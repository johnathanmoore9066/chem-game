/* ============================================================
   ELEMENT FUSION — GAME ENGINE
   ============================================================
   Reads everything from window.GAME_DATA (data.js).
   No chemistry is hardcoded here — only mechanics.

   Architecture, briefly:
   - state            : single source of truth
   - recipe matching  : multiset → sorted-key lookup (O(1))
   - fallback cascade : exact hypothetical → heuristic rules → defaults
   - achievements     : declarative tests evaluated after every event
   - persistence      : localStorage, wrapped so the game still runs
                        in sandboxed iframes where storage throws
   ============================================================ */

(() => {
  'use strict';

  const DATA = window.GAME_DATA;
  const MAX_CHIPS = 8;

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
  const recipeByKey = new Map(DATA.RECIPES.map(r => [comboKey(r.inputs), r]));
  const hypoByKey = new Map(DATA.HYPOTHETICALS.map(h => [comboKey(h.inputs), h]));
  const TOTAL_DISCOVERABLE = DATA.ITEMS.filter(i => !i.starter).length;

  /* ---------- state ---------- */
  const state = {
    discovered: new Set(DATA.ITEMS.filter(i => i.starter).map(i => i.id)),
    mix: [],                 // array of item ids currently in the chamber
    fails: 0,
    achievements: new Set(),
    defaultFallbackIdx: 0,
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
    tile.setAttribute('aria-label', `Add ${item.name} to the mixing chamber`);

    if (item.kind === 'element') {
      tile.appendChild(el('span', 'tile-num', item.num));
      tile.appendChild(el('span', 'tile-symbol', item.symbol));
      tile.appendChild(el('span', 'tile-name', item.name));
    } else {
      tile.classList.add('tile-compound');
      tile.appendChild(el('span', 'tile-formula', item.formula));
      tile.appendChild(el('span', 'tile-name', item.name));
    }

    tile.addEventListener('click', () => addToMix(item.id));
    tile.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', item.id);
      e.dataTransfer.effectAllowed = 'copy';
      tile.classList.add('dragging');
    });
    tile.addEventListener('dragend', () => tile.classList.remove('dragging'));
    return tile;
  }

  /* ---------- mixing chamber ---------- */
  function addToMix(id) {
    if (state.mix.length >= MAX_CHIPS) {
      flashChamber('full');
      return;
    }
    state.mix.push(id);
    renderMix();
  }

  function removeFromMix(index) {
    state.mix.splice(index, 1);
    renderMix();
  }

  function clearMix() {
    state.mix = [];
    renderMix();
  }

  function renderMix() {
    const zone = $('#chips');
    zone.replaceChildren();
    if (state.mix.length === 0) {
      const hint = el('p', 'chamber-hint');
      hint.innerHTML = 'Drag elements here<br><span>or tap them in the inventory</span>';
      zone.appendChild(hint);
    } else {
      state.mix.forEach((id, idx) => {
        const item = itemById.get(id);
        const chip = el('button', `chip cat-${item.category}`);
        chip.type = 'button';
        chip.setAttribute('aria-label', `Remove ${item.name} from the chamber`);
        chip.appendChild(el('span', 'chip-label', item.symbol || item.formula));
        chip.appendChild(el('span', 'chip-x', '×'));
        chip.title = item.name;
        chip.addEventListener('click', () => removeFromMix(idx));
        zone.appendChild(chip);
      });
    }
    $('#combine-btn').disabled = state.mix.length < 2;
    $('#clear-btn').hidden = state.mix.length === 0;
  }

  function flashChamber(kind) {
    const chamber = $('#chamber');
    chamber.classList.remove('flash-success', 'flash-miss', 'flash-full');
    void chamber.offsetWidth; // restart animation
    chamber.classList.add(`flash-${kind}`);
  }

  /* ---------- combine: the core loop ---------- */
  function combine() {
    if (state.mix.length < 2) return;
    const key = comboKey(state.mix);

    const recipe = recipeByKey.get(key);
    if (recipe) {
      handleSuccess(recipe);
    } else {
      handleMiss(key);
    }
    clearMix();
    save();
    renderInventory();
  }

  function handleSuccess(recipe) {
    const item = itemById.get(recipe.output);
    const isNew = !state.discovered.has(item.id);
    if (isNew) state.discovered.add(item.id);

    logDiscovery(recipe, item, isNew);
    flashChamber('success');
    checkAchievements();
  }

  function handleMiss(key) {
    state.fails += 1;

    const hypo = hypoByKey.get(key);
    if (hypo) {
      logHypothesis(hypo.title, hypo.text);
    } else {
      const items = state.mix.map(id => itemById.get(id));
      const rule = DATA.FALLBACK_RULES.find(r => r.when(items));
      if (rule) {
        logHypothesis(rule.title, rule.text);
      } else {
        const fb = DATA.DEFAULT_FALLBACKS[state.defaultFallbackIdx % DATA.DEFAULT_FALLBACKS.length];
        state.defaultFallbackIdx += 1;
        logHypothesis(fb.title, fb.text);
      }
    }
    flashChamber('miss');
    checkAchievements();
  }

  /* ---------- discovery log ---------- */
  function reactionEquation(recipe) {
    // Render "H + H + O → H₂O" using symbols/formulas
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
    log.prepend(card);
    // keep the DOM light (never remove the empty-state node — Reset needs it)
    while (log.children.length > 60 && log.lastChild.id !== 'log-empty') {
      log.removeChild(log.lastChild);
    }
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

  /* ---------- wiring ---------- */
  function init() {
    load();

    // drop zone
    const chamber = $('#chamber');
    chamber.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      chamber.classList.add('drag-over');
    });
    chamber.addEventListener('dragleave', () => chamber.classList.remove('drag-over'));
    chamber.addEventListener('drop', e => {
      e.preventDefault();
      chamber.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      if (itemById.has(id) && state.discovered.has(id)) addToMix(id);
    });

    $('#combine-btn').addEventListener('click', combine);
    $('#clear-btn').addEventListener('click', clearMix);
    $('#search').addEventListener('input', renderInventory);

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
      state.discovered = new Set(DATA.ITEMS.filter(i => i.starter).map(i => i.id));
      state.fails = 0;
      state.achievements.clear();
      state.mix = [];
      $('#log').replaceChildren($('#log-empty'));
      $('#log-empty').hidden = false;
      renderMix();
      renderInventory();
      checkAchievements();
    });

    renderMix();
    renderInventory();
    checkAchievements();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
