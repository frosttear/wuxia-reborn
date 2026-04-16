// npc.js - NPC relationship management

const NPCSystem = {
    // Initialize relationships from npc data
    initRelationships(char, npcs) {
        for (const npc of npcs) {
            if (!char.relationships[npc.id]) {
                char.relationships[npc.id] = { affinity: 0, met: false };
            }
        }
    },

    changeAffinity(char, npcId, amount) {
        if (!char.relationships[npcId]) {
            char.relationships[npcId] = { affinity: 0, met: false };
        }
        char.relationships[npcId].affinity = Math.max(-100, Math.min(100,
            char.relationships[npcId].affinity + amount
        ));
    },

    getAffinity(char, npcId) {
        return char.relationships[npcId] ? char.relationships[npcId].affinity : 0;
    },

    getAffinityLabel(char, npcId, npcs) {
        const npc = npcs.find(n => n.id === npcId);
        if (!npc) return '';
        const affinity = this.getAffinity(char, npcId);
        let label = npc.affinityLevels[0].label;
        for (const level of npc.affinityLevels) {
            if (affinity >= level.threshold) label = level.label;
        }
        return label;
    },

    isMet(char, npcId) {
        return char.flags['met_' + npcId] === true;
    },

    // Check if NPC condition is satisfied
    checkNPCAffinity(char, npcAffinityReqs) {
        if (!npcAffinityReqs) return true;
        for (const npcId in npcAffinityReqs) {
            if (this.getAffinity(char, npcId) < npcAffinityReqs[npcId]) return false;
        }
        return true;
    },

    // Apply NPC affinity changes from event effects
    applyAffinityChanges(char, npcAffinityChanges) {
        if (!npcAffinityChanges) return;
        for (const npcId in npcAffinityChanges) {
            this.changeAffinity(char, npcId, npcAffinityChanges[npcId]);
        }
    },

    // Get all met NPCs with their status
    getMetNPCs(char, npcs) {
        return npcs.filter(npc => this.isMet(char, npc.id));
    }
};

if (typeof module !== 'undefined') module.exports = { NPCSystem };
