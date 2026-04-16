// combat.js - Turn-based combat system

const Combat = {
    // ── Narration pools ────────────────────────────────────────────────────
    STANCE_ATTACK_DESCS: {
        strike: ['你蓄力挥出一击，气势如虹', '你横刀一斩，剑光凛冽', '你凌空跃起，自上而下猛劈', '你运气于掌，拍出一道劲风'],
        quick:  ['你身形疾掠，抢先出手', '你以快打慢，剑走偏锋', '你绕至侧翼，斜刺里出剑', '你步伐连动，轻灵刺出'],
    },
    DEFEND_DESCS: ['你凝神守势，以逸待劳', '你侧身化解，以柔克刚', '你内力护体，顶住冲击'],
    PARRY_DESCS:  ['你屏息凝神，等待来招', '你蓄势收势，准备化解'],
    FOCUS_DESCS:  ['你气沉丹田，运转真气', '你凝神蓄势，积聚气劲'],
    ENEMY_HEAVY_DESCS: ['挥刀猛劈向你', '蓄力一拳，势大力沉', '反手横扫，重击而来'],
    ENEMY_SWIFT_DESCS: ['趁你换气之际，疾刺而来', '快步上前，连续出手', '身形一晃，剑尖已至'],
    ENEMY_INTENT: {
        heavy: '对方气沉丹田——<b>刚攻将至</b>',
        swift: '对方步法游走——<b>巧攻难测</b>',
    },
    VAGUE_INTENT_MSGS: [
        '对方行迹难以捉摸',
        '对方拜式之调难以判断',
        '对方意图难以看穿',
        '对方下一招摄格不定',
    ],

    // ── Scaled enemy stats ──────────────────────────────────────────────────
    getEffectiveStats(enemy, char) {
        const tier = Math.max(0, Character.getAgeYears(char) - 15);
        const hp = Math.round((enemy.hp || 80) * (1 + tier * (enemy.hpScale || 0.15)));
        return {
            attack:  enemy.attack  + tier * (enemy.attackScale  || 0),
            defense: enemy.defense + tier * (enemy.defenseScale || 0),
            hp
        };
    },

    // ── Monte-Carlo win-chance (200 trials) ─────────────────────────────────
    calcWinChance(char, enemy, job) {
        const atk = Character.getAttackPower(char, job);
        const eff = this.getEffectiveStats(enemy, char);
        let wins = 0;
        for (let i = 0; i < 200; i++) {
            const lv = 1 + (Math.random() - 0.5) * (char.attributes.luck / 100);
            if (Math.floor(atk * lv) + Math.floor(Math.random() * 10) >
                eff.defense + Math.floor(Math.random() * 10)) wins++;
        }
        return Math.round(wins / 2);
    },

    // ── Build fresh combat state ─────────────────────────────────────────────
    initState(char, enemy, job) {
        const eff = this.getEffectiveStats(enemy, char);
        return {
            enemy,
            enemyHp:    eff.hp,
            enemyMaxHp: eff.hp,
            enemyEffAtk: eff.attack,
            enemyEffDef: eff.defense,
            turn:        0,
            fleeChance:  0.25,
            pendingSkill: null,
            usedSkills:   [],
            playerMomentum: 0,      // 0–5, builds with attacks / focus
            skillCooldown:  0,      // turns until job active skill can fire again
            enemyNextAction: null,  // 'heavy'|'swift', previewed for next turn
            enemyIntentHint: '',    // text shown in combat UI
            enemyStunned: false,    // skip enemy attack once (stun skill effect)
            totalDmgDealt: 0,
            totalDmgReceived: 0,
            log:          [],
            postNarrative: ''
        };
    },

    // ── Enemy AI: choose heavy or swift ─────────────────────────────────────
    _enemyChooseAction(cs) {
        const hpPct = cs.enemyHp / cs.enemyMaxHp;
        return Math.random() < (hpPct < 0.35 ? 0.65 : 0.45) ? 'heavy' : 'swift';
    },

    // ── Main turn processor ──────────────────────────────────────────────────
    // action: 'strike'|'quick'|'defend'|'parry'|'focus'|'flee'
    processTurn(action, cs, char, job) {
        cs.turn++;
        const lines = [];
        let combatOver = false, result = null;

        let playerAtk = Character.getAttackPower(char, job);
        if (cs.allBondsBonus) playerAtk += 60;
        const playerDef = Character.getDefensePower(char, job);

        if (cs.allBondsBonus && cs.turn === 1) {
            lines.push('<b style="color:#c9a84c">【羁绊之力】江湖情谊化为无形刃芒——攻击力+60！</b>');
        }

        if (cs.skillCooldown > 0) cs.skillCooldown--;

        // Determine enemy action for THIS turn
        const enemyAction = cs.enemyNextAction || this._enemyChooseAction(cs);

        // ── FLEE ────────────────────────────────────────────────────────────
        if (action === 'flee') {
            if (Math.random() < cs.fleeChance) {
                lines.push(`趁${cs.enemy.name}换招之际，你拼命脱身——<b>逃跑成功！</b>`);
                result = 'fled'; combatOver = true;
            } else {
                const dmg = Math.max(1, cs.enemyEffAtk - Math.floor(playerDef / 2) + this._rand(-1, 5));
                Character.takeDamage(char, dmg);
                cs.totalDmgReceived += dmg;
                lines.push(`逃跑失败！${cs.enemy.name}${this._pick(this.ENEMY_HEAVY_DESCS)}，你仓皇受击，损失 <b>${dmg}</b> 气血。`);
                cs.fleeChance = Math.min(0.85, cs.fleeChance + 0.15);
                if (char.hp <= 0) { result = 'lost'; combatOver = true; }
            }

        // ── COMBAT ACTIONS ───────────────────────────────────────────────────
        } else {
            const activeSkill = job && job.activeSkill;
            const skillFires  = activeSkill
                && cs.playerMomentum >= activeSkill.momentumCost
                && cs.skillCooldown === 0;

            // ── Player attack phase ──────────────────────────────────────────
            if (skillFires) {
                // Auto-trigger job skill
                cs.playerMomentum -= activeSkill.momentumCost;
                cs.skillCooldown = 3;
                const sk = activeSkill;

                if (sk.type === 'multi') {
                    let total = 0;
                    const parts = [];
                    for (let i = 0; i < (sk.hits || 3); i++) {
                        const h = Math.max(1, Math.floor(playerAtk * sk.power)
                            - Math.floor(cs.enemyEffDef * (1 - (sk.armorBreak || 0.5)))
                            + this._rand(-1, 4));
                        total += h; parts.push(h);
                    }
                    cs.enemyHp = Math.max(0, cs.enemyHp - total);
                    cs.totalDmgDealt += total;
                    lines.push(`【<b style="color:#f4c430">${sk.name}</b>】连击（${parts.join('+')}=<b>${total}</b>），对方剩余气血 ${Math.max(0, cs.enemyHp)}。`);
                } else {
                    const defFactor = 1 - (sk.armorBreak || 0);
                    const dmg = Math.max(1, Math.floor(playerAtk * sk.power)
                        - Math.floor(cs.enemyEffDef * defFactor * 0.5)
                        + this._rand(-2, 8));
                    cs.enemyHp = Math.max(0, cs.enemyHp - dmg);
                    cs.totalDmgDealt += dmg;
                    const stunNote = sk.type === 'stun' ? '  【<b style="color:#a0d8ef">震慑</b>】' : '';
                    if (sk.type === 'stun') cs.enemyStunned = true;
                    lines.push(`【<b style="color:#f4c430">${sk.name}</b>】对方损失 <b>${dmg}</b> 气血（剩余 ${Math.max(0, cs.enemyHp)}）。${stunNote}`);
                }
                if (cs.enemyHp <= 0) { result = 'won'; combatOver = true; }

            } else if (action === 'strike') {
                const lv    = 1 + (Math.random() - 0.5) * (char.attributes.luck / 100);
                const isCrit = Math.random() < Character.getLuckTriggerChance(char);
                let dmg = Math.max(1, Math.floor(playerAtk * 1.2 * lv)
                    - Math.floor(cs.enemyEffDef * 0.5) + this._rand(-2, 8));
                if (isCrit) dmg = Math.floor(dmg * 1.5);
                cs.enemyHp = Math.max(0, cs.enemyHp - dmg);
                cs.totalDmgDealt += dmg;
                cs.playerMomentum = Math.min(5, cs.playerMomentum + 1);
                const pd = this._pick(this.STANCE_ATTACK_DESCS.strike);
                lines.push(`${pd}${isCrit ? '【<b>会心一击</b>】' : ''}，对方损失 <b>${dmg}</b> 气血（剩余 ${Math.max(0, cs.enemyHp)}）。`);
                if (cs.enemyHp <= 0) { result = 'won'; combatOver = true; }

            } else if (action === 'quick') {
                const lv    = 1 + (Math.random() - 0.5) * (char.attributes.luck / 100);
                const isCrit = Math.random() < Character.getLuckTriggerChance(char);
                let dmg = Math.max(1, Math.floor(playerAtk * 0.85 * lv)
                    - Math.floor(cs.enemyEffDef * 0.35) + this._rand(-2, 6));
                if (isCrit) dmg = Math.floor(dmg * 1.5);
                cs.enemyHp = Math.max(0, cs.enemyHp - dmg);
                cs.totalDmgDealt += dmg;
                cs.playerMomentum = Math.min(5, cs.playerMomentum + 1);
                const pd = this._pick(this.STANCE_ATTACK_DESCS.quick);
                lines.push(`${pd}${isCrit ? '【<b>会心一击</b>】' : ''}，对方损失 <b>${dmg}</b> 气血（剩余 ${Math.max(0, cs.enemyHp)}）。`);
                if (cs.enemyHp <= 0) { result = 'won'; combatOver = true; }

            } else if (action === 'defend') {
                lines.push(this._pick(this.DEFEND_DESCS) + '。');

            } else if (action === 'parry') {
                lines.push(this._pick(this.PARRY_DESCS) + '。');

            } else if (action === 'focus') {
                cs.playerMomentum = Math.min(5, cs.playerMomentum + 2);
                const fd = this._pick(this.FOCUS_DESCS);
                const readyHint = activeSkill && cs.playerMomentum >= activeSkill.momentumCost
                    ? `——<b style="color:#f4c430">【${activeSkill.name}】蓄势完成！</b>` : '';
                lines.push(`${fd}，势能积聚（${cs.playerMomentum}/5）${readyHint}。`);
            }

            // ── Enemy phase ──────────────────────────────────────────────────
            if (!combatOver) {
                if (action === 'parry') {
                    if (enemyAction === 'heavy') {
                        // Successful parry → counter-hit
                        const counterDmg = Math.max(1, Math.floor(playerAtk * 0.6) + this._rand(-2, 4));
                        cs.enemyHp = Math.max(0, cs.enemyHp - counterDmg);
                        cs.totalDmgDealt += counterDmg;
                        cs.playerMomentum = Math.min(5, cs.playerMomentum + 1);
                        lines.push(`${cs.enemy.name}${this._pick(this.ENEMY_HEAVY_DESCS)}——你【<b>化解反击</b>】！借力打力，对方损失 <b>${counterDmg}</b> 气血。`);
                        if (cs.enemyHp <= 0) { result = 'won'; combatOver = true; }
                    } else {
                        // Parry punished by swift
                        const pend = cs.pendingSkill;
                        const skillMult = pend ? (pend.damageMult || 1.5) : 1.0;
                        if (pend) cs.pendingSkill = null;
                        const rawDmg = Math.max(1, Math.floor(cs.enemyEffAtk * 1.3 * skillMult)
                            - Math.floor(playerDef * 0.25) + this._rand(-2, 5));
                        Character.takeDamage(char, rawDmg);
                        cs.totalDmgReceived += rawDmg;
                        cs.playerMomentum = Math.max(0, cs.playerMomentum - 1);
                        const sl = pend ? `【<b style="color:#e07b39">${pend.name}</b>】` : '';
                        lines.push(`化解失败！${cs.enemy.name}${sl}${this._pick(this.ENEMY_SWIFT_DESCS)}，打破你的架势，你受到 <b>${rawDmg}</b> 伤害！`);
                        if (char.hp <= 0) { result = 'lost'; combatOver = true; }
                    }
                } else if (cs.enemyStunned) {
                    cs.enemyStunned = false;
                    lines.push(`${cs.enemy.name}被震慑，无法出手！`);
                } else {
                    // Normal enemy attack
                    const pend = cs.pendingSkill;
                    const skillMult = pend ? (pend.damageMult || 1.5) : 1.0;
                    const skillName = pend ? pend.name : null;
                    if (pend) cs.pendingSkill = null;

                    // Reduction based on player stance and enemy attack type
                    let incomingMult = 1.0;
                    if (action === 'defend') {
                        incomingMult = enemyAction === 'heavy' ? 0.25 : 0.50;
                    } else if (action === 'focus') {
                        incomingMult = 0.55;
                    } else if (action === 'quick' && enemyAction === 'heavy') {
                        incomingMult = 0.80;
                    }

                    const rawDmg = Math.max(1,
                        Math.floor(cs.enemyEffAtk * skillMult) - Math.floor(playerDef * 0.5)
                        + this._rand(-2, 6));
                    const finalDmg = Math.max(1, Math.floor(rawDmg * incomingMult));
                    const attackPool = enemyAction === 'swift' ? this.ENEMY_SWIFT_DESCS : this.ENEMY_HEAVY_DESCS;
                    const customPool = cs.enemy.attackDescs && cs.enemy.attackDescs.length ? cs.enemy.attackDescs : null;
                    const ed = skillName
                        ? `使出【<b style="color:#e07b39">${skillName}</b>】`
                        : this._pick(customPool || attackPool);

                    if (Math.random() < Character.getLuckDodgeChance(char)) {
                        lines.push(`${cs.enemy.name}${ed}——你【<b>灵巧闪避</b>】，未受伤害！`);
                    } else {
                        Character.takeDamage(char, finalDmg);
                        cs.totalDmgReceived += finalDmg;
                        const reduceNote = incomingMult < 1.0
                            ? `（减伤 ${Math.round((1 - incomingMult) * 100)}%）` : '';
                        lines.push(`${cs.enemy.name}${ed}，你承受 <b>${finalDmg}</b> 伤害${reduceNote}。`);
                        if (char.hp <= 0) { result = 'lost'; combatOver = true; }
                    }

                    // Telegraph enemy HP-threshold skill
                    if (!combatOver && cs.enemy.skills && cs.enemy.skills.length > 0) {
                        const hpPct = cs.enemyHp / cs.enemyMaxHp;
                        for (const s of cs.enemy.skills) {
                            if (!cs.usedSkills.includes(s.id) && hpPct <= (s.hpThreshold || 0.5)) {
                                cs.pendingSkill = s;
                                cs.usedSkills.push(s.id);
                                lines.push(`<br><span style="color:#f4a261;font-weight:bold">⚠ ${s.telegraph}</span>`);
                                break;
                            }
                        }
                    }
                }
            }
        }

        // ── Preview enemy's NEXT action (accuracy gated by comprehension) ────
        // Power-law curve: needs comp ~55-60 (3-4 rebirths) for reliable reads.
        // Low comp: mostly wrong reads (deceptive). Mid comp: vague. High comp: accurate.
        if (!combatOver) {
            const next = this._enemyChooseAction(cs);
            cs.enemyNextAction = next;
            const comp = (char.attributes && char.attributes.comprehension) || 0;
            // x^1.5 power law: 0% at comp≤3, ~15% at 20, ~50% at 40, ~90% at 60
            const t = Math.max(0, comp - 3) / 55;
            const accurateChance = Math.min(0.90, Math.pow(t, 1.5) * 0.90);
            // Vague fraction rises with comp: low comp → mostly wrong, high comp → mostly vague
            const vagueFrac = Math.min(0.80, 0.30 + comp / 60 * 0.50);
            const remaining = 1 - accurateChance;
            const r = Math.random();
            if (r < accurateChance) {
                cs.enemyIntentHint  = this.ENEMY_INTENT[next] || '';
                cs.enemyIntentType  = 'accurate';
            } else if (r < accurateChance + remaining * vagueFrac) {
                cs.enemyIntentHint  = this._pick(this.VAGUE_INTENT_MSGS);
                cs.enemyIntentType  = 'vague';
            } else {
                const wrong = next === 'heavy' ? 'swift' : 'heavy';
                cs.enemyIntentHint  = this.ENEMY_INTENT[wrong] || '';
                cs.enemyIntentType  = 'wrong'; // looks identical to 'accurate' in UI
            }
        }

        cs.log.push({ turn: cs.turn, text: lines.join(' ') });
        return { combatOver, result };
    },

    _rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

    getSummaryLine(char, enemy, job) {
        const atk = Character.getAttackPower(char, job);
        const def = Character.getDefensePower(char, job);
        const eff = this.getEffectiveStats(enemy, char);
        return `你的攻击力：${atk} | 防御力：${def} | 敌方：${enemy.name}（攻${eff.attack}/防${eff.defense}）`;
    }
};

if (typeof module !== 'undefined') module.exports = { Combat };
