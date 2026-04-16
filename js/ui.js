// ui.js - UI rendering and DOM management

const ATTR_NAMES = {
    strength: '力量', agility: '敏捷', constitution: '体质',
    innerForce: '内力', comprehension: '悟性', luck: '运气', reputation: '声望'
};

const UI = {
    init() {
        this.logEl   = document.getElementById('eventLog');
        this.choicesEl = document.getElementById('choicesPanel');
        this.nextBtn   = document.getElementById('nextMonthBtn');
        this.autoBtn   = document.getElementById('autoAdvanceBtn');
        this.visitBtn  = document.getElementById('visitBtn');
        this.visitPanel = document.getElementById('visitPanel');
        this.chainBtn  = document.getElementById('chainBtn');
        this.chainPanel = document.getElementById('chainPanel');
        this.logBuffer = []; // persisted log entries
    },

    // Mobile tab switching
    switchTab(tab) {
        const map = { char: 'panelChar', event: 'panelEvent', npc: 'panelNpc' };
        Object.values(map).forEach(id => {
            document.getElementById(id).classList.remove('mobile-active');
        });
        document.getElementById(map[tab]).classList.add('mobile-active');
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('tab-active', btn.dataset.tab === tab);
        });
        // Auto-scroll event log to bottom when switching to event tab
        if (tab === 'event') this.logEl.scrollTop = this.logEl.scrollHeight;
    },

    // On mobile, auto-switch to event tab when a new event/log arrives
    notifyEventTab() {
        if (window.innerWidth <= 768) this.switchTab('event');
    },

    renderAll(state) {
        const { char, jobs, npcs } = state;
        if (!char) return;
        this.renderCharacter(char, jobs);
        this.renderRelationships(char, npcs);
        this.renderJobPanel(char, jobs);
        this.updateControls(state);
    },

    renderCharacter(char, jobs) {
        const job = jobs.find(j => j.id === char.job);
        const hpMax = Character.getHPMax(char, job);
        const ageYears = Character.getAgeYears(char);
        const ageMonths = Character.getAgeMonthsRemainder(char);

        document.getElementById('charName').textContent = char.name;
        document.getElementById('charAge').textContent = `${ageYears}岁${ageMonths}月`;
        const injuredBadge = char.injured ? ' <span class="injured-badge">重伤休养</span>' : '';
        document.getElementById('charJob').innerHTML = (job ? job.name : '无名小卒') + injuredBadge;
        document.getElementById('charRebirth').textContent = char.rebirthCount > 0 ? `第${char.rebirthCount}世轮回` : '初入江湖';

        // HP bar
        const hpPct = Math.max(0, Math.min(100, Math.floor(char.hp / hpMax * 100)));
        document.getElementById('hpBar').style.width = hpPct + '%';
        document.getElementById('hpBar').className = 'hp-fill ' + (hpPct > 60 ? 'hp-high' : hpPct > 30 ? 'hp-mid' : 'hp-low');
        document.getElementById('hpText').textContent = `${char.hp} / ${hpMax}`;

        // Attributes
        const ATTR_COLOR = {
            strength: 'at-strength', agility: 'at-agility',
            constitution: 'at-constitution', innerForce: 'at-inner-force',
            comprehension: 'at-comprehension', luck: 'at-luck', reputation: 'at-reputation'
        };
        const attrsEl = document.getElementById('attributes');
        attrsEl.innerHTML = '';
        const attack = Character.getAttackPower(char, job);
        const defense = Character.getDefensePower(char, job);
        for (const key in ATTR_NAMES) {
            const val = char.attributes[key] || 0;
            const row = document.createElement('div');
            row.className = `attr-row ${ATTR_COLOR[key] || ''}`;
            row.innerHTML = `<span class="attr-name">${ATTR_NAMES[key]}</span><span class="attr-val">${val}</span>`;
            attrsEl.appendChild(row);
        }
        // Combat stats + derived stat effects
        const compRate  = Character.getComprehensionRate(char);
        const luckDodge = Character.getLuckDodgeChance(char);
        const luckCrit  = Character.getLuckTriggerChance(char);
        const combatEl = document.getElementById('combatStats');
        const atag = (cls, text) => `<span class="attr-tag ${cls}">${text}</span>`;
        const kills = char.kills || 0;
        combatEl.innerHTML =
            `<span>⚔ 攻击 ${attack}</span><span>🛡 防御 ${defense}</span>` +
            `<span>☠ 斩杀 ${kills} 人</span>` +
            `<span>📖 属性学习效率 ${compRate > 0 ? '+' : ''}${Math.round(compRate * 100)}% ${atag('at-comprehension', '悟性')}</span>` +
            `<span>💨 闪避率 ${Math.round(luckDodge * 100)}% ${atag('at-luck', '运气')}${atag('at-agility', '敏捷')}</span>` +
            `<span>✨ 会心率 ${Math.round(luckCrit * 100)}% ${atag('at-luck', '运气')}${atag('at-inner-force', '内力')}</span>`;

        // Learned skills
        const skillsEl = document.getElementById('learnedSkills');
        skillsEl.innerHTML = '';
        const skills = char.learnedSkills || [];
        if (skills.length > 0) {
            for (const sk of skills) {
                const attackBonus = (sk.bonuses && sk.bonuses.attack) || 0;
                const defenseBonus = (sk.bonuses && sk.bonuses.defense) || 0;
                let bonusText = [];
                if (attackBonus > 0) bonusText.push(`攻+${attackBonus}`);
                if (defenseBonus > 0) bonusText.push(`防+${defenseBonus}`);
                if (sk.special === 'reputation_scaling') bonusText.push('声望转攻击');
                if (sk.special === 'innerforce_scaling') bonusText.push('内力转攻击');
                const div = document.createElement('div');
                div.className = 'skill-row';
                div.title = sk.desc;
                div.innerHTML = `<span class="skill-name">${sk.name}</span>`
                    + (bonusText.length ? `<span class="skill-bonus">${bonusText.join(' ')}</span>` : '');
                skillsEl.appendChild(div);
            }
        } else {
            skillsEl.innerHTML = '<span class="muted">尚未学习任何技能</span>';
        }

        // Talents
        const talentsEl = document.getElementById('talents');
        talentsEl.innerHTML = '';
        if (char.legacyTalents.length > 0) {
            for (const tid of char.legacyTalents) {
                const talent = TALENTS.find(t => t.id === tid);
                if (talent) {
                    const span = document.createElement('span');
                    span.className = 'talent-tag';
                    span.title = talent.desc;
                    span.textContent = talent.name;
                    talentsEl.appendChild(span);
                }
            }
        } else {
            talentsEl.innerHTML = '<span class="muted">暂无传承天赋</span>';
        }

        // Passives (earned this life via max-bond)
        const passivesEl = document.getElementById('passives');
        if (passivesEl) {
            passivesEl.innerHTML = '';
            const passives = char.passives || [];
            if (passives.length > 0) {
                for (const p of passives) {
                    const span = document.createElement('span');
                    span.className = 'talent-tag passive-tag';
                    span.title = p.desc;
                    span.textContent = p.name;
                    passivesEl.appendChild(span);
                }
            } else {
                passivesEl.innerHTML = '<span class="muted">尚无被动</span>';
            }
        }
    },

    renderRelationships(char, npcs) {
        const el = document.getElementById('relationships');
        el.innerHTML = '';
        const metNPCs = NPCSystem.getMetNPCs(char, npcs);
        if (metNPCs.length === 0) {
            el.innerHTML = '<div class="muted">尚未结识江湖人士</div>';
            return;
        }
        for (const npc of metNPCs) {
            const affinity = NPCSystem.getAffinity(char, npc.id);
            const label = NPCSystem.getAffinityLabel(char, npc.id, npcs);
            // Centered bar: 0 is at 50%, range -100..+100
            const halfPct = Math.abs(affinity) / 2; // max 50%
            const isPos = affinity >= 0;
            const fillStyle = isPos
                ? `left:50%; width:${halfPct}%`
                : `right:50%; width:${halfPct}%`;
            const fillClass = isPos ? 'affinity-bar-fill pos' : 'affinity-bar-fill neg';
            const div = document.createElement('div');
            div.className = 'npc-row';
            const bondLevel = (char.bondLevels || {})[npc.id] || 0;
            const totalBondLevels = 5;
            const bondDots = Array.from({length: totalBondLevels}, (_, i) =>
                `<span class="bond-dot ${i < bondLevel ? 'bond-dot-filled' : ''}">◆</span>`
            ).join('');
            div.innerHTML = `
                <div class="npc-header">
                    <span class="npc-name">${npc.name}</span>
                    <span class="npc-title">${npc.title}</span>
                    <span class="npc-affinity-val ${isPos ? 'label-pos' : 'label-neg'}">${affinity > 0 ? '+' : ''}${affinity}</span>
                    <span class="npc-label ${isPos ? 'label-pos' : 'label-neg'}">${label}</span>
                </div>
                <div class="affinity-bar-bg">
                    <div class="affinity-center-line"></div>
                    <div class="${fillClass}" style="${fillStyle}"></div>
                </div>
                <div class="bond-level-row">羁绊 ${bondDots}</div>`;
            div.title = npc.description;
            el.appendChild(div);
        }
    },

    renderJobPanel(char, jobs) {
        const el = document.getElementById('jobPanel');
        el.innerHTML = '';
        const wudaoJobs = jobs.filter(j => j.branch === 'wudao' || j.id === 'nobody');
        for (const job of wudaoJobs) {
            const unlocked = char.unlockedJobs.includes(job.id);
            const isCurrent = char.job === job.id;
            const meetsReq = Character.meetsJobRequirements(char, job);
            const div = document.createElement('div');
            div.className = 'job-row' + (isCurrent ? ' job-current' : '') + (unlocked ? ' job-unlocked' : ' job-locked');
            const reqHtml = this.formatRequirementsWithChar(job.requirements, char);
            const flagHtml = this.formatFlagRequirementsWithChar(job.requiredFlags, char);
            div.innerHTML = `
                <div class="job-header">
                    <span class="job-name">${job.name}${isCurrent ? ' ✓' : ''}</span>
                </div>
                <div class="job-reqs">${reqHtml}${flagHtml}</div>`;
            if (!isCurrent && (unlocked || meetsReq)) {
                const btn = document.createElement('button');
                btn.className = 'btn-small';
                btn.textContent = '切换';
                btn.onclick = () => Engine.promoteJob(job.id);
                div.appendChild(btn);
            } else if (!isCurrent && !unlocked && !meetsReq) {
                const indicator = document.createElement('span');
                indicator.className = 'unlock-locked';
                indicator.textContent = '🔒';
                div.appendChild(indicator);
            }
            el.appendChild(div);
        }
    },

    formatRequirements(reqs) {
        if (!reqs || Object.keys(reqs).length === 0) return '无要求';
        return Object.entries(reqs).map(([k, v]) => `${ATTR_NAMES[k] || k}≥${v}`).join(' ');
    },

    formatRequirementsWithChar(reqs, char) {
        if (!reqs || Object.keys(reqs).length === 0) return '';
        return Object.entries(reqs).map(([k, needed]) => {
            const have = char.attributes[k] || 0;
            const met = have >= needed;
            const cls = met ? 'req-tag req-ok' : 'req-tag req-no';
            return `<span class="${cls}">${ATTR_NAMES[k] || k} ${have}/${needed} ${met ? '✓' : '✗'}</span>`;
        }).join('');
    },

    FLAG_NAMES: {
        hero_recognized: '武林认可',
        sword_legacy: '剑意传承',
        met_mysterious_elder: '结识神秘老者',
        met_wang_tie: '结识王铁',
        met_li_yunshu: '结识李云舒',
        met_ling_xue: '结识凌雪',
        met_zhao_batian: '结识赵霸天',
        elder_taught: '老者传授心法',
        wang_taught_basics: '王铁传授基础',
        tianmo_sign1: '完成「路遇奇人」',
        tianmo_sign2: '完成「探查龙脊山」',
        elder_past1: '完成「旧日画像」',
        elder_past2: '完成「故地重游」',
        chaos1: '完成「奇怪委托」',
        chaos2: '完成「追查幕后」',
        wuxiang_stele_found: '发现无相古碑',
        wuxiang_comprehending: '参悟无相剑意',
        temple_awakened: '武神庙感悟',
        has_secret_manual: '获得秘籍',
        has_rare_medicine: '持有灵药',
        jade_tablet_awakened: '玉牌异变',
        tianmo_trace_known: '追查天魔踪迹',
        shadow_cult_broken: '摧毁影堂',
        li_knows_burden: '李云舒了解你的重担',
        wang_dying_wish: '王铁临终嘱托',
        hidden_boss_beaten: '击败隐藏Boss'
    },

    formatFlagRequirementsWithChar(reqFlags, char) {
        if (!reqFlags || Object.keys(reqFlags).length === 0) return '';
        return Object.entries(reqFlags).map(([flag, needed]) => {
            const have = (char.flags[flag] || false) === needed;
            const cls = have ? 'req-tag req-ok' : 'req-tag req-no req-flag';
            const label = this.FLAG_NAMES[flag] || flag;
            return `<span class="${cls}">${label} ${have ? '✓' : '（事件）'}</span>`;
        }).join('');
    },

    formatRequirementLabel(requirements, unlocked = false) {
        if (!requirements) return '';
        const parts = [];
        if (requirements.minAttributes) {
            for (const [attr, val] of Object.entries(requirements.minAttributes)) {
                parts.push(`${ATTR_NAMES[attr] || attr}${val}`);
            }
        }
        if (requirements.minAgeYears) parts.push(`年满${requirements.minAgeYears}岁`);
        if (requirements.flags) {
            for (const [flag, val] of Object.entries(requirements.flags)) {
                const label = this.FLAG_NAMES[flag] || flag;
                if (val) parts.push(label);
            }
        }
        if (requirements.npcAffinity) {
            for (const [npcId, val] of Object.entries(requirements.npcAffinity)) {
                parts.push(`好感≥${val}`);
            }
        }
        const inner = parts.length > 0 ? parts.join('·') : '条件';
        return unlocked ? `[${inner} ✓]` : `[${inner}]`;
    },

    formatEffectPreview(effects, enemies, npcs, char, jobs) {
        if (!effects) return '';
        const parts = [];

        if (effects.combat) {
            const enemy = (enemies || []).find(e => e.id === effects.combat);
            const eName = enemy ? enemy.name : effects.combat;
            if (enemy && char && jobs) {
                const job = jobs.find(j => j.id === char.job);
                const eff = Combat.getEffectiveStats(enemy, char);
                const winPct = Combat.calcWinChance(char, enemy, job);
                const pctColor = winPct >= 70 ? '🟢' : winPct >= 40 ? '🟡' : '🔴';
                parts.push(`⚔ 与【${eName}】战斗（攻${eff.attack}/防${eff.defense}） ${pctColor}胜率${winPct}%`);
            } else {
                parts.push(`⚔ 与【${eName}】战斗`);
            }
        }

        if (effects.attributes) {
            for (const [k, v] of Object.entries(effects.attributes)) {
                if (v === 0) continue;
                const sign = v > 0 ? '+' : '';
                parts.push(`${ATTR_NAMES[k] || k} ${sign}${v}`);
            }
        }

        if (effects.hp) {
            const sign = effects.hp > 0 ? '+' : '';
            parts.push(`气血 ${sign}${effects.hp}`);
        }

        if (effects.npcAffinity) {
            for (const [npcId, v] of Object.entries(effects.npcAffinity)) {
                const npc = (npcs || []).find(n => n.id === npcId);
                const name = npc ? npc.name : npcId;
                const sign = v > 0 ? '+' : '';
                parts.push(`${name}好感 ${sign}${v}`);
            }
        }

        return parts.join('  |  ');
    },

    showEvent(event, choices, state) {
        const ageYears = Character.getAgeYears(state.char);
        const ageMonths = Character.getAgeMonthsRemainder(state.char);
        const ageStr = `${ageYears}岁${ageMonths}月`;
        const remaining = 240 - state.char.ageMonths;
        const countdownHtml = remaining > 0
            ? `<span class="log-age-countdown${remaining <= 6 ? ' urgent' : ''}">距天魔之日还剩 ${remaining} 月</span>`
            : '';

        // Add event to log
        const entry = document.createElement('div');
        entry.className = 'log-entry event-entry';
        entry.innerHTML = `<div class="log-age">${ageStr}${countdownHtml}</div>
            <div class="log-type type-${event.type}">${event.type}</div>
            <div class="log-title">${event.title}</div>
            <div class="log-text">${event.text.replace(/\n/g, '<br>')}</div>`;
        this.logEl.appendChild(entry);
        this.logEl.scrollTop = this.logEl.scrollHeight;
        this.notifyEventTab();

        // Show choices; locked ones grayed-out, unlocked ones get sequential applyChoice index
        this.choicesEl.innerHTML = '';
        if (choices && choices.length > 0) {
            let unlockIdx = 0;
            for (let i = 0; i < choices.length; i++) {
                const choice = choices[i];
                const btn = document.createElement('button');
                if (choice.locked) {
                    btn.className = 'choice-btn choice-locked';
                    btn.disabled = true;
                    const lockTag = this.formatRequirementLabel(choice.requirements, false);
                    btn.innerHTML = `<span class="choice-lock-tag">${lockTag}</span><span class="choice-text">${choice.text}</span>`;
                } else {
                    const idx = unlockIdx++;
                    const preview = this.formatEffectPreview(choice.effects, state.enemies, state.npcs, state.char, state.jobs);
                    const unlockTag = choice.requirements
                        ? `<span class="choice-unlock-tag">${this.formatRequirementLabel(choice.requirements, true)}</span>`
                        : '';
                    btn.className = 'choice-btn';
                    btn.innerHTML = unlockTag
                        + `<span class="choice-text">${choice.text}</span>`
                        + (preview ? `<span class="choice-effects">${preview}</span>` : '');
                    btn.onclick = () => {
                        this.choicesEl.innerHTML = '';
                        this.nextBtn.disabled = false;
                        Engine.applyChoice(idx);
                    };
                }
                this.choicesEl.appendChild(btn);
            }
            this.nextBtn.disabled = true;
        }
    },

    addLog(text, type) {
        const div = document.createElement('div');
        div.className = `log-entry log-${type}`;
        div.innerHTML = text.replace(/\n/g, '<br>');
        this.logEl.appendChild(div);
        this.logEl.scrollTop = this.logEl.scrollHeight;
        this.notifyEventTab();
        this.logBuffer.push({ text, type });
        if (this.logBuffer.length > 30) this.logBuffer.shift();
    },

    getLogBuffer() { return this.logBuffer; },

    restoreLog(entries) {
        if (!entries || !entries.length) return;
        const sep = document.createElement('div');
        sep.className = 'log-entry log-system';
        sep.textContent = '── 上次存档 ──';
        this.logEl.appendChild(sep);
        for (const { text, type } of entries) {
            const div = document.createElement('div');
            div.className = `log-entry log-${type}`;
            div.innerHTML = text.replace(/\n/g, '<br>');
            this.logEl.appendChild(div);
        }
        this.logEl.scrollTop = this.logEl.scrollHeight;
        this.logBuffer = [...entries];
    },

    addCombatSummary({ turns, dmgDealt, dmgReceived, result, rewards }) {
        const resultLabel = result === 'won'  ? '<span style="color:#6fcf97">⚔ 战斗胜利</span>'
                          : result === 'lost' ? '<span style="color:#e05050">💀 战斗落败</span>'
                          :                    '<span style="color:#aaa">💨 成功逃脱</span>';
        const rewardLine = rewards
            ? `<div class="csumm-row"><span class="csumm-label">🏆 获得奖励</span><span class="csumm-val" style="color:#c9a84c">${rewards}</span></div>`
            : '';
        const div = document.createElement('div');
        div.className = 'combat-summary';
        div.innerHTML = `
            <div class="csumm-title">${resultLabel} &nbsp;·&nbsp; 共 ${turns} 回合</div>
            <div class="csumm-row"><span class="csumm-label">⚔ 造成伤害</span><span class="csumm-val">${dmgDealt}</span></div>
            <div class="csumm-row"><span class="csumm-label">🩸 承受伤害</span><span class="csumm-val">${dmgReceived}</span></div>
            ${rewardLine}`;
        this.logEl.appendChild(div);
        this.logEl.scrollTop = this.logEl.scrollHeight;
        this.notifyEventTab();
    },

    clearLog() {
        this.logEl.innerHTML = '';
        this.choicesEl.innerHTML = '';
        this.logBuffer = [];
    },

    // ── Combat overlay ──────────────────────────────────────────
    showCombatOverlay(state) {
        const { char, combatState: cs } = state;
        const job = state.jobs.find(j => j.id === char.job);
        const atk = Character.getAttackPower(char, job);
        const def = Character.getDefensePower(char, job);
        document.getElementById('combatEnemyName').textContent  = cs.enemy.name;
        document.getElementById('combatEnemyStats').textContent = `攻 ${cs.enemyEffAtk}  防 ${cs.enemyEffDef}`;
        document.getElementById('combatPlayerName').textContent = char.name;
        document.getElementById('combatPlayerStats').textContent = `攻 ${atk}  防 ${def}`;
        document.getElementById('combatLog').innerHTML = '';
        document.getElementById('combatIntentHint').textContent = '';
        document.getElementById('combatSkillReady').style.display = 'none';
        document.getElementById('combatMomentumFill').style.width = '0%';
        document.getElementById('combatMomentumVal').textContent = '0';
        this.setCombatActionsEnabled(true);
        this.setCombatAutoButton(false);
        if (cs.noFlee) {
            const fleeBtn = document.getElementById('combatFleeBtn');
            fleeBtn.disabled = true;
            fleeBtn.textContent = '🔒 无法逃跑';
        }
        this.updateCombatOverlay(state);
        document.getElementById('combatOverlay').classList.add('visible');
        if (window.innerWidth <= 768) this.switchTab('event');
    },

    updateCombatOverlay(state) {
        const { char, combatState: cs } = state;
        if (!cs) return;
        const job  = state.jobs.find(j => j.id === char.job);
        const hpMax = Character.getHPMax(char, job);

        // Enemy HP bar
        const ePct = Math.max(0, Math.round(cs.enemyHp / cs.enemyMaxHp * 100));
        document.getElementById('combatEnemyHpText').textContent = `${Math.max(0, cs.enemyHp)} / ${cs.enemyMaxHp}`;
        const eBar = document.getElementById('combatEnemyHpBar');
        eBar.style.width = ePct + '%';
        eBar.className = 'hp-fill ' + (ePct > 50 ? 'hp-high' : ePct > 25 ? 'hp-mid' : 'hp-low');

        // Player HP bar
        const pPct = Math.max(0, Math.round(char.hp / hpMax * 100));
        document.getElementById('combatPlayerHpText').textContent = `${Math.max(0, char.hp)} / ${hpMax}`;
        const pBar = document.getElementById('combatPlayerHpBar');
        pBar.style.width = pPct + '%';
        pBar.className = 'hp-fill ' + (pPct > 50 ? 'hp-high' : pPct > 25 ? 'hp-mid' : 'hp-low');

        // Momentum bar
        const mom = cs.playerMomentum || 0;
        document.getElementById('combatMomentumVal').textContent = mom;
        document.getElementById('combatMomentumFill').style.width = (mom / 5 * 100) + '%';
        const activeSkill = job && job.activeSkill;
        const skillReady = activeSkill && mom >= activeSkill.momentumCost && cs.skillCooldown === 0;
        const skillEl = document.getElementById('combatSkillReady');
        if (activeSkill) {
            skillEl.style.display = skillReady ? '' : 'none';
            skillEl.innerHTML = skillReady
                ? `⚡ 「${activeSkill.name}」蓄势完成，下回合自动发动！`
                : '';
        } else {
            skillEl.style.display = 'none';
        }

        // Enemy intent hint (accuracy gated by comprehension)
        const intentEl = document.getElementById('combatIntentHint');
        if (cs.enemyIntentHint) {
            if (cs.enemyIntentType === 'perfect') {
                intentEl.innerHTML = `<span class="intent-read">🔮 ${cs.enemyIntentHint}</span><span class="intent-perfect-label">【无相剑意】</span>`;
            } else {
                const comp = char.attributes.comprehension || 0;
                const eComp = cs.enemyComp || 0;
                const ratio = comp / (eComp + 5);
                const accuratePct = Math.round(Math.min(90, Math.pow(ratio, 1.5) * 90));
                if (cs.enemyIntentType === 'vague') {
                    intentEl.innerHTML = `<span class="intent-vague">❓ ${cs.enemyIntentHint}</span><span class="intent-comp-label">（悟性${comp}，洞察${accuratePct}%）</span>`;
                } else {
                    intentEl.innerHTML = `<span class="intent-read">🔮 ${cs.enemyIntentHint}</span><span class="intent-comp-label">（悟性${comp}，洞察${accuratePct}%）</span>`;
                }
            }
        } else {
            intentEl.innerHTML = '';
        }

        // Combat log (last 5 entries)
        const logEl = document.getElementById('combatLog');
        logEl.innerHTML = cs.log.slice(-5).map(e => {
            const badge = e.turn === 0
                ? `<span class="combat-turn-badge combat-turn-open">⚔ 开战</span>`
                : `<span class="combat-turn-badge">第${e.turn}回合</span>`;
            return `<div class="combat-log-entry">${badge}${e.text}</div>`;
        }).join('');
        logEl.scrollTop = logEl.scrollHeight;

        // Flee button text
        const fleeBtn = document.getElementById('combatFleeBtn');
        if (cs.noFlee) {
            fleeBtn.disabled = true;
            fleeBtn.textContent = '🔒 无法逃跑';
        } else {
            fleeBtn.textContent = `� 逃跑 ${Math.round(cs.fleeChance * 100)}%`;
        }
    },

    hideCombatOverlay() {
        document.getElementById('combatOverlay').classList.remove('visible');
    },

    showCombatReturnBtn(callback) {
        const actionsEl = document.getElementById('combatActions');
        actionsEl.innerHTML = '';
        const btn = document.createElement('button');
        btn.className = 'combat-btn combat-return-btn';
        btn.textContent = '📋 点击返回';
        btn.onclick = callback;
        actionsEl.appendChild(btn);
    },

    setCombatActionsEnabled(enabled) {
        document.querySelectorAll('.combat-btn').forEach(btn => {
            btn.disabled = !enabled;
        });
    },

    setCombatAutoButton(isOn) {
        // no-op: auto-combat replaced by quick combat button
        void isOn;
    },
    // ─────────────────────────────────────────────────────────────

    updateControls(state) {
        const busy = state.gamePhase !== 'idle';
        this.nextBtn.disabled = busy;
        this.nextBtn.textContent = (state.char && state.char.injured) ? '静心修养 ▶' : '出门探险 ▶';
        this.autoBtn.disabled = (state.gamePhase === 'game_over' || state.gamePhase === 'rebirth' || state.gamePhase === 'victory');

        // Show visit button only when idle and visits are available
        const visits = state.gamePhase === 'idle' ? Engine.getAvailableVisits() : [];
        this.visitBtn.style.display = visits.length > 0 ? '' : 'none';
        if (visits.length === 0 && this.visitPanel) this.visitPanel.style.display = 'none';

        // Show chain button if any chain has a pending step (met or locked)
        const chainSteps = state.gamePhase === 'idle' ? Engine.getAllPendingChainSteps() : [];
        if (this.chainBtn) {
            this.chainBtn.style.display = chainSteps.length > 0 ? '' : 'none';
            if (chainSteps.length === 0 && this.chainPanel) this.chainPanel.style.display = 'none';
        }
    },

    toggleChainPanel() {
        const panel = this.chainPanel;
        if (!panel) return;
        if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
        const steps = Engine.getAllPendingChainSteps();
        if (steps.length === 0) return;
        panel.innerHTML = steps.map(({ chain, step, stepIdx, conditionsMet, lockedReasons, enemyInfo }) => {
            const bossTag = enemyInfo ? `<span class="chain-boss-tag">⚔ 含战斗</span>` : '';
            const enemyStats = enemyInfo
                ? `<span class="chain-enemy-stats">敌方「${enemyInfo.name}」攻击 ${enemyInfo.attack}　防御 ${enemyInfo.defense}　气血 ${enemyInfo.hp}</span>`
                : '';
            if (!conditionsMet) {
                const lockHtml = lockedReasons.map(r => `<span class="chain-lock-reason">⌛ ${r}</span>`).join('');
                return `<div class="chain-step-btn chain-step-locked">
                    <span class="chain-name">${chain.name}</span>
                    <span class="chain-step-title">${step.title}</span>
                    <div class="chain-lock-reasons">${lockHtml}</div>
                    ${enemyStats}
                </div>`;
            }
            return `<button class="chain-step-btn" onclick="Engine.triggerChainStep('${chain.id}', ${stepIdx}); UI.chainPanel.style.display='none'">
                <span class="chain-name">${chain.name}</span>
                <span class="chain-step-title">${step.title}</span>
                ${bossTag}
                ${enemyStats}
                <span class="chain-desc">${chain.desc}</span>
            </button>`;
        }).join('');
        panel.style.display = 'block';
    },

    toggleVisitPanel() {
        const panel = this.visitPanel;
        if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
        const visits = Engine.getAvailableVisits();
        if (visits.length === 0) return;
        const char = Engine.state.char;
        const ageYear = char ? Character.getAgeYears(char) : 0;
        panel.innerHTML = visits.map(v => {
            const infoText = v.bondReady
                ? `💞 第${v.bondEvent.level}章「${v.bondEvent.title}」可触发`
                : v.bondEvent
                    ? `好感 ${v.affinity}／${v.bondEvent.minAffinity}（差 ${v.bondEvent.minAffinity - v.affinity}）`
                    : `羁绊圆满  好感 ${v.affinity}`;
            const cls = v.bondReady ? 'visit-npc-btn visit-bond-ready' : 'visit-npc-btn';
            let visitNote = '';
            if (!v.bondReady && char) {
                const vc = (char.visitCounts || {})[v.npcId] || { year: -1, count: 0 };
                const used = vc.year === ageYear ? vc.count : 0;
                const remaining = 2 - used;
                visitNote = remaining > 0
                    ? `<span class="visit-remain">今年还可拜访 ${remaining} 次</span>`
                    : `<span class="visit-remain visit-remain-out">今年已达上限</span>`;
            }
            return `<button class="${cls}" onclick="Engine.visitNPC('${v.npcId}'); UI.visitPanel.style.display='none'">
                <span class="visit-npc-name">${v.npc.name}</span>
                <span class="visit-npc-info">${infoText}</span>
                ${visitNote}
            </button>`;
        }).join('');
        panel.style.display = 'block';
    },

    setAutoButton(isOn) {
        this.autoBtn.textContent = isOn ? '⏸ 暂停' : '▶ 自动';
        this.autoBtn.classList.toggle('btn-active', isOn);
    },

    showRebirthScreen(summary, availableTalents, cause) {
        this.choicesEl.innerHTML = '';
        this.nextBtn.disabled = true;
        this.autoBtn.disabled = true;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const causeText = cause === 'boss' ? '败于天魔' : cause === 'hidden_boss' ? '功亏一篑，败于剑魂' : '力战身陨';
        const rebirthNarrative = cause === 'boss'
            ? '天魔最后一击将你轰飞，血气殆尽，意识正在消散……就在这一刻，胸口的家传双鱼玉佩骤然亮起，白光如潮水般涌出，将四周的黑暗尽数淹没。时光在那道光里倒流——你感到自己被卷入一道无形的漩涡，前世的山河与记忆化为点点星光，没入眉心。'
            : cause === 'hidden_boss'
            ? '剑魂的虚空剑意贯穿了你最后的防线，你轰然倒下……恍惚中，胸口的双鱼玉佩剧烈震动，白光骤起，将那道凌厉的剑意硬生生格在了门外。时光开始回溯，碎裂的剑影在光中缓缓复原——你知道，这不是结束。'
            : '你在江湖的厮杀中倒下，鲜血浸透衣衫。正当一切归于黑暗之际，胸口的双鱼玉佩忽然震动，柔和的白光将你从那个瞬间带离——山河依旧，而你，将重新踏上这条路。';
        modal.innerHTML = `
            <div class="modal-box">
                <h2>✦ 轮回 ✦</h2>
                <div class="modal-cause">${causeText}</div>
                <div class="rebirth-narrative">${rebirthNarrative}</div>
                <pre class="modal-summary">${summary}</pre>
                <div class="modal-section">
                    <div class="modal-label">本世将继承 <strong>10%</strong> 属性进入下一世</div>
                </div>
                ${availableTalents.length > 0 ? `
                <div class="modal-section">
                    <div class="modal-label">解锁了新的传承天赋（最多选2个）：</div>
                    <div id="talentChoices" class="talent-choices"></div>
                </div>` : ''}
                <button id="rebirthConfirmBtn" class="btn-confirm">踏入轮回</button>
            </div>`;
        document.body.appendChild(modal);

        const selected = new Set();
        if (availableTalents.length > 0) {
            const choicesDiv = modal.querySelector('#talentChoices');
            for (const talent of availableTalents) {
                const btn = document.createElement('button');
                btn.className = 'talent-choice-btn';
                btn.innerHTML = `<strong>${talent.name}</strong><br><small>${talent.desc}</small>`;
                btn.onclick = () => {
                    if (selected.has(talent.id)) {
                        selected.delete(talent.id);
                        btn.classList.remove('selected');
                    } else if (selected.size < 2) {
                        selected.add(talent.id);
                        btn.classList.add('selected');
                    }
                };
                choicesDiv.appendChild(btn);
            }
        }

        modal.querySelector('#rebirthConfirmBtn').onclick = () => {
            document.body.removeChild(modal);
            this.nextBtn.disabled = false;
            Engine.executeRebirth([...selected]);
        };
    },

    showVictoryScreen(char, isTrueEnding) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const title = isTrueEnding ? '✦ 真·天下太平 ✦' : '✦ 天下太平 ✦';
        const body = isTrueEnding
            ? `<p>天魔已倒，剑魂亦散。</p>
               <p>你是这个时代真正的强者。</p>
               <p>那枚玉牌最终化为流光，没入你的眉心。老者在另一个地方，或许微微一笑。</p>
               <p>【${char.name}】的传奇，将永远流传于世。</p>`
            : `<p>你击败了天魔，还江湖以清明。</p>
               <p>【${char.name}】的传奇将永远流传于世。</p>`;
        modal.innerHTML = `
            <div class="modal-box">
                <h2>${title}</h2>
                ${body}
                <p class="muted">轮回 ${char.rebirthCount} 次 | 享年 ${Character.getAgeYears(char)} 岁</p>
                <button id="victoryRebirthBtn" class="btn-confirm" style="margin-right:12px">继续轮回</button>
                <button id="newGameBtn" class="btn-secondary">重新开始</button>
            </div>`;
        document.body.appendChild(modal);
        modal.querySelector('#victoryRebirthBtn').onclick = () => {
            document.body.removeChild(modal);
            const avail = Rebirth.getAvailableTalents(char);
            const summary = Rebirth.getSummaryText(char, Engine.state.jobs, Engine.state.bonds, Engine.state.npcs);
            this.showRebirthScreen(summary, avail, 'victory');
        };
        modal.querySelector('#newGameBtn').onclick = () => {
            document.body.removeChild(modal);
            Engine.deleteSave();
            location.reload();
        };
    }
};
