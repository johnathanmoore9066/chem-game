/* ============================================================
   ELEMENT FUSION — GAME ENGINE v2: LIVE REACTIVE CANVAS
   ============================================================
   Reads everything from window.GAME_DATA (data.js).
   No chemistry is hardcoded here — only mechanics.

   What changed from v1 (manual Combine button):
   - The mixing area is now a free-form canvas. Items become
     positioned "nodes" you drag around with the pointer.
   - STATE vs SOLUTION: nodes sitting in the same beaker do NOT
     react. A reaction is triggered only by literal contact —
     dragging one node into another (or a new node spawning in
     contact during a cascade).
   - Evaluation pipeline, on every release/spawn-in-contact:
       contact set → subset recipe match (largest first)
       → hit: snap-coalesce animation, ledger update, then
         cascade-check the new node against its neighbors
       → miss: educational hypothesis card (throttled so the
         same pair doesn't spam the log)
   - Magnet tug: while dragging, if a nearby node would complete
     a valid recipe with what you're holding, the held node is
     visually pulled a few px toward it and the partner glows.
   - Discovery log keeps only the last 10 cards + can be cleared.
   ============================================================ */

(() => {
  'use strict';

  const DATA = window.GAME_DATA;

  /* ---------- tunables ---------- */
  const NODE_SIZE     = 66;   // px, rendered node diameter
  const REACT_RADIUS  = 70;   // px center-to-center = "literal contact"
  const MAGNET_RADIUS = 150;  // px, how far the tug can feel a partner
  const MAGNET_PULL   = 20;   // px, max visual tug toward a partner
  const MAX_NODES     = 14;   // keep the canvas readable
  const MAX_LOG       = 10;   // discovery log cap (user request)
  const CASCADE_DELAY = 480;  // ms between chain-reaction steps
  const MISS_COOLDOWN = 6000; // ms before the same miss pair logs again

  /* ---------- safe storage (works locally; degrades gracefully) ---------- */
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, val) { try { localStorage.setItem(key, val); } catch { /* no-op */ } },
    remove(key) { try { localStorage.removeItem(key); } catch { /* no-op */ } },
  };
  const SAVE_KEY = 'element-fusion-save-v1';

  /* ---------- indexes built once from data ---------- */
  const itemById = new Map(DATA.ITEMS.map(i => [i.id, i]));
  const comboKey = ids => [...ids].sort().join('+');
  // Two reaction regimes, keyed by canvas zone: fusion recipes only
  // fire inside the Stellar Core; bench chemistry only outside it.
  // The same key can exist in both (H+H → He in the core, H₂ on the
  // bench) — that's the point, not a collision.
  const recipesOf = mode => DATA.RECIPES.filter(r => (r.mode || 'chem') === mode);
  const recipeMaps = {
    fusion: new Map(recipesOf('fusion').map(r => [comboKey(r.inputs), r])),
    chem:   new Map(recipesOf('chem').map(r => [comboKey(r.inputs), r])),
  };
  const recipeLists = { fusion: recipesOf('fusion'), chem: recipesOf('chem') };
  const hypoByKey = new Map(DATA.HYPOTHETICALS.map(h => [comboKey(h.inputs), h]));
  const TOTAL_DISCOVERABLE = DATA.ITEMS.filter(i => !i.starter).length;

  /* ---------- state ---------- */
  const state = {
    discovered: new Set(DATA.ITEMS.filter(i => i.starter).map(i => i.id)),
    nodes: [],               // [{ nid, itemId, x, y, el }] — canvas workspace
    nextNid: 1,
    fails: 0,
    achievements: new Set(),
    defaultFallbackIdx: 0,
    coreFallbackIdx: 0,
    lastMiss: { key: null, at: 0 },
  };

  function save() {
    store.set(SAVE_KEY, JSON.stringify({
      discovered: [...state.discovered],
      fails: state.fails,
      achievements: [...state.achievements],
    }));
  }

  function load() {
    const raw = store.get(SAVE_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      (s.discovered || []).forEach(id => { if (itemById.has(id)) state.discovered.add(id); });
      state.fails = s.fails || 0;
      (s.achievements || []).forEach(id => state.achievements.add(id));
    } catch { /* corrupted save — start fresh */ }
  }

  /* ---------- dom helpers ---------- */
  const $ = sel => document.querySelector(sel);
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  /* ---------- inventory panel ---------- */
  function renderInventory() {
    const filter = $('#search').value.trim().toLowerCase();
    const list = [...state.discovered].map(id => itemById.get(id));

    const matches = i =>
      !filter ||
      i.name.toLowerCase().includes(filter) ||
      (i.symbol || '').toLowerCase().includes(filter) ||
      (i.formula || '').toLowerCase().includes(filter) ||
      i.tags.some(t => t.includes(filter));

    const elements = list.filter(i => i.kind === 'element' && matches(i));
    const compounds = list.filter(i => i.kind === 'compound' && matches(i));

    renderTileGroup($('#elements-grid'), elements);
    renderTileGroup($('#compounds-grid'), compounds);
    $('#elements-section').hidden = elements.length === 0;
    $('#compounds-section').hidden = compounds.length === 0;
    $('#inventory-empty').hidden = elements.length + compounds.length > 0;

    // progress
    const found = list.filter(i => !i.starter).length;
    $('#progress-text').textContent = `${found} / ${TOTAL_DISCOVERABLE} discovered`;
    $('#progress-fill').style.width = `${(found / TOTAL_DISCOVERABLE) * 100}%`;
  }

  function renderTileGroup(container, items) {
    container.replaceChildren();
    items
      .sort((a, b) => (a.num || 999) - (b.num || 999) || a.name.localeCompare(b.name))
      .forEach(item => container.appendChild(makeTile(item)));
  }

  function makeTile(item) {
    const tile = el('button', `tile cat-${item.category}`);
    tile.type = 'button';
    tile.draggable = true;
    tile.dataset.id = item.id;
    tile.setAttribute('aria-label', `Add ${item.name} to the canvas`);

    if (item.kind === 'element') {
      tile.appendChild(el('span', 'tile-num', item.num));
      tile.appendChild(el('span', 'tile-symbol', item.symbol));
      tile.appendChild(el('span', 'tile-name', item.name));
    } else {
      tile.classList.add('tile-compound');
      tile.appendChild(el('span', 'tile-formula', item.formula));
      tile.appendChild(el('span', 'tile-name', item.name));
    }

    // Click = drop it onto a free spot (no reaction: nothing was
    // dragged INTO anything — state vs solution).
    tile.addEventListener('click', () => spawnNearCenter(item.id));
    tile.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', item.id);
      e.dataTransfer.effectAllowed = 'copy';
      tile.classList.add('dragging');
    });
    tile.addEventListener('dragend', () => tile.classList.remove('dragging'));
    return tile;
  }

  /* ============================================================
     CANVAS: nodes, dragging, magnet tug
     ============================================================ */
  const canvas = () => $('#canvas');

  function canvasRect() { return canvas().getBoundingClientRect(); }

  /* ---------- the Stellar Core: where fusion lives ---------- */
  // Geometry is computed in JS and pushed to the div, so the visual
  // circle and the logic circle are the same numbers by construction.
  function coreGeom() {
    const r = canvasRect();
    return {
      cx: r.width * 0.80,
      cy: r.height * 0.20,
      radius: Math.min(Math.max(Math.min(r.width, r.height) * 0.24, 72), 118),
    };
  }

  function zoneAt(x, y) {
    const g = coreGeom();
    return Math.hypot(x - g.cx, y - g.cy) <= g.radius ? 'fusion' : 'chem';
  }
  const zoneOf = node => zoneAt(node.x, node.y);

  function renderCore() {
    const g = coreGeom();
    const core = $('#star-core');
    core.style.width = core.style.height = `${g.radius * 2}px`;
    core.style.transform = `translate(${g.cx - g.radius}px, ${g.cy - g.radius}px)`;
  }

  function clampToCanvas(x, y) {
    const r = canvasRect();
    const half = NODE_SIZE / 2 + 4;
    return {
      x: Math.min(Math.max(x, half), r.width - half),
      y: Math.min(Math.max(y, half), r.height - half),
    };
  }

  function updateHint() {
    $('#canvas-hint').hidden = state.nodes.length > 0;
    $('#clear-canvas-btn').hidden = state.nodes.length === 0;
  }

  function positionNode(n, dx = 0, dy = 0) {
    n.el.style.transform =
      `translate(${n.x + dx - NODE_SIZE / 2}px, ${n.y + dy - NODE_SIZE / 2}px)`;
  }

  function spawnNode(itemId, x, y, animate = true) {
    if (state.nodes.length >= MAX_NODES) {
      canvas().classList.remove('canvas-full');
      void canvas().offsetWidth;
      canvas().classList.add('canvas-full');
      return null;
    }
    const item = itemById.get(itemId);
    const p = clampToCanvas(x, y);
    const node = { nid: state.nextNid++, itemId, x: p.x, y: p.y, el: null };

    const div = el('div', `node cat-${item.category}${animate ? ' spawn' : ''}`);
    div.appendChild(el('span', 'node-label', item.symbol || item.formula));
    div.appendChild(el('span', 'node-name', item.name));
    div.title = `${item.name} — drag into another node to react · double-click to remove`;
    node.el = div;

    div.addEventListener('dblclick', () => removeNode(node));
    div.addEventListener('pointerdown', e => startDrag(node, e));

    canvas().appendChild(div);
    positionNode(node);
    state.nodes.push(node);
    updateHint();
    return node;
  }

  function spawnNearCenter(itemId) {
    const r = canvasRect();
    // scatter so repeated taps don't stack into accidental contact
    const angle = Math.random() * Math.PI * 2;
    const radius = 40 + Math.random() * Math.min(r.width, r.height) * 0.22;
    spawnNode(itemId,
      r.width / 2 + Math.cos(angle) * radius,
      r.height / 2 + Math.sin(angle) * radius);
  }

  function removeNode(node) {
    const i = state.nodes.indexOf(node);
    if (i !== -1) state.nodes.splice(i, 1);
    node.el.remove();
    updateHint();
  }

  function clearCanvas() {
    state.nodes.forEach(n => n.el.remove());
    state.nodes = [];
    updateHint();
  }

  /* ---------- in-canvas pointer dragging ---------- */
  function startDrag(node, e) {
    e.preventDefault();
    node.el.setPointerCapture(e.pointerId);
    node.el.classList.add('dragging-node');

    const r = canvasRect();
    const grabDx = node.x - (e.clientX - r.left);
    const grabDy = node.y - (e.clientY - r.top);
    let pull = { x: 0, y: 0 };
    let magnetPartner = null;

    const onMove = ev => {
      const rect = canvasRect();
      const p = clampToCanvas(ev.clientX - rect.left + grabDx, ev.clientY - rect.top + grabDy);
      node.x = p.x;
      node.y = p.y;

      // --- magnet tug: feel for a partner that completes a recipe ---
      const found = findRecipePartner(node);
      if (magnetPartner && magnetPartner !== found.partner) {
        magnetPartner.el.classList.remove('magnet');
      }
      magnetPartner = found.partner;
      if (magnetPartner) {
        magnetPartner.el.classList.add('magnet');
        const d = dist(node, magnetPartner);
        // pull grows as you get closer; "slight", never a yank
        const strength = MAGNET_PULL * (1 - d / MAGNET_RADIUS);
        const ux = (magnetPartner.x - node.x) / (d || 1);
        const uy = (magnetPartner.y - node.y) / (d || 1);
        pull = { x: ux * strength, y: uy * strength };
      } else {
        pull = { x: 0, y: 0 };
      }
      positionNode(node, pull.x, pull.y);
    };

    const onUp = () => {
      node.el.classList.remove('dragging-node');
      if (magnetPartner) magnetPartner.el.classList.remove('magnet');
      node.el.removeEventListener('pointermove', onMove);
      node.el.removeEventListener('pointerup', onUp);
      node.el.removeEventListener('pointercancel', onUp);

      // commit the tug: if the magnet visually closed the gap,
      // the contact is real
      const committed = clampToCanvas(node.x + pull.x, node.y + pull.y);
      node.x = committed.x;
      node.y = committed.y;
      positionNode(node);

      evaluateContact(node, /* playerAction */ true);
    };

    node.el.addEventListener('pointermove', onMove);
    node.el.addEventListener('pointerup', onUp);
    node.el.addEventListener('pointercancel', onUp);
  }

  /* ---------- contact + recipe resolution ---------- */
  function touching(node) {
    return state.nodes.filter(n => n !== node && dist(n, node) <= REACT_RADIUS);
  }

  // All non-empty subsets, largest first, so 3 He → C wins over
  // any smaller partial match. Contact sets are tiny (≤6), so
  // 2^n enumeration is nothing.
  function subsetsDesc(arr) {
    const out = [];
    const n = arr.length;
    for (let mask = 1; mask < (1 << n); mask++) {
      const sub = [];
      for (let b = 0; b < n; b++) if (mask & (1 << b)) sub.push(arr[b]);
      out.push(sub);
    }
    return out.sort((a, b) => b.length - a.length);
  }

  function findRecipeIn(node, neighbors) {
    const zone = zoneOf(node);
    for (const sub of subsetsDesc(neighbors.slice(0, 6))) {
      const group = [node, ...sub];
      const recipe = recipeMaps[zone].get(comboKey(group.map(n => n.itemId)));
      if (recipe) return { recipe, group };
    }
    return null;
  }

  // Is this contact set a strict sub-multiset of any recipe in its
  // zone? If so, the player is mid-staging, not failing — return how
  // many ingredients the closest-to-complete recipe still needs.
  function partialOf(ids, zone) {
    let bestMissing = Infinity;
    for (const r of recipeLists[zone]) {
      if (r.inputs.length <= ids.length) continue;
      const pool = [...r.inputs];
      const fits = ids.every(id => {
        const i = pool.indexOf(id);
        if (i === -1) return false;
        pool.splice(i, 1);
        return true;
      });
      if (fits) bestMissing = Math.min(bestMissing, pool.length);
    }
    return bestMissing === Infinity ? 0 : bestMissing;
  }

  // Magnet: nearest same-zone node within MAGNET_RADIUS that would
  // complete a recipe with the held node (pairwise, or with that
  // node's own contact cluster — so a third He feels the He pair).
  function findRecipePartner(dragNode) {
    const zone = zoneOf(dragNode);
    let best = null, bestD = Infinity;
    for (const cand of state.nodes) {
      if (cand === dragNode || zoneOf(cand) !== zone) continue;
      const d = dist(dragNode, cand);
      if (d > MAGNET_RADIUS || d >= bestD) continue;

      const pair = recipeMaps[zone].has(comboKey([dragNode.itemId, cand.itemId]));
      let cluster = false;
      if (!pair) {
        const around = touching(cand).filter(n => n !== dragNode);
        cluster = !!findRecipeIn(dragNode, [cand, ...around]);
      }
      if (pair || cluster) { best = cand; bestD = d; }
    }
    return { partner: best };
  }

  /* The evaluation pipeline. playerAction=true → a miss produces
     an educational card; cascades stay silent on misses so the
     log only reflects deliberate chemistry. */
  function evaluateContact(node, playerAction) {
    const neighbors = touching(node);
    if (neighbors.length === 0) return; // free placement, no reaction

    const hit = findRecipeIn(node, neighbors);
    if (hit) {
      react(hit.group, hit.recipe);
    } else if (playerAction) {
      missContact(node, neighbors);
    }
  }

  function react(group, recipe) {
    // centroid = where the new compound coalesces
    const cx = group.reduce((s, n) => s + n.x, 0) / group.length;
    const cy = group.reduce((s, n) => s + n.y, 0) / group.length;

    // snap animation: everyone slides to the centroid and shrinks
    group.forEach(n => {
      n.x = cx; n.y = cy;
      n.el.classList.add('consuming');
      positionNode(n);
    });

    // reaction ring at the point of fusion
    const ring = el('div', 'react-ring');
    ring.style.left = `${cx}px`;
    ring.style.top = `${cy}px`;
    canvas().appendChild(ring);
    setTimeout(() => ring.remove(), 700);

    setTimeout(() => {
      group.forEach(removeNode);
      const out = spawnNode(recipe.output, cx, cy);

      // ledger + achievements update in real time
      const item = itemById.get(recipe.output);
      const isNew = !state.discovered.has(item.id);
      if (isNew) state.discovered.add(item.id);
      logDiscovery(recipe, item, isNew);
      checkAchievements();
      save();
      renderInventory();

      // cascade: the newborn compound may itself be in contact
      // with ambient nodes (e.g. fresh NaCl born next to H₂O)
      if (out) {
        setTimeout(() => evaluateContact(out, /* playerAction */ false), CASCADE_DELAY);
      }
    }, 230);
  }

  function missContact(node, neighbors) {
    // nearest neighbor = the thing the player actually pushed into
    const nearest = neighbors.reduce((a, b) => (dist(node, a) <= dist(node, b) ? a : b));
    const zone = zoneOf(node);
    const otherZone = zone === 'fusion' ? 'chem' : 'fusion';
    const clusterIds = [node, ...neighbors].map(n => n.itemId);
    const clusterKey = comboKey(clusterIds);
    const pairKey = comboKey([node.itemId, nearest.itemId]);

    // 1) Would this react in the OTHER zone? Teach the mechanic.
    const elsewhere = recipeMaps[otherZone].get(clusterKey) || recipeMaps[otherZone].get(pairKey);
    if (elsewhere) {
      shakePair(node, nearest);
      if (throttledMiss(pairKey)) return;
      const out = itemById.get(elsewhere.output);
      logHypothesis(
        zone === 'fusion'
          ? `These bond chemically — not in a star`
          : `These fuse — but only in the Stellar Core`,
        zone === 'fusion'
          ? `Inside the core it's ~15 million K: molecules can't survive, only nuclei colliding. Drag these out of the core and they'll react chemically (→ ${out.name}).`
          : `At bench conditions, nuclei never get close enough to fuse — their positive charges repel. Drag this pair into the glowing Stellar Core, where heat and pressure overcome the Coulomb barrier (→ ${out.name}).`
      );
      checkAchievements();
      save();
      return;
    }

    // 2) Strict subset of a bigger recipe? That's staging, not failure.
    const missing = partialOf(clusterIds, zone);
    if (missing > 0) {
      [node, ...neighbors].forEach(n => {
        n.el.classList.remove('staged');
        void n.el.offsetWidth;
        n.el.classList.add('staged');
      });
      // a curated lesson for this exact pair (e.g. He+He → the
      // beryllium-8 story) beats the generic "needs more" pill
      const stagingHypo = hypoByKey.get(clusterKey) || hypoByKey.get(pairKey);
      if (stagingHypo && !throttledMiss(pairKey)) {
        logHypothesis(stagingHypo.title, stagingHypo.text);
      } else {
        stagePill(node, missing);
      }
      return; // no fail count — something is brewing
    }

    // 3) Genuine miss → educational card (throttled)
    shakePair(node, nearest);
    if (throttledMiss(pairKey)) return;

    state.fails += 1;

    const hypo = hypoByKey.get(clusterKey) || hypoByKey.get(pairKey);
    if (hypo) {
      logHypothesis(hypo.title, hypo.text);
    } else {
      const items = [node, nearest].map(n => itemById.get(n.itemId));
      // In the core, chemistry explanations (electron shells, bonds)
      // are the wrong physics — route to plasma-flavored education.
      const rules = zone === 'fusion' ? DATA.CORE_RULES : DATA.FALLBACK_RULES;
      const rule = rules.find(r => r.when(items));
      if (rule) {
        logHypothesis(rule.title, rule.text);
      } else if (zone === 'fusion') {
        const fb = DATA.CORE_FALLBACKS[state.coreFallbackIdx % DATA.CORE_FALLBACKS.length];
        state.coreFallbackIdx += 1;
        logHypothesis(fb.title, fb.text);
      } else {
        const fb = DATA.DEFAULT_FALLBACKS[state.defaultFallbackIdx % DATA.DEFAULT_FALLBACKS.length];
        state.defaultFallbackIdx += 1;
        logHypothesis(fb.title, fb.text);
      }
    }
    checkAchievements();
    save();
  }

  function shakePair(a, b) {
    [a, b].forEach(n => {
      n.el.classList.remove('shake');
      void n.el.offsetWidth;
      n.el.classList.add('shake');
    });
  }

  function throttledMiss(pairKey) {
    const now = Date.now();
    if (state.lastMiss.key === pairKey && now - state.lastMiss.at < MISS_COOLDOWN) return true;
    state.lastMiss = { key: pairKey, at: now };
    return false;
  }

  // floating "⚗ n more…" pill above a staged cluster
  function stagePill(node, missing) {
    canvas().querySelectorAll('.stage-pill').forEach(p => p.remove());
    const pill = el('div', 'stage-pill',
      `⚗ partial mix — ${missing} more ingredient${missing > 1 ? 's' : ''} could complete a reaction`);
    pill.style.left = `${node.x}px`;
    pill.style.top = `${node.y - NODE_SIZE / 2 - 14}px`;
    canvas().appendChild(pill);
    setTimeout(() => pill.classList.add('fade'), 1900);
    setTimeout(() => pill.remove(), 2400);
  }

  /* ---------- discovery log ---------- */
  function reactionEquation(recipe) {
    // Render "2 H + O → H₂O" using symbols/formulas
    const counts = new Map();
    recipe.inputs.forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
    const left = [...counts.entries()].map(([id, n]) => {
      const it = itemById.get(id);
      const label = it.symbol || it.formula || it.name;
      return n > 1 ? `${n} ${label}` : label;
    }).join(' + ');
    const out = itemById.get(recipe.output);
    return `${left} → ${out.formula || out.symbol || out.name}`;
  }

  function logDiscovery(recipe, item, isNew) {
    const card = el('article', `log-card success cat-border-${item.category}`);

    const head = el('header', 'log-head');
    const title = el('h3', 'log-title', item.name);
    if (isNew) title.appendChild(el('span', 'badge-new', 'NEW'));
    head.appendChild(title);
    head.appendChild(el('code', 'log-formula', item.formula || item.symbol));
    card.appendChild(head);

    card.appendChild(el('code', 'log-equation', reactionEquation(recipe)));
    if (recipe.note) card.appendChild(makeField('Why it works', recipe.note));
    card.appendChild(makeField('What it is', item.blurb));
    card.appendChild(makeField('Real-world use', item.use));
    card.appendChild(makeField('Fun fact', item.funFact));

    const tags = el('div', 'log-tags');
    item.tags.forEach(t => tags.appendChild(el('span', 'tag', t)));
    card.appendChild(tags);

    // your-move tooltip: flag compounds that are themselves ingredients
    const further = DATA.RECIPES.filter(r => r.inputs.includes(item.id)).length;
    if (further > 0) {
      card.appendChild(el('p', 'log-reactive',
        `⚗ Reactive — ${item.name} is an ingredient in ${further} more recipe${further > 1 ? 's' : ''}. Try dragging it into things.`));
    }

    prependLog(card);
  }

  function logHypothesis(title, text) {
    const card = el('article', 'log-card hypothesis');
    const head = el('header', 'log-head');
    head.appendChild(el('span', 'hypo-label', 'No reaction — but here\'s the chemistry'));
    card.appendChild(head);
    card.appendChild(el('h3', 'log-title', title));
    card.appendChild(el('p', 'log-text', text));
    prependLog(card);
  }

  function makeField(label, text) {
    const wrap = el('div', 'log-field');
    wrap.appendChild(el('span', 'field-label', label));
    wrap.appendChild(el('p', 'log-text', text));
    return wrap;
  }

  function prependLog(card) {
    const log = $('#log');
    $('#log-empty').hidden = true;
    $('#clear-log-btn').hidden = false;
    log.prepend(card);
    // last 10 only (never remove the empty-state node — Reset needs it)
    const cards = [...log.children].filter(c => c.id !== 'log-empty');
    cards.slice(MAX_LOG).forEach(c => c.remove());
  }

  function clearLog() {
    const log = $('#log');
    [...log.children].forEach(c => { if (c.id !== 'log-empty') c.remove(); });
    $('#log-empty').hidden = false;
    $('#clear-log-btn').hidden = true;
  }

  /* ---------- achievements ---------- */
  function discoveredCount() {
    return [...state.discovered].filter(id => !itemById.get(id).starter).length;
  }

  function categoryCount(tag) {
    return [...state.discovered].filter(id => itemById.get(id).tags.includes(tag)).length;
  }

  function testPasses(test) {
    switch (test.type) {
      case 'discover':      return state.discovered.has(test.id);
      case 'discoverAll':   return test.ids.every(id => state.discovered.has(id));
      case 'categoryCount': return categoryCount(test.tag) >= test.count;
      case 'totalCount':    return discoveredCount() >= (test.count === 'ALL' ? TOTAL_DISCOVERABLE : test.count);
      case 'failCount':     return state.fails >= test.count;
      default:              return false;
    }
  }

  function checkAchievements() {
    DATA.ACHIEVEMENTS.forEach(a => {
      if (!state.achievements.has(a.id) && testPasses(a.test)) {
        state.achievements.add(a.id);
        toast(a);
      }
    });
    $('#trophy-count').textContent = `${state.achievements.size}/${DATA.ACHIEVEMENTS.length}`;
  }

  function toast(achievement) {
    const t = el('div', 'toast');
    t.setAttribute('role', 'status');
    t.appendChild(el('span', 'toast-icon', achievement.icon));
    const body = el('div', 'toast-body');
    body.appendChild(el('strong', null, achievement.name));
    body.appendChild(el('p', null, achievement.desc));
    t.appendChild(body);
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('show'), 20);
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 400);
    }, 5200);
  }

  /* ---------- achievements panel ---------- */
  function renderAchievementsPanel() {
    const list = $('#achievements-list');
    list.replaceChildren();
    DATA.ACHIEVEMENTS.forEach(a => {
      const unlocked = state.achievements.has(a.id);
      const row = el('div', `ach-row ${unlocked ? 'unlocked' : 'locked'}`);
      row.appendChild(el('span', 'ach-icon', unlocked ? a.icon : '🔒'));
      const body = el('div', 'ach-body');
      body.appendChild(el('strong', null, a.name));
      body.appendChild(el('p', null, unlocked ? a.desc : 'Keep experimenting…'));
      row.appendChild(body);
      list.appendChild(row);
    });
  }

  /* ============================================================
     LANDING + DONATION BUTTON CHOREOGRAPHY
     ============================================================
     The button is one fixed element with two homes:
     - landing visible → laid over an inline placeholder in the
       support sentence, full brightness
     - playing → docked in the bottom-right corner, dimmed
     Dismissing the landing fades the overlay UNDER the button,
     then the button glides to its dock. */
  const LANDING_KEY = 'element-fusion-landing-seen';
  const DOCK_MARGIN = 16;
  const reducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const coffee = () => $('#coffee-btn');
  const landing = () => $('#landing');

  function dockTarget() {
    const r = coffee().getBoundingClientRect();
    return {
      left: window.innerWidth - r.width - DOCK_MARGIN,
      top: window.innerHeight - r.height - DOCK_MARGIN,
    };
  }

  function placeCoffee(left, top) {
    const c = coffee();
    c.style.left = `${left}px`;
    c.style.top = `${top}px`;
  }

  function coffeeToAnchor(animate) {
    const anchor = $('#coffee-anchor');
    if (!anchor) { coffeeToDock(false); return; } // markup moved? degrade gracefully
    const a = anchor.getBoundingClientRect();
    const c = coffee();
    c.classList.remove('docked');
    if (animate && !reducedMotion()) {
      c.classList.add('traveling');
      placeCoffee(a.left, a.top);
      c.addEventListener('transitionend', () => c.classList.remove('traveling'), { once: true });
    } else {
      c.classList.remove('traveling');
      placeCoffee(a.left, a.top);
    }
  }

  function coffeeToDock(animate) {
    const c = coffee();
    const t = dockTarget();
    if (animate && !reducedMotion()) {
      c.classList.add('traveling');
      placeCoffee(t.left, t.top);
      c.addEventListener('transitionend', () => {
        c.classList.remove('traveling');
        c.classList.add('docked');
      }, { once: true });
    } else {
      c.classList.remove('traveling');
      placeCoffee(t.left, t.top);
      c.classList.add('docked');
    }
  }

  function showLanding(animateButton) {
    landing().hidden = false;
    landing().classList.remove('hide');
    // wait a frame so the anchor has a layout box to measure
    requestAnimationFrame(() => coffeeToAnchor(animateButton));
  }

  function dismissLanding() {
    store.set(LANDING_KEY, '1');
    landing().classList.add('hide');
    // the overlay fades beneath the button — the button doesn't move
    // until the fade is mostly done, THEN glides to its dock
    setTimeout(() => {
      landing().hidden = true;
      coffeeToDock(true);
    }, reducedMotion() ? 0 : 380);
  }

  function initLanding() {
    coffee().hidden = false;
    if (store.get(LANDING_KEY)) {
      // returning visitor: straight to the game, button pre-docked
      coffeeToDock(false);
    } else {
      showLanding(false);
    }
    $('#start-btn').addEventListener('click', dismissLanding);
    $('#about-btn').addEventListener('click', () => showLanding(true));
    landing().addEventListener('click', e => {
      if (e.target === landing()) dismissLanding();
    });
    window.addEventListener('resize', () => {
      if (!landing().hidden) {
        requestAnimationFrame(() => coffeeToAnchor(false));
      } else {
        coffeeToDock(false);
      }
    });
    // webfonts swap in after DOMContentLoaded and reflow the landing
    // text — re-measure the anchor once they settle
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!landing().hidden) coffeeToAnchor(false);
      });
    }
  }

  /* ============================================================
     SUGGEST-A-REACTION DIALOG
     ============================================================
     Teachers asked (well, the intro promised): a way to get their
     curriculum's reactions into the game. Two paths, one dialog:
     - email: mailto pre-filled with the README's template, plus a
       copy button because webmail users often have no mailto handler
     - GitHub: deep link to the README's contributor walkthrough */
  const SUGGEST_EMAIL = 'johnathanmoore@elementfusion.org';
  const SUGGEST_SUBJECT = '[Element Fusion] New reaction: <compound name>';
  // Mirrors README → "Add your own chemistry". If the README template
  // changes, change this too.
  const SUGGEST_TEMPLATE = `Hi Johnathan,

I'd like to suggest a new reaction for Element Fusion.

// ---------- ITEM (one per new substance) ----------
{ id:'',            // lowercase-with-dashes, unique
  name:'',          // display name
  formula:'',       // real unicode subscripts: ₀₁₂₃₄₅₆₇₈₉
  kind:'compound',  // 'compound' or 'element'
  starter:false,
  category:'',      // pick ONE: salt, oxide, acid, base, organic, ...
                    // (full list in the README, linked below)
  tags:[],          // a few searchable keywords
  blurb:'',         // what it is, chemically - one or two sentences
  use:'',           // where it shows up in the real world
  funFact:'' },     // the thing a student repeats at dinner

// ---------- RECIPE (how to make it) ----------
{ inputs:[],        // ids of ingredients; duplicates = stoichiometry
  output:'',        // the item id above
  note:'' },        // the equation and WHY it works - the teaching moment
  // add  mode:'fusion'  before output if it's a nuclear reaction

Full field guide and house rules:
https://github.com/johnathanmoore9066/chem-game#add-your-own-chemistry

Thanks!
`;

  function initSuggest() {
    const dlg = $('#suggest-dialog');
    const open = () => dlg.showModal(); // top layer: works over the landing too

    $('#suggest-btn').addEventListener('click', open);
    $('#landing-suggest-link').addEventListener('click', e => {
      e.preventDefault();
      open();
    });
    $('#close-suggest').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => {
      if (e.target === dlg) dlg.close();
    });

    $('#suggest-email-link').href =
      `mailto:${SUGGEST_EMAIL}` +
      `?subject=${encodeURIComponent(SUGGEST_SUBJECT)}` +
      `&body=${encodeURIComponent(SUGGEST_TEMPLATE)}`;

    const copyBtn = $('#copy-template-btn');
    copyBtn.addEventListener('click', async () => {
      const payload =
        `To: ${SUGGEST_EMAIL}\nSubject: ${SUGGEST_SUBJECT}\n\n${SUGGEST_TEMPLATE}`;
      try {
        await navigator.clipboard.writeText(payload);
        const label = copyBtn.textContent;
        copyBtn.textContent = 'copied!';
        setTimeout(() => { copyBtn.textContent = label; }, 1600);
      } catch {
        // clipboard API blocked (http, old browser): show it instead
        window.prompt('Copy the template below:', payload);
      }
    });
  }

  /* ---------- wiring ---------- */
  function init() {
    load();

    // inventory → canvas drop (a drop ONTO a node counts as
    // dragging them together, so it evaluates immediately)
    const cv = canvas();
    cv.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      cv.classList.add('drag-over');
    });
    cv.addEventListener('dragleave', () => cv.classList.remove('drag-over'));
    cv.addEventListener('drop', e => {
      e.preventDefault();
      cv.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      if (!itemById.has(id) || !state.discovered.has(id)) return;
      const r = canvasRect();
      const node = spawnNode(id, e.clientX - r.left, e.clientY - r.top);
      if (node) evaluateContact(node, /* playerAction */ true);
    });

    $('#clear-canvas-btn').addEventListener('click', clearCanvas);
    $('#clear-log-btn').addEventListener('click', clearLog);
    $('#search').addEventListener('input', renderInventory);

    // keep nodes inside the canvas (and the core sized) on resize
    window.addEventListener('resize', () => {
      renderCore();
      state.nodes.forEach(n => {
        const p = clampToCanvas(n.x, n.y);
        n.x = p.x; n.y = p.y;
        positionNode(n);
      });
    });

    // achievements popover
    const dialog = $('#achievements-dialog');
    $('#trophy-btn').addEventListener('click', () => {
      renderAchievementsPanel();
      dialog.showModal();
    });
    $('#close-dialog').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => {
      if (e.target === dialog) dialog.close();
    });

    // reset
    $('#reset-btn').addEventListener('click', () => {
      if (!confirm('Reset all progress? Your discoveries and achievements will be wiped.')) return;
      store.remove(SAVE_KEY);
      store.remove(LANDING_KEY);
      state.discovered = new Set(DATA.ITEMS.filter(i => i.starter).map(i => i.id));
      state.fails = 0;
      state.achievements.clear();
      state.lastMiss = { key: null, at: 0 };
      clearCanvas();
      clearLog();
      renderInventory();
      checkAchievements();
      showLanding(true);
    });

    updateHint();
    renderCore();
    renderInventory();
    checkAchievements();
    initLanding();
    initSuggest();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
