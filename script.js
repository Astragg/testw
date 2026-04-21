// --- OFFICIAL D&D 5E ITEM DATABASE ---
const magicItems = [
    { name: "Potion of Healing", rarity: "Common", tier: 1 },
    { name: "Spell Scroll (Cantrip)", rarity: "Common", tier: 1 },
    { name: "Armor of Gleaming", rarity: "Common", tier: 1 },
    { name: "Bag of Holding", rarity: "Uncommon", tier: 1 },
    { name: "Weapon, +1", rarity: "Uncommon", tier: 1 },
    { name: "Gauntlets of Ogre Power", rarity: "Uncommon", tier: 2 },
    { name: "Cloak of Displacement", rarity: "Rare", tier: 2 },
    { name: "Sun Blade", rarity: "Rare", tier: 3 },
    { name: "Armor, +2", rarity: "Very Rare", tier: 3 },
    { name: "Staff of Power", rarity: "Very Rare", tier: 4 },
    { name: "Vorpal Sword", rarity: "Legendary", tier: 4 },
    { name: "Holy Avenger", rarity: "Legendary", tier: 4 }
];

const mundaneItems = ["Pouch of Spices", "Silver Mirror", "Silk Rope", "Merchant's Scale", "Hourglass"];

document.getElementById('generateBtn').addEventListener('click', () => {
    const data = {
        lvl: parseInt(document.getElementById('partyLevel').value),
        size: parseInt(document.getElementById('partySize').value),
        enemies: parseInt(document.getElementById('enemyCount').value),
        diff: parseFloat(document.getElementById('difficulty').value),
        type: document.getElementById('lootScale').value
    };

    calculateLoot(data);
});

function calculateLoot(data) {
    const resultArea = document.getElementById('lootResult');
    resultArea.classList.remove('hidden');
    resultArea.innerHTML = '<h2>Generated Spoils</h2>';

    // 1. Coins Logic (Scaled by 5e Individual vs Hoard rules)
    let totalCopper = 0, totalSilver = 0, totalGold = 0, totalPlat = 0;

    if (data.type === 'individual') {
        // Individual loot is per enemy. Scale logic: CR 0-4, 5-10, 11-16, 17+
        for (let i = 0; i < data.enemies; i++) {
            if (data.lvl < 5) {
                totalCopper += (rollDice(5, 6) * data.diff);
                totalSilver += (rollDice(4, 6) * data.diff);
                totalGold += (rollDice(3, 6) * data.diff);
            } else if (data.lvl < 11) {
                totalGold += (rollDice(4, 6) * 10 * data.diff);
                totalPlat += (rollDice(3, 6) * data.diff);
            } else if (data.lvl < 17) {
                totalGold += (rollDice(4, 6) * 100 * data.diff); // At lvl 16, roughly 1400 GP per body
                totalPlat += (rollDice(1, 6) * 100 * data.diff);
            } else {
                totalGold += (rollDice(2, 6) * 1000 * data.diff);
                totalPlat += (rollDice(8, 6) * 100 * data.diff);
            }
        }
    } else {
        // Hoard logic (single large pile)
        if (data.lvl < 5) {
            totalGold += rollDice(6, 6) * 10 * data.diff;
        } else if (data.lvl < 11) {
            totalGold += rollDice(2, 6) * 100 * data.diff;
        } else if (data.lvl < 17) {
            totalGold += rollDice(4, 6) * 1000 * data.diff;
            totalPlat += rollDice(5, 6) * 100 * data.diff;
        } else {
            totalGold += rollDice(12, 6) * 1000 * data.diff;
            totalPlat += rollDice(8, 6) * 1000 * data.diff;
        }
    }

    // Clean up math
    totalGold = Math.floor(totalGold);
    const goldPerPerson = (totalGold / data.size).toFixed(1);

    resultArea.innerHTML += `
        <div class="currency-wrap">
            <span>CP: ${Math.floor(totalCopper)}</span>
            <span>SP: ${Math.floor(totalSilver)}</span>
            <span style="color: #b8860b; font-weight: bold;">GP: ${totalGold}</span>
            <span style="color: #4682b4; font-weight: bold;">PP: ${Math.floor(totalPlat)}</span>
        </div>
        <div class="per-player">Approx. <strong>${goldPerPerson} GP</strong> per party member</div>
    `;

    // 2. Magic & Items
    if (document.getElementById('includeMagic').checked) {
        generateMagicLoot(data, resultArea);
    }
}

function rollDice(count, sides) {
    let total = 0;
    for (let i = 0; i < count; i++) {
        total += Math.floor(Math.random() * sides) + 1;
    }
    return total;
}

function generateMagicLoot(data, container) {
    const roll = Math.random() * 100 * data.diff;
    let rarityNeeded = "Common";
    
    // Scaling rarity chance by party level
    if (data.lvl >= 17) {
        if (roll > 85) rarityNeeded = "Legendary";
        else if (roll > 60) rarityNeeded = "Very Rare";
        else rarityNeeded = "Rare";
    } else if (data.lvl >= 11) {
        if (roll > 90) rarityNeeded = "Very Rare";
        else if (roll > 70) rarityNeeded = "Rare";
        else rarityNeeded = "Uncommon";
    } else if (data.lvl >= 5) {
        if (roll > 85) rarityNeeded = "Rare";
        else rarityNeeded = "Uncommon";
    }

    const pool = magicItems.filter(i => i.rarity === rarityNeeded);
    if (pool.length > 0) {
        const item = pool[Math.floor(Math.random() * pool.length)];
        container.innerHTML += `
            <div class="magic-item-card">
                <span class="rarity-tag">${item.rarity}</span>
                <h3>${item.name}</h3>
                <p>An official artifact suitable for level ${data.lvl} encounters.</p>
            </div>
        `;
    }
}
