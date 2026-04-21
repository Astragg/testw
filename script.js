let CLASSES = [];
let SPELLS = [];
let RULES = [];

// Base D&D Class Data for generation logic
const CLASS_DATA = {
    "Barbarian": { hd: 12, saves: ["STR", "CON"] },
    "Bard": { hd: 8, saves: ["DEX", "CHA"] },
    "Cleric": { hd: 8, saves: ["WIS", "CHA"] },
    "Druid": { hd: 8, saves: ["INT", "WIS"] },
    "Fighter": { hd: 10, saves: ["STR", "CON"] },
    "Monk": { hd: 8, saves: ["STR", "DEX"] },
    "Paladin": { hd: 10, saves: ["WIS", "CHA"] },
    "Ranger": { hd: 10, saves: ["STR", "DEX"] },
    "Rogue": { hd: 8, saves: ["DEX", "INT"] },
    "Sorcerer": { hd: 6, saves: ["CON", "CHA"] },
    "Warlock": { hd: 8, saves: ["WIS", "CHA"] },
    "Wizard": { hd: 6, saves: ["INT", "WIS"] }
};

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    
    const sSearch = document.getElementById("spellSearch");
    const rSearch = document.getElementById("ruleSearch");
    
    if(sSearch) sSearch.addEventListener("input", renderSpells);
    if(rSearch) rSearch.addEventListener("input", renderRules);
});

async function loadData() {
    try {
        const [cRes, spRes, rRes] = await Promise.all([
            fetch("https://www.dnd5eapi.co/api/classes"),
            fetch("https://www.dnd5eapi.co/api/spells"),
            fetch("https://www.dnd5eapi.co/api/conditions")
        ]);

        CLASSES = (await cRes.json()).results;
        SPELLS = (await spRes.json()).results;
        RULES = (await rRes.json()).results;

        populateClasses();
        renderSpells();
        renderRules();
    } catch (err) {
        console.error("API failed to load:", err);
    }
}

function showTab(id) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

function populateClasses() {
    const sel = document.getElementById("classSelect");
    if (!sel) return;
    sel.innerHTML = "";
    CLASSES.forEach(c => {
        const o = document.createElement("option");
        o.value = c.index;
        o.text = c.name;
        sel.add(o);
    });
}

// Dice Roller for Stats (4d6 drop lowest)
function rollStat() {
    let rolls = Array.from({length: 4}, () => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => b - a); // Sort highest to lowest
    return rolls[0] + rolls[1] + rolls[2]; // Sum top 3
}

function getMod(score) {
    return Math.floor((score - 10) / 2);
}

