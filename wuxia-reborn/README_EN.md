English | **[中文](./README.md)**

# Cycle of Jianghu (In Development) v0.27.35

> A wuxia-themed timeline-rewind text adventure game · Pure HTML/CSS/JS · Deployable on GitHub Pages

**[Play Online →](https://frosttear.github.io/wuxia-reborn/)**

---

## Game Overview

Each lifetime begins at **age 15**, advancing month by month. Random events are triggered each month — make choices to gain attributes and rewards, hone martial arts, and build relationships. On your **20th birthday**, the Celestial Demon arrives — this final battle is inevitable regardless of your strength. Upon defeat, the Twin Fish Jade activates a **timeline rewind** — time reverses, and you return to the starting point of another timeline with memories intact, growing stronger in each new cycle.

Reference: Virtual Life — time passage replaces dice rolls; every choice carries weight.

---

## Core Attributes (7)

| Attribute | Description | Primary Effect |
|-----------|-------------|----------------|
| Strength | Physical power | Physical attack, martial job unlocks |
| Agility | Swift movement | Dodge rate (+Luck), partial Defense, Swordsman path |
| Constitution | Vital resilience | Max HP, Defense (primary) |
| Inner Force | Qi cultivation | Qi Shield damage reduction, skill amplification, partial crit rate, HP recovery, Sword Sect path |
| Perception | Natural talent | Enemy intent read rate (cap 50%; Formless Sword Intent passive grants 100%) |
| Luck | Fortune's favor | Dodge rate, crit rate, double attribute trigger |
| Reputation | Jianghu renown | Social events, Sword Hero path unlock |

---

## Birth Month System

Choose a birth month (Jan–Dec) at character creation, **persists across timelines**. Each month grants an initial attribute **+2** bonus:

| Month | Season | Bonus | Flavor |
|-------|--------|-------|--------|
| January | New Year | Luck+2 | New Year blessings |
| February | Apricot | Perception+2 | Spring rain nurtures wisdom |
| March | Peach | Agility+2 | Peach month agility |
| April | Locust | Constitution+2 | Summer fortitude |
| May | Calamus | Strength+2 | Scorching sun tempers bones |
| June | Lotus | Inner Force+2 | Lotus month stores Qi |
| July | Melon | Luck+2 | Tanabata destiny |
| August | Osmanthus | Perception+2 | Osmanthus month clarity |
| September | Chrysanthemum | Agility+2 | Autumn crispness |
| October | Harvest | Constitution+2 | Harvest month reserves |
| November | Winter | Inner Force+2 | Cold condenses true Qi |
| December | Year-End | Strength+2 | Bitter cold forges steel |

---

## Job Progression (Martial Path)

```
Nameless Nobody
  └─→ Wanderer  (Strength ≥ 12)
        └─→ Swordsman  (Strength ≥ 18, Agility ≥ 12)
              └─→ Sword Hero  (Strength ≥ 26, Agility ≥ 15, Reputation ≥ 18 + Recognition quest)
                    └─→ Sword Sect  (Strength ≥ 36, Inner Force ≥ 18, Agility ≥ 20, Reputation ≥ 25 + Legacy quest)
```

**Quest Gates**: Sword Hero requires completing the "Path of Chivalry" quest chain (`hero_recognized` flag; first node "Rescue the Refugees" requires **Sword Expert** job). Sword Sect requires "Sword Legacy" quest chain (`sword_legacy` flag). Advanced jobs unlock through dedicated quest lines with story, attribute thresholds, and combat trials.

---

## Time & Life Cycle

- **Start**: Age 15 (ageMonths = 180)
- **End**: Age 20 birthday (ageMonths = 240) — Celestial Demon descends
- **Safety cap**: maxAgeMonths = 246
- **Event frequency**: One random event per month
- **Single attribute cap**: Max +2 per event (prevents stat inflation)

---

## Birthday System

A birthday event triggers every 12 months with unique dialogue + attribute rewards, followed by a regular monthly random event (including birthday-exclusive event pool).

| Age | Content |
|-----|---------|
| 16 | First steps in Jianghu reflections |
| 17 | Mature beyond years, Perception+1 |
| 18 | Can hold own ground, Strength+1 Reputation+1 |
| 19 | "Only one year until the Demon's calamity," Inner Force+1 |
| **20** | **Celestial Demon descends** (unconditional) |

**Birthday-exclusive events** (weight 40, high priority):
- "Birthday Meditation": Solo contemplation, Perception/Inner Force+1~2
- "Old Escort's Celebration": Drink with Wang Tie, affinity+8~10
- "Yun Shu's Greeting": Li Yun Shu brings pastries, affinity+8~10
- "Elder's Birthday Blessing": Mysterious elder visits at night, affinity+8~10

---

## Event System

| Type | Weight | Description |
|------|--------|-------------|
| Training | High | Practice/study, active attribute growth |
| Adventure | Medium | Unexpected manuals/elixirs/mentor guidance |
| Combat | Medium | Encounter enemies, turn-based battle |
| Social | Low | Meet/deepen NPC relationships, unlock quest chains |
| Opportunity | Low | Job promotion chances, special items |
| Boss | Triggered | Birthday system trigger, not in random pool |

### Event Conditions
- `minAgeYears / maxAgeYears`: Age range
- `jobs / notJobs`: Job restrictions
- `minAttributes`: Minimum attribute requirements
- `flags`: Story flags (e.g., `sword_legacy: true`, `_is_birthday: true`)
- `npcAffinity`: NPC affinity threshold

---

## NPC Relationship System

Affinity 0 to 100, one-directional positive, displayed as bar graph. Each NPC shows AI-generated portrait (AlbedoBase XL SDXL) in relationship and visit panels; clicking the portrait opens a lightbox with full image and bond/passive details. Player avatar also supports lightbox for current attribute details.

Upon completing Bond Chapter 5, an exclusive scene illustration (1216×832 landscape) is displayed. Celestial Demon and Sword Soul battle outcomes also have corresponding illustrations.

### NPC Overview

| NPC | Type | Bond Chapters | Ultimate Passive (Chapter 5) |
|-----|------|---------------|------------------------------|
| Wang Tie | Master | 5 chapters (affinity ≥25/50/75/90/100, includes legacy/Boss battle) | "Thirty Years of Iron Will" — injury recovery halved + ATK+10 when HP≤25% |
| Li Yun Shu | Close Friend | 5 chapters (affinity ≥20/45/70/85/95), L1 sparring / L2 real combat | "Yun Shu's Sword Spirit" — Agility & Luck gain +20% |
| Mysterious Elder | Destiny | 5 chapters (affinity ≥25/50/75/90/95) → **True Ending key** | "Profound Foundation" — Inner Force & Perception gain +20% |
| Yan Chi Xing | Jianghu figure | 5 chapters, L2 night raid exclusive battle enemy | "Blazing Saber Qi" — Combat ATK+15 |
| Su Qing | Traveling Healer | 5 chapters | "Green Heart Elixir" — auto-clear injuries + recover 100% lost HP monthly |
| **Ling Xue** | **Hidden · Demon's Disciple** | **5 chapters (affinity ≥20/45/70/80/90) → L4 identity reveal, L5 hidden Boss battle** | "Frost Sword Bone" — ATK+6 + ice aura reduces each hit by 5 |

### Visit Mechanic

**Visit** any befriended NPC at any time when conditions are met:
- **Affinity sufficient** → Triggers full bond chapter event
- **Affinity insufficient** → Casual chat, affinity **+5**, shows gap to next chapter
- Each visit costs **1 month**

---

## Combat System (Turn-Based)

### Base Stat Formulas

```
ATK = floor(Strength) + Job Base ATK + Skill Bonus + Passive Bonus
DEF = floor(Constitution×0.4 + Agility×0.6) + Job Base DEF + Skill Bonus

Dodge Rate = Luck/120 + Agility/250 (cap 25%)
Crit Rate = Luck/120 (cap 35%)
Qi Shield = floor(Inner Force/8) + Talent/Passive Bonus (flat damage reduction per hit)
Skill Amplification = max(0, (Player Inner Force - Enemy Inner Force) / (Combined Inner Force + 10) × 40%)
```

### Damage Formula (Bravely Default-style Proportional Reduction)

```
baseDmg = floor(ATK² / (ATK + DEF + 1))
```

Defense provides proportional reduction rather than flat subtraction — high defense significantly reduces damage but never to zero. Symmetrical: players and enemies use the same formula.

**Power Attack Damage**:
```
dmg = max(1, floor(baseDmg × lv × (1 + Inner Force Amp)) - Enemy Qi Shield)
```
- `lv`: Luck variance coefficient `1 ± (luck/200)`
- Critical hit ×1.5

**Counter Damage** (on successful Parry):
```
counterDmg = max(1, floor(baseDmg × counterMult) - Enemy Qi Shield)
```
- Normal counter `counterMult = 0.75`, Insight counter `counterMult = 1.0`
- If skill is ready, it replaces the basic counter (including multi-hit/stun effects)

**Defend Reduction** (scales with ATK/DEF ratio):
```
powerRatio = min(1, DEF / max(1, Enemy ATK))
defCap = min(0.75, powerRatio × 0.75 + 0.10)
```
- Defend vs Heavy Attack: reduction min(75%, defCap)
- Defend vs Quick Attack: reduction min(50%, defCap)
- Charge reduction: min(55%, defCap)
- Insight Quick Attack defense breaks defCap: at least defCap+15% (cap 80%)

### Action Options

| Action | Effect | Qi | Notes |
|--------|--------|-----|-------|
| ⚔ Power Attack | Deal damage, can crit (×1.5) | +2 | BD proportional reduction, never zero |
| 🛡 Defend | Heavy Attack -75%, Quick Attack -50% | — | Insight Quick Attack: up to 80% reduction |
| ⚡ Parry | Counters Heavy Attack: counter + only take 20% damage | +1 | Failed Parry: ×1.15 damage |
| 🔮 Charge | -55% damage, accumulate Qi | +3 | For filling skill gauge |
| 🏃 Flee | 25% success rate, +15% per failure | — | Full damage on failure |

- **Skills**: Auto-activate next turn when Qi is full (triggers on Power Attack/Charge), 3-turn cooldown
- **Parry counter**: If skill is ready during Parry, skill is used as the counter move (including multi-hit combos), skill is not wasted

### Enemy Behavior

Enemies randomly choose **Heavy Attack** or **Quick Attack** each turn:
- HP > 35%: Heavy Attack probability 45%
- HP ≤ 35%: Heavy Attack probability 65% (desperate gambit)
- ⚠️ Enemies do NOT have "Parry" action

### Enemy Intent Reading

At end of each turn, Perception determines whether you can read the enemy's next move:

```
Read Probability = min(50%, 80% × ln(1 + Perception / (Enemy Perception + 20)))
```

| Result | Display |
|--------|---------|
| Read (accurate) | True intent description, 100% accurate |
| Unclear (unreadable) | Vague, misleading text |
| Formless Sword Intent passive | Always 100% read (perfect) |

**Intent Response Bonuses** (only when accurate/perfect):

| Read Result | Response Action | Bonus Effect |
|-------------|----------------|--------------|
| Quick Attack incoming | Defend | Reduction increased to 80% (normal Defend vs Quick is only 50%) |
| Heavy Attack incoming | Parry | Counter multiplier increased to 1.0× (normal 0.75×), extra +1 Qi |

### Job Active Skills

Each job has one active skill, **always displayed** in the combat panel showing name, effect, and remaining Qi needed:

| State | Display |
|-------|---------|
| Charging | "Skill Name" effect description — X Qi remaining |
| Ready | ⚡ "Skill Name" charge complete, auto-activates next turn! (golden flash) |
| Cooldown | "Skill Name" effect description — Cooling down (X turns left) |

### Combat Preview System

Clicking a combat action button expands a preview bar showing estimated damage/reduction/Qi changes; clicking the same button again executes the action. Power Attack is selected by default.

### Other Mechanics

- **Quick Battle**: When win rate is near 100%, one-click skip — Monte Carlo 50-round simulation for instant resolution
- **Combat State Persistence**: Refreshing mid-battle preserves state (localStorage)
- **Injury State**: After battle defeat, enter severe injury — forced "recovery" events for **3 months**, auto-heal on month 4. Wang Tie's passive reduces recovery to 2 months
- **Enemy Scaling**: Enemy ATK/DEF/HP dynamically scales with player age (`tier = age - 15`)

**Monthly HP Recovery** (percentage-based):
- Base: 15% max HP
- Constitution: each point +0.5% max HP (20 CON = +10%)
- Inner Force: each point +0.5% max HP (20 IF = +10%)
- Su Qing's passive "Green Heart Elixir": recover 100% lost HP (nearly full heal in one month)

---

## Timeline Rewind System

**Lore**: The Twin Fish Jade activates when the bearer is near death, rewinding time and sending consciousness along with memories to the starting point of another timeline. This is not reincarnation — it's a timeline fork. You remember everything that "will happen."

**Trigger**: Defeated by a Boss (Celestial Demon or Sword Soul). Normal battle defeat only causes injury, no rewind; there is no lifespan limit.

**Inheritance**:
1. **Attribute Inheritance**: All attributes × 10% (talents can increase ratio)
2. **Birth Month**: Same destiny, same birthday
3. **Timeline Memory**: Previous timeline bond levels → new timeline initial affinity bonus; already-met NPCs don't need to be re-discovered
4. **Legacy Talents**: Unlocked by this life's achievements, choose **2** per cycle

| Talent | Unlock Condition | Effect | Upgrade |
|--------|-----------------|--------|---------|
| Sword Heart Awakening | Strength or Agility ≥ 12 | Strength/Agility gain efficiency +10% | → Sword Heart |
| Sword Heart | Strength or Agility ≥ 20 | Strength/Agility gain efficiency +15% | — |
| Intuition | Inner Force or Perception ≥ 15 | Inner Force/Perception gain efficiency +10% | → Enlightened |
| Enlightened | Inner Force or Perception ≥ 30 | Inner Force/Perception gain efficiency +15% | — |
| Battle-Tested | ≥ 5 combat victories | Start each battle with 1 Qi | → Veteran |
| Veteran | ≥ 10 combat victories | Start each battle with 2 Qi | → Hundred Battles |
| Hundred Battles | ≥ 15 combat victories | Start each battle with 3 Qi | — |
| Deep Bonds | Any bond level ≥ 3 | Double affinity bonus when visiting NPCs from previous timeline | — |
| Renowned | Reputation ≥ 20 | Starting Reputation +8 | → Sovereign Aura |
| Fate's Power | ≥ 2 rewinds | Attribute inheritance ratio +5% | — |
| Lucky One | Luck ≥ 10 | Starting Luck +3, Luck gain efficiency +10% | → Child of Fortune |
| Child of Fortune | Luck ≥ 20 | Starting Luck +5, Luck gain efficiency +15% | — |
| Body Tempering | Constitution ≥ 15 | Max HP +10% | → Longevity Art |
| Longevity Art | Constitution ≥ 30 | Max HP +15% | — |
| Breath Control | Inner Force ≥ 20 | Qi Shield +1, skill amplification +5% | → Qi Mastery |
| Qi Mastery | Inner Force ≥ 35 | Qi Shield +2, skill amplification +10% | — |
| Tough | Constitution ≥ 15 and ≥ 1 kill | Injury recovery -1 month | → Iron Will |
| Iron Will | Constitution ≥ 25 and ≥ 3 kills | Injury recovery halved | — |
| Déjà Vu | ≥ 3 rewinds | Previous-life bond NPCs start with greatly increased affinity, skip early chapters | — |
| Spark of Insight | Perception ≥ 20 | Perception gain efficiency +12% | → Quick Learner |
| Quick Learner | Perception ≥ 35 | Perception gain efficiency +20% | — |
| Sovereign Aura | Reputation ≥ 30 | Reputation gain +25%, starting Reputation +5 (replaces Renowned) | — |

---

## Boss Design & Ending System

### Ending Paths

```
Celestial Demon Battle (Age 20 birthday, unconditional)
  → NPC Bond Effects apply (see NPC Effects table below)
    → Sword Soul unconditionally appears

Sword Soul — Two paths:
  ├─ Vessel Path (Insufficient NPC bonds / no Formless Sword Intent)
  │     → Consumed → Jade activates → Timeline Rewind
  │       (After first trigger, subsequent cycles unlock NPC branch lines)
  └─ Spiritual Integrity Path (Sufficient NPC bonds / has Formless Sword Intent)
        → Victory → "Fragment Truth" quest chain
                  → Reveals Mysterious Elder is Shen Xuan Qing
                    → Shen Xuan Qing (narrative forced defeat — he does it willingly, sending player 900 years back)
                      → 900 years ago: Witness the sealing moment
                          → Defeat Sword Soul Origin with mortal will
                              └─ ✦ True Peace Under Heaven ✦ (Seal broken, Shen Xuan Qing's 900-year sacrifice ends)
```

### NPC Bond Effects on Celestial Demon Battle

| NPC | Trigger | Effect |
|-----|---------|--------|
| Ling Xue (Freedom path) | Ling Xue freedom path complete | Appears before battle, shakes Lu Wu Gui, weakens one stat |
| Ling Xue (Blade path) | Ling Xue blade path complete | Blocks the way, must defeat her first |
| Su Qing (Healer path) | Su Qing healer path complete | Soul-Devouring Scripture research, Demon's max HP reduced |
| Li Yun Shu (Family pressure path) | Family pressure path complete | Demon Palace intel, Demon's defense reduced |
| Yan Chi Xing (Let go of obsession) | Yan Chi Xing letting-go path complete | Recites 30 names of Han Guang Sect before battle, player ATK increased |
| Mysterious Elder (Full bond) | Elder bond complete | Unlocks "Lu Wu Gui" dialogue layer, Demon skips turn 1 attack |
| Wang Tie | Any | Pure narrative — inner monologue, the weight of "why must I win" |

### Boss: Celestial Demon (Lu Wu Gui)
- **Trigger**: Descends unconditionally on 20th birthday; high base stats, difficult without NPC effects
- Ling Xue Bond Chapter 5 pre-triggers a hidden Boss battle (Ling Xue herself) as an extra stage

### Boss: Sword Soul (Contemporary)
- **Trigger**: Appears **unconditionally** after defeating Celestial Demon
- Residual will of an ancient sword cultivator, sealed 900 years ago by Shen Xuan Qing with 70% of his cultivation; Shen Xuan Qing used himself as the seal container, using mortal bonds to suppress the power
- **Spiritual Integrity Path**: With sufficient NPC bonds (or Formless Sword Intent), Sword Soul recognizes you're not just another vessel, asking the millennia-old question "Why does power exist" — after battle, Sword Soul feels something nameless for the first time before fading
- **Vessel Path**: Insufficient bonds, Sword Soul judges you as a vessel, consumption begins; Jade activates, saves player, triggers timeline rewind
- **Formless Sword Intent**: Quest chain unlockable after maxing all 6 bonds, grants `perfectIntentRead` passive (100% intent read), key to the Spiritual Integrity Path
- Displayed as `????` in test battle list

### Boss: Shen Xuan Qing (Narrative Forced Defeat)
- **Trigger**: After defeating Sword Soul (Spiritual Integrity Path), "Fragment Truth" quest chain reveals — the Mysterious Elder IS Shen Xuan Qing, who engineered every timeline rewind to cultivate someone who could end the Sword Soul
- **Nature**: Narrative mechanism, not a true power test. He waited 900 years for this moment — finding someone worthy, sending them back. His defeat is the final step he willingly takes
- **Stats**: ATK 220 / DEF 130 / HP 4000 / Inner Force 100; core mechanic "Cycle Chains" (5× multiplier) — blockable but direct hit is nearly fatal
- Displayed as `????` in test battles

### Boss: Sword Soul · Origin (900 Years Ago, True Ending)
- **Trigger**: After Shen Xuan Qing's forced defeat, Jade sends player 900 years back
- The Sword Soul before the seal: player witnesses the moment Shen Xuan Qing made his choice, understanding the full story, answering with bonds and conviction accumulated across lifetimes — "Why does power exist"
- Victory breaks the seal, ending Shen Xuan Qing's 900-year self-sacrifice; True Ending includes epilogue stories for each NPC

### Ending Differences
| Condition | Ending |
|-----------|--------|
| Defeated by Celestial Demon | Timeline Rewind |
| Sword Soul Vessel Path (insufficient bonds) | Timeline Rewind (first trigger unlocks NPC branch lines) |
| Defeated by Shen Xuan Qing | Timeline Rewind |
| Victory over Sword Soul · Origin | ✦ True Peace Under Heaven ✦ |

---

## Save System

- `localStorage` auto-save (`wuxia_save`)
- Continue game restores last **30** event log entries (`wuxia_log`), showing "── Previous Save ──" separator
- **Export/Import**: Save code (Base64) copied to clipboard, supports cross-device migration or sharing

---

## Technical Architecture

- **Tech Stack**: Pure HTML + CSS + JS, no frameworks, direct GitHub Pages deployment
- **Data Layer**: JSON files (jobs / npcs / events / enemies / bonds / chains)
- **Save**: localStorage auto-save + Base64 export/import
- **Testing**: Jest 317 tests (character/combat/engine/data/HTML integrity/API surface), Husky pre-commit hooks

```
index.html          Main page (birth month selection + game interface)
css/styles.css      Wuxia dark theme
js/
  character.js      Character attributes, HP, job management, birth month bonuses
  npc.js            NPC affinity & relationship system
  combat.js         Turn-based combat
  rebirth.js        Timeline rewind system & talents
  engine.js         Main game engine (monthly progression, birthday system, event triggers, true ending)
  ui.js             UI rendering (three-column layout + mobile tabs + visit panel)
data/
  jobs.json         Job definitions (with requiredFlags)
  npcs.json         NPC definitions
  events.json       Event library (including birthday-exclusive events)
  enemies.json      Enemy definitions (Celestial Demon/Sword Soul/Ling Xue Bosses + sparring, bond, sword trials, job-line enemies, 12 types total)
  chains.json       Quest chain definitions (Demon Omen/Elder's Past/Jianghu Turmoil/Formless Sword Intent/Sword Legacy/Path of Chivalry + 5 epilogue chains)
  bonds.json        Bond event definitions
tests/
  character.test.js Character system tests
  combat.test.js    Combat system tests
  engine.test.js    Engine system tests
  data.test.js      Data integrity tests
  html.test.js      HTML structure integrity tests (anti-corruption)
  setup.js          Test environment configuration
assets/
  characters/       NPC portraits (AI Horde generated, AlbedoBase XL SDXL)
scripts/
  generate-avatars.mjs  NPC portrait generation script (supports single character regeneration, requires AIHORDE_API_KEY)
```

---

## Development Progress

See [PROGRESS.md](./PROGRESS.md)

---

## License

This project is open-sourced under the [MIT License](./LICENSE).
