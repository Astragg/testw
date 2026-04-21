let CLASSES = [];
let SUBCLASSES = [];
let SPELLS = [];
let RULES = [];

// -------------------- LOAD DATA --------------------
async function loadData() {
  try {
    // CLASSES
    let c = await fetch("https://www.dnd5eapi.co/api/classes");
    let cd = await c.json();
    CLASSES = cd.results || [];

    // SUBCLASSES
    let s = await fetch("https://www.dnd5eapi.co/api/subclasses");
    let sd = await s.json();
    SUBCLASSES = sd.results || [];

    // SPELL LIST (lightweight list only)
    let sp = await fetch("https://www.dnd5eapi.co/api/spells");
    let spd = await sp.json();
    SPELLS = spd.results || [];

    // CONDITIONS (rules tab)
    let r = await fetch("https://www.dnd5eapi.co/api/conditions");
    let rd = await r.json();
    RULES = rd.results || [];

    populateClasses();
    renderSpells();
    renderRules();

    console.log("Loaded SRD data successfully");

  } catch (err) {
    console.error("Load failed:", err);
  }
}

// -------------------- UI --------------------
function showTab(id) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// -------------------- CLASSES --------------------
function populateClasses() {
  let sel = document.getElementById("class");
  sel.innerHTML = "";

  CLASSES.forEach(c => {
    let o = document.createElement("option");
    o.text = c.name;
    sel.add(o);
  });

  updateSubclasses();
}

document.getElementById("class").addEventListener("change", updateSubclasses);

function updateSubclasses() {
  let cls = document.getElementById("class").value;
  let sel = document.getElementById("subclass");
  sel.innerHTML = "";

  SUBCLASSES
    .filter(s => s.class.name === cls)
    .forEach(s => {
      let o = document.createElement("option");
      o.text = s.name;
      sel.add(o);
    });
}

// -------------------- CHARACTER --------------------
function generateCharacter() {
  let name = document.getElementById("name").value || "Hero";
  let cls = document.getElementById("class").value;
  let sub = document.getElementById("subclass").value;
  let lvl = +document.getElementById("level").value;

  let hp = 10 + lvl * 5;

  document.getElementById("sheet").innerHTML = `
    <div class="card">
      <b>${name}</b><br>
      ${cls} (${sub})<br>
      Level ${lvl}
    </div>

    <div class="card">
      HP: ${hp}
    </div>
  `;

  showTab("sheet");
}

// -------------------- SPELL LIST --------------------
document.getElementById("spellSearch").addEventListener("input", renderSpells);

function renderSpells() {
  let q = document.getElementById("spellSearch").value.toLowerCase();

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

// -------------------- SPELL DETAILS --------------------
async function loadSpell(index) {
  let res = await fetch(`https://www.dnd5eapi.co/api/spells/${index}`);
  let data = await res.json();

  document.getElementById("spellDetails").innerHTML = `
    <b>${data.name}</b><br>
    Level: ${data.level}<br>
    Range: ${data.range}<br>
    Duration: ${data.duration}<br>
    <br>
    ${data.desc?.join("<br>") || ""}
  `;
}

// -------------------- RULES --------------------
document.getElementById("ruleSearch").addEventListener("input", renderRules);

function renderRules() {
  let q = document.getElementById("ruleSearch").value.toLowerCase();

  document.getElementById("ruleList").innerHTML = RULES
    .filter(r => r.name.toLowerCase().includes(q))
    .map(r => `
      <div class="card">
        <b>${r.name}</b>
      </div>
    `)
    .join("");
}

// -------------------- START --------------------
loadData();