function formatMod(mod) {
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

// THE 5E STANDARD CHARACTER SHEET
function generateCharacter() {
    const name = document.getElementById("charName").value || "Nameless Hero";
    const className = document.getElementById("classSelect").options[document.getElementById("classSelect").selectedIndex].text;
    const lvl = parseInt(document.getElementById("levelInput").value);

    // Roll Stats
    const stats = {
        STR: rollStat(), DEX: rollStat(), CON: rollStat(),
        INT: rollStat(), WIS: rollStat(), CHA: rollStat()
    };

    // Calculate D&D Mechanics
    const classInfo = CLASS_DATA[className] || { hd: 8, saves: [] };
    const pb = Math.ceil(lvl / 4) + 1; // Proficiency Bonus scales with level
    const hp = classInfo.hd + getMod(stats.CON) + ((lvl - 1) * (Math.floor(classInfo.hd / 2) + 1 + getMod(stats.CON)));
    const ac = 10 + getMod(stats.DEX);
    const initiative = formatMod(getMod(stats.DEX));

    // Determine basic attack stats
    let weaponMod = formatMod(Math.max(getMod(stats.STR), getMod(stats.DEX)) + pb);

    document.getElementById("sheetOutput").innerHTML = `
        <div class="sheet-header">
            <h2>${name}</h2>
            <div class="header-details">
                <span><b>Class:</b> ${className}</span>
                <span><b>Level:</b> ${lvl}</span>
                <span><b>Proficiency Bonus:</b> +${pb}</span>
            </div>
        </div>

        <div class="sheet-grid">
            <div class="stat-column">
                ${Object.entries(stats).map(([stat, score]) => `
                    <div class="stat-box">
                        <div class="stat-name">${stat}</div>
                        <div class="stat-mod">${formatMod(getMod(score))}</div>
                        <div class="stat-score">${score}</div>
                    </div>
                `).join('')}
            </div>

            <div class="combat-column">
                <div class="vitals-row">
                    <div class="vital-box"><b>AC</b><br>${ac}</div>
                    <div class="vital-box"><b>Initiative</b><br>${initiative}</div>
                    <div class="vital-box"><b>Speed</b><br>30 ft</div>
                    <div class="vital-box hp-box"><b>Hit Points</b><br>${hp} / ${hp}<br><small>Hit Dice: ${lvl}d${classInfo.hd}</small></div>
                </div>

                <div class="attacks-box">
                    <h3>Attacks & Spellcasting</h3>
                    <table width="100%">
                        <tr><th>Name</th><th>Atk Bonus</th><th>Damage/Type</th></tr>
                        <tr><td>Primary Weapon</td><td>${weaponMod}</td><td>1d8 ${formatMod(getMod(stats.STR))}</td></tr>
                        <tr><td>Unarmed Strike</td><td>${formatMod(getMod(stats.STR) + pb)}</td><td>${1 + getMod(stats.STR)} Bludgeoning</td></tr>
                    </table>
                </div>

                <div class="traits-box">
                    <h3>Features & Traits</h3>
                    <ul>
                        <li><b>Saving Throws:</b> ${classInfo.saves.join(', ')}</li>
                        <li><b>Armor/Weapons:</b> Refer to ${className} class block</li>
                        ${lvl >= 5 && (className === 'Fighter' || className === 'Barbarian' || className === 'Paladin' || className === 'Ranger' || className === 'Monk') ? '<li><b>Extra Attack:</b> Attack twice when taking the Attack action.</li>' : ''}
                    </ul>
                </div>
            </div>
        </div>
        <button class="primary-btn" onclick="saveCharacterData()">Save Character JSON</button>
    `;
    showTab("sheet");
}

/* --- SPELLS --- */
function renderSpells() {
    const q = document.getElementById("spellSearch").value.toLowerCase();
    const list = document.getElementById("spellList");
    
    list.innerHTML = SPELLS
        .filter(s => s.name.toLowerCase().includes(q))
        .slice(0, 20)
        .map(s => `
            <details class="card" onclick="if(!this.dataset.loaded) fetchItemData('${s.index}', this, 'spells')">
                <summary>${s.name}</summary>
                <div class="drop-data">Loading...</div>
            </details>
        `).join("");
}

/* --- RULES (FIXED DROPDOWN) --- */
function renderRules() {
    const q = document.getElementById("ruleSearch").value.toLowerCase();
    const list = document.getElementById("ruleList");
    
    list.innerHTML = RULES
        .filter(r => r.name.toLowerCase().includes(q))
        .map(r => `
            <details class="card" onclick="if(!this.dataset.loaded) fetchItemData('${r.index}', this, 'conditions')">
                <summary>${r.name}</summary>
                <div class="drop-data">Loading...</div>
            </details>
        `).join("");
}

// Unified fetch function for both spells and rules
async function fetchItemData(index, el, category) {
    el.dataset.loaded = "true";
    try {
        const res = await fetch(`https://www.dnd5eapi.co/api/${category}/${index}`);
        const d = await res.json();
        
        let content = "";
        if (category === "spells") {
            content = `<p style="color:#888; font-size:0.9rem;">Level ${d.level} | ${d.school.name}</p>`;
        }
        content += `<p>${d.desc ? d.desc.join("<br><br>") : "No description available in the SRD API."}</p>`;
        
        el.querySelector(".drop-data").innerHTML = content;
    } catch (err) {
        el.querySelector(".drop-data").innerHTML = "Error loading data.";
    }
}

function saveCharacterData() {
    alert("Character data packaged for travel!");
}
