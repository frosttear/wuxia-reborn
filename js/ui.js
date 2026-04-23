// ui.js - UI rendering and DOM management

// Shows LQ JPG immediately, loads HQ PNG in background, crossfades on swap.
// Falls back to HQ directly when no low/ version exists.
// fallbackSrc: shown on total failure; null hides the element.
function loadProgressiveImg(img, hqSrc, fallbackSrc) {
    const lowSrc = hqSrc.replace(/(assets\/[^/]+\/)([^/]+)\.\w+$/, '$1low/$2.jpg');
    const onError = fallbackSrc
        ? () => { img.src = fallbackSrc; img.classList.remove('img-lq'); img.onerror = null; }
        : () => { img.style.display = 'none'; };
    const lqProbe = new Image();
    lqProbe.onload = () => {
        img.src = lowSrc;
        img.classList.add('img-lq');
        const hqProbe = new Image();
        hqProbe.onload = () => { img.src = hqSrc; img.classList.remove('img-lq'); };
        hqProbe.onerror = onError;
        hqProbe.src = hqSrc;
    };
    lqProbe.onerror = () => {
        img.src = hqSrc;
        img.onerror = onError;
    };
    lqProbe.src = lowSrc;
}

const ATTR_NAMES = {
    strength: '力量', agility: '敏捷', constitution: '体质',
    innerForce: '内力', comprehension: '悟性', luck: '运气', reputation: '声望'
};

