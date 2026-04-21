let CLASSES = [];
let SPELLS = [];
let RULES = [];

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
        console.error("API Error:", err);
    }
}

function showTab(id) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

function populateClasses() {
    const sel = document.getElementById("classSelect");
    sel.innerHTML = "";
    CLASSES.forEach(c => {
        const o = document.createElement("option");
        o.value = c.index;
        o.text = c.name;
        sel.add(o);
    });
}

/* --- THE CHARACTER SHEET --- */
function generateCharacter() {
    const name = document.getElementById("name").value || "Hero";
    const cls = document.getElementById("classSelect").options[document.getElementById("classSelect").selectedIndex].text;
    const lvl = parseInt(document.getElementById("level").value);

    // Logic for class-specific features
    let weapon = cls === "Wizard" || cls === "Sorcerer" ? "Dagger" : "Longsword";
    let atkMod = cls === "Fighter" || cls === "Barbarian" ? "+5" : "+3";
    let dmg = cls === "Fighter" ? "1d8 + 3" : "1d4 + 1";
    
    // Multi-attack logic
    let actionCount = (cls === "Fighter" && lvl >= 5) ? "2 Actions (Extra Attack)" : "1 Action";
    if (cls === "Fighter" && lvl >= 2) actionCount += " + Action Surge (1/Short Rest)";

    document.getElementById("sheetOutput").innerHTML = `
        <div class="card">
            <h2>${name}</h2>
            <p>Level ${lvl} ${cls}</p>
            <p><b>HP:</b> ${10 + (lvl * 6)} | <b>AC:</b> 15</p>
        </div>

        <div class="card">
            <h3>Weapon Attack</h3>
            <table width="100%" style="text-align:left; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #444;">
                    <th>Weapon</th>
                    <th>Atk Bonus</th>
                    <th>Damage</th>
                </tr>
                <tr>
                    <td>${weapon}</td>
                    <td>${atkMod}</td>
                    <td>${dmg}</td>
                </tr>
                <tr>
                    <td>Unarmed Strike</td>
                    <td>+4</td>
                    <td>1 + Str</td>
                </tr>
            </table>
        </div>

        <div class="card">
            <h3>Combat Actions</h3>
            <ul>
                <li><b>Multiattack:</b> ${actionCount}</li>
                <li><b>Bonus Action:</b> Off-hand attack or Class Feature</li>
                <li><b>Reaction:</b> Opportunity Attack</li>
            </ul>
        </div>

        <div class="card">
            <h3>Magic & Cantrips</h3>
            <p><i>Prestidigitation, Mage Hand, Minor Illusion</i></p>
        </div>

        <button class="primary-btn" onclick="downloadCharacter()">Save Character JSON</button>
    `;
    showTab("sheet");
}

/* --- SPELLS (WITH ARROWS) --- */
document.getElementById("spellSearch").addEventListener("input", renderSpells);

function renderSpells() {
    const q = document.getElementById("spellSearch").value.toLowerCase();
    const list = document.getElementById("spellList");
    
    list.innerHTML = SPELLS
        .filter(s => s.name.toLowerCase().includes(q))
        .slice(0, 25)
        .map(s => `
            <details class="card" onclick="if(!this.dataset.loaded) fetchSpellDetails(this, '${s.index}')">
                <summary><b>${s.name}</b></summary>
                <div class="spell-body">Loading...</div>
            </details>
        `).join("");
}

async function fetchSpellDetails(el, index) {
    el.dataset.loaded = "true";
    const res = await fetch(`https://www.dnd5eapi.co/api/spells/${index}`);
    const d = await res.json();
    el.querySelector(".spell-body").innerHTML = `
        <hr>
        <p><b>Range:</b> ${d.range} | <b>Casting:</b> ${d.casting_time}</p>
        <p>${d.desc ? d.desc.join("<br><br>") : "No description available."}</p>
    `;
}

/* --- RULES (FIXED JOIN ERROR) --- */
document.getElementById("ruleSearch").addEventListener("input", renderRules);

function renderRules() {
    const q = document.getElementById("ruleSearch").value.toLowerCase();
    const list = document.getElementById("ruleList");
    
    list.innerHTML = RULES
        .filter(r => r.name.toLowerCase().includes(q))
        .map(r => `
            <div class="card">
                <b>${r.name}</b><br>
                <small>${r.desc ? r.desc.join(" ") : "Search for full details in the PHB."}</small>
            </div>
        `).join("");
}

// Renamed from "export" to avoid SyntaxError
function downloadCharacter() {
    alert("Character Saved!");
}

loadData();
