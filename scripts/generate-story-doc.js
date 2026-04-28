'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const chains = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/chains.json'), 'utf8')).chains;
const bonds = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/bonds.json'), 'utf8'));
const events = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/events.json'), 'utf8'));

const lines = [];
const out = (s = '') => lines.push(s);

function formatChoices(choices, indent = '') {
  if (!choices || choices.length === 0) return;
  choices.forEach(c => {
    out(`${indent}**【选择】** ${c.text}`);
    if (c.requirements) {
      const req = c.requirements.minAttributes;
      if (req) out(`${indent}*（需要：${Object.entries(req).map(([k,v])=>k+'≥'+v).join('，')}）*`);
    }
    if (c.effects && c.effects.narrative && c.effects.narrative.trim()) {
      out('');
      c.effects.narrative.split('\n').forEach(l => out(`${indent}> ${l}`));
    }
    if (c.effects && c.effects.combat) {
      out(`${indent}*→ 触发战斗：${c.effects.combat}*`);
    }
    out('');
  });
}

function formatSteps(steps) {
  (steps || []).forEach((step, i) => {
    out(`#### 第 ${i+1} 段`);
    out('');
    step.text.split('\n').forEach(l => out(l));
    out('');
    formatChoices(step.choices);
  });
}

function formatChain(chain) {
  out(`### ${chain.name}（${chain.id}）`);
  out('');
  if (chain.desc) { out(chain.desc); out(''); }
  (chain.steps || []).forEach((step, i) => {
    out(`#### 步骤 ${i+1}：${step.title || ''}`);
    out('');
    if (step.narrative) {
      step.narrative.split('\n').forEach(l => out(l));
      out('');
    }
    (step.choices || []).forEach(c => {
      out(`**【选择】** ${c.text}`);
      if (c.requirements) {
        const req = c.requirements.minAttributes || c.requirements;
        if (typeof req === 'object') out(`*（需要：${Object.entries(req).filter(([k])=>k!=='flags'&&k!=='bondLevels').map(([k,v])=>k+'≥'+v).join('，')}）*`);
      }
      if (c.effects && c.effects.narrative && c.effects.narrative.trim()) {
        out('');
        c.effects.narrative.split('\n').forEach(l => out('> ' + l));
      }
      if (c.effects && c.effects.combat) out(`*→ 触发战斗：${c.effects.combat}*`);
      out('');
    });
  });
}

// ── HEADER ──────────────────────────────────────────────────────────────────
out('# 轮回江湖 — 故事完整文本');
out('');
out('> 本文档由脚本从 data/ 自动提取，供剧情全面审阅。');
out('');
out('---');
out('');

// ── MAIN PLOT CHAINS ─────────────────────────────────────────────────────────
out('## 一、主线任务链');
out('');

const mainChainIds = ['tianmo_harbinger','jianghu_chaos','hero_path','sword_path','wuxiang_sword','truth_shards','zhushi_zhi_wo'];
mainChainIds.forEach(id => {
  const c = chains.find(x => x.id === id);
  if (c) { formatChain(c); out('---'); out(''); }
});

// ── BOSS EVENTS ──────────────────────────────────────────────────────────────
out('## 二、关键剧情事件');
out('');

const bossIds = ['tianmo_appears','elder_true_form_appears','elder_truth_form_appears'];
bossIds.forEach(id => {
  const ev = events.find(e => e.id === id);
  if (!ev) return;
  out(`### ${ev.title}（${ev.id}）`);
  out('');
  ev.text.split('\n').forEach(l => out(l));
  out('');
  formatChoices(ev.choices);
  out('---');
  out('');
});

// ── REBIRTH HINT EVENTS ───────────────────────────────────────────────────────
out('## 三、前世线索事件');
out('');

const hintIds = ['past_life_scar','past_life_dream','elder_timing','deja_vu_road','jade_pulse','meet_lingxue'];
hintIds.forEach(id => {
  const ev = events.find(e => e.id === id);
  if (!ev) return;
  out(`### ${ev.title}（${ev.id}）`);
  out('');
  ev.text.split('\n').forEach(l => out(l));
  out('');
  formatChoices(ev.choices);
  out('---');
  out('');
});

// ── NPC BONDS ────────────────────────────────────────────────────────────────
out('## 四、NPC 羁绊故事');
out('');

const npcNames = {
  yan_chixing: '燕赤行（疤脸剑客）',
  wang_tie: '王铁（铁匠）',
  su_qing: '苏青（游医）',
  li_yunshu: '李云舒（书生）',
  ling_xue: '凌雪（白衣剑客）',
  mysterious_elder: '神秘老人（沈玄清）',
};

Object.entries(npcNames).forEach(([key, label]) => {
  out(`### ${label}`);
  out('');
  const npcBonds = bonds[key];
  if (!npcBonds) { out('（暂无数据）'); out(''); return; }
  npcBonds.forEach(bond => {
    out(`#### 羁绊 ${bond.level}：${bond.title}`);
    out('');
    if (bond.desc) { out(bond.desc); out(''); }
    formatSteps(bond.steps);
  });
  out('---');
  out('');
});

// ── AFTERSTORY CHAINS ─────────────────────────────────────────────────────────
out('## 五、NPC 后续故事链');
out('');

const afterIds = ['yan_afterstory','wang_revenge','li_yunshu_afterstory','su_qing_afterstory','lingxue_afterstory','elder_afterstory'];
afterIds.forEach(id => {
  const c = chains.find(x => x.id === id);
  if (c) { formatChain(c); out('---'); out(''); }
});

// ── WRITE ─────────────────────────────────────────────────────────────────────
const outPath = path.join(ROOT, 'docs/story-review.md');
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
const size = Math.round(fs.statSync(outPath).size / 1024);
console.log(`Written: ${outPath} (${size} KB, ${lines.length} lines)`);
