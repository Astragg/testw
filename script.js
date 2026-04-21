let SPELLS = [];
let CLASSES = [];
let SUBCLASSES = [];
let RULES = [];

// ===== LOAD DATA =====
async function loadData() {

  // Classes
  let classRes = await fetch("https://www.dnd5eapi.co/api/classes");
  let classData = await classRes.json();
  CLASSES = classData.results;

  // Subclasses
  let subRes = await fetch("https://www.dnd5eapi.co/api/subclasses");
  let subData = await subRes.json();
  SUBCLASSES = subData.results;

  // Spells (full details)
  let spellRes = await fetch("https://www.dnd5eapi.co/api/spells");
  let spellData = await spellRes.json();
  SPELLS = await Promise.all(
    spellData.results.map(s =>
      fetch("https://www.dnd5eapi.co" + s.url).then(r => r.json())
    )
  );

  // Rules (conditions)
  let ruleRes = await fetch("https://www.dnd5eapi.co/api/conditions");
  let ruleData = await ruleRes.json();
  RULES = await Promise.all(
    ruleData.results.map(r =>
      fetch("https://www.dnd5eapi.co" + r.url).then(x => x.json())
    )
  );

  populateClasses();
  renderSpells();
  renderRules();
}

// ===== UI =====
function showTab(id) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

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

// ===== GENERATOR =====
function generateCharacter() {
  let name = document.getElementById("name").value || "Hero";
  let cls = document.getElementById("class").value;
  let sub = document.getElementById("subclass").value;
  let lvl = +document.getElementById("level").value;

  let hp = 10 + lvl * 5;

  let classSpells = SPELLS.filter(s =>
    s.classes?.some(c => c.name === cls)
  ).slice(0, 6);

  document.getElementById("sheet").innerHTML = `
    <div class="card">
      <b>${name}</b><br>
      ${cls} (${sub}) - Level ${lvl}
    </div>

    <div class="card">
      <b>HP:</b> ${hp}
    </div>

    <div class="card">
      <b>Spells:</b><br>
      ${classSpells.map(s => s.name).join(", ")}
    </div>
  `;

  showTab("sheet");
}

// ===== SPELLS =====
document.getElementById("spellSearch").addEventListener("input", renderSpells);

function renderSpells() {
  let q = document.getElementById("spellSearch").value.toLowerCase();

  document.getElementById("spellList").innerHTML = SPELLS
    .filter(s => s.name.toLowerCase().includes(q))
    .slice(0, 50)
    .map(s => `
      <div class="card">
        <b>${s.name}</b> (Level ${s.level})<br>
        ${s.desc ? s.desc[0] : ""}
      </div>
    `)
    .join("");
}

// ===== RULES =====
document.getElementById("ruleSearch").addEventListener("input", renderRules);

function renderRules() {
  let q = document.getElementById("ruleSearch").value.toLowerCase();

  document.getElementById("ruleList").innerHTML = RULES
    .filter(r => r.name.toLowerCase().includes(q))
    .map(r => `
      <div class="card">
        <b>${r.name}</b><br>
        ${r.desc.join(" ")}
      </div>
    `)
    .join("");
}

// START
loadData();
