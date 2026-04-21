// --- DATA: Official Magic Items (Sample Set) ---
const magicItemsData = [
    { name: "Potion of Healing", rarity: "Common", desc: "Regain 2d4+2 HP.", minLevel: 1 },
    { name: "Spell Scroll (Cantrip)", rarity: "Common", desc: "Contains a 0-level spell.", minLevel: 1 },
    { name: "Bag of Holding", rarity: "Uncommon", desc: "Holds 500 lbs, weightless.", minLevel: 2 },
    { name: "+1 Weapon", rarity: "Uncommon", desc: "+1 to hit and damage.", minLevel: 3 },
    { name: "Cloak of Protection", rarity: "Uncommon", desc: "+1 AC and Saving Throws.", minLevel: 3 },
    { name: "Sun Blade", rarity: "Rare", desc: "Finesse longsword, +2 bonus, radiant damage.", minLevel: 5 },
    { name: "Armor of Resistance", rarity: "Rare", desc: "Resistance to one damage type.", minLevel: 5 },
    { name: "Staff of Power", rarity: "Very Rare", desc: "+2 bonus to AC, saves, and spell attacks.", minLevel: 11 },
    { name: "Belt of Giant Strength (Fire)", rarity: "Very Rare", desc: "Strength becomes 25.", minLevel: 11 },
    { name: "Vorpal Sword", rarity: "Legendary", desc: "Ignores resistance, cuts off heads on a 20.", minLevel: 17 },
    { name: "Holy Avenger", rarity: "Legendary", desc: "Advantage on saves vs spells for allies nearby.", minLevel: 17 }
];

const mundaneItems = ["Steel Mirror", "Silk Rope (50ft)", "Hourglass", "Magnifying Glass", "Healer's Kit", "Crowbar"];

// --- CORE LOGIC ---

document.getElementById('generateBtn').addEventListener('click', generateLoot);

function generateLoot() {
    const level = parseInt(document.getElementById('partyLevel').value);
    const difficulty = parseFloat(document.getElementById('difficulty').value);
    const resultDiv = document.getElementById('lootResult');
    
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = '<h2>The Spoils:</h2>';

    // 1. Generate Currency
    if (document.getElementById('includeCoins').checked) {
        resultDiv.innerHTML += generateCoins(level, difficulty);
    }

    // 2. Generate Mundane / Gems
    let itemList = '<ul class="item-list">';
    if (document.getElementById('includeGems').checked) {
        itemList += generateGems(level, difficulty);
    }
    if (document.getElementById('includeMundane').checked) {
        itemList += `<li>${mundaneItems[Math.floor(Math.random() * mundaneItems.length)]}</li>`;
    }
    itemList += '</ul>';
    resultDiv.innerHTML += itemList;

    // 3. Generate Magic Items
    if (document.getElementById('includeMagic').checked) {
        resultDiv.innerHTML += generateMagicItems(level, difficulty);
    }
}

/**
 * Scales currency based on 5e Individual Treasure tiers.
 * Logic: level 1-4, 5-10, 11-16, 17-20
 */
function generateCoins(level, mult) {
    let cp = 0, sp = 0, gp = 0, pp = 0;

    if (level < 5) {
        cp = Math.floor((Math.random() * 20 + 5) * mult);
        sp = Math.floor((Math.random() * 12 + 3) * mult);
        gp = Math.floor((Math.random() * 6) * mult);
    } else if (level < 11) {
        gp = Math.floor((Math.random() * 100 + 50) * mult);
        pp = Math.floor((Math.random() * 5) * mult);
    } else {
        gp = Math.floor((Math.random() * 1000 + 500) * mult);
        pp = Math.floor((Math.random() * 100 + 20) * mult);
    }

    return `
        <div class="currency-box">
            <div class="coin"><strong>CP:</strong> ${cp}</div>
            <div class="coin"><strong>SP:</strong> ${sp}</div>
            <div class="coin"><strong>GP:</strong> ${gp}</div>
            <div class="coin"><strong>PP:</strong> ${pp}</div>
        </div>
    `;
}

/**
 * Gems value scaling
 */
function generateGems(level, mult) {
    const gemTiers = [10, 50, 100, 500, 1000, 5000];
    let tierIdx = Math.min(Math.floor(level / 4), gemTiers.length - 1);
    let count = Math.floor((Math.random() * 3 + 1) * mult);
    return `<li>${count}x Gems (worth ${gemTiers[tierIdx]} gp each)</li>`;
}

/**
 * Selects items from the database based on Party Level.
 * Uses a weighted roll to determine rarity.
 */
function generateMagicItems(level, mult) {
    const roll = Math.random() * 100 * mult;
    let targetRarity = "Common";

    // Rarity thresholds based on level
    if (level >= 17) {
        if (roll > 80) targetRarity = "Legendary";
        else if (roll > 50) targetRarity = "Very Rare";
        else targetRarity = "Rare";
    } else if (level >= 11) {
        if (roll > 80) targetRarity = "Very Rare";
        else if (roll > 40) targetRarity = "Rare";
        else targetRarity = "Uncommon";
    } else if (level >= 5) {
        if (roll > 70) targetRarity = "Rare";
        else targetRarity = "Uncommon";
    }

    // Filter list for matching rarity AND level requirement
    const pool = magicItemsData.filter(i => i.rarity === targetRarity && i.minLevel <= level);
    
    if (pool.length === 0) return "<p><em>No magic items found in this hoard.</em></p>";
    
    const item = pool[Math.floor(Math.random() * pool.length)];

    return `
        <div class="magic-item">
            <span class="rarity-label">${item.rarity}</span>
            <h3>${item.name}</h3>
            <p>${item.desc}</p>
        </div>
    `;
}