const UI = {
    showPlayerLightbox() {
        const lb = document.getElementById('avatarLightbox');
        loadProgressiveImg(document.getElementById('avatarLightboxImg'), 'assets/characters/player.png', null);

        const { char, jobs } = Engine.state;
        const job = (jobs || []).find(j => j.id === char.job);
        const hpMax = Character.getHPMax(char, job);
        const hpPct = Math.max(0, Math.min(100, Math.round(char.hp / hpMax * 100)));
        const age = Character.getAgeYears(char);
        const ageMonths = Character.getAgeMonthsRemainder(char);
        const rebirthText = char.rebirthCount > 0 ? `第 ${char.rebirthCount + 1} 周目` : '初入江湖';

        const ATTR_ICONS = { strength:'力', agility:'敏', constitution:'体', innerForce:'内', comprehension:'悟', luck:'运', reputation:'声' };
        const attrsHtml = Object.entries(ATTR_ICONS).map(([k, label]) =>
            `<span class="lb-attr-chip"><b>${label}</b>${char.attributes[k] || 0}</span>`
        ).join('');

        const passives = (char.passives || []).map(p =>
            `<div class="lb-passive active"><b>${p.name}</b>：${p.desc}</div>`
        ).join('');

        const talents = (char.talents || []).map(t =>
            `<span class="lb-talent-chip">${t.name}</span>`
        ).join('');

        document.getElementById('avatarLightboxInfo').innerHTML = `
            <div class="lb-name">${char.name}</div>
            <div class="lb-title">${job ? job.name : '无名小卒'} · ${age} 岁 ${ageMonths} 月 · ${rebirthText}</div>
            <div class="lb-hp-row">
                <span class="lb-hp-label">气血</span>
                <div class="lb-hp-bar-bg"><div class="lb-hp-bar-fill" style="width:${hpPct}%"></div></div>
                <span class="lb-hp-val">${char.hp}/${hpMax}</span>
            </div>
            <div class="lb-attrs">${attrsHtml}</div>
            ${talents ? `<div class="lb-section-label">天赋</div><div class="lb-talents">${talents}</div>` : ''}
            ${passives ? `<div class="lb-section-label">羁绊被动</div>${passives}` : ''}`;

        lb.classList.add('active');
    },

    showAvatarLightbox(src, npcId) {
        const lb = document.getElementById('avatarLightbox');
        loadProgressiveImg(document.getElementById('avatarLightboxImg'), src, null);

        const npcs = Engine.state.npcs || [];
        const bonds = Engine.state.bonds || {};
        const char = Engine.state.char || {};
        const npc = npcs.find(n => n.id === npcId);
        const name = npc ? npc.name : npcId;
        const title = npc ? npc.title : '';
        const desc = npc ? npc.description : '';
        const bondLevel = (char.bondLevels || {})[npcId] || 0;
        const affinity = NPCSystem.getAffinity(char, npcId);
        const label = npc ? NPCSystem.getAffinityLabel(char, npcId, npcs) : '';

        const npcBonds = bonds[npcId] || [];
        const passive = npcBonds.find(b => b.passive)?.passive;
        const passiveActivated = (char.passives || []).some(p => p.id === (passive && passive.id));

        let passiveHtml = '';
        if (passive) {
            const cls = passiveActivated ? 'lb-passive active' : 'lb-passive inactive';
            const statusText = passiveActivated ? '' : '（未激活）';
            passiveHtml = `<div class="${cls}"><b>${passive.name}</b>：${passive.desc} ${statusText}</div>`;
        }

        const totalBondLevels = 5;
        const bondDots = Array.from({length: totalBondLevels}, (_, i) =>
            `<span class="bond-dot ${i < bondLevel ? 'bond-dot-filled' : ''}">◆</span>`
        ).join('');

        document.getElementById('avatarLightboxInfo').innerHTML = `
            <div class="lb-name">${name}</div>
            <div class="lb-title">${title}</div>
            <div class="lb-desc">${desc}</div>
            <div class="lb-bond-row">羁绊 ${bondDots} <span class="lb-affinity">${label} (${affinity})</span></div>
            ${passiveHtml}`;

        lb.classList.add('active');
    },

    init() {
        this.logEl   = document.getElementById('eventLog');
        this.choicesEl = document.getElementById('choicesPanel');
        this.nextBtn   = document.getElementById('nextMonthBtn');
        this.visitBtn  = document.getElementById('visitBtn');
        this.visitPanel = document.getElementById('visitPanel');
        this.chainBtn  = document.getElementById('chainBtn');
        this.chainPanel = document.getElementById('chainPanel');
        this.logBuffer = [];
        this._preloadAvatars();
        // Force player avatar through SW so version bumps always serve fresh image
        const playerAvatar = document.querySelector('.player-avatar');
        if (playerAvatar) loadProgressiveImg(playerAvatar, 'assets/characters/player.png', null);
        if (typeof Gallery !== 'undefined') Gallery.init();
    },

    _preloadAvatars() {
        this._imgCache = [];
        const preload = src => { const img = new Image(); img.src = src; this._imgCache.push(img); };

        // Player portrait: LQ immediately, HQ right after
        preload('assets/characters/low/player.jpg');
        preload('assets/characters/player.png');

        // NPC LQ portraits immediately (small files, visible on game screen)
        ['li-yunshu', 'wang-tie', 'mysterious-elder', 'yan-chixing', 'ling-xue', 'su-qing']
            .forEach(id => preload(`assets/characters/low/${id}.jpg`));

        // NPC HQ portraits deferred so they don't compete with critical resources
        setTimeout(() => {
            ['li-yunshu', 'wang-tie', 'mysterious-elder', 'yan-chixing', 'ling-xue', 'su-qing']
                .forEach(id => preload(`assets/characters/${id}.png`));
        }, 3000);

        setTimeout(() => {
            ['li-yunshu-ending', 'wang-tie-ending', 'mysterious-elder-ending',
             'yan-chixing-ending', 'su-qing-ending', 'ling-xue-ending',
             'sword-soul-win', 'sword-soul-lose', 'tianmo-win', 'tianmo-lose',
             'rebirth', 'wuxiang-unlock']
                .forEach(id => preload(`assets/illustrations/${id}.png`));
        }, 8000);
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
        document.getElementById('charRebirth').textContent = char.rebirthCount > 0 ? `${char.rebirthCount + 1}周目` : '初入江湖';

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
        const luckDodge = Character.getLuckDodgeChance(char);
        const luckCrit  = Character.getLuckTriggerChance(char);
        const qiShield  = Character.getQiShield(char);
        const skillAmp  = Character.getSkillAmplify(char);
        const combatEl = document.getElementById('combatStats');
        const atag = (cls, text) => `<span class="attr-tag ${cls}">${text}</span>`;
        const kills = char.kills || 0;
        combatEl.innerHTML =
            `<span>⚔ 攻击 ${attack}</span><span>🛡 防御 ${defense}</span>` +
            `<span>🏆 战胜 ${kills} 次</span>` +
            (qiShield > 0 ? `<span>🔮 气盾 -${qiShield} ${atag('at-inner-force', '内力')}</span>` : '') +
            (skillAmp >= 0.10 ? `<span>💠 内力增幅 +${Math.round(skillAmp * 100)}% ${atag('at-inner-force', '内力')}</span>` : '') +
            `<span> 闪避率 ${Math.round(luckDodge * 100)}% ${atag('at-luck', '运气')}${atag('at-agility', '敏捷')}</span>` +
            `<span>✨ 会心率 ${Math.round(luckCrit * 100)}% ${atag('at-luck', '运气')}</span>`;

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
                if (sk.special === 'reputation_scaling') {
                    const repBonus = Math.floor(char.attributes.reputation / 10) * 1.5;
                    bonusText.push(`声望转攻击+${repBonus.toFixed(1)}`);
                }
                if (sk.special === 'innerforce_scaling') {
                    const ifBonus = Math.floor(char.attributes.innerForce / 10) * 2.5;
                    bonusText.push(`内力转攻击+${ifBonus.toFixed(1)}`);
                }
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
                    span.textContent = `${talent.name}：${talent.desc}`;
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
                    span.innerHTML = `<b>${p.name}</b>：${p.desc}`;
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
            // Simple 0-100 bar starting from left
            const pct = Math.min(100, Math.max(0, affinity));
            const fillStyle = `left:0; width:${pct}%`;
            const fillClass = 'affinity-bar-fill pos';
            const div = document.createElement('div');
            div.className = 'npc-row';
            const bondLevel = (char.bondLevels || {})[npc.id] || 0;
            const totalBondLevels = 5;
            const bondDots = Array.from({length: totalBondLevels}, (_, i) =>
                `<span class="bond-dot ${i < bondLevel ? 'bond-dot-filled' : ''}">◆</span>`
            ).join('');
            const avatarFile = npc.id.replace(/_/g, '-');
            const avatarHqSrc = `assets/characters/${avatarFile}.png`;
            div.innerHTML = `
                <img class="npc-avatar" data-prog="${avatarHqSrc}" alt="${npc.name}" decoding="async" onclick="UI.showAvatarLightbox(this.dataset.prog,'${npc.id}')">
                <div class="npc-info">
                    <div class="npc-header">
                        <span class="npc-name">${npc.name}</span>
                        <span class="npc-title">${npc.title}</span>
                        <span class="npc-affinity-val label-pos">${affinity}</span>
                        <span class="npc-label label-pos">${label}</span>
                    </div>
                    <div class="affinity-bar-bg">
                        <div class="${fillClass}" style="${fillStyle}"></div>
                    </div>
                    <div class="bond-level-row">羁绊 ${bondDots}</div>
                </div>`;
            div.title = npc.description;
            loadProgressiveImg(div.querySelector('.npc-avatar'), avatarHqSrc, null);
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
                const indicator = document.createElement('span');
                indicator.className = 'unlock-ready';
                indicator.textContent = '✓ 已解锁';
                div.appendChild(indicator);
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
        elder_taught: '老者传授心法',
        wang_taught_basics: '王铁传授基础',
        tianmo_sign1: '完成「路遇奇人」',
        tianmo_sign2: '完成「探查龙脊山」',
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
        wang_dying_wish: '王铁遗愿（羁绊Lv5）',
        hidden_boss_beaten: '击败隐藏Boss',
        sword_tomb_found: '发现古剑冢',
        sword_master_met: '拜访老剑师',
        sword_trial_passed: '通过剑道试炼',
        hero_relief: '义救灾民',
        hero_tyrant_defeated: '击败铁面判官',
        zhao_traced: '追踪赵霸天',
        zhao_defeated_for_wang: '击败赵霸天',
        wang_wish_fulfilled: '告慰王铁英灵'
    },

    formatFlagRequirementsWithChar(reqFlags, char) {
        if (!reqFlags || Object.keys(reqFlags).length === 0) return '';
        return Object.entries(reqFlags).map(([flag, needed]) => {
            const have = (char.flags[flag] || false) === needed;
            const cls = have ? 'req-tag req-ok' : 'req-tag req-no req-flag';
            const label = this.FLAG_NAMES[flag] || flag;
            return `<span class="${cls}">${label} ${have ? '✓' : '（任务）'}</span>`;
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
                parts.push(`⚔ 与【${eName}】战斗（攻${eff.attack}/防${eff.defense}/血${eff.hp}） ${pctColor}胜率${winPct}%`);
                const winEffects = enemy.winEffects || {};
                const rewardParts = Object.entries(winEffects)
                    .filter(([, v]) => v !== 0)
                    .map(([k, v]) => `${ATTR_NAMES[k] || k}${v > 0 ? '+' : ''}${v}`);
                if (rewardParts.length > 0) parts.push(`🏆 胜利奖励：${rewardParts.join(' ')}`);
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

    addVisitAgeHeader(char) {
        const ageYears = Character.getAgeYears(char);
        const ageMonths = Character.getAgeMonthsRemainder(char);
        const ageStr = `${ageYears}岁${ageMonths}月`;
        const remaining = 240 - char.ageMonths;
        const countdownHtml = remaining > 0
            ? `<span class="log-age-countdown${remaining <= 6 ? ' urgent' : ''}">⏳ 距天魔之日还剩 ${remaining} 月</span>`
            : '';
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<div class="log-age">${ageStr}${countdownHtml}</div>`;
        this.logEl.appendChild(entry);
        this.logEl.scrollTop = this.logEl.scrollHeight;
    },

    showEvent(event, choices, state) {
        const ageYears = Character.getAgeYears(state.char);
        const ageMonths = Character.getAgeMonthsRemainder(state.char);
        const ageStr = `${ageYears}岁${ageMonths}月`;
        const remaining = 240 - state.char.ageMonths;
        const countdownHtml = remaining > 0
            ? `<span class="log-age-countdown${remaining <= 6 ? ' urgent' : ''}">⏳ 距天魔之日还剩 ${remaining} 月</span>`
            : '';

        // Add event entry with empty text — narrative revealed line by line
        const entry = document.createElement('div');
        entry.className = 'log-entry event-entry';
        entry.innerHTML = `<div class="log-age">${ageStr}${countdownHtml}</div>
            <div class="log-title-row"><span class="log-type type-${event.type}">${event.type}</span>${event.title}</div>
            <div class="log-text"></div>`;
        this.logEl.appendChild(entry);
        this.notifyEventTab();

        // Cancel any previous reveal animation still running
        if (this._revealTimer) { clearTimeout(this._revealTimer); this._revealTimer = null; }

        this.choicesEl.innerHTML = '';
        this.nextBtn.disabled = true;

        const textEl = entry.querySelector('.log-text');
        const text = event.text;
        let charIdx = 0;
        let done = false;

        const renderChoices = () => {
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
                    btn.style.animationDelay = `${i * 120}ms`;
                    this.choicesEl.appendChild(btn);
                }
                this.nextBtn.disabled = true;
            } else {
                this.nextBtn.disabled = false;
            }
        };

        const finishReveal = () => {
            if (done) return;
            done = true;
            if (this._revealTimer) { clearTimeout(this._revealTimer); this._revealTimer = null; }
            entry.style.cursor = '';
            textEl.innerHTML = event.text.replace(/\n/g, '<br>');
            renderChoices();
            // Re-scroll after choices panel expands and shrinks the log's visible area
            requestAnimationFrame(() => { this.logEl.scrollTop = this.logEl.scrollHeight; });
        };

        const revealStep = () => {
            if (charIdx >= text.length) { finishReveal(); return; }
            charIdx = Math.min(charIdx + 1, text.length);
            textEl.innerHTML = text.slice(0, charIdx).replace(/\n/g, '<br>');
            this.logEl.scrollTop = this.logEl.scrollHeight;
            this._revealTimer = setTimeout(revealStep, 45);
        };

        // Click the event card to skip the animation
        entry.style.cursor = 'pointer';
        entry.addEventListener('click', finishReveal);
        revealStep();
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

    addIllustration(id) {
        if (typeof Gallery !== 'undefined') Gallery.unlockIllustration(id);
        const wrap = document.createElement('div');
        wrap.className = 'log-illustration';
        const img = document.createElement('img');
        img.src = `assets/illustrations/${id}.png`;
        img.className = 'event-illustration';
        img.decoding = 'async';
        img.onerror = () => { img.src = 'assets/illustrations/placeholder.svg'; img.onerror = null; };
        wrap.appendChild(img);
        this.logEl.appendChild(wrap);
        this.logEl.scrollTop = this.logEl.scrollHeight;
        this.logBuffer.push({ type: 'illustration', id });
        if (this.logBuffer.length > 30) this.logBuffer.shift();
    },

    getLogBuffer() { return this.logBuffer; },

    restoreLog(entries) {
        if (!entries || !entries.length) return;
        this.logEl.innerHTML = '';
        this.logBuffer = [];
        const sep = document.createElement('div');
        sep.className = 'log-entry log-system';
        sep.textContent = '── 上次存档 ──';
        this.logEl.appendChild(sep);
        for (const entry of entries) {
            if (entry.type === 'illustration') {
                this.addIllustration(entry.id);
            } else {
                const div = document.createElement('div');
                div.className = `log-entry log-${entry.type}`;
                div.innerHTML = entry.text.replace(/\n/g, '<br>');
                this.logEl.appendChild(div);
            }
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
        const isHidden = (cs.enemy.isHiddenBoss || cs.enemy.isTrueFinalBoss) && state._isTestCombat;
        document.getElementById('combatEnemyName').textContent  = isHidden ? '????' : cs.enemy.name;
        const eqsText = cs.enemyQiShield > 0 ? `  盾 ${cs.enemyQiShield}` : '';
        document.getElementById('combatEnemyStats').textContent = `攻 ${cs.enemyEffAtk}  防 ${cs.enemyEffDef}${eqsText}`;
        document.getElementById('combatPlayerName').textContent = char.name;
        document.getElementById('combatPlayerStats').textContent = `攻 ${atk}  防 ${def}`;
        document.getElementById('combatLog').innerHTML = '';
        document.getElementById('combatIntentHint').textContent = '';
        document.getElementById('combatSkillReady').style.display = 'none';
        document.getElementById('combatMomentumFill').style.width = '0%';
        document.getElementById('combatMomentumVal').textContent = '0';
        // Restore action buttons, hide return button and result banner
        document.querySelectorAll('#combatActions .combat-btn:not(#combatReturnBtn)').forEach(b => b.style.display = '');
        const returnBtn = document.getElementById('combatReturnBtn');
        if (returnBtn) { returnBtn.style.display = 'none'; returnBtn.onclick = null; }
        const previewBar = document.getElementById('combatPreviewBar');
        if (previewBar) previewBar.style.display = 'none';
        const bannerEl = document.getElementById('combatResult');
        if (bannerEl) { bannerEl.style.display = 'none'; bannerEl.textContent = ''; }
        this.setCombatActionsEnabled(true);
        this.setCombatAutoButton(false);
        if (cs.noFlee) {
            const fleeBtn = document.getElementById('combatFleeBtn');
            fleeBtn.disabled = true;
            fleeBtn.textContent = '🔒 无法逃跑';
        }
        this.updateCombatOverlay(state);
        this._selectedCombatAction = null;
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
        const skillEl = document.getElementById('combatSkillReady');
        if (activeSkill) {
            skillEl.style.display = '';
            const skillReady = mom >= activeSkill.momentumCost && cs.skillCooldown === 0;
            const onCooldown  = cs.skillCooldown > 0;
            if (skillReady) {
                skillEl.className = 'combat-skill-ready';
                skillEl.innerHTML = `⚡ 「${activeSkill.name}」蓄势完成，下回合自动发动！`;
            } else if (onCooldown) {
                skillEl.className = 'combat-skill-cooldown';
                skillEl.innerHTML = `「${activeSkill.name}」${activeSkill.desc}　<span class="skill-cost-tag">冷却中（剩 ${cs.skillCooldown} 回合）</span>`;
            } else {
                const needed = activeSkill.momentumCost - mom;
                skillEl.className = 'combat-skill-charging';
                skillEl.innerHTML = `「${activeSkill.name}」${activeSkill.desc}　<span class="skill-cost-tag">还差 ${needed} 势</span>`;
            }
        } else {
            skillEl.style.display = 'none';
        }

        // Enemy momentum bar (only shown when enemy has skills)
        const enemyMomWrap = document.getElementById('combatEnemyMomentumWrap');
        if (cs.enemy && cs.enemy.skills && cs.enemy.skills.length > 0) {
            enemyMomWrap.style.display = '';
            const eMom = cs.enemyMomentum || 0;
            // Find the next skill available at current HP (or the one pending)
            const hpPctE = cs.enemyHp / cs.enemyMaxHp;
            const availableE = cs.enemy.skills
                .filter(s => hpPctE <= (s.hpThreshold || 0.5))
                .sort((a, b) => ((a.momentumCost || 3) - (b.momentumCost || 3)) || ((a.hpThreshold || 0) - (b.hpThreshold || 0)));
            const nextSkE = cs.pendingSkill || availableE[0];
            if (nextSkE) {
                const maxMom = nextSkE.momentumCost || 3;
                document.getElementById('combatEnemyMomentumVal').textContent = Math.min(eMom, maxMom);
                document.getElementById('combatEnemyMomentumMax').textContent = maxMom;
                document.getElementById('combatEnemyMomentumFill').style.width = (Math.min(eMom, maxMom) / maxMom * 100) + '%';
                const chargeEl = document.getElementById('combatEnemySkillCharge');
                if (cs.pendingSkill) {
                    chargeEl.style.display = '';
                    chargeEl.className = 'combat-enemy-skill-pending';
                    chargeEl.textContent = `⚠ 对方已蓄势「${cs.pendingSkill.name}」——准备格挡！`;
                } else {
                    const needed = maxMom - eMom;
                    chargeEl.style.display = '';
                    chargeEl.className = 'combat-enemy-skill-charging';
                    chargeEl.textContent = needed > 0
                        ? `「${nextSkE.name}」还差 ${needed} 势`
                        : `⚠ 「${nextSkE.name}」随时可发！`;
                }
            } else {
                document.getElementById('combatEnemyMomentumVal').textContent = eMom;
                document.getElementById('combatEnemyMomentumMax').textContent = '—';
                document.getElementById('combatEnemyMomentumFill').style.width = '0%';
                document.getElementById('combatEnemySkillCharge').style.display = 'none';
            }
        } else {
            enemyMomWrap.style.display = 'none';
        }

        // Enemy intent hint (accuracy gated by comprehension)
        const intentEl = document.getElementById('combatIntentHint');
        if (cs.enemyIntentHint) {
            if (cs.enemyIntentType === 'perfect') {
                intentEl.innerHTML = `<span class="intent-read">🔮 ${cs.enemyIntentHint}</span><span class="intent-perfect-label">【无相剑意】</span>`;
            } else {
                const comp  = char.attributes.comprehension || 0;
                const eComp = cs.enemyComp || 0;
                const intentCap = cs.enemy && cs.enemy.id === 'sword_soul' ? 50
                                : cs.enemy && cs.enemy.id === 'tianmo'      ? 60 : 80;
                const capNote   = intentCap < 80
                    ? `·上限${intentCap}%（${cs.enemy.id === 'sword_soul' ? '剑魂神意难测' : '天魔威压遮蔽'}）`
                    : '';
                const accuratePct = Math.round(Math.min(intentCap, 80 * Math.log(1 + comp / (eComp + 20))));
                const label = `（悟性${comp}，识破${accuratePct}%${capNote}）`;
                if (cs.enemyIntentType === 'unreadable') {
                    intentEl.innerHTML = `<span class="intent-none">— ${cs.enemyIntentHint}</span><span class="intent-comp-label">${label}</span>`;
                } else {
                    intentEl.innerHTML = `<span class="intent-read">🔮 ${cs.enemyIntentHint}</span><span class="intent-comp-label">${label}</span>`;
                }
            }
        } else {
            intentEl.innerHTML = '';
        }

        // Combat log (full history, scrollable)
        const logEl = document.getElementById('combatLog');
        logEl.innerHTML = cs.log.map(e => {
            const badge = e.turn === 0
                ? `<span class="combat-turn-badge combat-turn-open">⚔ 开战</span>`
                : `<span class="combat-turn-badge">第${e.turn}回合</span>`;
            return `<div class="combat-log-entry">${badge}${e.text}</div>`;
        }).join('');
        // Scroll so the first entry of the current turn is at the top
        if (cs.log.length > 0) {
            const lastTurn = cs.log[cs.log.length - 1].turn;
            const firstOfLastTurn = cs.log.findIndex(e => e.turn === lastTurn);
            const entries = logEl.querySelectorAll('.combat-log-entry');
            const target = entries[firstOfLastTurn];
            if (target) logEl.scrollTop = target.offsetTop;
            else logEl.scrollTop = logEl.scrollHeight;
        }

        // Flee button text
        const fleeBtn = document.getElementById('combatFleeBtn');
        if (cs.noFlee) {
            fleeBtn.disabled = true;
            fleeBtn.textContent = '🔒 无法逃跑';
        } else {
            fleeBtn.textContent = `🏃 逃跑 ${Math.round(cs.fleeChance * 100)}%`;
        }

        // Dynamic strike tooltip (BD-style: effective hit rate = atk / (atk + def))
        const atk = Character.getAttackPower(char, job);
        const effRatioPct = Combat.getStrikeEffRatio(atk, cs.enemyEffDef);
        const strikeBtn = document.querySelector('#combatActions .combat-strike');
        if (strikeBtn) {
            strikeBtn.title = `强攻：正面攻击，有效命中率${effRatioPct}%，气力+2，可触发会心`;
        }

        this._selectedCombatAction = null;
        document.querySelectorAll('#combatActions .combat-btn').forEach(b => b.classList.remove('selected'));
        this._restoreButtonLabels();
        const previewBar = document.getElementById('combatPreviewBar');
        if (previewBar) previewBar.style.display = 'none';
    },

    // ── Combat action selection & preview ──────────────────────────────────
    _selectedCombatAction: null,
    _ACTION_LABELS: { strike: '⚔ 强攻', defend: '🛡 防御', parry: '⚡ 破招', focus: '🔮 蓄势', flee: '🏃 逃跑' },
    _ACTION_CONFIRM: { strike: '⚔ 再点强攻', defend: '🛡 再点防御', parry: '⚡ 再点破招', focus: '🔮 再点蓄势', flee: '🏃 再点逃跑' },

    selectCombatAction(action) {
        // If same action clicked again, execute immediately
        if (this._selectedCombatAction === action) {
            this._selectedCombatAction = null;
            this._restoreButtonLabels();
            Engine.handleCombatAction(action);
            return;
        }
        this._selectedCombatAction = action;

        // Highlight selected button, change its text to hint "再点执行"
        const btnMap = { strike: '.combat-strike', defend: '.combat-defend', parry: '.combat-parry', focus: '.combat-focus', flee: '.combat-flee' };
        document.querySelectorAll('#combatActions .combat-btn').forEach(b => b.classList.remove('selected'));
        for (const [act, selector] of Object.entries(btnMap)) {
            const btn = document.querySelector(`#combatActions ${selector}`);
            if (btn) btn.textContent = act === action ? this._ACTION_CONFIRM[act] : this._ACTION_LABELS[act];
        }
        const sel = document.querySelector(`#combatActions ${btnMap[action]}`);
        if (sel) sel.classList.add('selected');

        // Show preview bar
        const bar = document.getElementById('combatPreviewBar');
        bar.style.display = '';
        const state = Engine.state;
        if (!state || !state.combatState) return;
        const { char, combatState: cs } = state;
        const job = state.jobs.find(j => j.id === char.job);
        const preview = Combat.getActionPreview(cs, char, job);
        if (!preview) return;

        let html = '';
        if (action === 'strike') {
            const p = preview.strike;
            const sk = p.skillPreview;
            html = `<span class="preview-label">⚔ 强攻</span>`;
            html += `伤害 <span class="preview-good">${p.dmg}</span>`;
            if (p.critChance > 0) html += ` · 会心 <span class="preview-good">${p.critDmg}</span>（${p.critChance}%）`;
            html += ` · 气力+2`;
            if (sk) html += `<br><span class="preview-label">⚡ ${sk.name}</span>自动发动，伤害 <span class="preview-good">${sk.dmg}</span>`;
            html += `<br><span class="preview-muted">承受敌方攻击 ${preview.incoming.fullDmg}${preview.incoming.dodgeChance > 0 ? ` · 闪避 ${preview.incoming.dodgeChance}%` : ''}</span>`;
        } else if (action === 'defend') {
            const p = preview.defend;
            html = `<span class="preview-label">🛡 防御</span>`;
            html += `对重攻减伤 ${p.vsHeavy}%（受 <span class="preview-good">${p.dmgHeavy}</span>）`;
            if (p.insightSwift) {
                html += ` · <span class="preview-good">🔮 洞察快攻</span>减伤 ${p.vsSwift}%（受 <span class="preview-good">${p.dmgSwift}</span>）`;
            } else {
                html += ` · 对快攻减伤 ${p.vsSwift}%（受 <span class="preview-good">${p.dmgSwift}</span>）`;
            }
            html += `<br><span class="preview-muted">不造成伤害，不获得气力。识破快攻时减伤突破上限</span>`;
        } else if (action === 'parry') {
            const p = preview.parry;
            html = `<span class="preview-label">⚡ 破招</span>`;
            html += `成功反击 <span class="preview-good">${p.counterDmg}</span>`;
            if (p.critChance > 0) html += `（会心 ${p.counterCrit}，${p.critChance}%）`;
            html += ` · 自受冲击 ${p.selfDmg} · 气力+1`;
            html += `<br>破招失败：受 <span class="preview-bad">${p.punishDmg}</span>`;
            html += `<br><span class="preview-muted">克制重攻，被快攻克制。技能就绪时作为反击招式发动</span>`;
        } else if (action === 'focus') {
            const p = preview.focus;
            html = `<span class="preview-label">🔮 蓄势</span>`;
            html += `气力 → ${p.momAfter}/5 · 减伤 ${p.reduction}%（受 <span class="preview-good">${p.dmg}</span>）`;
            html += `<br><span class="preview-muted">快速积攒气力以发动技能，减伤略低于防御</span>`;
        } else if (action === 'flee') {
            html = `<span class="preview-label">🏃 逃跑</span>`;
            html += `成功率 ${Math.round(cs.fleeChance * 100)}% · 失败受 ${preview.incoming.fullDmg} 伤害`;
            html += `<br><span class="preview-muted">每次失败+15%成功率</span>`;
        }
        bar.innerHTML = html;
    },

    confirmCombatAction() {
        const action = this._selectedCombatAction;
        if (!action) return;
        this._clearCombatSelection();
        Engine.handleCombatAction(action);
    },

    _restoreButtonLabels() {
        const btnMap = { strike: '.combat-strike', defend: '.combat-defend', parry: '.combat-parry', focus: '.combat-focus', flee: '.combat-flee' };
        for (const [act, selector] of Object.entries(btnMap)) {
            const btn = document.querySelector(`#combatActions ${selector}`);
            if (btn) btn.textContent = this._ACTION_LABELS[act];
        }
    },

    _clearCombatSelection() {
        this._selectedCombatAction = null;
        document.querySelectorAll('#combatActions .combat-btn').forEach(b => b.classList.remove('selected'));
        this._restoreButtonLabels();
        const bar = document.getElementById('combatPreviewBar');
        if (bar) bar.style.display = 'none';
    },

    hideCombatOverlay() {
        document.getElementById('combatOverlay').classList.remove('visible');
    },

    showCombatReturnBtn(result, callback) {
        this._clearCombatSelection();
        document.querySelectorAll('#combatActions .combat-btn:not(#combatReturnBtn)').forEach(b => b.style.display = 'none');
        const returnBtn = document.getElementById('combatReturnBtn');
        returnBtn.style.display = '';
        returnBtn.disabled = false;
        returnBtn.onclick = callback;
        const bannerEl = document.getElementById('combatResult');
        if (bannerEl) {
            const cfg = {
                won:  { cls: 'combat-result-won',  text: '⚔ 战斗胜利' },
                lost: { cls: 'combat-result-lost', text: '💀 战斗落败' },
                fled: { cls: 'combat-result-fled', text: '🏃 成功脱身' },
            }[result] || { cls: '', text: '' };
            bannerEl.className = `combat-result-banner ${cfg.cls}`;
            bannerEl.textContent = cfg.text;
            bannerEl.style.display = '';
        }
    },

    setCombatActionsEnabled(enabled) {
        document.querySelectorAll('#combatActions .combat-btn:not(#combatReturnBtn)').forEach(btn => {
            btn.disabled = !enabled;
        });
        if (!enabled) this._clearCombatSelection();
    },

    setCombatAutoButton(isOn) {
        // no-op: auto-combat replaced by quick combat button
        void isOn;
    },
    // ─────────────────────────────────────────────────────────────

    updateControls(state) {
        const busy = state.gamePhase !== 'idle';
        this.nextBtn.disabled = busy;
        this.nextBtn.textContent = (state.char && state.char.injured) ? '🛌 静心修养' : '🚶 出门探险';

        // Show/hide visit button: only re-evaluate visibility when idle
        if (!busy) {
            const visits = Engine.getAvailableVisits();
            this.visitBtn.style.display = visits.length > 0 ? '' : 'none';
            if (visits.length === 0 && this.visitPanel) this.visitPanel.style.display = 'none';
        }
        // Disable visit button when busy (but keep visible so UI doesn't jump)
        this.visitBtn.disabled = busy;

        // Show/hide chain button: only re-evaluate visibility when idle
        if (this.chainBtn) {
            if (!busy) {
                const chainSteps = Engine.getAllPendingChainSteps();
                this.chainBtn.style.display = chainSteps.length > 0 ? '' : 'none';
                if (chainSteps.length === 0 && this.chainPanel) this.chainPanel.style.display = 'none';
            }
            this.chainBtn.disabled = busy;
        }

        // Show/hide final boss shortcut when 诸世之我 chain is complete
        const finalBossBtn = document.getElementById('finalBossBtn');
        if (finalBossBtn) {
            const char = state.char;
            const chainDone = char && char.flags && char.flags.zhushi_chain_done;
            const bossNotYetFired = char && !(char.flags && char.flags.boss_triggered);
            finalBossBtn.style.display = (chainDone && bossNotYetFired && !busy) ? '' : 'none';
            finalBossBtn.disabled = busy;
        }

        // Disable test combat button when busy
        const testCombatBtn = document.getElementById('testCombatBtn');
        if (testCombatBtn) testCombatBtn.disabled = busy;

        // Close open panels when busy
        if (busy) {
            if (this.visitPanel) this.visitPanel.style.display = 'none';
            if (this.chainPanel) this.chainPanel.style.display = 'none';
            const testPanel = document.getElementById('testCombatPanel');
            if (testPanel) testPanel.style.display = 'none';
        }
    },

    _closeAllPanels(except) {
        const panels = [
            this.visitPanel,
            this.chainPanel,
            document.getElementById('testCombatPanel')
        ];
        for (const p of panels) {
            if (p && p !== except) p.style.display = 'none';
        }
    },

    toggleChainPanel() {
        const panel = this.chainPanel;
        if (!panel) return;
        if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
        this._closeAllPanels(panel);
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
        this._closeAllPanels(panel);
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
            const avatarFile = v.npcId.replace(/_/g, '-');
            const visitHqSrc = `assets/characters/${avatarFile}.png`;
            return `<button class="${cls}" onclick="Engine.visitNPC('${v.npcId}'); UI.visitPanel.style.display='none'">
                <img class="visit-npc-avatar" data-prog="${visitHqSrc}" alt="${v.npc.name}" decoding="async" onclick="event.stopPropagation();UI.showAvatarLightbox(this.dataset.prog,'${v.npcId}')">
                <div class="visit-npc-detail">
                    <span class="visit-npc-name">${v.npc.name}</span>
                    <span class="visit-npc-info">${infoText}</span>
                    ${visitNote}
                </div>
            </button>`;
        }).join('');
        panel.querySelectorAll('[data-prog]').forEach(img => loadProgressiveImg(img, img.dataset.prog, null));
        panel.style.display = 'block';
    },

    toggleTestCombatPanel() {
        const panel = document.getElementById('testCombatPanel');
        if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
        this._closeAllPanels(panel);
        if (Engine.state.gamePhase === 'combat') return;
        const enemies = Engine.state.enemies || [];
        const char = Engine.state.char;
        const job = Engine.getJob(char.job);
        panel.innerHTML = '<div style="font-weight:bold;margin-bottom:6px">⚔ 选择对手（战斗模拟）</div>' +
            enemies.map(e => {
                const eff = Combat.getEffectiveStats(e, char);
                const winPct = Combat.calcWinChance(char, e, job);
                return { e, eff, winPct };
            }).sort((a, b) => b.winPct - a.winPct || (a.eff.attack + a.eff.defense + a.eff.hp) - (b.eff.attack + b.eff.defense + b.eff.hp)).map(({ e, eff, winPct }) => {
                const pctColor = winPct >= 70 ? '🟢' : winPct >= 40 ? '🟡' : '🔴';
                const listName = (e.isHiddenBoss || e.isTrueFinalBoss) ? '????' : e.name;
                return `<button class="visit-npc-btn" onclick="Engine.startTestCombat('${e.id}'); document.getElementById('testCombatPanel').style.display='none'">
                    <span class="visit-npc-name">${listName}</span>
                    <span class="visit-npc-info">攻${eff.attack} 防${eff.defense} 血${eff.hp}  ${pctColor}胜率${winPct}%</span>
                </button>`;
            }).join('');
        panel.style.display = 'block';
    },

    setAutoButton(isOn) {
        // no-op: auto-advance removed
    },

    showRebirthScreen(summary, availableTalents, cause) {
        if (typeof Gallery !== 'undefined') Gallery.unlockIllustration('rebirth');
        this.choicesEl.innerHTML = '';
        this.nextBtn.disabled = true;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const causeText = cause === 'boss' ? '败于天魔'
            : cause === 'hidden_boss' ? '功亏一篑，败于剑魂'
            : cause === 'boss_aftermath' ? '击败天魔，但未能阻止更深处的恶意'
            : cause === 'page_reload' ? '世界线中断'
            : '力战身陨';
        const rebirthNarrative = cause === 'boss'
            ? '天魔最后一击将你轰飞，血气殆尽，意识正在消散……就在这一刻，胸口的家传双鱼玉佩骤然亮起。白光如潮水般涌出，时间开始倒流——周围的一切像被按下了回退键，剑痕愈合、血液倒流、天魔的身影渐渐模糊。你感到自己被拉回到了某个更早的时间节点。这不是来世，而是另一条世界线——你带着这一世的记忆，回到了一切尚未发生的起点。'
            : cause === 'hidden_boss'
            ? '剑魂的虚空剑意贯穿了你最后的防线，你轰然倒下……恍惚中，胸口的双鱼玉佩剧烈震动，白光骤起。时间仿佛被撕裂，碎裂的剑影在光中倒转重组。你知道这不是死亡——而是世界线的回溯。在另一条时间线上，你将带着此刻的记忆重新出发。'
            : cause === 'boss_aftermath'
            ? '你击败了天魔，以为一切终于结束了。然而数年之后，天魔骸骨深处沉睡的更古老的恶意苏醒了——你未曾察觉那枚玉牌中封印的秘密。这一世的你已无力回天……胸口的双鱼玉佩再次亮起，白光涌出，时间开始倒流。也许在下一条世界线上，你能找到那个被忽视的线索。'
            : '你在江湖的厮杀中倒下，鲜血浸透衣衫。正当一切归于黑暗之际，胸口的双鱼玉佩忽然震动，柔和的白光将周围的时间冻结。血从地上回流、伤口缓缓合拢——然后，一切都在倒退。你并非死去，而是被送回了另一条世界线的起点，带着这一世的经历与记忆。';
        modal.innerHTML = `
            <div class="modal-box">
                <h2>✦ 世界线回溯 ✦</h2>
                <div class="modal-cause">${causeText}</div>
                <div class="rebirth-narrative">${rebirthNarrative}</div>
                <div class="modal-illustration"><img src="assets/illustrations/rebirth.png" class="modal-illustration-img" decoding="async" onerror="this.parentElement.style.display='none'"></div>
                <pre class="modal-summary">${summary}</pre>
                <div class="modal-section">
                    <div class="modal-label">你的记忆将随玉佩传至新的世界线，继承 <strong>10%</strong> 属性</div>
                </div>
                ${availableTalents.length > 0 ? `
                <div class="modal-section">
                    <div class="modal-label">解锁了新的传承天赋（最多选择2个）：</div>
                    <div id="talentChoices" class="talent-choices"></div>
                </div>` : ''}
                <button id="rebirthConfirmBtn" class="btn-confirm">踏入新的世界线</button>
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

    showVictoryScreen(char, jobs, bonds, npcs) {
        // True ending — defeated the hidden boss
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        // Career summary
        const job = jobs && jobs.find(j => j.id === char.job);
        const jobName = job ? job.name : char.job;
        const attrs = char.attributes;
        const statLine = `力量 ${attrs.strength} · 敏捷 ${attrs.agility} · 体质 ${attrs.constitution} · 内力 ${attrs.innerForce} · 悟性 ${attrs.comprehension} · 声望 ${attrs.reputation}`;

        let bondsHtml = '';
        if (bonds && npcs) {
            for (const npcId in char.bondLevels) {
                const lv = char.bondLevels[npcId];
                if (lv > 0) {
                    const npc = npcs.find(n => n.id === npcId);
                    const total = bonds[npcId] ? bonds[npcId].length : '?';
                    bondsHtml += `<li>${npc ? npc.name : npcId}（第 ${lv}/${total} 章）</li>`;
                }
            }
        }

        let talentsHtml = '';
        for (const tid of (char.legacyTalents || [])) {
            const t = (typeof TALENTS !== 'undefined' ? TALENTS : []).find(x => x.id === tid);
            talentsHtml += `<li>${t ? t.name : tid}</li>`;
        }

        modal.innerHTML = `
            <div class="modal-box">
                <h2 style="color:#f4c430;font-size:1.4em">✦ 大结局 · 天下归一 ✦</h2>
                <p style="color:#c9a84c;margin:6px 0 14px">天魔已倒，剑魂亦散。那枚玉牌最终化为流光，没入你的眉心。</p>
                <p>老者在另一个地方，或许微微一笑。</p>
                <p style="margin-bottom:16px">【${char.name}】的传奇，从此刻起，永远流传于世。</p>
                <hr style="border-color:#444;margin:12px 0">
                <h3 style="color:#aaa;font-size:0.95em;margin-bottom:8px">── 生涯总结 ──</h3>
                <p>历经 <b>${char.rebirthCount}</b> 次世界线回溯（${char.rebirthCount + 1}周目），终于走完了最后一世。</p>
                <p>最终职业：<b>${jobName}</b> · 享年 <b>${Character.getAgeYears(char)}</b> 岁</p>
                <p style="font-size:0.88em;color:#aaa;margin:6px 0">${statLine}</p>
                ${bondsHtml ? `<p style="margin-top:10px;color:#aaa;font-size:0.9em">羁绊：</p><ul style="color:#ccc;font-size:0.88em;margin:4px 0 10px 16px">${bondsHtml}</ul>` : ''}
                ${talentsHtml ? `<p style="color:#aaa;font-size:0.9em">传承天赋：</p><ul style="color:#c9a84c;font-size:0.88em;margin:4px 0 10px 16px">${talentsHtml}</ul>` : ''}
                <hr style="border-color:#444;margin:12px 0">
                <button id="victoryNGPlusBtn" class="btn-confirm" style="margin-right:12px">传说难度·再战一世</button>
                <button id="newGameBtn" class="btn-secondary">重新开始</button>
            </div>`;
        document.body.appendChild(modal);
        modal.querySelector('#victoryNGPlusBtn').onclick = () => {
            document.body.removeChild(modal);
            const avail = Rebirth.getAvailableTalents(char);
            const summary = Rebirth.getSummaryText(char, Engine.state.jobs, Engine.state.bonds, Engine.state.npcs);
            this.showRebirthScreen(summary, avail, 'true_victory');
        };
        modal.querySelector('#newGameBtn').onclick = () => {
            document.body.removeChild(modal);
            Engine.deleteSave();
            location.reload();
        };
    }
};
