let CLASSES = [];
let SPELLS = [];
let RULES = [];

// 1. SAFE LOADING
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    
    // Attach listeners safely after DOM is ready
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

// 2. THE CHARACTER SHEET (WITH COMBAT BLOCKS)
function generateCharacter() {
    const name = document.getElementById("charName").value || "Hero";
    const classIndex = document.getElementById("classSelect").value;
    const className = document.getElementById("classSelect").options[document.getElementById("classSelect").selectedIndex].text;
    const lvl = parseInt(document.getElementById("levelInput").value);

    // Combat Logic
    let weapon = (className === "Wizard" || className === "Sorcerer") ? "Quarterstaff" : "Longsword";
    let atkMod = (className === "Fighter" || className === "Barbarian") ? "+5" : "+3";
    let dmg = (className === "Fighter") ? "1d10 + 3" : "1d6 + 1";
    
    // Fighter/Martial scaling
    let actions = "1 Action";
    if (className === "Fighter" || className === "Barbarian" || className === "Paladin") {
        if (lvl >= 5) actions = "2 Actions (Extra Attack)";
    }
    let special = (className === "Fighter" && lvl >= 2) ? "<li><b>Action Surge:</b> Take one extra action (1/Short Rest)</li>" : "";

    document.getElementById("sheetOutput").innerHTML = `
        <div class="card">
            <h2 style="margin:0; color:#b71c1c;">${name}</h2>
            <p>Level ${lvl} ${className}</p>
        </div>

        <div class="card">
            <h3 style="border-bottom:1px solid #444; padding-bottom:5px;">Attacks</h3>
            <table width="100%">
                <tr style="text-align:left; font-size:0.8rem; color:#888;">
                    <th>Weapon</th><th>Atk</th><th>Damage</th>
                </tr>
                <tr>
                    <td><b>${weapon}</b></td><td>${atkMod}</td><td>${dmg}</td>
                </tr>
                <tr>
                    <td>Unarmed</td><td>+4</td><td>1 + Str</td>
                </tr>
            </table>
        </div>

        <div class="card">
            <h3>Actions & Features</h3>
            <ul style="padding-left:18px;">
                <li><b>Multiattack:</b> ${actions}</li>
                ${special}
                <li><b>Bonus Action:</b> Off-hand attack or class feature</li>
            </ul>
        </div>

        <div class="card">
            <h3>Magic (Cantrips)</h3>
            <p style="margin:0; font-style:italic;">Guidance, Mage Hand, Shocking Grasp</p>
        </div>

        <button class="primary-btn" onclick="saveCharacterData()">Save JSON</button>
    `;
    showTab("sheet");
}

// 3. SPELLS WITH CUSTOM ARROWS
function renderSpells() {
    const q = document.getElementById("spellSearch").value.toLowerCase();
    const list = document.getElementById("spellList");
    
    list.innerHTML = SPELLS
        .filter(s => s.name.toLowerCase().includes(q))
        .slice(0, 20)
        .map(s => `
            <details class="card" onclick="if(!this.dataset.loaded) fetchSpell('${s.index}', this)">
                <summary>${s.name}</summary>
                <div class="spell-data">Loading...</div>
            </details>
        `).join("");
}

async function fetchSpell(index, el) {
    el.dataset.loaded = "true";
    const res = await fetch(`https://www.dnd5eapi.co/api/spells/${index}`);
    const d = await res.json();
    el.querySelector(".spell-data").innerHTML = `
        <p style="color:#888; font-size:0.9rem;">Level ${d.level} | ${d.school.name}</p>
        <p>${d.desc ? d.desc.join("<br><br>") : "No info."}</p>
    `;
}

// 4. RULES (PATCHED JOIN ERROR)
function renderRules() {
    const q = document.getElementById("ruleSearch").value.toLowerCase();
    const list = document.getElementById("ruleList");
    
    list.innerHTML = RULES
        .filter(r => r.name.toLowerCase().includes(q))
        .map(r => `
            <div class="card">
                <b>${r.name}</b><br>
                <small>${r.desc ? r.desc.join(" ") : "Refer to Player's Handbook."}</small>
            </div>
        `).join("");
}

function saveCharacterData() {
    alert("Character data packaged for travel!");
}
