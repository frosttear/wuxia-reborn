// combat.js - Combat resolution system

const Combat = {
    // Resolve combat between character and an enemy
    // Returns { won, hpLost, narrative, effects }
    resolve(char, enemy, job) {
        const attack = Character.getAttackPower(char, job);
        const defense = Character.getDefensePower(char, job);

        // Add luck-based variance (+/- up to luck/2 %)
        const luckVariance = 1 + (Math.random() - 0.5) * (char.attributes.luck / 100);
        const effectiveAttack = Math.floor(attack * luckVariance);

        // Enemy effective stats
        const enemyEffectiveAtk = Math.floor(enemy.attack * (0.85 + Math.random() * 0.3));

        // Determine winner: attacker with higher effective power wins
        const playerScore = effectiveAttack + Math.floor(Math.random() * 10);
        const enemyScore = enemy.defense + Math.floor(Math.random() * 10);

        const won = playerScore > enemyScore;

        let hpLost = 0;
        let narrative = '';
        let winEffects = {};

        if (won) {
            hpLost = enemy.hpLossOnWin || 5;
            narrative = enemy.winNarrative;
            winEffects = enemy.winEffects || {};
        } else {
            hpLost = enemy.hpLossOnDefeat || 20;
            narrative = enemy.loseNarrative;
            winEffects = enemy.loseEffects || {};
        }

        // 运气闪避：概率性减伤5-%
        const dodgeChance = Character.getLuckDodgeChance(char);
        const dodged = Math.random() < dodgeChance;
        if (dodged) hpLost = Math.max(1, Math.floor(hpLost * 0.5));

        // Take HP damage
        const died = Character.takeDamage(char, hpLost);

        return { won, hpLost, narrative, winEffects, died, dodged };
    },

    // Get a descriptive combat summary line
    getSummaryLine(char, enemy, job) {
        const attack = Character.getAttackPower(char, job);
        const defense = Character.getDefensePower(char, job);
        return `你的攻击力：${attack} | 防御力：${defense} | 敌方：${enemy.name}（攻${enemy.attack}/防${enemy.defense}）`;
    }
};
