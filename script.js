let CLASSES = [];
let SPELLS = [];
let RULES = [];
let currentStats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

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

/* --- CLASS LOGIC --- */
function populateClasses() {
    const sel = document.getElementById("class");
    sel.innerHTML = "";
    CLASSES.forEach(c => {
        const o = document.createElement("option");
        o.value = c.index;
        o.text = c.name;
        sel.add(o);
    });
    updateSubclasses();
}

document.getElementById("class").addEventListener("change", updateSubclasses);

async function updateSubclasses() {
    const cls = document.getElementById("class").value;
    const sel = document.getElementById("subclass");
    sel.innerHTML = "<option>Loading...</option>";
    
    const res = await fetch(`https://www.dnd5eapi.co/api/classes/${cls}/subclasses`);
    const data = await res.json();
    
    sel.innerHTML = "";
    data.results.forEach(s => {
        const o = document.createElement("option");
        o.text = s.name;
        sel.add(o);
    });
}

/* --- GENERATION --- */
function generateCharacter() {
    const name = document.getElementById("name").value || "Hero";
    const cls = document.getElementById("class").options[document.getElementById("class").selectedIndex].text;
    const sub = document.getElementById("subclass").value;
    const lvl = document.getElementById("level").value;

    // Use sheetOutput as the target
    document.getElementById("sheetOutput").innerHTML = `
        <div class="card">
            <h2>${name}</h2>
            <p>Level ${lvl} ${cls}</p>
            <p><b>Subclass:</b> ${sub}</p>
            <p><b>HP:</b> ${10 + (lvl * 5)}</p>
        </div>
    `;
    showTab("sheet");
}

/* --- SPELLS WITH DROPDOWN --- */
document.getElementById("spellSearch").addEventListener("input", renderSpells);

function renderSpells() {
    const q = document.getElementById("spellSearch").value.toLowerCase();
    const list = document.getElementById("spellList");
    
    list.innerHTML = SPELLS
        .filter(s => s.name.toLowerCase().includes(q))
        .slice(0, 30) // Performance limit
        .map(s => `
            <details class="card" onclick="if(!this.dataset.loaded) fetchDetails(this, '${s.index}')">
                <summary><b>${s.name}</b></summary>
                <div class="details-content">Loading spell secrets...</div>
            </details>
        `).join("");
}

async function fetchDetails(el, index) {
    el.dataset.loaded = "true";
    const res = await fetch(`https://www.dnd5eapi.co/api/spells/${index}`);
    const d = await res.json();
    el.querySelector(".details-content").innerHTML = `
        <hr>
        <p><i>Level ${d.level} ${d.school.name}</i></p>
        <p>${d.desc ? d.desc.join("<br><br>") : "No description."}</p>
    `;
}

/* --- RULES --- */
document.getElementById("ruleSearch").addEventListener("input", renderRules);

function renderRules() {
    const q = document.getElementById("ruleSearch").value.toLowerCase();
    const list = document.getElementById("ruleList");
    
    list.innerHTML = RULES
        .filter(r => r.name.toLowerCase().includes(q))
        .map(r => `
            <div class="card">
                <b>${r.name}</b><br>
                <small>${r.desc ? r.desc.join(" ") : "No extra rules info."}</small>
            </div>
        `).join("");
}

loadData();
