English | **[中文](./README.md)**

# Ammo Defense

> Post-apocalyptic fortress tower defense · Ammo logistics + Weapon upgrades + Synergy system · Pure Canvas 2D

---

## Overview

On the last supply line of a post-apocalyptic fortress, manage ammo production, dispatch workers, and keep gunners and cannons loaded to fend off wave after wave of enemies. 10 stages with 10 waves each; endless mode unlocks after clearing all stages.

---

## Core Gameplay

### Weapon System

| Weapon | Ammo | Characteristics |
|--------|------|-----------------|
| **Gunner** | Bullet (Standard/AP/Ice) | Fast fire rate, low per-shot damage, ideal for clearing grunts |
| **Cannon** | Shell (Standard/Fire/HE) | Slow fire rate, high per-shot damage, built-in AOE blast |
| **Machine Gun** (Gunner mod) | Bullet | Ultra-rapid fire, highest DPS |
| **Sniper** (Gunner mod) | Bullet | High single-shot damage, prioritizes armored targets |
| **Mortar** (Cannon mod) | Shell | Auto area bombardment, fixed cooldown |

### Ammo Logistics

- **Production Line**: Auto-produces bullets and shells; toggle priority (balanced/bullet/shell)
- **Workers**: AI-driven pickup and delivery to gunner/cannon magazines
- **Magazine Capacity**: Gunner 5 rounds, Cannon 2 rounds

### Enemy Types

| Type | Traits |
|------|--------|
| Grunt | Standard enemy |
| Runner | Fast movement, low HP |
| Tank | Armored — bullets deal 52% less damage |
| Saboteur | Prioritizes destroying the production line |
| Healer | Periodically heals nearby allies (appears from stage 3+) |
| Boss | Every 10th wave, comes with energy shield (only shells effective), enrages at low HP |

### Upgrade System

- **Shop**: Production level, gunner/cannon count & enhancement, worker count
- **Wave Rewards (Pick 1 of 3)**: Choose one upgrade from a random pool after each wave
- **Synergy System**: Upgrades carry tags (🔥Fire/🛡Armor/⚡Speed/💰Economy); collecting 3 or 6 of the same tag triggers synergy bonuses

### Synergy Effects

| Tag | Tier 3 | Effect | Tier 6 | Effect |
|-----|--------|--------|--------|--------|
| 🔥 Fire | Flame Resonance | All damage +8% | Inferno | Burn duration +50% |
| 🛡 Armor | Steel Bastion | Wall HP cap +1 | Iron Fortress | Defense repair time -30% |
| ⚡ Speed | Rapid Supply | Belt speed +10% | Lightning Logistics | Worker speed +15% |
| 💰 Economy | Prosperity | Base income +2 | Golden Age | Kill reward +10% |

---

## File Structure

```
ammo-defense.html    Main page
ammo-defense/
  core.js            Core logic: state management, constants, wave generation, upgrades, synergy system
  systems.js         Game systems: worker AI, enemy behavior, combat, projectile physics, events
  render.js          Rendering: all game element Canvas 2D drawing
  game.js            Main loop: requestAnimationFrame loop, user input
  background.js      Static background: sky, ruins, terrain, base structures
  styles.css         UI styles: overlays, buttons, choice panels
```

---

## Tech Stack

- Pure HTML + CSS + JS, no framework dependencies
- Canvas 2D real-time rendering
- Web Audio API sound effects
- localStorage save (highest stage record)

---

## License

MIT
