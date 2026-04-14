// ui.js - UI rendering and DOM management

const ATTR_NAMES = {
    strength: '力量', agility: '敏捷', constitution: '体质',
    innerForce: '内力', comprehension: '悟性', luck: '运气', reputation: '声望'
};

const UI = {
    init() {
        this.logEl = document.getElementById('eventLog');
        this.choicesEl = document.getElementById('choicesPanel');
        this.nextBtn = document.getElementById('nextMonthBtn');
        this.autoBtn = document.getElementById('autoAdvanceBtn');
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
        const maxYears = Math.floor(char.maxAgeMonths / 12);

        document.getElementById('charName').textContent = char.name;
        document.getElementById('charAge').textContent = `${ageYears}岁${ageMonths > 0 ? ageMonths + '月' : ''} / 寿元${maxYears}年`;
        document.getElementById('charJob').textContent = job ? job.name : '无名小卒';
        document.getElementById('charRebirth').textContent = char.rebirthCount > 0 ? `第${char.rebirthCount}世轮回` : '初入江湖';

        // HP bar
        const hpPct = Math.max(0, Math.min(100, Math.floor(char.hp / hpMax * 100)));
        document.getElementById('hpBar').style.width = hpPct + '%';
        document.getElementById('hpBar').className = 'hp-fill ' + (hpPct > 60 ? 'hp-high' : hpPct > 30 ? 'hp-mid' : 'hp-low');
        document.getElementById('hpText').textContent = `${char.hp} / ${hpMax}`;

        // Attributes
        const attrsEl = document.getElementById('attributes');
        attrsEl.innerHTML = '';
        const attack = Character.getAttackPower(char, job);
        const defense = Character.getDefensePower(char, job);
        for (const key in ATTR_NAMES) {
            const val = char.attributes[key] || 0;
            const row = document.createElement('div');
            row.className = 'attr-row';
            row.innerHTML = `<span class="attr-name">${ATTR_NAMES[key]}</span><span class="attr-val">${val}</span>`;
            attrsEl.appendChild(row);
        }
        // Combat stats
        const combatEl = document.getElementById('combatStats');
        combatEl.innerHTML = `<span>⚔ 攻击 ${attack}</span><span>🛡 防御 ${defense}</span>`;

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
            const pct = affinity;
            const div = document.createElement('div');
            div.className = 'npc-row';
            div.innerHTML = `
                <div class="npc-header">
                    <span class="npc-name">${npc.name}</span>
                    <span class="npc-title">${npc.title}</span>
                    <span class="npc-label">${label}</span>
                </div>
                <div class="affinity-bar-bg">
                    <div class="affinity-bar-fill" style="width:${pct}%"></div>
                </div>`;
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
            const reqText = this.formatRequirements(job.requirements);
            div.innerHTML = `
                <div class="job-name">${job.name}${isCurrent ? ' ✓' : ''}</div>
                <div class="job-req muted">${reqText}</div>`;
            if (unlocked && !isCurrent) {
                const btn = document.createElement('button');
                btn.className = 'btn-small';
                btn.textContent = '切换';
                btn.onclick = () => Engine.promoteJob(job.id);
                div.appendChild(btn);
            } else if (!unlocked) {
                const indicator = document.createElement('span');
                indicator.className = meetsReq ? 'unlock-ready' : 'unlock-locked';
                indicator.textContent = meetsReq ? '可解锁' : '🔒';
                div.appendChild(indicator);
            }
            el.appendChild(div);
        }
    },

    formatRequirements(reqs) {
        if (!reqs || Object.keys(reqs).length === 0) return '无要求';
        return Object.entries(reqs).map(([k, v]) => `${ATTR_NAMES[k] || k}≥${v}`).join(' ');
    },

    formatEffectPreview(effects, enemies, npcs) {
        if (!effects) return '';
        const parts = [];

        if (effects.combat) {
            const enemy = (enemies || []).find(e => e.id === effects.combat);
            parts.push(`⚔ 与【${enemy ? enemy.name : effects.combat}】战斗`);
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
        const ageStr = `${ageYears}岁${ageMonths > 0 ? ageMonths + '月' : ''}`;

        // Add event to log
        const entry = document.createElement('div');
        entry.className = 'log-entry event-entry';
        entry.innerHTML = `<div class="log-age">${ageStr}</div>
            <div class="log-type type-${event.type}">${event.type}</div>
            <div class="log-title">${event.title}</div>
            <div class="log-text">${event.text.replace(/\n/g, '<br>')}</div>`;
        this.logEl.appendChild(entry);
        this.logEl.scrollTop = this.logEl.scrollHeight;

        // Show choices with effect previews
        this.choicesEl.innerHTML = '';
        if (choices && choices.length > 0) {
            for (let i = 0; i < choices.length; i++) {
                const choice = choices[i];
                const preview = this.formatEffectPreview(choice.effects, state.enemies, state.npcs);
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.innerHTML = `<span class="choice-text">${choice.text}</span>`
                    + (preview ? `<span class="choice-effects">${preview}</span>` : '');
                btn.onclick = () => {
                    this.choicesEl.innerHTML = '';
                    this.nextBtn.disabled = false;
                    Engine.applyChoice(i);
                };
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
    },

    clearLog() {
        this.logEl.innerHTML = '';
        this.choicesEl.innerHTML = '';
    },

    updateControls(state) {
        const busy = state.gamePhase !== 'idle';
        this.nextBtn.disabled = busy;
        this.autoBtn.disabled = (state.gamePhase === 'game_over' || state.gamePhase === 'rebirth' || state.gamePhase === 'victory');
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
        const causeText = cause === 'age' ? '寿终正寝' : cause === 'boss' ? '败于天魔' : '力战身陨';
        modal.innerHTML = `
            <div class="modal-box">
                <h2>✦ 轮回 ✦</h2>
                <div class="modal-cause">${causeText}</div>
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

    showVictoryScreen(char) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-box">
                <h2>✦ 天下太平 ✦</h2>
                <p>你击败了天魔，还江湖以清明。</p>
                <p>【${char.name}】的传奇将永远流传于世。</p>
                <p class="muted">轮回 ${char.rebirthCount} 次 | 享年 ${Character.getAgeYears(char)} 岁</p>
                <button id="victoryRebirthBtn" class="btn-confirm" style="margin-right:12px">继续轮回</button>
                <button id="newGameBtn" class="btn-secondary">重新开始</button>
            </div>`;
        document.body.appendChild(modal);
        modal.querySelector('#victoryRebirthBtn').onclick = () => {
            document.body.removeChild(modal);
            const avail = Rebirth.getAvailableTalents(char);
            const summary = Rebirth.getSummaryText(char);
            this.showRebirthScreen(summary, avail, 'victory');
        };
        modal.querySelector('#newGameBtn').onclick = () => {
            document.body.removeChild(modal);
            Engine.deleteSave();
            location.reload();
        };
    }
};
