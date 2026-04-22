"""
Add retroactive foreshadowing to mysterious_elder bond L1-L3.
Three insertions — each reads as natural on first playthrough,
becomes suspicious only after completing 碎片真相.
"""
import json, os

BASE = os.path.join(os.path.dirname(__file__), '..', 'data')

with open(os.path.join(BASE, 'bonds.json'), encoding='utf-8') as f:
    bonds = json.load(f)

elder_bonds = bonds['mysterious_elder']

# ── L1 step0: first meeting ───────────────────────────────────────────────────
# Original: "见你过来，眼神一闪"
# Extend to: that flash reads as confirmation, not curiosity
L1S0_OLD = "见你过来，眼神一闪："
L1S0_NEW = "见你过来，眼神一闪——那一闪极短，不像是遇见陌生人的意外，更像是某种确认。随即，他开口："

# ── L1 step1 "answer_continue" narrative: the "等了许多年" moment ─────────────
# Original ends: "多了一种说不清的默契。"
# Add: in hindsight, he exhaled like he was putting something down
L1S1_OLD = "但那之后，你们之间，多了一种说不清的默契。"
L1S1_NEW = (
    "但那之后，你们之间，多了一种说不清的默契。\n\n"
    "只是事后你回想，才发现——他当时呼出了一口很长的气。"
    "长得不像感慨，更像是……某种如释重负。"
)

# ── L2 step1 "accept_trial" narrative: "三日走完别人三年的路" ─────────────────
# Original ends: "那句话，让你感到一种踏实。"
# Add: he watches you like he's reading a ledger, not praising a student
L2S1_OLD = "那句话，让你感到一种踏实。"
L2S1_NEW = (
    "那句话，让你感到一种踏实。"
    "他收回目光，若有所思地看了你良久——不像是在看一个进步神速的学生，"
    "更像是在检视某样东西的……当前状态。"
)

def replace_in_bond_level(npc_bonds, level, target_old, target_new):
    for bond_level in npc_bonds:
        if bond_level['level'] != level:
            continue
        # Check steps
        for step in bond_level.get('steps', []):
            if target_old in step.get('text', ''):
                step['text'] = step['text'].replace(target_old, target_new, 1)
                return True
            # Check choices
            for ch in step.get('choices', []):
                eff = ch.get('effects', {})
                if target_old in eff.get('narrative', ''):
                    eff['narrative'] = eff['narrative'].replace(target_old, target_new, 1)
                    return True
        # Check top-level choices (non-step bonds)
        for ch in bond_level.get('choices', []):
            eff = ch.get('effects', {})
            if target_old in eff.get('narrative', ''):
                eff['narrative'] = eff['narrative'].replace(target_old, target_new, 1)
                return True
    return False

changes = [
    (1, L1S0_OLD, L1S0_NEW,  "L1 step0 — first meeting flash"),
    (1, L1S1_OLD, L1S1_NEW,  "L1 step1 — 'waited many years' exhale"),
    (2, L2S1_OLD, L2S1_NEW,  "L2 step1 — 'three days for three years' gaze"),
]

for level, old, new, label in changes:
    if replace_in_bond_level(elder_bonds, level, old, new):
        print(f"OK {label}")
    else:
        print(f"NOT FOUND: {label}")
        print(f"  Looking for: {old[:60]}")

with open(os.path.join(BASE, 'bonds.json'), 'w', encoding='utf-8') as f:
    json.dump(bonds, f, ensure_ascii=False, indent=2)

print("bonds.json updated.")
