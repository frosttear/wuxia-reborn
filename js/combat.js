// combat.js - Turn-based combat system

const Combat = {
    PLAYER_ATTACK_DESCS: [
        '你横刀一斩，剑光凛冽',
        '你蓄力挥出一掌，内劲勃发',
        '你凌空跃起，自上而下猛劈',
        '你以快打慢，抢先刺出一剑',
        '你运气于掌，拍出一道劲风',
        '你身形飘忽，剑走偏锋',
        '你绕至侧翼，斜刺里出剑'
    ],
    DEFEND_DESCS: [
        '你凝神守势，以逸待劳',
        '你侧身化解，以柔克刚',
        '你步伐灵动，卸去来势',
        '你内力护体，顶住冲击'
    ],
    ENEMY_ATTACK_DESCS: [
        '挥刀猛劈向你',
        '猛地冲上，出拳猛击',
        '趁你换气之际，疾刺而来',
        '反手横扫，势大力沉',
        '快步上前，连续出手'
    ],

    // Scaled enemy stats based on player strength tier
    getEffectiveStats(enemy, char) {
        const tier = Math.floor((char.attributes.strength || 0) / 10);
        return {
            attack:  enemy.attack  + tier * (enemy.attackScale  || 0),
            defense: enemy.defense + tier * (enemy.defenseScale || 0)
        };
    },

    // Monte-Carlo win-chance (200 trials) for UI preview
    calcWinChance(char, enemy, job) {
        const atk = Character.getAttackPower(char, job);
        const eff = this.getEffectiveStats(enemy, char);
        let wins = 0;
        for (let i = 0; i < 200; i++) {
            const lv = 1 + (Math.random() - 0.5) * (char.attributes.luck / 100);
            if (Math.floor(atk * lv) + Math.floor(Math.random() * 10) >
                eff.defense        + Math.floor(Math.random() * 10)) wins++;
        }
        return Math.round(wins / 2);
    },

    // Build fresh combat state
    initState(char, enemy, job) {
        const eff = this.getEffectiveStats(enemy, char);
        return {
            enemy,
            enemyHp:    enemy.hp || 80,
            enemyMaxHp: enemy.hp || 80,
            enemyEffAtk: eff.attack,
            enemyEffDef: eff.defense,
            turn:       0,
            fleeChance: 0.25,
            pendingSkill: null,   // enemy skill telegraphed, fires next turn
            usedSkills:   [],     // skill ids already used (array for serializability)
            log:        [],
            postNarrative: ''
        };
    },

    // Process one player action; mutates cs and char
    // Returns { combatOver, result: 'won'|'lost'|'fled'|null }
    processTurn(action, cs, char, job) {
        const playerAtk = Character.getAttackPower(char, job);
        const playerDef = Character.getDefensePower(char, job);
        cs.turn++;
        const lines = [];
        let combatOver = false, result = null;

        if (action === 'flee') {
            if (Math.random() < cs.fleeChance) {
                lines.push(`趁${cs.enemy.name}换招之际，你拼命脱身——<b>逃跑成功！</b>`);
                result = 'fled'; combatOver = true;
            } else {
                const dmg = Math.max(1,
                    cs.enemyEffAtk - Math.floor(playerDef / 2) + Math.floor(Math.random() * 5));
                Character.takeDamage(char, dmg);
                const ed = this._pick(this.ENEMY_ATTACK_DESCS);
                lines.push(`逃跑失败！${cs.enemy.name}${ed}，你仓皇受击，损失 <b>${dmg}</b> 气血。`);
                cs.fleeChance = Math.min(0.85, cs.fleeChance + 0.15);
                if (char.hp <= 0) { result = 'lost'; combatOver = true; }
            }
        } else {
            // Player acts
            if (action === 'attack') {
                const lv     = 1 + (Math.random() - 0.5) * (char.attributes.luck / 100);
                const isCrit = Math.random() < (char.attributes.luck / 200);
                let dmg = Math.max(1,
                    Math.floor(playerAtk * lv) - Math.floor(cs.enemyEffDef * 0.55)
                    + Math.floor(Math.random() * 8) - 3);
                if (isCrit) dmg = Math.floor(dmg * 1.5);
                cs.enemyHp = Math.max(0, cs.enemyHp - dmg);
                const pd = this._pick(this.PLAYER_ATTACK_DESCS);
                lines.push(`${pd}${isCrit ? '【<b>会心一击</b>】' : ''}，对方损失 <b>${dmg}</b> 气血（剩余 ${cs.enemyHp}）。`);
                if (cs.enemyHp <= 0) { result = 'won'; combatOver = true; }
            } else {
                lines.push(`${this._pick(this.DEFEND_DESCS)}。`);
            }

            // Enemy counter (skip if already won)
            if (!combatOver) {
                // Apply pending skill if telegraphed last turn
                const skill = cs.pendingSkill;
                const skillMult = skill ? (skill.damageMult || 1.5) : 1.0;
                const skillName = skill ? skill.name : null;
                if (skill) cs.pendingSkill = null;

                const defMult = action === 'defend' ? 0.35 : 1.0;
                const effDef  = playerDef * (action === 'defend' ? 0.85 : 0.5);
                const rawDmg  = Math.max(1,
                    Math.floor(cs.enemyEffAtk * skillMult) - Math.floor(effDef)
                    + Math.floor(Math.random() * 6) - 2);
                const eDmg    = Math.max(1, Math.floor(rawDmg * defMult));
                const ed      = skillName
                    ? `使出【<b style="color:#e07b39">${skillName}</b>】`
                    : this._pick(this.ENEMY_ATTACK_DESCS);
                if (Math.random() < Character.getLuckDodgeChance(char)) {
                    lines.push(`${cs.enemy.name}${ed}——你【<b>灵巧闪避</b>】，未受伤害！`);
                } else {
                    Character.takeDamage(char, eDmg);
                    lines.push(`${cs.enemy.name}${ed}，你承受 <b>${eDmg}</b> 伤害${action === 'defend' ? '（防御减伤）' : ''}。`);
                    if (char.hp <= 0) { result = 'lost'; combatOver = true; }
                }

                // Telegraph next skill if HP threshold crossed
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

        cs.log.push({ turn: cs.turn, text: lines.join(' ') });
        return { combatOver, result };
    },

    _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

    getSummaryLine(char, enemy, job) {
        const atk = Character.getAttackPower(char, job);
        const def = Character.getDefensePower(char, job);
        const eff = this.getEffectiveStats(enemy, char);
        return `你的攻击力：${atk} | 防御力：${def} | 敌方：${enemy.name}（攻${eff.attack}/防${eff.defense}）`;
    }
};
