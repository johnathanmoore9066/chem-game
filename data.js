/* ============================================================
   ELEMENT FUSION — GAME DATA
   ============================================================
   Everything the game knows lives in this file. To extend the
   game, you only ever touch this file:

   1. ITEMS    — every element/compound that can exist.
   2. RECIPES  — valid combinations. Inputs are arrays of item
                 ids (duplicates allowed: ['h','h','o'] means
                 two hydrogens + one oxygen). Order never matters.
   3. HYPOTHETICALS — specific "no reaction, but here's why"
                 responses for interesting failed combos.
   4. ACHIEVEMENTS  — data-driven milestone definitions.

   The engine (game.js) reads all of this at load time and never
   hardcodes chemistry.
   ============================================================ */

window.GAME_DATA = (() => {

  /* ----------------------------------------------------------
     ITEMS
     kind:     'element' | 'compound'
     starter:  true = in inventory from the beginning
     category: drives tile color (see styles.css)
     tags:     used for achievements + fallback heuristics
  ---------------------------------------------------------- */
  const ITEMS = [
    // ---- Starting elements -------------------------------------------------
    { id:'h',  name:'Hydrogen', symbol:'H',  num:1,  kind:'element', starter:true, category:'nonmetal',
      tags:['element','nonmetal'],
      blurb:'The lightest and most abundant element — about 75% of all normal matter in the universe.',
      use:'Rocket fuel, ammonia production, and the raw material stars burn.',
      funFact:'A hydrogen atom is mostly empty space. If the nucleus were a marble, the electron cloud would be a football stadium.' },

    { id:'c',  name:'Carbon', symbol:'C', num:6, kind:'element', starter:true, category:'nonmetal',
      tags:['element','nonmetal'],
      blurb:'The backbone of all known life. Forms four covalent bonds, letting it build chains, rings, and lattices.',
      use:'Everything from diamond drill bits to the graphite in your pencil to you.',
      funFact:'Diamond and graphite are both pure carbon — the only difference is how the atoms are arranged.' },

    { id:'n',  name:'Nitrogen', symbol:'N', num:7, kind:'element', starter:true, category:'nonmetal',
      tags:['element','nonmetal'],
      blurb:'Makes up 78% of the air you breathe, mostly as inert N₂ held together by a stubborn triple bond.',
      use:'Fertilizer feedstock, food packaging, and liquid nitrogen cryogenics.',
      funFact:'Breaking the N≡N triple bond is so hard that fixing nitrogen industrially (the Haber process) consumes ~1–2% of the world\'s energy.' },

    { id:'o',  name:'Oxygen', symbol:'O', num:8, kind:'element', starter:true, category:'nonmetal',
      tags:['element','nonmetal'],
      blurb:'Highly reactive nonmetal that drives combustion, respiration, and corrosion.',
      use:'Breathing, steelmaking, water treatment, rocket oxidizer.',
      funFact:'Early Earth had almost no free oxygen. When photosynthetic microbes flooded the air with it, it caused a mass extinction — the Great Oxidation Event.' },

    { id:'na', name:'Sodium', symbol:'Na', num:11, kind:'element', starter:true, category:'alkali',
      tags:['element','metal','alkali'],
      blurb:'A soft, silvery alkali metal so reactive it must be stored under oil.',
      use:'Table salt, street lights, soap making, and coolant in some nuclear reactors.',
      funFact:'Sodium is soft enough to cut with a butter knife — and reacts violently enough with water to ignite.' },

    { id:'cl', name:'Chlorine', symbol:'Cl', num:17, kind:'element', starter:true, category:'halogen',
      tags:['element','nonmetal','halogen'],
      blurb:'A pungent yellow-green halogen gas, fiercely reactive and an aggressive oxidizer.',
      use:'Water disinfection, PVC plastic, bleach production.',
      funFact:'Chlorinating drinking water is credited with one of the largest jumps in human life expectancy in history.' },

    { id:'s',  name:'Sulfur', symbol:'S', num:16, kind:'element', starter:true, category:'nonmetal',
      tags:['element','nonmetal'],
      blurb:'The biblical "brimstone" — a yellow nonmetal found around volcanoes and hot springs.',
      use:'Sulfuric acid (the most-produced industrial chemical), vulcanized rubber, gunpowder.',
      funFact:'Pure sulfur is odorless. The rotten-egg smell people blame on it comes from hydrogen sulfide.' },

    { id:'fe', name:'Iron', symbol:'Fe', num:26, kind:'element', starter:true, category:'metal',
      tags:['element','metal'],
      blurb:'The workhorse transition metal and, by mass, the most common element on Earth (most of it in the core).',
      use:'Steel, magnets, hemoglobin — the molecule carrying oxygen in your blood right now.',
      funFact:'Iron is the end of the line for stellar fusion. Fusing iron costs energy instead of releasing it, which is what kills massive stars.' },

    { id:'cu', name:'Copper', symbol:'Cu', num:29, kind:'element', starter:true, category:'metal',
      tags:['element','metal'],
      blurb:'One of the few metals with natural color, and one of the first humans ever worked.',
      use:'Electrical wiring, plumbing, cookware, antimicrobial surfaces.',
      funFact:'Copper surfaces kill bacteria on contact — hospital door handles made of brass and copper measurably reduce infections.' },

    { id:'zn', name:'Zinc', symbol:'Zn', num:30, kind:'element', starter:true, category:'metal',
      tags:['element','metal'],
      blurb:'A bluish metal best known for sacrificing itself to protect steel from rust.',
      use:'Galvanizing, batteries, brass, sunscreen (as zinc oxide), and your immune system.',
      funFact:'A US penny is 97.5% zinc with a thin copper coat — copper got too expensive in 1982.' },

    { id:'ca', name:'Calcium', symbol:'Ca', num:20, kind:'element', starter:true, category:'alkaline',
      tags:['element','metal','alkaline'],
      blurb:'A reactive alkaline-earth metal that never occurs free in nature — but builds bones, shells, and mountains.',
      use:'Cement, plaster, antacids, and the skeleton holding you upright.',
      funFact:'The White Cliffs of Dover are calcium carbonate — compressed shells of trillions of microscopic sea organisms.' },

    // ---- Elements discovered through fusion --------------------------------
    { id:'he', name:'Helium', symbol:'He', num:2, kind:'element', starter:false, category:'noble',
      tags:['element','noble-gas','fusion'],
      blurb:'Forged by hydrogen fusion in stellar cores. The second most abundant element in the universe — and chemically inert.',
      use:'MRI magnet cooling, balloons, deep-sea diving mixes, leak detection.',
      funFact:'Helium was discovered in the Sun (via its spectral lines) 27 years before anyone found it on Earth. Hence the name — helios.' },

    { id:'ne', name:'Neon', symbol:'Ne', num:10, kind:'element', starter:false, category:'noble',
      tags:['element','noble-gas','fusion'],
      blurb:'Born in carbon-burning stars. A noble gas that refuses to bond with anything.',
      use:'Glowing signs, high-voltage indicators, cryogenic refrigerant.',
      funFact:'True neon signs only glow red-orange. Every other "neon" color is actually argon, mercury vapor, or colored glass.' },

    { id:'mg', name:'Magnesium', symbol:'Mg', num:12, kind:'element', starter:false, category:'alkaline',
      tags:['element','metal','alkaline','fusion'],
      blurb:'Made in stars by alpha capture. Light, strong, and burns with a blinding white flame.',
      use:'Aircraft alloys, flares, fireworks — and the atom at the center of every chlorophyll molecule.',
      funFact:'Burning magnesium is nearly impossible to extinguish with water — it rips the oxygen right out of H₂O and keeps burning.' },

    { id:'si', name:'Silicon', symbol:'Si', num:14, kind:'element', starter:false, category:'metalloid',
      tags:['element','metalloid','fusion'],
      blurb:'A metalloid forged late in massive stars. Sits below carbon on the periodic table and makes up 28% of Earth\'s crust.',
      use:'Computer chips, solar panels, glass, concrete.',
      funFact:'Sci-fi loves silicon-based life because silicon bonds like carbon — but its bonds with oxygen are so strong that silicon "breath" would be solid quartz.' },

    { id:'ar', name:'Argon', symbol:'Ar', num:18, kind:'element', starter:false, category:'noble',
      tags:['element','noble-gas','fusion'],
      blurb:'Produced in the alpha ladder of dying stars. Nearly 1% of Earth\'s atmosphere, and completely unreactive.',
      use:'Welding shield gas, double-pane window insulation, preserving documents like the U.S. Constitution.',
      funFact:'Its name comes from the Greek argos — "lazy" — because it does absolutely nothing chemically.' },

    /* ---- Compounds --------------------------------------------------------
       Atmospheric & simple molecules */
    { id:'water', name:'Water', formula:'H₂O', kind:'compound', starter:false, category:'molecule',
      tags:['molecule','atmospheric'],
      blurb:'The universal solvent. Bent molecular shape gives it polarity, which gives it almost all of its weird, life-enabling behavior.',
      use:'Solvent, coolant, habitat, ~60% of your body.',
      funFact:'Ice floats because water expands when it freezes — almost no other substance does this, and life in lakes depends on it.' },

    { id:'h2', name:'Hydrogen Gas', formula:'H₂', kind:'compound', starter:false, category:'atmospheric',
      tags:['molecule','atmospheric'],
      blurb:'Two hydrogen atoms sharing their lone electrons in a single covalent bond — the simplest molecule that exists.',
      use:'Rocket fuel, hydrogenation of fats and oils, ammonia synthesis, and a candidate clean fuel.',
      funFact:'On the bench, two hydrogens bond into H₂. In a stellar core, the same pair fuses into helium — location is everything.' },

    { id:'oxygen-gas', name:'Oxygen Gas', formula:'O₂', kind:'compound', starter:false, category:'atmospheric',
      tags:['molecule','atmospheric'],
      blurb:'Two oxygen atoms double-bonded together — the form of oxygen your lungs actually want.',
      use:'Respiration, combustion, medical oxygen, steelmaking.',
      funFact:'Liquid oxygen is pale blue and magnetic — you can hang it between the poles of a strong magnet.' },

    { id:'nitrogen-gas', name:'Nitrogen Gas', formula:'N₂', kind:'compound', starter:false, category:'atmospheric',
      tags:['molecule','atmospheric'],
      blurb:'Two nitrogen atoms locked in a triple bond — one of the strongest bonds in chemistry, which is why air is mostly inert.',
      use:'Inert blanketing for food and electronics, liquid nitrogen cooling.',
      funFact:'Every breath you take is 78% nitrogen that your body completely ignores and exhales unchanged.' },

    { id:'ozone', name:'Ozone', formula:'O₃', kind:'compound', starter:false, category:'atmospheric',
      tags:['molecule','atmospheric'],
      blurb:'Three oxygen atoms in a strained, reactive arrangement. A shield in the stratosphere, a pollutant at street level.',
      use:'UV protection (up high), water purification, sterilization.',
      funFact:'That sharp smell after a lightning storm? Ozone. Its name comes from the Greek ozein — "to smell."' },

    { id:'air', name:'Air', formula:'N₂ + O₂ (+ Ar, CO₂…)', kind:'compound', starter:false, category:'atmospheric',
      tags:['mixture','atmospheric'],
      blurb:'Not a compound at all — a mixture. Roughly 78% nitrogen, 21% oxygen, 1% argon, and traces of everything else.',
      use:'Breathing, combustion, pneumatics, the thing weather happens in.',
      funFact:'Air has mass: the column of it above one square meter at sea level weighs about 10 tonnes.' },

    { id:'hydroxyl', name:'Hydroxyl Radical', formula:'•OH', kind:'compound', starter:false, category:'radical',
      tags:['radical','atmospheric'],
      blurb:'An oxygen-hydrogen fragment with an unpaired electron, making it ferociously reactive.',
      use:'Nature\'s atmospheric janitor — it oxidizes pollutants and greenhouse gases out of the sky.',
      funFact:'Chemists call •OH "the detergent of the atmosphere." A typical one survives less than a second before reacting.' },

    { id:'peroxide', name:'Hydrogen Peroxide', formula:'H₂O₂', kind:'compound', starter:false, category:'molecule',
      tags:['molecule','oxidizer'],
      blurb:'Water with one oxygen too many. That weak O–O bond makes it eager to decompose and oxidize things.',
      use:'Disinfectant, hair bleach, rocket propellant at high concentrations.',
      funFact:'The fizzing on a cut isn\'t the peroxide attacking germs — it\'s an enzyme in your blood (catalase) tearing the peroxide apart into water and oxygen.' },

    /* Carbon oxides & carbonic acid */
    { id:'co', name:'Carbon Monoxide', formula:'CO', kind:'compound', starter:false, category:'atmospheric',
      tags:['molecule','toxic','atmospheric'],
      blurb:'Incomplete combustion\'s calling card. Colorless, odorless, and binds hemoglobin ~240× more strongly than oxygen.',
      use:'Industrial reducing agent in steelmaking; otherwise mostly a hazard to detect.',
      funFact:'CO poisoning was so common in gas-lit Victorian homes that "haunted house" symptoms — dread, hallucinations, hearing things — track suspiciously well with chronic CO exposure.' },

    { id:'co2', name:'Carbon Dioxide', formula:'CO₂', kind:'compound', starter:false, category:'atmospheric',
      tags:['molecule','atmospheric'],
      blurb:'Fully oxidized carbon. What you exhale, what plants inhale, and the lever arm of Earth\'s climate.',
      use:'Carbonation, fire extinguishers, dry ice, photosynthesis feedstock.',
      funFact:'Dry ice skips the liquid phase entirely at normal pressure — solid CO₂ sublimates straight to gas at −78.5 °C.' },

    { id:'carbonic-acid', name:'Carbonic Acid', formula:'H₂CO₃', kind:'compound', starter:false, category:'acid',
      tags:['acid','molecule'],
      blurb:'What CO₂ becomes when it dissolves in water. Weak, unstable, and the reason soda is tangy.',
      use:'Carbonated drinks, blood pH buffering, slow sculptor of limestone caves.',
      funFact:'Your blood uses the carbonic acid/bicarbonate equilibrium to hold pH at 7.4 — drift by 0.2 either way and you\'re in the ER.' },

    /* Organic chain */
    { id:'methane', name:'Methane', formula:'CH₄', kind:'compound', starter:false, category:'organic',
      tags:['organic','molecule','fuel'],
      blurb:'The simplest hydrocarbon — one carbon, four hydrogens, perfect tetrahedral symmetry.',
      use:'Natural gas: heating, cooking, electricity generation.',
      funFact:'Methane is odorless. The "gas smell" is mercaptan, a sulfur compound added on purpose so leaks are noticeable.' },

    { id:'methanol', name:'Methanol', formula:'CH₃OH', kind:'compound', starter:false, category:'organic',
      tags:['organic','molecule','toxic'],
      blurb:'The simplest alcohol — methane with one hydrogen swapped for a hydroxyl group. Toxic because your liver oxidizes it into formaldehyde.',
      use:'Fuel, antifreeze, solvent, feedstock for formaldehyde and plastics.',
      funFact:'The treatment for methanol poisoning is, historically, ethanol — regular alcohol keeps the liver enzyme busy so methanol passes through unconverted.' },

    { id:'formaldehyde', name:'Formaldehyde', formula:'CH₂O', kind:'compound', starter:false, category:'organic',
      tags:['organic','molecule','toxic'],
      blurb:'The simplest aldehyde — sharp-smelling, reactive, and a crosslinker of proteins (which is why it preserves tissue).',
      use:'Resins, plywood adhesives, embalming, vaccine production.',
      funFact:'Formaldehyde has been detected in interstellar space — it was the first polyatomic organic molecule found out there.' },

    { id:'ethane', name:'Ethane', formula:'C₂H₆', kind:'compound', starter:false, category:'organic',
      tags:['organic','molecule','fuel'],
      blurb:'Two carbons, single-bonded, saturated with hydrogen. The second-simplest alkane.',
      use:'Cracked industrially into ethylene — the gateway to most plastics.',
      funFact:'Titan, Saturn\'s moon, has lakes of liquid ethane and methane — the only known open liquid on a surface besides Earth\'s.' },

    { id:'ethylene', name:'Ethylene', formula:'C₂H₄', kind:'compound', starter:false, category:'organic',
      tags:['organic','molecule'],
      blurb:'Two carbons sharing a double bond. That bond is reactive real estate — it\'s why ethylene polymerizes into polyethylene.',
      use:'The most-produced organic compound on Earth: plastics, antifreeze, and ripening fruit.',
      funFact:'Ethylene is a plant hormone. One ripening banana in a bag releases enough of it to ripen everything else — that trick is real chemistry.' },

    { id:'acetylene', name:'Acetylene', formula:'C₂H₂', kind:'compound', starter:false, category:'organic',
      tags:['organic','molecule','fuel'],
      blurb:'Two carbons with a triple bond — packed with energy and itching to release it.',
      use:'Oxy-acetylene welding torches that hit ~3,300 °C.',
      funFact:'Pure pressurized acetylene can detonate on its own. Welding tanks store it dissolved in acetone soaked into porous filler — a chemistry hack disguised as a gas bottle.' },

    { id:'ethanol', name:'Ethanol', formula:'C₂H₅OH', kind:'compound', starter:false, category:'organic',
      tags:['organic','molecule'],
      blurb:'Drinking alcohol — an ethyl group wearing a hydroxyl. Industrially made by hydrating ethylene; biologically by yeast.',
      use:'Beverages, fuel additive, solvent, antiseptic.',
      funFact:'There\'s a molecular cloud near the center of the galaxy containing roughly 10²⁸ liters of ethanol. Unfortunately it\'s spread across light-years.' },

    { id:'acetic-acid', name:'Acetic Acid', formula:'CH₃COOH', kind:'compound', starter:false, category:'acid',
      tags:['organic','acid','molecule'],
      blurb:'Oxidized ethanol — the acid in vinegar. Weak as acids go, but the workhorse of kitchen and industrial chemistry alike.',
      use:'Vinegar (~5% solution), plastics (vinyl acetate), film, food preservation.',
      funFact:'Wine turning to vinegar is this exact reaction, run by Acetobacter bacteria. "Vinegar" literally means vin aigre — sour wine.' },

    { id:'ethyl-acetate', name:'Ethyl Acetate', formula:'CH₃COOC₂H₅', kind:'compound', starter:false, category:'organic',
      tags:['organic','molecule','ester'],
      blurb:'An ester — alcohol and acid condensed together, losing a water. Esters are why fruit smells like fruit.',
      use:'Nail polish remover, decaffeinating coffee, glues, that solvent smell in markers.',
      funFact:'Swap the alcohol or acid and you get different fruit aromas: pentyl acetate is banana, octyl acetate is orange. Esterification is nature\'s perfume kit.' },

    { id:'benzene', name:'Benzene', formula:'C₆H₆', kind:'compound', starter:false, category:'organic',
      tags:['organic','molecule','aromatic','toxic'],
      blurb:'Six carbons in a ring with delocalized electrons smeared around it — the foundation of aromatic chemistry.',
      use:'Feedstock for plastics, resins, nylon, detergents (handled carefully — it\'s a carcinogen).',
      funFact:'Kekulé claimed the ring structure came to him in a dream of a snake biting its own tail. Chemists have argued about whether he made that up ever since.' },

    { id:'phenol', name:'Phenol', formula:'C₆H₅OH', kind:'compound', starter:false, category:'organic',
      tags:['organic','molecule','aromatic'],
      blurb:'Benzene with a hydroxyl group — acidic for an alcohol, thanks to the ring stabilizing its conjugate base.',
      use:'Resins, nylon precursor, and historically the first surgical antiseptic.',
      funFact:'Joseph Lister sprayed phenol ("carbolic acid") in operating rooms in the 1860s and slashed surgical death rates. Listerine is named after him.' },

    { id:'salicylic-acid', name:'Salicylic Acid', formula:'C₇H₆O₃', kind:'compound', starter:false, category:'organic',
      tags:['organic','acid','aromatic','pharma'],
      blurb:'Phenol with a carboxyl group bolted on (the Kolbe–Schmitt reaction). Found naturally in willow bark.',
      use:'Acne treatment, wart removers, and the direct precursor to aspirin.',
      funFact:'Willow bark tea was prescribed for pain by Hippocrates ~2,400 years ago. The active ingredient was salicylic acid all along — it just wrecked your stomach.' },

    { id:'aspirin', name:'Aspirin', formula:'C₉H₈O₄', kind:'compound', starter:false, category:'organic',
      tags:['organic','aromatic','pharma'],
      blurb:'Acetylsalicylic acid — salicylic acid with an acetyl group capping the harsh phenol. Same painkiller, far gentler on the stomach.',
      use:'Pain relief, fever reduction, anti-inflammatory, low-dose heart attack prevention.',
      funFact:'Synthesized at Bayer in 1897, aspirin is arguably the first blockbuster drug — and we didn\'t figure out how it actually works (blocking prostaglandins) until 1971.' },

    /* Nitrogen chemistry */
    { id:'ammonia', name:'Ammonia', formula:'NH₃', kind:'compound', starter:false, category:'base',
      tags:['base','molecule'],
      blurb:'A nitrogen with three hydrogens and a lone pair — that lone pair makes it a base and a great ligand.',
      use:'Fertilizer (the big one), refrigerant, cleaning products.',
      funFact:'The Haber–Bosch process for making ammonia feeds roughly half the people on Earth. About 50% of the nitrogen in your body passed through a chemical plant.' },

    { id:'ammonium-chloride', name:'Ammonium Chloride', formula:'NH₄Cl', kind:'compound', starter:false, category:'salt',
      tags:['salt','molecule'],
      blurb:'Ammonia (base) meets hydrogen chloride (acid) and they neutralize into a salt — famously as white smoke when the gases just touch in air.',
      use:'Flux for soldering, licorice candy (salmiak), dry-cell batteries, expectorants.',
      funFact:'Hold open bottles of ammonia and hydrochloric acid near each other and a white ribbon of NH₄Cl smoke forms in midair — a classic demo of gases reacting on contact.' },

    { id:'nitric-oxide', name:'Nitric Oxide', formula:'NO', kind:'compound', starter:false, category:'radical',
      tags:['radical','molecule','atmospheric'],
      blurb:'A stable free radical — one unpaired electron, yet it survives long enough to act as a signaling molecule in your body.',
      use:'Vasodilation signaling, semiconductor manufacturing.',
      funFact:'NO is why nitroglycerin treats chest pain — it releases NO, which tells blood vessels to relax and widen. The discovery of NO as a signaling molecule won the 1998 Nobel Prize in Physiology.' },

    { id:'nitrogen-dioxide', name:'Nitrogen Dioxide', formula:'NO₂', kind:'compound', starter:false, category:'atmospheric',
      tags:['molecule','toxic','atmospheric'],
      blurb:'A reddish-brown toxic gas — the visible color in smog and the brown fumes over nitric acid spills.',
      use:'Intermediate in nitric acid production; rocket oxidizer (as N₂O₄).',
      funFact:'That brown haze over cities on hot days is largely NO₂ from engine exhaust reacting in sunlight.' },

    { id:'nitric-acid', name:'Nitric Acid', formula:'HNO₃', kind:'compound', starter:false, category:'acid',
      tags:['acid','molecule','oxidizer'],
      blurb:'A strong acid and strong oxidizer in one — it doesn\'t just donate protons, it tears electrons away too.',
      use:'Fertilizers, explosives, etching metals, rocket propellant.',
      funFact:'Mix it 1:3 with hydrochloric acid and you get aqua regia — "royal water" — the only common acid mixture that dissolves gold.' },

    /* Sulfur chemistry */
    { id:'hydrogen-sulfide', name:'Hydrogen Sulfide', formula:'H₂S', kind:'compound', starter:false, category:'molecule',
      tags:['molecule','toxic'],
      blurb:'Water\'s evil twin — same shape, sulfur instead of oxygen. The actual source of rotten-egg smell.',
      use:'Produced in sour gas wells and sewers; used to make sulfur and sulfuric acid.',
      funFact:'Your nose detects H₂S at parts-per-billion, but at dangerous concentrations it paralyzes your sense of smell — the gas literally hides itself right when it matters most.' },

    { id:'sulfur-dioxide', name:'Sulfur Dioxide', formula:'SO₂', kind:'compound', starter:false, category:'atmospheric',
      tags:['molecule','atmospheric','toxic'],
      blurb:'Burnt sulfur. Sharp-smelling gas from volcanoes, coal plants, and the first step toward sulfuric acid.',
      use:'Wine and dried-fruit preservative, bleaching, refrigerant historically.',
      funFact:'Large volcanic eruptions inject SO₂ into the stratosphere where it forms reflective droplets — Pinatubo in 1991 cooled the whole planet ~0.5 °C for two years.' },

    { id:'sulfur-trioxide', name:'Sulfur Trioxide', formula:'SO₃', kind:'compound', starter:false, category:'molecule',
      tags:['molecule','toxic'],
      blurb:'SO₂ pushed one oxidation further. Reacts with water so violently that industry dissolves it in sulfuric acid instead.',
      use:'The key intermediate in sulfuric acid manufacture (the contact process).',
      funFact:'SO₃ + water releases so much heat it flash-boils the water into acid mist — which is exactly why you add acid to water, never water to acid.' },

    { id:'sulfurous-acid', name:'Sulfurous Acid', formula:'H₂SO₃', kind:'compound', starter:false, category:'acid',
      tags:['acid','molecule'],
      blurb:'SO₂ dissolved in water — a weak, unstable acid that mostly exists as dissolved gas in equilibrium.',
      use:'Mild bleaching and preservation; a component of acid rain.',
      funFact:'Nobody has ever isolated pure H₂SO₃ — it only exists in solution, always ready to fall apart back into SO₂ and water.' },

    { id:'sulfuric-acid', name:'Sulfuric Acid', formula:'H₂SO₄', kind:'compound', starter:false, category:'acid',
      tags:['acid','molecule','oxidizer'],
      blurb:'The king of industrial chemicals — strong acid, dehydrating agent, and produced in greater tonnage than any other compound.',
      use:'Fertilizer, car batteries, metal processing, oil refining.',
      funFact:'A country\'s sulfuric acid consumption is a classic economist\'s proxy for its industrial output. It touches almost everything manufactured.' },

    /* Acids, bases, salts */
    { id:'hydrochloric-acid', name:'Hydrogen Chloride', formula:'HCl', kind:'compound', starter:false, category:'acid',
      tags:['acid','molecule'],
      blurb:'Hydrogen and chlorine, sharing electrons very unequally. Dissolved in water it dissociates completely — a textbook strong acid.',
      use:'Steel pickling, pH control, food processing — and your stomach.',
      funFact:'Your stomach acid is ~0.5% HCl, around pH 1.5–2. Your stomach lining replaces itself every few days because it\'s slowly digesting itself.' },

    { id:'salt', name:'Table Salt', formula:'NaCl', kind:'compound', starter:false, category:'salt',
      tags:['salt','mineral'],
      blurb:'A violent metal plus a toxic gas equals dinner. Ionic bonding at its most iconic — Na⁺ and Cl⁻ stacked in a perfect cubic lattice.',
      use:'Seasoning, food preservation, de-icing, chlorine production.',
      funFact:'"Salary" comes from sal — Roman soldiers were partly paid in salt allowances. Being "worth your salt" is a 2,000-year-old performance review.' },

    { id:'salt-water', name:'Salt Water', formula:'NaCl(aq)', kind:'compound', starter:false, category:'salt',
      tags:['salt','mixture'],
      blurb:'Salt\'s ionic lattice pulled apart by polar water molecules — Na⁺ and Cl⁻ ions floating free, which is why it conducts electricity.',
      use:'Saline solution, brining (ask any cook), electrolysis feedstock, 97% of Earth\'s water.',
      funFact:'Brining works by osmosis and protein denaturation — the salt actually restructures muscle proteins so they hold more moisture during cooking.' },

    { id:'sodium-hydroxide', name:'Sodium Hydroxide', formula:'NaOH', kind:'compound', starter:false, category:'base',
      tags:['base','molecule'],
      blurb:'Lye — the textbook strong base. Sodium metal hits water, hydrogen gas erupts (often igniting), and this is what\'s left.',
      use:'Soap making, drain cleaner, paper production, pretzel glazing.',
      funFact:'Pretzels get their deep brown shine from a lye dip before baking — the high pH supercharges the Maillard reaction.' },

    { id:'bleach', name:'Bleach', formula:'NaOCl', kind:'compound', starter:false, category:'base',
      tags:['base','oxidizer','molecule'],
      blurb:'Sodium hypochlorite — chlorine tamed by lye into a household oxidizer that destroys pigments and pathogens.',
      use:'Disinfection, laundry whitening, water treatment.',
      funFact:'Bleach doesn\'t remove stains — it oxidizes the stain\'s molecules until they stop absorbing visible light. The stain is still there; you just can\'t see it.' },

    { id:'soda-ash', name:'Sodium Carbonate', formula:'Na₂CO₃', kind:'compound', starter:false, category:'salt',
      tags:['salt','base','mineral'],
      blurb:'Soda ash / washing soda — a strong-ish base salt that\'s been used since ancient Egypt (as natron, for mummification).',
      use:'Glassmaking (the big one), water softening, ramen noodles (kansui gives them their bounce).',
      funFact:'Alkaline noodles are sodium carbonate chemistry — it raises the dough pH, changing gluten behavior and turning the noodles yellow and springy.' },

    { id:'baking-soda', name:'Baking Soda', formula:'NaHCO₃', kind:'compound', starter:false, category:'salt',
      tags:['salt','base','mineral'],
      blurb:'Sodium bicarbonate — a gentle base that releases CO₂ when it meets acid or heat. The chemistry of leavening.',
      use:'Baking, antacids, fire extinguishers, deodorizing.',
      funFact:'Baking powder is just baking soda pre-packaged with a dry acid — add water and the neutralization reaction inflates your pancakes.' },

    /* The lime cycle + minerals */
    { id:'quicklime', name:'Quicklime', formula:'CaO', kind:'compound', starter:false, category:'mineral',
      tags:['mineral','base','oxide'],
      blurb:'Calcium oxide — one of humanity\'s oldest manufactured chemicals, made by roasting limestone for ~7,000 years.',
      use:'Cement, steelmaking flux, soil treatment, water purification.',
      funFact:'Before electric lights, theaters burned quicklime to brilliant white incandescence for spotlights — literally being "in the limelight."' },

    { id:'slaked-lime', name:'Slaked Lime', formula:'Ca(OH)₂', kind:'compound', starter:false, category:'base',
      tags:['base','mineral'],
      blurb:'Quicklime plus water, in a reaction hot enough to boil. The result is the binder in mortar and plaster.',
      use:'Mortar, plaster, nixtamalizing corn, sugar refining, whitewash.',
      funFact:'Soaking corn in slaked lime (nixtamalization) frees up its niacin. Cultures that adopted corn without the lime trick got pellagra epidemics — the chemistry mattered that much.' },

    { id:'limestone', name:'Limestone', formula:'CaCO₃', kind:'compound', starter:false, category:'mineral',
      tags:['mineral','salt'],
      blurb:'Calcium carbonate — slaked lime reabsorbing CO₂ from the air completes the lime cycle. Also: chalk, marble, seashells, and antacids.',
      use:'Construction, cement, paper filler, agriculture, Tums.',
      funFact:'Mortar in ancient Roman walls is still slowly absorbing CO₂ and turning back into limestone — the buildings have been curing for 2,000 years.' },

    { id:'sand', name:'Quartz / Sand', formula:'SiO₂', kind:'compound', starter:false, category:'mineral',
      tags:['mineral','oxide'],
      blurb:'Silicon dioxide — silicon and oxygen in an endless covalent network. The most common mineral in Earth\'s crust.',
      use:'Glass, concrete, fiber optics, computer chips (after serious purification).',
      funFact:'Quartz is piezoelectric — squeeze it and it produces voltage. That\'s the crystal keeping time in quartz watches, vibrating exactly 32,768 times per second.' },

    { id:'glass', name:'Glass', formula:'SiO₂·Na₂O·CaO', kind:'compound', starter:false, category:'mineral',
      tags:['mineral','material'],
      blurb:'Sand melted with soda ash (drops the melting point ~900 °C) and limestone (stops it dissolving in water). An amorphous solid — frozen liquid structure.',
      use:'Windows, bottles, fiber optics, screens, lab equipment.',
      funFact:'Old windows being "thicker at the bottom" isn\'t glass flowing — it\'s just how old glass was made. Glass at room temperature would take longer than the age of the universe to visibly flow.' },

    /* Metals, alloys, oxides */
    { id:'steel', name:'Steel', formula:'Fe + C (~0.2–2%)', kind:'compound', starter:false, category:'alloy',
      tags:['alloy','metal','material'],
      blurb:'Iron with a small, deliberate dose of carbon. The carbon atoms wedge into the iron lattice and stop layers from sliding — hardness from impurity.',
      use:'Buildings, vehicles, tools, knives — civilization\'s structural default.',
      funFact:'The difference between a butter-soft iron nail and a razor-holding chef\'s knife is about 1% carbon and a heat-treatment schedule. Tiny composition changes, huge property changes.' },

    { id:'rust', name:'Rust', formula:'Fe₂O₃·nH₂O', kind:'compound', starter:false, category:'oxide',
      tags:['oxide','mineral'],
      blurb:'Hydrated iron(III) oxide — iron slowly burning at room temperature. Needs both oxygen and water; remove either and it stops.',
      use:'Pigment (ochre, the oldest paint humans used), polishing rouge, thermite.',
      funFact:'Rust is the same chemical family as the minerals that make Mars red. Mars is, essentially, a rusty planet.' },

    { id:'brass', name:'Brass', formula:'Cu + Zn', kind:'compound', starter:false, category:'alloy',
      tags:['alloy','metal','material'],
      blurb:'Copper and zinc dissolved into each other as a solid solution. Harder than copper, more corrosion-resistant, and famously acoustic.',
      use:'Instruments, plumbing fittings, ammunition casings, door hardware.',
      funFact:'Brass instruments aren\'t brass for the sound first — it was workability and corrosion resistance. The "brassy" timbre comes mostly from the player and the bore shape.' },

    { id:'pyrite', name:'Pyrite', formula:'FeS₂', kind:'compound', starter:false, category:'mineral',
      tags:['mineral'],
      blurb:'Iron disulfide — "fool\'s gold." Brassy metallic cubes that fooled generations of prospectors.',
      use:'Historic sulfur source, sparking steel for flintlocks, lithium battery cathodes.',
      funFact:'The quick test: gold is soft and dents; pyrite is brittle and shatters. Also, pyrite struck against steel throws sparks — its name comes from the Greek for fire.' },

    { id:'copper-oxide', name:'Copper Oxide', formula:'CuO', kind:'compound', starter:false, category:'oxide',
      tags:['oxide','mineral'],
      blurb:'Copper tarnished by oxygen — the black layer on a heated copper pan, and the first step toward verdigris patina.',
      use:'Pigments, ceramics glazes, batteries, fungicides.',
      funFact:'The Statue of Liberty\'s green isn\'t paint — it\'s ~130 years of copper oxidation chemistry, and the patina now protects the metal underneath.' },

    { id:'zinc-oxide', name:'Zinc Oxide', formula:'ZnO', kind:'compound', starter:false, category:'oxide',
      tags:['oxide','mineral'],
      blurb:'A white powder that scatters and absorbs UV light — physics-based sunscreen rather than chemical absorption alone.',
      use:'Sunscreen, diaper cream, rubber vulcanization, paint pigment.',
      funFact:'Zinc oxide sunscreen works the day you put it on and hasn\'t fundamentally changed since Roman times — it\'s a physical UV mirror on your skin.' },
  ];

  /* ----------------------------------------------------------
     RECIPES
     inputs:  array of item ids (duplicates = need that many)
     output:  item id created
     note:    shown in the log — the "why" behind the reaction
  ---------------------------------------------------------- */
  const RECIPES = [
    // --- Stellar fusion (the game's namesake) ---
    { inputs:['h','h'], mode:'fusion', output:'he',
      note:'Proton–proton fusion: in stellar cores, hydrogen nuclei overcome their mutual repulsion and fuse. This is the reaction powering the Sun — 600 million tonnes of hydrogen per second.' },
    { inputs:['he','he','he'], mode:'fusion', output:'c',
      note:'The triple-alpha process: three helium nuclei collide nearly simultaneously to form carbon. Two-helium collisions fail (see what happens if you try!), so stars need this improbable triple hit — every carbon atom in you came from it.' },
    { inputs:['c','he'], mode:'fusion', output:'o',
      note:'Alpha capture: carbon absorbs a helium nucleus to become oxygen. The carbon/oxygen ratio in the universe is set by the race between this reaction and the triple-alpha process.' },
    { inputs:['c','c'], mode:'fusion', output:'ne',
      note:'Carbon burning: in stars over ~8 solar masses, carbon nuclei fuse, producing neon (plus sodium and magnesium). This stage lasts only ~1,000 years — the star is running out of time.' },
    { inputs:['ne','he'], mode:'fusion', output:'mg',
      note:'The alpha ladder continues: neon captures a helium nucleus to form magnesium, deep in a dying star\'s onion-layered core.' },
    { inputs:['mg','he'], mode:'fusion', output:'si',
      note:'Alpha capture once more: magnesium + helium → silicon. Silicon burning is the final fusion stage before iron — after which the star collapses.' },
    { inputs:['o','he'], mode:'fusion', output:'ne',
      note:'Alpha capture: oxygen-16 + helium-4 → neon-20. The ladder continues — each rung is a nucleus swallowing one more alpha particle.' },
    { inputs:['o','o'], mode:'fusion', output:'si',
      note:'Oxygen burning: ¹⁶O + ¹⁶O → ²⁸Si + α (mostly). Ignites around 2 billion K, late in a massive star\'s life. Note that "noble" neon and argon form this way too — electron-shell nobility means nothing to a bare nucleus.' },
    { inputs:['si','he'], mode:'fusion', output:'s',
      note:'Alpha capture: silicon-28 + helium-4 → sulfur-32. In real stars this happens during silicon burning, a frantic final week of rearrangement before core collapse.' },
    { inputs:['si','si'], mode:'fusion', output:'fe',
      note:'The end of the line. Real "silicon burning" isn\'t literal Si+Si — it\'s photodisintegration reshuffling nuclei up to iron-peak elements — but the destination is honest: ⁵⁶Fe has the highest binding energy per nucleon. Fusing past iron COSTS energy. This is why stars die.' },
    { inputs:['s','he'], mode:'fusion', output:'ar',
      note:'Alpha process: sulfur-32 captures a helium nucleus to form argon-36. The "lazy" gas in your window panes was forged in a supernova\'s last days.' },

    // --- Simple molecules & atmosphere ---
    { inputs:['h','h'], output:'h2',
      note:'H + H → H₂. Two lone hydrogen atoms can\'t resist pairing — each contributes its single electron to a shared bond. (Drag the same pair into the Stellar Core and you get fusion instead.)' },
    { inputs:['h2','o'], output:'water',
      note:'H₂ + O → H₂O. Hydrogen burning — violently exothermic, the reaction in hydrogen rocket engines. Bent at 104.5°, and the most important molecule on Earth.' },
    { inputs:['hydroxyl','h'], output:'water',
      note:'•OH + H → H₂O: radical recombination. The hydroxyl radical grabs the hydrogen it always wanted. This is genuinely how water assembles in interstellar gas clouds.' },
    { inputs:['o','o'], output:'oxygen-gas',
      note:'Two oxygen atoms pair into O₂ with a double bond. Single oxygen atoms are too reactive to last; pairing up is how oxygen exists in air.' },
    { inputs:['n','n'], output:'nitrogen-gas',
      note:'N + N → N₂, locked with a triple bond worth 945 kJ/mol — the reason most of the atmosphere is chemically asleep.' },
    { inputs:['oxygen-gas','o'], output:'ozone',
      note:'O₂ + O → O₃: exactly how the ozone layer forms. UV light splits O₂ high in the stratosphere, and the freed atoms stick to other O₂ molecules. Strained and reactive — useful up there, harmful down here.' },
    { inputs:['nitrogen-gas','oxygen-gas'], output:'air',
      note:'Not a reaction — a mixture! N₂ and O₂ coexist without bonding (mostly). That distinction between mixture and compound is one of chemistry\'s first big ideas.' },
    { inputs:['h','o'], output:'hydroxyl',
      note:'H + O → •OH, a radical with an unpaired electron. In the atmosphere, these form when UV light splits ozone near water vapor — then they oxidize nearly everything they touch.' },
    { inputs:['hydroxyl','hydroxyl'], output:'peroxide',
      note:'•OH + •OH → H₂O₂: two radicals pair their lonely electrons into a weak O–O bond that\'s forever eager to break — which is exactly what makes peroxide a useful oxidizer.' },

    // --- Carbon oxides ---
    { inputs:['c','o'], output:'co',
      note:'2C + O₂ → 2CO: incomplete combustion. Not enough oxygen to fully oxidize carbon — this is why running engines or grills in enclosed spaces kills.' },
    { inputs:['c','oxygen-gas'], output:'co2',
      note:'C + O₂ → CO₂: complete combustion. Carbon fully oxidized — the end state of burning anything organic, and what your cells produce making energy.' },
    { inputs:['co','o'], output:'co2',
      note:'CO + O → CO₂: finishing the job. Carbon monoxide is combustion interrupted — give it the oxygen it\'s missing and it completes into carbon dioxide. This is what catalytic converters do.' },
    { inputs:['co2','water'], output:'carbonic-acid',
      note:'CO₂ + H₂O ⇌ H₂CO₃. An equilibrium, not a one-way street — which is why soda goes flat. The same reaction is acidifying the oceans as they absorb atmospheric CO₂.' },

    // --- Organic chemistry chain ---
    { inputs:['c','h2','h2'], output:'methane',
      note:'C + 2H₂ → CH₄. One carbon, four hydrogens, perfect tetrahedron. The starting point of organic chemistry.' },
    { inputs:['methane','o'], output:'methanol',
      note:'Partial oxidation: CH₄ + ½O₂ → CH₃OH. Sneak one oxygen into methane without burning it completely — industrially done via syngas.' },
    { inputs:['methanol','o'], output:'formaldehyde',
      note:'Oxidation continues: CH₃OH → CH₂O. Each oxidation step climbs a ladder: alkane → alcohol → aldehyde → carboxylic acid. You\'ll see this pattern again.' },
    { inputs:['methane','methane'], output:'ethane',
      note:'Oxidative coupling of methane: 2CH₄ → C₂H₆ + H₂. Joining two carbons is a real (and notoriously difficult) industrial goal — game shorthand for a hard reaction.' },
    { inputs:['acetylene','h2'], output:'ethylene',
      note:'C₂H₂ + H₂ → C₂H₄: partial hydrogenation. One H₂ adds across the triple bond, leaving a double bond. Industrially this needs a poisoned (Lindlar) catalyst — too active a catalyst and you overshoot to ethane.' },
    { inputs:['c','c','h','h'], output:'acetylene',
      note:'2C + H₂ → C₂H₂ — historically made by dripping water on calcium carbide. The triple bond stores serious energy: this fuels the hottest common welding flame.' },
    { inputs:['ethylene','water'], output:'ethanol',
      note:'Acid-catalyzed hydration: C₂H₄ + H₂O → C₂H₅OH. Water adds across the double bond. This is genuinely how industrial (non-beverage) ethanol is made.' },
    { inputs:['ethanol','o'], output:'acetic-acid',
      note:'Oxidation: C₂H₅OH + O₂ → CH₃COOH + H₂O. The alcohol→acid ladder again. Acetobacter bacteria run this exact reaction to turn wine into vinegar.' },
    { inputs:['ethanol','acetic-acid'], output:'ethyl-acetate',
      note:'Fischer esterification: acid + alcohol ⇌ ester + water. The OH from the acid and the H from the alcohol leave together as water — a condensation reaction.' },
    { inputs:['acetylene','acetylene','acetylene'], output:'benzene',
      note:'Cyclotrimerization: 3C₂H₂ → C₆H₆. Three triple-bonded pairs link into one aromatic ring — a real reaction (Reppe chemistry) and a beautiful piece of molecular geometry.' },
    { inputs:['benzene','o'], output:'phenol',
      note:'Oxidation of benzene to phenol (industrially via the cumene process). Hanging an OH on the aromatic ring changes its personality completely.' },
    { inputs:['phenol','co2'], output:'salicylic-acid',
      note:'The Kolbe–Schmitt reaction: phenol + CO₂ under pressure → salicylic acid. Yes, you can bolt carbon dioxide directly onto an aromatic ring. Discovered in 1860, still used today.' },
    { inputs:['salicylic-acid','acetic-acid'], output:'aspirin',
      note:'Acetylation: the acetic acid (industrially, acetic anhydride) caps salicylic acid\'s phenol group. Felix Hoffmann ran this at Bayer in 1897 — same synthesis taught in organic chem labs today.' },

    // --- Nitrogen chemistry ---
    { inputs:['nitrogen-gas','h2','h2','h2'], output:'ammonia',
      note:'N₂ + 3H₂ → 2NH₃: the Haber–Bosch process, run at ~450 °C and 200 atm over an iron catalyst. The reaction that feeds half of humanity.' },
    { inputs:['ammonia','hydrochloric-acid'], output:'ammonium-chloride',
      note:'NH₃ + HCl → NH₄Cl. Base meets acid: ammonia\'s lone pair grabs HCl\'s proton. The two gases react on contact in midair, forming white smoke.' },
    { inputs:['n','o'], output:'nitric-oxide',
      note:'N₂ + O₂ → 2NO, but only at extreme temperatures — lightning bolts and engine cylinders. At room temperature, N₂\'s triple bond says no.' },
    { inputs:['nitric-oxide','o'], output:'nitrogen-dioxide',
      note:'2NO + O₂ → 2NO₂. Happens spontaneously in air — colorless NO browns into NO₂. This pair (NOx) is the engine of photochemical smog.' },
    { inputs:['nitrogen-dioxide','water'], output:'nitric-acid',
      note:'3NO₂ + H₂O → 2HNO₃ + NO. The final step of the Ostwald process — and the same chemistry that puts nitric acid into acid rain.' },

    // --- Sulfur chemistry ---
    { inputs:['h2','s'], output:'hydrogen-sulfide',
      note:'H₂ + S → H₂S. Structurally water\'s twin, but sulfur\'s weaker pull on electrons makes it a gas, a poison, and a stench instead of the basis of life.' },
    { inputs:['s','oxygen-gas'], output:'sulfur-dioxide',
      note:'S + O₂ → SO₂: burning brimstone in oxygen gas — same blue flame, tidier bookkeeping.' },
    { inputs:['s','o','o'], output:'sulfur-dioxide',
      note:'S + O₂ → SO₂: burning sulfur. The blue flame of burning brimstone produces this sharp gas — step one of the contact process.' },
    { inputs:['sulfur-dioxide','o'], output:'sulfur-trioxide',
      note:'2SO₂ + O₂ → 2SO₃ over a vanadium(V) oxide catalyst at ~450 °C. Step two of the contact process — the catalyst is the whole trick; without it this reaction is glacially slow.' },
    { inputs:['sulfur-dioxide','water'], output:'sulfurous-acid',
      note:'SO₂ + H₂O ⇌ H₂SO₃, a weak equilibrium. This is what actually happens when sulfur oxides meet rain — one half of acid rain chemistry.' },
    { inputs:['sulfur-trioxide','water'], output:'sulfuric-acid',
      note:'SO₃ + H₂O → H₂SO₄, step three of the contact process — so exothermic that industry absorbs SO₃ into existing acid instead of water to avoid acid mist.' },

    // --- Acids, bases, salts ---
    { inputs:['h','cl'], output:'hydrochloric-acid',
      note:'H₂ + Cl₂ → 2HCl. So eager to happen that a flash of UV light triggers an explosion. The H–Cl bond is highly polar — primed to dissociate in water.' },
    { inputs:['na','cl'], output:'salt',
      note:'2Na + Cl₂ → 2NaCl. Sodium donates its lonely outer electron, chlorine completes its octet, and electrostatic attraction locks the ions into a lattice. Two dangerous elements, one edible crystal.' },
    { inputs:['salt','water'], output:'salt-water',
      note:'Dissolution, not reaction: polar water molecules surround and pry apart the Na⁺ and Cl⁻ ions. Free-floating ions are why salt water conducts electricity and pure water barely does.' },
    { inputs:['na','water'], output:'sodium-hydroxide',
      note:'2Na + 2H₂O → 2NaOH + H₂↑. The hydrogen often ignites from the reaction heat — the classic "sodium in the lake" demonstration teachers are no longer allowed to do.' },
    { inputs:['hydrochloric-acid','sodium-hydroxide'], output:'salt-water',
      note:'Neutralization: HCl + NaOH → NaCl + H₂O. Strong acid + strong base = salt + water, releasing ~57 kJ/mol. The pH meets in the middle at 7.' },
    { inputs:['cl','sodium-hydroxide'], output:'bleach',
      note:'Cl₂ + 2NaOH → NaOCl + NaCl + H₂O. Chlorine gas bubbled through cold lye — how household bleach has been made since the 1780s.' },
    { inputs:['sodium-hydroxide','sodium-hydroxide','co2'], output:'soda-ash',
      note:'2NaOH + CO₂ → Na₂CO₃ + H₂O. Excess base captures CO₂ fully. Carbon-capture research uses exactly this chemistry at industrial scale.' },
    { inputs:['sodium-hydroxide','co2'], output:'baking-soda',
      note:'NaOH + CO₂ → NaHCO₃. With CO₂ in excess, you only get to bicarbonate. Same ingredients as soda ash — the ratio decides the product. Stoichiometry matters.' },

    // --- The lime cycle ---
    { inputs:['ca','o'], output:'quicklime',
      note:'2Ca + O₂ → 2CaO. (Industrially it\'s made by roasting limestone instead.) Calcium\'s two outer electrons go to oxygen — a textbook ionic oxide.' },
    { inputs:['quicklime','water'], output:'slaked-lime',
      note:'CaO + H₂O → Ca(OH)₂, releasing enough heat to boil the water — "slaking" lime has scalded careless workers for millennia.' },
    { inputs:['slaked-lime','co2'], output:'limestone',
      note:'Ca(OH)₂ + CO₂ → CaCO₃ + H₂O. This is how mortar hardens: it pulls CO₂ from the air and turns back to stone, completing the lime cycle. Burn, slake, set — repeat for 7,000 years.' },

    // --- Minerals & glass ---
    { inputs:['si','oxygen-gas'], output:'sand',
      note:'Si + O₂ → SiO₂: silicon burns too — it just never stops once it starts. The product is the covalent network solid we call quartz.' },
    { inputs:['si','o','o'], output:'sand',
      note:'Si + O₂ → SiO₂. Each silicon bonds to four oxygens, each oxygen bridges two silicons — an endless covalent network, which is why quartz is hard and melts at 1,700 °C.' },
    { inputs:['sand','soda-ash','limestone'], output:'glass',
      note:'The soda-lime recipe: soda ash fluxes the sand (melting point drops from ~1,700 °C to ~1,000 °C), limestone adds calcium to stabilize it against water. ~90% of all glass made.' },

    // --- Metals, alloys, oxides ---
    { inputs:['fe','c'], output:'steel',
      note:'Iron + a pinch of carbon. The carbon atoms jam the iron crystal\'s slip planes — like dropping gravel into a deck of sliding cards. Below ~2% carbon: steel. Above: brittle cast iron.' },
    { inputs:['fe','o'], output:'rust',
      note:'4Fe + 3O₂ → 2Fe₂O₃ (with water as the essential accomplice — it\'s an electrochemical process, tiny batteries forming on the metal surface). Slow-motion combustion.' },
    { inputs:['cu','zn'], output:'brass',
      note:'Melt copper, dissolve zinc into it: a substitutional alloy where zinc atoms replace copper atoms in the lattice. Humanity\'s been making it since ~500 BCE.' },
    { inputs:['fe','s','s'], output:'pyrite',
      note:'Fe + 2S → FeS₂. Forms in oxygen-poor environments — deep sediments, hydrothermal vents. The sulfur pairs up (S₂²⁻), which is unusual and gives pyrite its structure.' },
    { inputs:['cu','o'], output:'copper-oxide',
      note:'2Cu + O₂ → 2CuO. Heat copper in air and watch it blacken. Unlike rust, copper\'s oxide layer adheres and protects — the metal passivates instead of flaking away.' },
    { inputs:['zn','o'], output:'zinc-oxide',
      note:'2Zn + O₂ → 2ZnO. Burning zinc gives brilliant bluish-white light and white smoke of ZnO — alchemists called it "philosopher\'s wool."' },
  ];

  /* ----------------------------------------------------------
     HYPOTHETICALS — exact-match educational "misses"
     Keyed by inputs just like recipes. No new item is created,
     but the player learns something. Add freely.
  ---------------------------------------------------------- */
  const HYPOTHETICALS = [
    { inputs:['he','he'],
      title:'Almost — but beryllium-8 won\'t cooperate',
      text:'Two helium nuclei do fuse into beryllium-8… which falls apart in about 10⁻¹⁶ seconds. It\'s why stars need three heliums to collide nearly simultaneously to make carbon (the triple-alpha process). Try adding a third helium.' },
    { inputs:['h','he'],
      title:'Helium won\'t take the proton',
      text:'Slamming a proton into helium-4 makes lithium-5, which falls apart in ~10\u207b\u00b2\u00b2 seconds \u2014 even less cooperative than beryllium-8. Real stars grow helium differently: two protons fuse into deuterium (spitting out a positron and a neutrino), deuterium grabs another proton to make helium-3, and two helium-3 nuclei merge into helium-4. This game compresses that whole proton\u2013proton chain into H + H. To climb HIGHER than helium, stop feeding it protons \u2014 cluster three heliums together instead.' },
    { inputs:['s','water'],
      title:'No reaction — sulfur shrugs at water',
      text:'Elemental sulfur is hydrophobic and essentially insoluble; it just sits there. To get sulfurous acid (H₂SO₃) you need sulfur dioxide first — burn the sulfur in oxygen, then dissolve that gas in water. Chemistry often requires the right intermediate, not just the right atoms.' },
    { inputs:['fe','water'],
      title:'No rust yet — you\'re missing an ingredient',
      text:'Iron in pure, oxygen-free water barely corrodes. Rusting is electrochemical and needs both water and oxygen working together (that\'s why ships rust fastest at the waterline, where metal, water, and air all meet). Add oxygen to the mix.' },
    { inputs:['ammonia','bleach'],
      title:'Do NOT do this one at home',
      text:'Bleach and ammonia react to form chloramine gases — toxic fumes that send people to the ER every year, usually from mixing cleaning products. This is the single most important "never mix" rule under your kitchen sink. The game rewards curiosity; your lungs do not.' },
    { inputs:['c','n'],
      title:'No stable molecule — but say hi to comets',
      text:'Carbon and nitrogen form the cyano radical (•CN) — too reactive to bottle on Earth, but astronomers detect it glowing in comet tails and interstellar clouds. It was one of the first molecules ever identified in space, back in 1910.' },
    { inputs:['h','he'],
      title:'Fusion says no',
      text:'Hydrogen + helium fusion would make lithium-5, which is catastrophically unstable and decays instantly. Stellar nucleosynthesis has gaps at mass 5 and 8 — nature has to route around them, which is exactly why the triple-alpha process exists.' },
    { inputs:['n','water'],
      title:'Nitrogen isn\'t interested',
      text:'N₂\'s triple bond makes it nearly inert in water — which is lucky, since you\'re surrounded by both constantly. Dissolved nitrogen only matters at pressure: it\'s what causes the bends in divers who surface too fast.' },
    { inputs:['fe','cu'],
      title:'These metals don\'t mix well',
      text:'Iron and copper have limited mutual solubility — molten together, they mostly separate like oil and water as they cool. Alloying isn\'t universal: atomic size, crystal structure, and electronegativity decide which metals dissolve into each other (the Hume-Rothery rules). Try copper + zinc, or iron + carbon.' },
    { inputs:['aspirin','water'],
      title:'Dissolves… then slowly falls apart',
      text:'Aspirin dissolves in water, but it also slowly hydrolyzes back into salicylic acid and acetic acid — undoing its own synthesis. Old aspirin bottles that smell like vinegar have done exactly this. Reactions run both ways; conditions decide the direction.' },
  ];

  /* ----------------------------------------------------------
     GENERIC FALLBACKS — heuristic responses (checked in order)
     when: function receives the array of item objects in the mix
  ---------------------------------------------------------- */
  const FALLBACK_RULES = [
    {
      id:'noble',
      when: items => items.some(i => i.tags.includes('noble-gas')),
      title:'A noble gas is ghosting you',
      text:'Noble gases have full outer electron shells — no vacancy, no desire to bond. That\'s the entire periodic table\'s organizing logic in one behavior: chemistry is the pursuit of filled shells, and these elements already won. (Exception trivia: xenon can be forced to react with fluorine, but nothing here is that persuasive.)'
    },
    {
      id:'same-metal',
      when: items => items.length >= 2 && items.every(i => i.id === items[0].id) && items[0].tags.includes('metal'),
      title:'More of the same',
      text:'Melting a metal with itself just gets you a bigger piece of that metal — same element, same lattice. Alloys need a *different* atom to disrupt the crystal structure. That disruption is where the new properties come from.'
    },
    {
      id:'metal-metal',
      when: items => items.length === 2 && items.every(i => i.kind === 'element' && i.tags.includes('metal')),
      title:'Not every metal pair makes an alloy',
      text:'Alloying is real, but it\'s picky: the atoms need compatible sizes and crystal structures to dissolve into each other (the Hume-Rothery rules). Some pairs in this lab do work — think about which metals humans have actually been mixing for thousands of years.'
    },
    {
      id:'acid-base',
      when: items => items.some(i => i.tags.includes('acid')) && items.some(i => i.tags.includes('base')),
      title:'These would neutralize — partially',
      text:'Acid + base = neutralization: the acid\'s H⁺ meets the base\'s OH⁻ (or lone pair) to form water plus a salt. This particular pairing isn\'t in the lab\'s recipe book, but the principle always holds — it\'s the same reaction as an antacid calming stomach acid.'
    },
    {
      id:'acid-metal',
      when: items => items.some(i => i.tags.includes('acid')) && items.some(i => i.kind === 'element' && i.tags.includes('metal')),
      title:'Fizzing, probably',
      text:'Most metals react with acids to release hydrogen gas and form a salt — how vigorously depends on the metal\'s position in the activity series (sodium: explosive; copper: barely bothers). This exact combo isn\'t catalogued here, but that\'s the chemistry you\'d see.'
    },
  ];

  const DEFAULT_FALLBACKS = [
    { title:'No reaction at room temperature',
      text:'Plenty of reactions are thermodynamically possible but kinetically stuck — the atoms would be happier combined, but the activation energy barrier is too high without heat, pressure, or a catalyst. Most of industrial chemistry is the art of lowering that barrier.' },
    { title:'These molecules just bounce off each other',
      text:'For a reaction to happen, molecules must collide with enough energy AND the right orientation. Most collisions fail both tests. At room temperature, this particular crowd isn\'t getting past the bouncer.' },
    { title:'Nothing here wants to trade electrons',
      text:'Reactions need a driver: an electron donor meeting an acceptor, an acid meeting a base, or a big energy payoff. None of these species has a compelling reason to rearrange. Try species with more obvious chemistry between them — strong opposites attract.' },
    { title:'No stable product exists',
      text:'Not every combination of atoms maps to a stable molecule. Bonding has rules — valence, electronegativity, geometry — and this combination doesn\'t satisfy them. The periodic table is a map of what\'s possible, not a license for everything.' },
  ];

  /* ----------------------------------------------------------
     CORE_RULES / CORE_FALLBACKS — miss education INSIDE the
     Stellar Core. Chemistry explanations (electron shells, bonds,
     acids/bases) are the wrong physics at 10⁸ K — in plasma there
     are no electron shells, only bare nuclei. Same shape as
     FALLBACK_RULES: first matching rule wins; otherwise rotate
     through CORE_FALLBACKS.
  ---------------------------------------------------------- */
  const CORE_RULES = [
    {
      id:'iron-wall',
      when: items => items.some(i => i.id === 'fe'),
      title:'Iron: where fusion stops paying',
      text:'Iron-56 sits at the peak of nuclear binding energy — fusing anything INTO iron, or iron into anything, consumes energy instead of releasing it. When a massive star\'s core turns to iron, the furnace shuts off mid-burn and the star collapses in under a second. Everything heavier than iron in your body was made in that collapse, not before it.'
    },
    {
      id:'noble-means-nothing-here',
      when: items => items.some(i => i.tags.includes('noble-gas')),
      title:'Nobility means nothing in plasma',
      text:'A noble gas\'s famous inertness is an ELECTRON property — a full outer shell with no vacancy. But at stellar core temperatures, atoms are fully ionized: the electrons are long gone and only bare nuclei remain. Neon fuses in massive stars (neon burning, ~1.5 billion K) just fine. What stops THIS collision isn\'t nobility — it\'s that it isn\'t one of the energy-favorable channels stars actually use. Try alpha capture: add helium.'
    },
  ];

  const CORE_FALLBACKS = [
    { title:'The Coulomb barrier wins this round',
      text:'Two nuclei are both positively charged and repel ferociously — fusion only happens when temperature (plus a generous assist from quantum tunneling) slams them close enough for the strong force to grab. Stars manage it only for specific, energy-favorable pairings. This isn\'t one of the channels they use. The reliable rungs: add helium — the alpha ladder.' },
    { title:'Stars burn in a strict order',
      text:'Stellar fusion runs in stages — hydrogen, then helium, carbon, neon, oxygen, silicon — each igniting only when the core contracts and heats enough for the next, harder fuel. Heavier pairings than the current stage simply don\'t go. This combination skips the queue, and the star\'s bouncer is temperature.' },
    { title:'Not a channel the universe uses',
      text:'In principle many nuclei CAN fuse; in practice stars take the cheap routes — mostly capturing helium-4 (the alpha process) because it\'s abundant and the energy bookkeeping works. Fun fact: stars also burn hydrogen using carbon, nitrogen, and oxygen as a catalytic loop (the CNO cycle) — the catalysts come out untouched, like a good enzyme.' },
  ];

  /* ----------------------------------------------------------
     ACHIEVEMENTS — data-driven milestone definitions
     test types:
       discover      { id }                — unlock a specific item
       discoverAll   { ids: [] }           — unlock every listed item
       categoryCount { tag, count }        — N discovered items carrying tag
       totalCount    { count }             — N total non-starter discoveries
       failCount     { count }             — N informative misses
  ---------------------------------------------------------- */
  const ACHIEVEMENTS = [
    { id:'first-reaction', icon:'💧', name:'First Reaction!',
      desc:'You made water — the molecule everything else depends on.',
      test:{ type:'discover', id:'water' } },
    { id:'stellar-forge', icon:'☀️', name:'Stellar Forge',
      desc:'You fused hydrogen into helium. You are now, technically, a star.',
      test:{ type:'discover', id:'he' } },
    { id:'noble-pursuit', icon:'👑', name:'Noble Pursuit',
      desc:'You\'ve discovered all the noble gases in the lab: helium, neon, and argon.',
      test:{ type:'discoverAll', ids:['he','ne','ar'] } },
    { id:'pharmacist', icon:'💊', name:'Pharmacist',
      desc:'You synthesized aspirin — a five-step total synthesis from raw elements. Bayer would hire you.',
      test:{ type:'discover', id:'aspirin' } },
    { id:'organic-chemist', icon:'🧪', name:'Organic Chemist',
      desc:'Ten organic compounds discovered. Carbon is starting to make sense.',
      test:{ type:'categoryCount', tag:'organic', count:10 } },
    { id:'acid-rain', icon:'🌧️', name:'Acid Rain',
      desc:'Sulfuric and nitric acid, both synthesized — you\'ve recreated the chemistry of industrial-era rain.',
      test:{ type:'discoverAll', ids:['sulfuric-acid','nitric-acid'] } },
    { id:'metallurgist', icon:'⚒️', name:'Metallurgist',
      desc:'Steel and brass forged. Two alloys, four thousand years of human history.',
      test:{ type:'discoverAll', ids:['steel','brass'] } },
    { id:'glassblower', icon:'🏺', name:'Glassblower',
      desc:'Sand, soda ash, and limestone — the 5,000-year-old recipe, completed.',
      test:{ type:'discover', id:'glass' } },
    { id:'lab-partner', icon:'🥼', name:'Lab Partner',
      desc:'Ten discoveries logged. The notebook is filling up.',
      test:{ type:'totalCount', count:10 } },
    { id:'serious-chemist', icon:'⚗️', name:'Serious Chemist',
      desc:'Twenty-five discoveries. You\'re past the easy ones now.',
      test:{ type:'totalCount', count:25 } },
    { id:'periodic-complete', icon:'🏆', name:'Master of Matter',
      desc:'Every substance in the lab, discovered. Nothing left but to add more data.',
      test:{ type:'totalCount', count:'ALL' } },
    { id:'alchemists-folly', icon:'🔮', name:'Alchemist\'s Folly',
      desc:'Ten reactions that didn\'t pan out — and ten things learned anyway. That\'s just science.',
      test:{ type:'failCount', count:10 } },
  ];

  return { ITEMS, RECIPES, HYPOTHETICALS, FALLBACK_RULES, DEFAULT_FALLBACKS, CORE_RULES, CORE_FALLBACKS, ACHIEVEMENTS };
})();
