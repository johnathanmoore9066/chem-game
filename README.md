# Element Fusion

A free, browser-based chemistry sandbox. Drag elements into each other and
discover real compounds through real reactions — nuclear fusion inside the
Stellar Core, bench chemistry everywhere else. Every discovery (and every
informative failure) comes with the actual chemistry: what happened, why,
and where it shows up in the real world.

Built for classrooms, curious kids, and anyone who ever wondered why water
puts out fires when both of its ingredients are famously flammable.

**Play it:** open `index.html` in any modern browser. That's the whole
installation process. No accounts, no tracking, no build step — progress
saves only to your own browser via localStorage, and nothing ever leaves
your device.

---

## How it works (the 60-second tour)

- **Inventory (left):** every element and compound you've unlocked. Drag
  tiles onto the canvas, or click to drop one in.
- **Reaction Canvas (center):** nothing reacts by merely sharing a beaker —
  state vs. solution. Drag one node *into* another and the engine checks for
  a real reaction on contact. The glowing circle is the **Stellar Core**:
  fusion happens only in there, chemistry only outside. Same two hydrogens,
  very different afternoon depending on the neighborhood.
- **Discovery Log (right):** your lab notebook. Keeps the last 10 entries.
- Partial mixes glow and tell you something's brewing. Wrong-zone collisions
  tell you where to take them. Dead ends explain *why* they're dead ends.

All of the chemistry lives in **one file: `data.js`**. The engine
(`game.js`) contains zero chemistry — it just runs whatever the data says.
This is a deliberate design decision, and it's also your invitation.

---

## Climbing the stellar ladder (a field guide)

The Stellar Core follows real nucleosynthesis, which means it has real
quirks. The ones every player asks about:

- **Hydrogen pairs up.** H + H in the core → helium. (Real stars do this
  through the proton–proton chain — deuterium, helium-3, the works — the
  game compresses it to one collision.)
- **You cannot grow helium by feeding it hydrogen.** H + He makes
  lithium-5, which survives for about 10⁻²² seconds — the game will tell
  you so. This is not a bug; it's the actual reason stars spent a billion
  years stuck at helium.
- **Helium climbs by crowding, not by addition.** Drag two He together —
  they'll glow and tell you something's brewing (beryllium-8, briefly).
  Drag a **third He into the pair** → carbon. This is the triple-alpha
  process, and the glow-plus-hint is the game's staging mechanic: partial
  recipes wait patiently for the rest of their ingredients.
- **From carbon, ride the alpha ladder.** Keep adding He: C → O → Ne →
  Mg → Si → S → Ar. One helium per rung, just like the inside of a
  massive star.
- **Heavy shortcuts exist.** C + C → Ne (carbon burning), O + O → Si
  (oxygen burning), Si + Si → Fe. Iron is the end of the line — fusing
  past it costs energy instead of releasing it, which is why it's also
  the end of the star.
- **The tug is a hint.** While dragging, if a nearby node would complete
  a real reaction with what you're holding, you'll feel a slight pull
  toward it and the partner glows. The magnet never lies — it only
  signals valid chemistry.

Same staging trick works on the bench: clusters that partially match a
bigger recipe glow and wait instead of failing.

---

## Add your own chemistry

Found a reaction we're missing? A compound your students keep asking about?
There are two ways to get it in. Both start with filling out the template
below — it contains every field we need, so a complete template can be
pasted straight into the game with no follow-up questions. Reactions
should be exothermic in the educational sense: they must release more
understanding than they consume.

### The template

A new compound needs an **item card** (what it is) and at least one
**recipe** (how to make it). Copy, fill, done:

```js
// ---------- ITEM (one per new substance) ----------
{ id:'calcium-chloride',          // lowercase-with-dashes, unique
  name:'Calcium Chloride',         // display name
  formula:'CaCl₂',                 // real unicode subscripts: ₀₁₂₃₄₅₆₇₈₉
  kind:'compound',                 // 'compound' or 'element'
  starter:false,                   // false for anything discoverable
  category:'salt',                 // pick ONE — see list below
  tags:['salt','ionic'],           // a few searchable keywords
  blurb:'What it is, chemically — one or two sentences.',
  use:'Where it shows up in the real world.',
  funFact:'The thing a student repeats at dinner.' },

// ---------- RECIPE (how to make it) ----------
{ inputs:['ca','cl','cl'],         // ids of ingredients; duplicates = stoichiometry
  output:'calcium-chloride',       // the item id above
  note:'The equation and WHY it works — this is the teaching moment.' },
  // add  mode:'fusion'  before output if it's a nuclear reaction
```

Valid categories: `acid`, `alkali`, `alkaline`, `alloy`, `atmospheric`,
`base`, `halogen`, `metal`, `metalloid`, `mineral`, `molecule`, `noble`,
`nonmetal`, `organic`, `oxide`, `radical`, `salt`.

House rules (the chemistry review board is strict but fair):

1. **Real reactions only.** If it needs a catalyst, heat, or industrial
   pressure in real life, that's fine — say so in the note.
2. **Every input must be obtainable in-game.** Check that your ingredients
   already exist in `data.js`, or include item cards for them too.
3. **Prefer two-ingredient steps through real intermediates** over
   four-atom pileups. The game's contact mechanic rewards stepwise
   synthesis, just like actual chemistry. (And actual chemists.)
4. **The note must teach.** "A + B → C" is a receipt, not a lesson.

### Option 1: Email it in

No GitHub account, no problem. Fill out the template and email it to:

**`johnathanmoore@elementfusion.org`** 

Subject line: `[Element Fusion] New reaction: <compound name>`

If the template is complete, your chemistry can be plugged in as-is and
you'll be credited in the next update. If it's incomplete, it enters the
same fate as an unbalanced equation: politely returned.

### Option 2: Submit it yourself (pull request)

Never touched GitHub? It's friendlier than it looks, and you never have to
leave the browser:

1. Create a free account at [github.com](https://github.com) (regular
   email signup, takes a minute).
2. Go to this project's repository page and click **Fork** (top right).
   This makes your own personal copy — you can't break anything. That's
   the entire point of a fork.
3. In *your* copy, click on **`data.js`**, then the **pencil icon** (Edit
   this file).
4. Find the section you're adding to — `ITEMS` for new substances,
   `RECIPES` for reactions. Each section is labeled with a big comment
   banner. Paste your filled-out template at the end of the section,
   right before the closing `];`. Mind your commas: every entry ends
   with one, like items on any good list.
5. Click **Commit changes**, give it a short description ("Add calcium
   chloride"), and commit.
6. GitHub will show a banner suggesting you **open a pull request** —
   click it, click **Create pull request**, and you're done. A pull
   request is just a formal way of saying "I made this better, want it?"

We review every submission for chemical accuracy. Argon's contributions
will be considered, though historically it doesn't react well to feedback.

---

## Project structure

| File | What it is |
|------|-----------|
| `index.html` | The shell — three panels, landing page, no surprises |
| `styles.css` | The periodic-table-dark theme |
| `data.js` | **All of the chemistry.** Items, recipes, fallbacks, achievements |
| `game.js` | The engine — contact detection, zones, magnet tug, zero chemistry |

## Support

Element Fusion is free and stays free. If it earns a place in your
classroom, you can [buy me a coffee](https://ko-fi.com/johnathanmoore9066)
— entirely optional, always appreciated, and yes, caffeine is a real
catalyst: it lowers the activation energy of grading lab reports.

## License

MIT. Free as in beer, and occasionally free as in radical.
