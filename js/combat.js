// combat.js - Turn-based combat system

const Combat = {
    // ── Narration pools ────────────────────────────────────────────────────
    STANCE_ATTACK_DESCS: {
        strike: ['你蓄力挥出一击，气势如虹', '你横刀一斩，剑光凛冽', '你凌空跃起，自上而下猛劈', '你运气于掌，拍出一道劲风'],
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
    UNREADABLE_MSGS: [
        '对方行迹难以捉摸，看不出端倪',
        '对方气势沉敛，完全看不出意图',
        '对方深藏不露，无从判断下一招',
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
        const cs = {
            enemy,
            enemyHp:    eff.hp,
            enemyMaxHp: eff.hp,
            enemyEffAtk: eff.attack,
            enemyEffDef: eff.defense,
            turn:        0,
            fleeChance:  0.25,
            pendingSkill: null,
            usedSkills:   [],
            playerMomentum: (char.legacyTalents || []).includes('battle_hardened') ? 3 : 0,
            skillCooldown:  0,      // turns until job active skill can fire again
            enemyComp:    enemy.comprehension || 0, // enemy comprehension (affects intent readability)
            enemyNextAction: null,  // 'heavy'|'swift', previewed for next turn
            enemyIntentHint: '',    // text shown in combat UI
            enemyIntentType: null,  // 'accurate'|'vague'|'unreadable'
            enemyStunned: false,    // skip enemy attack once (stun skill effect)
            totalDmgDealt: 0,
            totalDmgReceived: 0,
            log:          [],
            postNarrative: ''
        };
        // Opening scene description
        if (enemy.description) cs.log.push({ turn: 0, text: enemy.description });
        // Pre-compute turn-1 intent so it shows before the player's first action
        const firstAction = this._enemyChooseAction(cs);
        cs.enemyNextAction = firstAction;
        const hasPerfectRead = (char.passives || []).some(p => p.perfectIntentRead);
        if (hasPerfectRead) {
            cs.enemyIntentHint = this._getIntentHint(enemy, firstAction);
            cs.enemyIntentType = 'perfect';
        } else {
            const playerComp = (char.attributes && char.attributes.comprehension) || 0;
            const enemyComp  = cs.enemyComp;
            const accurateChance = Math.min(0.80, 0.80 * Math.log(1 + playerComp / (enemyComp + 20)));
            if (Math.random() < accurateChance) {
                cs.enemyIntentHint = this._getIntentHint(enemy, firstAction);
                cs.enemyIntentType = 'accurate';
            } else {
                cs.enemyIntentHint = this._getUnreadableHint(enemy);
                cs.enemyIntentType = 'unreadable';
            }
        }
        return cs;
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
        // Intent anticipation: accurate/perfect read means player truly knows what's coming
        const intentAccurate   = cs.enemyIntentType === 'accurate' || cs.enemyIntentType === 'perfect';
        const swiftAnticipated = intentAccurate && enemyAction === 'swift' && action === 'defend';
        const heavyAnticipated = intentAccurate && enemyAction === 'heavy' && action === 'parry';

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
                && action !== 'defend'
                && cs.playerMomentum >= activeSkill.momentumCost
                && cs.skillCooldown === 0;

            // ── Player attack phase ──────────────────────────────────────────
            if (skillFires) {
                // Auto-trigger job skill
                cs.playerMomentum -= activeSkill.momentumCost;
                cs.skillCooldown = 3;
                const sk = activeSkill;

                if (sk.type === 'multi') {
                    const hits = sk.hits || 3;
                    const defMit = Math.floor(cs.enemyEffDef * (1 - (sk.armorBreak || 0.5)) * 0.5);
                    let total = 0;
                    const parts = [];
                    for (let i = 0; i < hits; i++) {
                        const h = Math.max(1, Math.floor(playerAtk * sk.power) + this._rand(-1, 4));
                        total += h; parts.push(h);
                    }
                    total = Math.max(1, total - defMit);
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
                let dmg = Math.max(1, Math.floor(playerAtk * lv)
                    - Math.floor(cs.enemyEffDef * 0.75) + this._rand(-2, 8));
                if (isCrit) dmg = Math.floor(dmg * 1.5);
                cs.enemyHp = Math.max(0, cs.enemyHp - dmg);
                cs.totalDmgDealt += dmg;
                cs.playerMomentum = Math.min(5, cs.playerMomentum + 2);
                const pd = this._pick(this.STANCE_ATTACK_DESCS.strike);
                lines.push(`${pd}${isCrit ? '【<b>会心一击</b>】' : ''}，对方损失 <b>${dmg}</b> 气血（剩余 ${Math.max(0, cs.enemyHp)}）。`);
                if (cs.enemyHp <= 0) { result = 'won'; combatOver = true; }

            } else if (action === 'defend') {
                if (swiftAnticipated) {
                    cs.playerMomentum = Math.min(5, cs.playerMomentum + 1);
                    lines.push('你早已预判对方快攻，' + this._pick(this.DEFEND_DESCS) + `，以守待攻——将攻势引于空处！气力 +1（${cs.playerMomentum}/5）`);
                } else {
                    lines.push(this._pick(this.DEFEND_DESCS) + '。');
                }

            } else if (action === 'parry') {
                lines.push(this._pick(this.PARRY_DESCS) + '。');

            } else if (action === 'focus') {
                cs.playerMomentum = Math.min(5, cs.playerMomentum + 3);
                const fd = this._pick(this.FOCUS_DESCS);
                const readyHint = activeSkill && cs.playerMomentum >= activeSkill.momentumCost
                    ? `——<b style="color:#f4c430">【${activeSkill.name}】蓄势完成！</b>` : '';
                lines.push(`${fd}，气力积聚（${cs.playerMomentum}/5）${readyHint}。`);
            }

            // ── Enemy phase ──────────────────────────────────────────────────
            if (!combatOver) {
                if (action === 'parry') {
                    if (enemyAction === 'heavy') {
                        // Successful parry → player takes 20% incoming + counter-hit
                        const pend = cs.pendingSkill;
                        const skillMult = pend ? (pend.damageMult || 1.5) : 1.0;
                        const skillName = pend ? pend.name : null;
                        if (pend) cs.pendingSkill = null;
                        const rawIncoming = Math.max(1, Math.floor(cs.enemyEffAtk * skillMult) - Math.floor(playerDef * 0.5) + this._rand(-2, 6));
                        const parryDmg = Math.max(1, Math.floor(rawIncoming * 0.20));
                        Character.takeDamage(char, parryDmg);
                        cs.totalDmgReceived += parryDmg;
                        const counterMult = heavyAnticipated ? 0.85 : 0.6;
                        const counterDmg = Math.max(1, Math.floor(playerAtk * counterMult) + this._rand(-2, 4));
                        cs.enemyHp = Math.max(0, cs.enemyHp - counterDmg);
                        cs.totalDmgDealt += counterDmg;
                        cs.playerMomentum = Math.min(5, cs.playerMomentum + 1);
                        const counterLabel = heavyAnticipated ? '洞察反击' : '化解反击';
                        const counterNote  = heavyAnticipated ? '你早已洞悉来招，截断蓄力，' : '借力打力，';
                        const skillNote = skillName ? `【<b style="color:#e07b39">${skillName}</b>】` : '';
                        lines.push(`${cs.enemy.name}${skillNote}${this._pick(this.ENEMY_HEAVY_DESCS)}——你【<b>${counterLabel}</b>】！${counterNote}对方损失 <b>${counterDmg}</b> 气血，你承受 <b>${parryDmg}</b> 点冲击。`);
                        if (char.hp <= 0) { result = 'lost'; combatOver = true; }
                        if (!combatOver && cs.enemyHp <= 0) { result = 'won'; combatOver = true; }
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
                    // swiftAnticipated: player read intent accurately → near-perfect block
                    let incomingMult = 1.0;
                    if (action === 'defend') {
                        incomingMult = swiftAnticipated ? 0.20 : (enemyAction === 'heavy' ? 0.25 : 0.50);
                    } else if (action === 'focus') {
                        incomingMult = 0.55;
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

        // ── Preview enemy's NEXT action (accuracy = f(playerComp / enemyComp)) ────
        // ratio = playerComp / (enemyComp + 5), accurateChance = min(0.90, ratio^1.5 * 0.90)
        // Weak enemies (comp 3-5): readable at playerComp ~8-10.
        // Final boss (comp 50): needs playerComp ~55 (3-4 rebirths) for reliable reads.
        // Passive 「无相剑意」 (perfectIntentRead): bypasses formula → always accurate.
        if (combatOver) {
            cs.enemyIntentHint = '';
            cs.enemyIntentType = '';
        } else {
            const next = this._enemyChooseAction(cs);
            cs.enemyNextAction  = next;
            const hasPerfectRead = (char.passives || []).some(p => p.perfectIntentRead);
            if (hasPerfectRead) {
                cs.enemyIntentHint = this._getIntentHint(cs.enemy, next);
                cs.enemyIntentType = 'perfect';
            } else {
                const playerComp    = (char.attributes && char.attributes.comprehension) || 0;
                const enemyComp     = cs.enemyComp;
                const accurateChance = Math.min(0.80, 0.80 * Math.log(1 + playerComp / (enemyComp + 20)));
                if (Math.random() < accurateChance) {
                    cs.enemyIntentHint = this._getIntentHint(cs.enemy, next);
                    cs.enemyIntentType = 'accurate';
                } else {
                    cs.enemyIntentHint = this._getUnreadableHint(cs.enemy);
                    cs.enemyIntentType = 'unreadable';
                }
            }
        }

        cs.log.push({ turn: cs.turn, text: lines.join(' ') });
        return { combatOver, result };
    },

    _rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    _getIntentHint(enemy, action) {
        const pool = enemy.intentReadMsgs && enemy.intentReadMsgs[action];
        if (pool && pool.length) return this._pick(pool);
        return this.ENEMY_INTENT[action] || '';
    },
    _getUnreadableHint(enemy) {
        const pool = enemy.intentUnreadMsgs;
        if (pool && pool.length) return this._pick(pool);
        return this._pick(this.UNREADABLE_MSGS);
    },

    // ── Monte Carlo quick combat ─────────────────────────────────────────────
    // Runs a single headless simulation. The AI uses intent hints the same way
    // a player would (wrong hints lead to wrong choices, vague hints → safe defend).
    _simulateOnce(char, enemy, job) {
        const simChar = {
            hp: char.hp,
            ageMonths: char.ageMonths || 180,
            attributes: { ...char.attributes },
            passives: char.passives || [],
            legacyTalents: char.legacyTalents || [],
            job: char.job,
        };
        const cs = this.initState(simChar, enemy, job);
        let finalResult = 'lost';
        for (let t = 0; t < 50; t++) {
            let action;
            const type = cs.enemyIntentType;
            const hint = cs.enemyNextAction;
            if (!hint || type === 'vague' || type === 'unreadable') {
                // No reliable info: safe rotation
                action = ['strike', 'strike', 'defend', 'focus'][t % 4];
            } else {
                // Accurate hint: act on it
                action = hint === 'heavy' ? 'parry' : 'strike';
            }
            const r = this.processTurn(action, cs, simChar, job);
            if (r.combatOver) { finalResult = r.result; break; }
        }
        return {
            result: finalResult,
            hpLost: Math.max(0, char.hp - simChar.hp),
            turns: cs.turn,
            dmgDealt: cs.totalDmgDealt,
            dmgReceived: cs.totalDmgReceived,
            log: cs.log,
            enemyHpFinal: cs.enemyHp,
        };
    },

    runQuickCombat(char, enemy, job, runs) {
        runs = runs || 100;
        let wins = 0, totalHpLost = 0, totalTurns = 0, totalDealt = 0, totalReceived = 0;
        for (let i = 0; i < runs; i++) {
            const s = this._simulateOnce(char, enemy, job);
            if (s.result === 'won') wins++;
            totalHpLost    += s.hpLost;
            totalTurns     += s.turns;
            totalDealt     += s.dmgDealt;
            totalReceived  += s.dmgReceived;
        }
        return {
            winRate:         wins / runs,
            avgHpLost:       Math.round(totalHpLost   / runs),
            avgTurns:        Math.round(totalTurns     / runs),
            avgDmgDealt:     Math.round(totalDealt     / runs),
            avgDmgReceived:  Math.round(totalReceived  / runs),
        };
    },

    getSummaryLine(char, enemy, job) {
        const atk = Character.getAttackPower(char, job);
        const def = Character.getDefensePower(char, job);
        const eff = this.getEffectiveStats(enemy, char);
        return `你的攻击力：${atk} | 防御力：${def} | 敌方：${enemy.name}（攻${eff.attack}/防${eff.defense}）`;
    }
};

if (typeof module !== 'undefined') module.exports = { Combat };
