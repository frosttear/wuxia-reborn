// combat.js - Combat resolution system

const Combat = {
    // Compute enemy's scaled stats based on player strength progression
    // enemies can define attackScale / defenseScale (bonus per 10 player strength)
    getEffectiveStats(enemy, char) {
        const scaleTier = Math.floor((char.attributes.strength || 0) / 10);
        return {
            attack:  enemy.attack  + scaleTier * (enemy.attackScale  || 0),
            defense: enemy.defense + scaleTier * (enemy.defenseScale || 0)
        };
    },

    // Monte-Carlo win-chance estimate (200 trials, fast)
    calcWinChance(char, enemy, job) {
        const attack  = Character.getAttackPower(char, job);
        const eff     = this.getEffectiveStats(enemy, char);
        let wins = 0;
        for (let i = 0; i < 200; i++) {
            const lv = 1 + (Math.random() - 0.5) * (char.attributes.luck / 100);
            const ps = Math.floor(attack * lv) + Math.floor(Math.random() * 10);
            const es = eff.defense              + Math.floor(Math.random() * 10);
            if (ps > es) wins++;
        }
        return Math.round(wins / 2); // returns 0-100
    },

    // Resolve combat between character and an enemy
    resolve(char, enemy, job) {
        const attack  = Character.getAttackPower(char, job);
        const defense = Character.getDefensePower(char, job);
        const eff     = this.getEffectiveStats(enemy, char);

        // Luck-based attack variance
        const luckVariance = 1 + (Math.random() - 0.5) * (char.attributes.luck / 100);
        const playerScore  = Math.floor(attack * luckVariance) + Math.floor(Math.random() * 10);
        const enemyScore   = eff.defense                       + Math.floor(Math.random() * 10);
        const won = playerScore > enemyScore;

        let hpLost = 0, narrative = '', winEffects = {};
        if (won) {
            hpLost     = enemy.hpLossOnWin || 5;
            narrative  = enemy.winNarrative;
            winEffects = enemy.winEffects || {};
        } else {
            hpLost     = enemy.hpLossOnDefeat || 20;
            narrative  = enemy.loseNarrative;
            winEffects = enemy.loseEffects || {};
        }

        // 运气闪避：概率性减伤50%
        const dodgeChance = Character.getLuckDodgeChance(char);
        const dodged = Math.random() < dodgeChance;
        if (dodged) hpLost = Math.max(1, Math.floor(hpLost * 0.5));

        const died = Character.takeDamage(char, hpLost);
        return { won, hpLost, narrative, winEffects, died, dodged, effAtk: eff.attack, effDef: eff.defense };
    },

    getSummaryLine(char, enemy, job) {
        const attack  = Character.getAttackPower(char, job);
        const defense = Character.getDefensePower(char, job);
        const eff     = this.getEffectiveStats(enemy, char);
        return `你的攻击力：${attack} | 防御力：${defense} | 敌方：${enemy.name}（攻${eff.attack}/防${eff.defense}）`;
    }
};
