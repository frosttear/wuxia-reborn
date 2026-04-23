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
        const hpScale = enemy.hpScale != null ? enemy.hpScale : 0.15;
        const hp = Math.round((enemy.hp || 80) * (1 + tier * hpScale));
        const innerForce = enemy.innerForce || 0;
        return {
            attack:  enemy.attack  + tier * (enemy.attackScale  || 0),
            defense: enemy.defense + tier * (enemy.defenseScale || 0),
            hp,
            innerForce,
            qiShield: Math.floor(innerForce / 8)
        };
    },

    // ── Win-chance estimate (full simulation, 50 trials) ──────────────────
    calcWinChance(char, enemy, job) {
        const result = this.runQuickCombat(char, enemy, job, 50);
        return Math.round(result.winRate * 100);
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
            enemyQiShield: eff.qiShield,
            enemyInnerForce: eff.innerForce,
            turn:        0,
            fleeChance:  0.25,
            pendingSkill: null,
            usedSkills:   [],
            playerMomentum: (char.legacyTalents || []).includes('battle_hardened') ? 3
                : (char.legacyTalents || []).includes('battle_veteran') ? 2
                : (char.legacyTalents || []).includes('battle_novice') ? 1 : 0,
            skillCooldown:  0,      // turns until job active skill can fire again
            enemyComp:    enemy.comprehension || 0, // enemy comprehension (affects intent readability)
            enemyNextAction: null,  // 'heavy'|'swift', previewed for next turn
            enemyIntentHint: '',    // text shown in combat UI
            enemyIntentType: null,  // 'accurate'|'vague'|'unreadable'
            enemyStunned: false,    // skip enemy attack once (stun skill effect)
            enemyMomentum: 0,      // enemy BP; accumulates each normal-attack turn
            enemySkillCooldown: 0, // cooldown turns after enemy uses a skill
            totalDmgDealt: 0,
            totalDmgReceived: 0,
            log:          [],
            postNarrative: ''
        };
        if ((char.legacyTalents || []).includes('wind_step')) cs.fleeChance += 0.20;
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
            // 天魔威压遮蔽，识破上限60%；剑魂神意难测，上限50%；普通对手上限80%
            const intentCap = enemy.id === 'sword_soul' ? 0.50
                            : enemy.id === 'tianmo'      ? 0.60 : 0.80;
            const accurateChance = Math.min(intentCap, 0.80 * Math.log(1 + playerComp / (enemyComp + 20)));
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

    // ── Inner-force combat bonus (relative advantage) ──────────────────────
    // Returns 0 when playerIF ≤ enemyIF; up to ~40% when massively dominant.
    // Formula: max(0, (pIF - eIF) / (pIF + eIF + 10) * 0.40)
    // Used for BOTH normal attacks and skill damage; enemy uses same formula vs player.
    _effectiveSkillAmp(playerIF, enemyIF) {
        const diff = (playerIF || 0) - (enemyIF || 0);
        return Math.max(0, diff / ((playerIF || 0) + (enemyIF || 0) + 10) * 0.40);
    },

    // ── Bravely Default-style defense: atk² / (atk + def + 1) ─────────────
    // Always returns positive damage; high def reduces proportionally but never
    // makes the attacker deal 1 (no hard floor needed). Works for both sides.
    _bdDmg(atk, def) {
        if (atk <= 0) return 0;
        return Math.floor(atk * atk / (atk + Math.max(0, def) + 1));
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
        const qiShield  = Character.getQiShield(char);       // flat reduction per hit
        // Inner-force advantage amp: relative formula; 0 when equal or player weaker
        const innerAmp  = this._effectiveSkillAmp(char.attributes.innerForce || 0, cs.enemyInnerForce)
            + ((char.legacyTalents || []).includes('qi_mastery') ? 0.08
               : (char.legacyTalents || []).includes('qi_flow')  ? 0.04 : 0);
        const enemyQS   = cs.enemyQiShield || 0;             // enemy qi shield
        // Enemy inner-force advantage over player (symmetric)
        const enemyInnerAmp = this._effectiveSkillAmp(cs.enemyInnerForce || 0, char.attributes.innerForce || 0);

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
                const rawDmgFlee = Math.max(1, this._bdDmg(cs.enemyEffAtk, Math.floor(playerDef / 2)));
                const dmg = Math.max(1, rawDmgFlee - qiShield);
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
                && action !== 'parry'
                && cs.playerMomentum >= activeSkill.momentumCost
                && cs.skillCooldown === 0;

            // ── Player attack phase ──────────────────────────────────────────
            // BD-style: damage = atk² / (atk + def + 1); no flat defPen needed.

            if (skillFires) {
                // Auto-trigger job skill
                cs.playerMomentum -= activeSkill.momentumCost;
                cs.skillCooldown = 3;
                const sk = activeSkill;

                // Skill damage: same BD ratio — defRatio = atk / (atk + def)
                const defRatio = Math.max(0.35, playerAtk / (playerAtk + cs.enemyEffDef + 1));
                const ampNote = innerAmp >= 0.05 ? `　<span style="color:#a0d8ef">内力+${Math.round(innerAmp * 100)}%</span>` : '';
                if (sk.type === 'multi') {
                    const hits = sk.hits || 3;
                    let rawSum = 0;
                    const parts = [];
                    for (let i = 0; i < hits; i++) {
                        const h = Math.max(1, Math.floor(playerAtk * sk.power * defRatio * (1 + innerAmp)));
                        rawSum += h; parts.push(h);
                    }
                    const total = Math.max(1, rawSum - enemyQS);
                    cs.enemyHp = Math.max(0, cs.enemyHp - total);
                    cs.totalDmgDealt += total;
                    const qsNote = enemyQS > 0 ? `，气盾抵消${enemyQS}，实际 <b>${total}</b>` : `，共 <b>${total}</b>`;
                    lines.push(`【<b style="color:#f4c430">${sk.name}</b>】连击（${parts.join('+')}=${rawSum}${qsNote}），对方剩余气血 ${Math.max(0, cs.enemyHp)}。${ampNote}`);
                } else {
                    const dmg = Math.max(1, Math.floor(playerAtk * sk.power * defRatio * (1 + innerAmp)) - enemyQS);
                    cs.enemyHp = Math.max(0, cs.enemyHp - dmg);
                    cs.totalDmgDealt += dmg;
                    const stunNote = sk.type === 'stun' ? '  【<b style="color:#a0d8ef">震慑</b>】' : '';
                    if (sk.type === 'stun') cs.enemyStunned = true;
                    lines.push(`【<b style="color:#f4c430">${sk.name}</b>】对方损失 <b>${dmg}</b> 气血（剩余 ${Math.max(0, cs.enemyHp)}）。${stunNote}${ampNote}`);
                }
                if (cs.enemyHp <= 0) { result = 'won'; combatOver = true; }

            } else if (action === 'strike') {
                const lv    = 1 + (Math.random() - 0.5) * (char.attributes.luck / 100);
                const isCrit = Math.random() < Character.getLuckTriggerChance(char);
                // BD-style: base = atk² / (atk + def + 1), then apply luck variance and innerAmp
                let dmg = Math.max(1, Math.floor(this._bdDmg(playerAtk, cs.enemyEffDef) * lv * (1 + innerAmp))
                    - enemyQS);
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
            // BD-style: baseDmg = enemyAtk² / (enemyAtk + playerDef + 1)

            if (!combatOver) {
                if (action === 'parry') {
                    if (enemyAction === 'heavy') {
                        // Successful parry → player takes 20% incoming + counter-hit
                        // If skill is ready, use skill as counter instead of basic counter
                        const pend = cs.pendingSkill;
                        const skillMult = pend ? (pend.damageMult || 1.5) * (1 + enemyInnerAmp) : 1.0;
                        const skillName = pend ? pend.name : null;
                        if (pend) { cs.pendingSkill = null; cs.enemySkillCooldown = 2; }
                        const rawIncoming = Math.max(1, Math.floor(this._bdDmg(cs.enemyEffAtk, playerDef) * skillMult));
                        const parryDmg = Math.max(1, Math.floor(rawIncoming * 0.20) - qiShield);
                        Character.takeDamage(char, parryDmg);
                        cs.totalDmgReceived += parryDmg;

                        // Check if player's active skill fires as counter
                        const activeSkill = job && job.activeSkill;
                        const skillCounterFires = activeSkill
                            && cs.playerMomentum >= activeSkill.momentumCost
                            && cs.skillCooldown === 0;

                        let counterDmg;
                        let counterText;
                        if (skillCounterFires) {
                            // Skill counter — supports multi-hit and single-hit types
                            cs.playerMomentum -= activeSkill.momentumCost;
                            cs.skillCooldown = 3;
                            const sk = activeSkill;
                            const isCrit = Math.random() < Character.getLuckTriggerChance(char);
                            const ampNote = innerAmp >= 0.05 ? `内力+${Math.round(innerAmp * 100)}%` : '';
                            const critTag = isCrit ? '【<b>会心一击</b>】' : '';
                            const ctrDefRatio = Math.max(0.35, playerAtk / (playerAtk + cs.enemyEffDef + 1));
                            if (sk.type === 'multi') {
                                const hits = sk.hits || 3;
                                let rawSum = 0;
                                const parts = [];
                                for (let i = 0; i < hits; i++) {
                                    const h = Math.max(1, Math.floor(playerAtk * sk.power * ctrDefRatio * (1 + innerAmp)));
                                    rawSum += h; parts.push(h);
                                }
                                counterDmg = Math.max(1, rawSum - enemyQS);
                                if (isCrit) counterDmg = Math.floor(counterDmg * 1.5);
                                if (sk.type === 'stun') cs.enemyStunned = true;
                                const cqsNote = enemyQS > 0 ? `，气盾抵消${enemyQS}，实际 <b>${counterDmg}</b>` : `，共 <b>${counterDmg}</b>`;
                                counterText = heavyAnticipated
                                    ? `你早已洞悉来招，顺势以【<b style="color:#f4c430">${sk.name}</b>】反击！${critTag}${ampNote}连击（${parts.join('+')}=${rawSum}${cqsNote}）`
                                    : `凭直觉化解来招，以【<b style="color:#f4c430">${sk.name}</b>】反击！${critTag}${ampNote}连击（${parts.join('+')}=${rawSum}${cqsNote}）`;
                            } else {
                                counterDmg = Math.max(1, Math.floor(playerAtk * sk.power * ctrDefRatio * (1 + innerAmp)) - enemyQS);
                                if (isCrit) counterDmg = Math.floor(counterDmg * 1.5);
                                if (sk.type === 'stun') cs.enemyStunned = true;
                                counterText = heavyAnticipated
                                    ? `你早已洞悉来招，顺势以【<b style="color:#f4c430">${sk.name}</b>】反击！${critTag}${ampNote}对方损失 <b>${counterDmg}</b> 气血`
                                    : `凭直觉化解来招，以【<b style="color:#f4c430">${sk.name}</b>】反击！${critTag}${ampNote}对方损失 <b>${counterDmg}</b> 气血`;
                            }
                        } else {
                            // Basic counter — BD-style
                            const counterMult = heavyAnticipated ? 1.0 : 0.75;
                            const isCrit = Math.random() < Character.getLuckTriggerChance(char);
                            counterDmg = Math.max(1, Math.floor(this._bdDmg(playerAtk, cs.enemyEffDef) * counterMult) - enemyQS);
                            if (isCrit) counterDmg = Math.floor(counterDmg * 1.5);
                            const critTag = isCrit ? '【<b>会心一击</b>】' : '';
                            counterText = heavyAnticipated
                                ? `你早已洞悉来招，截断蓄力，${critTag}对方损失 <b>${counterDmg}</b> 气血`
                                : `你凭直觉化解来招，借力反击，${critTag}对方损失 <b>${counterDmg}</b> 气血`;
                        }
                        cs.enemyHp = Math.max(0, cs.enemyHp - counterDmg);
                        cs.totalDmgDealt += counterDmg;
                        cs.playerMomentum = Math.min(5, cs.playerMomentum + 1);
                        const counterLabel = heavyAnticipated
                            ? '<b style="color:#6fcf97">洞察反击</b>'
                            : '<b style="color:#e0c060">化解反击</b>';
                        const skillNote = skillName ? `【<b style="color:#e07b39">${skillName}</b>】` : '';
                        lines.push(`${cs.enemy.name}${skillNote}${this._pick(this.ENEMY_HEAVY_DESCS)}——你【${counterLabel}】！${counterText}，你承受 <b>${parryDmg}</b> 点冲击。`);
                        if (char.hp <= 0) { result = 'lost'; combatOver = true; }
                        if (!combatOver && cs.enemyHp <= 0) { result = 'won'; combatOver = true; }
                        // Break: successful parry disrupts enemy skill charge
                        if (!combatOver) {
                            const breakAmt = Math.min(2, cs.enemyMomentum);
                            cs.enemyMomentum = Math.max(0, cs.enemyMomentum - 2);
                            if (breakAmt > 0) lines.push(`<span style="color:#6fcf97">【破势】对方蓄力中断（-${breakAmt}）。</span>`);
                        }
                    } else {
                        // Parry punished by swift — player off-balance: half defense, 1.15× multiplier
                        const pend = cs.pendingSkill;
                        const skillMult = pend ? (pend.damageMult || 1.5) * (1 + enemyInnerAmp) : 1.0;
                        if (pend) { cs.pendingSkill = null; cs.enemySkillCooldown = 2; }
                        const rawDmg = Math.max(1, Math.floor(this._bdDmg(cs.enemyEffAtk, Math.floor(playerDef * 0.5)) * 1.15 * skillMult));
                        const parryPunishDmg = Math.max(1, rawDmg - qiShield);
                        Character.takeDamage(char, parryPunishDmg);
                        cs.totalDmgReceived += parryPunishDmg;
                        const sl = pend ? `【<b style="color:#e07b39">${pend.name}</b>】` : '';
                        lines.push(`破招失败！${cs.enemy.name}${sl}${this._pick(this.ENEMY_SWIFT_DESCS)}，打破你的架势，你受到 <b>${parryPunishDmg}</b> 伤害！`);
                        if (char.hp <= 0) { result = 'lost'; combatOver = true; }
                    }
                } else if (cs.enemyStunned) {
                    cs.enemyStunned = false;
                    // Stunned: attacks at 40% power — reduced but not nullified
                    const stunRaw = Math.max(1, Math.floor(this._bdDmg(cs.enemyEffAtk, playerDef) * 0.40));
                    const stunDmg = Math.max(1, stunRaw - qiShield);
                    Character.takeDamage(char, stunDmg);
                    cs.totalDmgReceived += stunDmg;
                    lines.push(`${cs.enemy.name}被震慑，强撑出手，你承受 <b>${stunDmg}</b> 点冲击（力道大减）。`);
                    if (char.hp <= 0) { result = 'lost'; combatOver = true; }
                } else {
                    // Normal enemy attack — enemy momentum: decrement cooldown or accumulate
                    if (cs.enemySkillCooldown > 0) cs.enemySkillCooldown--;
                    const pend = cs.pendingSkill;
                    const skillMult = pend ? (pend.damageMult || 1.5) * (1 + enemyInnerAmp) : 1.0;
                    const skillName = pend ? pend.name : null;
                    if (pend) { cs.pendingSkill = null; cs.enemySkillCooldown = 2; }

                    // Reduction based on player stance and enemy attack type
                    // Scale reduction with defense/attack ratio: strong enemies punch through defense
                    // Base: defend vs swift=50%, defend vs heavy=25%, focus=55%
                    // Power gap penalty: if enemyAtk >> playerDef, reduction is capped lower
                    const powerRatio = Math.min(1, playerDef / Math.max(1, cs.enemyEffAtk));
                    // defCap: when ratio=1 (equal), cap=0.75; when ratio=0.3 (outmatched), cap≈0.36
                    const defCap = Math.min(0.75, powerRatio * 0.75 + 0.10);
                    let incomingMult = 1.0;
                    if (action === 'defend') {
                        const baseReduce = swiftAnticipated ? 0.80 : (enemyAction === 'heavy' ? 0.75 : 0.50);
                        // 洞察时允许突破defCap: 至少获得defCap+0.15的减伤(上限0.80)
                        const cappedReduce = swiftAnticipated
                            ? Math.min(0.80, Math.max(defCap + 0.15, baseReduce))
                            : Math.min(baseReduce, defCap);
                        incomingMult = 1.0 - cappedReduce;
                    } else if (action === 'focus') {
                        incomingMult = 1.0 - Math.min(0.55, defCap);
                    }

                    const rawDmg = Math.max(1, Math.floor(this._bdDmg(cs.enemyEffAtk, playerDef) * skillMult));
                    const finalDmg = Math.max(1, Math.floor(rawDmg * incomingMult) - qiShield);
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

                    // Enemy skill telegraph: momentum-based, repeatable
                    // Strongest available skill fires when enemy momentum ≥ its cost
                    if (!combatOver && cs.enemy.skills && cs.enemy.skills.length > 0
                            && !cs.pendingSkill && cs.enemySkillCooldown === 0) {
                        const hpPct = cs.enemyHp / cs.enemyMaxHp;
                        const available = cs.enemy.skills
                            .filter(s => hpPct <= (s.hpThreshold || 0.5))
                            .sort((a, b) => ((a.momentumCost || 3) - (b.momentumCost || 3)) || ((a.hpThreshold || 0) - (b.hpThreshold || 0)));
                        const nextSk = available[0];
                        if (nextSk && cs.enemyMomentum >= (nextSk.momentumCost || 3)) {
                            cs.pendingSkill = nextSk;
                            cs.enemyMomentum -= (nextSk.momentumCost || 3);
                            lines.push(`<br><span style="color:#f4a261;font-weight:bold">⚠ ${nextSk.telegraph}</span>`);
                        }
                    }
                    // Accumulate enemy momentum if cooldown done and no skill just telegraphed
                    if (cs.enemySkillCooldown === 0 && !cs.pendingSkill) cs.enemyMomentum++;
                }
            }
        }

        // ── Preview enemy's NEXT action (accuracy = f(playerComp / enemyComp)) ────
        // Cap: 普通对手80%，天魔60%（威压遮蔽），剑魂50%（神意难测）；无相剑意→百分百洞察
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
                const intentCap = cs.enemy.id === 'sword_soul' ? 0.50
                                : cs.enemy.id === 'tianmo'      ? 0.60 : 0.80;
                const accurateChance = Math.min(intentCap, 0.80 * Math.log(1 + playerComp / (enemyComp + 20)));
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

    // Effective damage ratio for strike UI tooltip (BD-style: atk / (atk + def))
    getStrikeEffRatio(playerAtk, enemyDef) {
        if (playerAtk <= 0) return 0;
        return Math.round(playerAtk / (playerAtk + Math.max(0, enemyDef) + 1) * 100);
    },

    // ── Action preview for UI ────────────────────────────────────────────────
    // Returns estimated values for each action button display
    getActionPreview(cs, char, job) {
        const playerAtk = Character.getAttackPower(char, job) + (cs.allBondsBonus ? 60 : 0);
        const playerDef = Character.getDefensePower(char, job);
        const qiShield  = Character.getQiShield(char);
        const innerAmp  = this._effectiveSkillAmp(char.attributes.innerForce || 0, cs.enemyInnerForce)
            + ((char.legacyTalents || []).includes('qi_mastery') ? 0.08
               : (char.legacyTalents || []).includes('qi_flow')  ? 0.04 : 0);
        const enemyQS   = cs.enemyQiShield || 0;
        const critChance = Math.round(Character.getLuckTriggerChance(char) * 100);
        const dodgeChance = Math.round(Character.getLuckDodgeChance(char) * 100);

        // Player → enemy flat defense penetration
        // BD-style damage helpers for preview (no defPen)
        const rawEnemyDmg = Math.max(1, this._bdDmg(cs.enemyEffAtk, playerDef));

        // Defend defCap (enemy power ratio — determines how much stances reduce incoming)
        const powerRatio = Math.min(1, playerDef / Math.max(1, cs.enemyEffAtk));
        const defCap = Math.min(0.75, powerRatio * 0.75 + 0.10);

        // ── Strike ──
        const strikeDmg = Math.max(1, Math.floor(this._bdDmg(playerAtk, cs.enemyEffDef) * (1 + innerAmp)) - enemyQS);
        const strikeCrit = Math.floor(strikeDmg * 1.5);

        // ── Skill preview ──
        const activeSkill = job && job.activeSkill;
        let skillPreview = null;
        if (activeSkill && cs.playerMomentum >= activeSkill.momentumCost && cs.skillCooldown === 0) {
            const sk = activeSkill;
            const previewDefRatio = Math.max(0.35, playerAtk / (playerAtk + cs.enemyEffDef + 1));
            if (sk.type === 'multi') {
                const hits = sk.hits || 3;
                const perHit = Math.max(1, Math.floor(playerAtk * sk.power * previewDefRatio * (1 + innerAmp)));
                const total = Math.max(1, perHit * hits - enemyQS);
                skillPreview = { name: sk.name, dmg: total, hits };
            } else {
                const dmg = Math.max(1, Math.floor(playerAtk * sk.power * previewDefRatio * (1 + innerAmp)) - enemyQS);
                skillPreview = { name: sk.name, dmg, hits: 1 };
            }
        }

        // ── Defend ──
        const intentAccurate = cs.enemyIntentType === 'accurate' || cs.enemyIntentType === 'perfect';
        const insightSwift = intentAccurate && cs.enemyNextAction === 'swift';
        const insightReduce = Math.min(0.80, Math.max(defCap + 0.15, 0.80));
        const defendVsHeavy = Math.round(Math.min(0.75, defCap) * 100);
        const defendVsSwift = insightSwift
            ? Math.round(insightReduce * 100)
            : Math.round(Math.min(0.50, defCap) * 100);
        const defendDmgHeavy = Math.max(1, Math.floor(rawEnemyDmg * (1 - Math.min(0.75, defCap))) - qiShield);
        const defendDmgSwift = insightSwift
            ? Math.max(1, Math.floor(rawEnemyDmg * (1 - insightReduce)) - qiShield)
            : Math.max(1, Math.floor(rawEnemyDmg * (1 - Math.min(0.50, defCap))) - qiShield);

        // ── Parry ──
        const counterDmg = Math.max(1, Math.floor(this._bdDmg(playerAtk, cs.enemyEffDef) * 0.75) - enemyQS);
        const counterCrit = Math.floor(counterDmg * 1.5);
        const parrySelfDmg = Math.max(1, Math.floor(rawEnemyDmg * 0.20) - qiShield);
        // Punished (vs swift): half defense, 1.15× multiplier
        const punishDmg = Math.max(1, Math.floor(this._bdDmg(cs.enemyEffAtk, Math.floor(playerDef * 0.5)) * 1.15) - qiShield);

        // ── Focus ──
        const focusReduction = Math.round(Math.min(0.55, defCap) * 100);
        const focusDmg = Math.max(1, Math.floor(rawEnemyDmg * (1 - Math.min(0.55, defCap))) - qiShield);
        const momAfter = Math.min(5, (cs.playerMomentum || 0) + 3);

        // ── No-action baseline (strike/focus incoming) ──
        const fullDmg = Math.max(1, rawEnemyDmg - qiShield);

        return {
            strike: { dmg: strikeDmg, critDmg: strikeCrit, critChance, skillPreview },
            defend: { vsHeavy: defendVsHeavy, vsSwift: defendVsSwift, dmgHeavy: defendDmgHeavy, dmgSwift: defendDmgSwift, dodgeChance, insightSwift },
            parry:  { counterDmg, counterCrit, selfDmg: parrySelfDmg, punishDmg, critChance, dodgeChance,
                  enemyMomentum: cs.enemyMomentum, momentumBreak: Math.min(2, cs.enemyMomentum) },
            focus:  { reduction: focusReduction, dmg: focusDmg, momAfter, dodgeChance },
            incoming: { fullDmg, dodgeChance },
        };
    },
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
            passives: (char.passives || []).slice(),
            legacyTalents: (char.legacyTalents || []).slice(),
            job: char.job,
        };
        const simEnemy = JSON.parse(JSON.stringify(enemy));
        const cs = this.initState(simChar, simEnemy, job);
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
