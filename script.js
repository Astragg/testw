/* =========================
   DATA STORAGE
========================= */
let CLASSES = [];
let SUBCLASSES = [];
let SPELLS = [];
let RULES = [];

/* =========================
   CLASS RULES (custom logic layer)
========================= */
const CLASS_RULES = {
  Barbarian: {
    forbiddenClasses: ["Wizard"]
  },
  Wizard: {
    forbiddenClasses: ["Barbarian"]
  }
};

/* =========================
   INIT LOAD (API)
========================= */
async function loadData() {
  try {
    // ---- CLASSES ----
    const cRes = await fetch("https://www.dnd5eapi.co/api/classes");
    const cData = await cRes.json();
    CLASSES = cData.results || [];

    // ---- SUBCLASSES ----
    const sRes = await fetch("https://www.dnd5eapi.co/api/subclasses");
    const sData = await sRes.json();
    SUBCLASSES = sData.results || [];

    // ---- SPELLS (LIST ONLY - SAFE) ----
    const spRes = await fetch("https://www.dnd5eapi.co/api/spells");
    const spData = await spRes.json();
    SPELLS = spData.results || [];

    // ---- RULES (CONDITIONS) ----
    const rRes = await fetch("https://www.dnd5eapi.co/api/conditions");
    const rData = await rRes.json();
    RULES = rData.results || [];

    populateClasses();
    renderSpells();
    renderRules();

    console.log("SRD loaded successfully");

  } catch (err) {
    console.error("API load error:", err);
  }
}

/* =========================
   UI - TABS
========================= */
function showTab(id) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* =========================
   CLASSES + SUBCLASSES FIX
========================= */
function populateClasses() {
  const sel = document.getElementById("class");
  sel.innerHTML = "";

  CLASSES.forEach(c => {
    const o = document.createElement("option");
    o.text = c.name;
    sel.add(o);
  });

  updateSubclasses();
}

document.getElementById("class").addEventListener("change", updateSubclasses);

function updateSubclasses() {
  const cls = document.getElementById("class").value;
  const sel = document.getElementById("subclass");
  sel.innerHTML = "";

  SUBCLASSES
    .filter(s => s.class?.name?.toLowerCase() === cls.toLowerCase())
    .forEach(s => {
      const o = document.createElement("option");
      o.text = s.name;
      sel.add(o);
    });
}

/* =========================
   CHARACTER GENERATION
========================= */
function generateCharacter() {
  const name = document.getElementById("name").value || "Hero";
  const cls = document.getElementById("class").value;
  const sub = document.getElementById("subclass").value;
  const lvl = +document.getElementById("level").value;

  // ---- CLASS RESTRICTION CHECK ----
  for (let key in CLASS_RULES) {
    if (key === cls) {
      const forbidden = CLASS_RULES[key].forbiddenClasses || [];
      if (forbidden.includes(cls)) {
        alert("Invalid class combination detected by rules.");
        return;
      }
    }
  }

  const hp = 10 + lvl * 5;

  document.getElementById("sheet").innerHTML = `
    <div class="card">
      <b>${name}</b><br>
      Class: ${cls}<br>
      Subclass: ${sub}<br>
      Level: ${lvl}
    </div>

    <div class="card">
      HP: ${hp}
    </div>

    <button onclick="exportCharacter()">Export JSON</button>
  `;

  showTab("sheet");
}

/* =========================
   SPELL LIST (SAFE RENDER)
========================= */
document.getElementById("spellSearch").addEventListener("input", renderSpells);

function renderSpells() {
  const q = document.getElementById("spellSearch").value.toLowerCase();

  document.getElementById("spellList").innerHTML = SPELLS
    .filter(s => s.name.toLowerCase().includes(q))
    .slice(0, 50)
    .map(s => `
      <div class="card" onclick="loadSpell('${s.index}')">
        ${s.name}
      </div>
    `)
    .join("");
}

/* =========================
   SPELL DETAILS (ON CLICK)
========================= */
async function loadSpell(index) {
  try {
    const res = await fetch(`https://www.dnd5eapi.co/api/spells/${index}`);
    const data = await res.json();

    document.getElementById("spellDetails").innerHTML = `
      <div class="card">
        <b>${data.name}</b><br>
        Level: ${data.level}<br>
        School: ${data.school?.name || "Unknown"}<br>
        Range: ${data.range}<br>
        Casting Time: ${data.casting_time}<br>
        Duration: ${data.duration}<br><br>
        ${data.desc?.join("<br>") || ""}
      </div>
    `;
  } catch (err) {
    console.error("Spell load error:", err);
  }
}

/* =========================
   RULES TAB
========================= */
document.getElementById("ruleSearch").addEventListener("input", renderRules);

function renderRules() {
  const q = document.getElementById("ruleSearch").value.toLowerCase();

  document.getElementById("ruleList").innerHTML = RULES
    .filter(r => r.name.toLowerCase().includes(q))
    .map(r => `
      <div class="card">
        <b>${r.name}</b><br>
        ${r.desc?.join(" ") || ""}
      </div>
    `)
    .join("");
}

/* =========================
   EXPORT JSON
========================= */
function exportCharacter() {
  const data = {
    name: document.getElementById("name").value,
    class: document.getElementById("class").value,
    subclass: document.getElementById("subclass").value,
    level: document.getElementById("level").value
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "character.json";
  a.click();
}

/* =========================
   START
========================= */
loadData();
