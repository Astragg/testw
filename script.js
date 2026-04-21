/* =========================
   GLOBAL STATE
========================= */
let CLASSES = [];
let SPELLS = [];
let RULES = [];
let currentStats = rollStats();

/* =========================
   INITIALIZATION
========================= */
async function loadData() {
    try {
        console.log("Fetching SRD Data...");
        const [cRes, spRes, rRes] = await Promise.all([
            fetch("https://www.dnd5eapi.co/api/classes"),
            fetch("https://www.dnd5eapi.co/api/spells"),
            fetch("https://www.dnd5eapi.co/api/conditions")
        ]);

        const cData = await cRes.json();
        const spData = await spRes.json();
        const rData = await rRes.json();

        CLASSES = cData.results;
        SPELLS = spData.results;
        RULES = rData.results;

        populateClasses();
        renderSpells();
        renderRules();
        rerollStats(); // Initial stat roll
        
        console.log("Ready!");
    } catch (err) {
        console.error("API Error:", err);
    }
}

/* =========================
   UI & NAVIGATION
========================= */
function showTab(id) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

/* =========================
   CLASS & SUBCLASS LOGIC
========================= */
function populateClasses() {
    const sel = document.getElementById("class");
    sel.innerHTML = "";
    CLASSES.forEach(c => {
        const o = document.createElement("option");
        o.value = c.index; // 'wizard', 'fighter', etc.
        o.text = c.name;
        sel.add(o);
    });
    updateSubclasses();
}

document.getElementById("class").addEventListener("change", updateSubclasses);

async function updateSubclasses() {
    const classIndex = document.getElementById("class").value;
    const sel = document.getElementById("subclass");
    sel.innerHTML = "<option>Loading...</option>";

    try {
        const res = await fetch(`https://www.dnd5eapi.co/api/classes/${classIndex}/subclasses`);
        const data = await res.json();
        sel.innerHTML = "";
        
        if (data.results.length === 0) {
            sel.innerHTML = "<option value='none'>No Subclasses in SRD</option>";
        } else {
            data.results.forEach(s => {
                const o = document.createElement("option");
                o.value = s.index;
                o.text = s.name;
                sel.add(o);
            });
        }
    } catch (e) {
        sel.innerHTML = "<option>Error loading subclasses</option>";
    }
}

/* =========================
   CHARACTER MECHANICS
========================= */
function rollStats() {
    const roll4d6kh3 = () => {
        let rolls = Array.from({length: 4}, () => Math.floor(Math.random() * 6) + 1);
        return rolls.sort().slice(1).reduce((a, b) => a + b, 0);
    };
    return {
        STR: roll4d6kh3(), DEX: roll4d6kh3(), CON: roll4d6kh3(),
        INT: roll4d6kh3(), WIS: roll4d6kh3(), CHA: roll4d6kh3()
    };
}

function rerollStats() {
    currentStats = rollStats();
    document.getElementById("statPreview").innerHTML = 
        Object.entries(currentStats).map(([k, v]) => `<b>${k}:</b> ${v}`).join(" | ");
}

const getMod = (score) => Math.floor((score - 10) / 2);

function generateCharacter() {
    const name = document.getElementById("name").value || "Nameless Hero";
    const classEl = document.getElementById("class");
    const subEl = document.getElementById("subclass");
    
    const className = classEl.options[classEl.selectedIndex].text;
    const subName = subEl.options[subEl.selectedIndex]?.text || "None";
    const lvl = +document.getElementById("level").value;

    const hp = 10 + (lvl * 5) + (lvl * getMod(currentStats.CON));

    document.getElementById("sheetOutput").innerHTML = `
        <div class="card">
            <h2>${name}</h2>
            <p>${className} (${subName}) | Level ${lvl}</p>
            <hr>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><b>HP:</b> ${hp}</div>
                <div><b>AC:</b> ${10 + getMod(currentStats.DEX)}</div>
            </div>
        </div>
        <div class="card">
            <h3>Ability Scores</h3>
            ${Object.entries(currentStats).map(([k, v]) => `
                <div><b>${k}:</b> ${v} (Modifier: ${getMod(v) >= 0 ? '+' : ''}${getMod(v)})</div>
            `).join("")}
        </div>
        <button class="primary-btn" onclick="window.print()">Print Sheet</button>
    `;
    showTab("sheet");
}

/* =========================
   SPELLS & RULES
========================= */
document.getElementById("spellSearch").addEventListener("input", renderSpells);

function renderSpells() {
    const query = document.getElementById("spellSearch").value.toLowerCase();
    const list = document.getElementById("spellList");
    list.innerHTML = SPELLS
        .filter(s => s.name.toLowerCase().includes(query))
        .slice(0, 30)
        .map(s => `<div class="card" style="cursor:pointer" onclick="loadSpell('${s.index}')">${s.name}</div>`)
        .join("");
}

async function loadSpell(index) {
    const res = await fetch(`https://www.dnd5eapi.co/api/spells/${index}`);
    const d = await res.json();
    document.getElementById("spellDetails").innerHTML = `
        <h3>${d.name}</h3>
        <p><i>Level ${d.level} ${d.school.name}</i></p>
        <p><b>Range:</b> ${d.range} | <b>Casting:</b> ${d.casting_time}</p>
        <p>${d.desc.join("<br><br>")}</p>
    `;
}

document.getElementById("ruleSearch").addEventListener("input", renderRules);

function renderRules() {
    const query = document.getElementById("ruleSearch").value.toLowerCase();
    document.getElementById("ruleList").innerHTML = RULES
        .filter(r => r.name.toLowerCase().includes(query))
        .map(r => `<div class="card"><b>${r.name}</b><br><small>${r.desc.join(" ")}</small></div>`)
        .join("");
}

// Kickoff
loadData();
