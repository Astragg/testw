let SPELLS = [];
let CLASSES = [];

// ===== LOAD DATA =====
async function loadData() {
  // Try cache first
  if (localStorage.getItem("spells")) {
    SPELLS = JSON.parse(localStorage.getItem("spells"));
    CLASSES = JSON.parse(localStorage.getItem("classes"));
    populateClasses();
    renderSpells();
    return;
  }

  // Fetch classes
  let classRes = await fetch("https://www.dnd5eapi.co/api/classes");
  let classData = await classRes.json();

  CLASSES = await Promise.all(
    classData.results.map(c =>
      fetch("https://www.dnd5eapi.co" + c.url).then(r => r.json())
    )
  );

  // Fetch spells
  let spellRes = await fetch("https://www.dnd5eapi.co/api/spells");
  let spellData = await spellRes.json();

  SPELLS = await Promise.all(
    spellData.results.map(s =>
      fetch("https://www.dnd5eapi.co" + s.url).then(r => r.json())
    )
  );

  // Save to cache
  localStorage.setItem("spells", JSON.stringify(SPELLS));
  localStorage.setItem("classes", JSON.stringify(CLASSES));

  populateClasses();
  renderSpells();
}

// ===== UI =====
function populateClasses() {
  let sel = document.getElementById("class");
  sel.innerHTML = "";
  CLASSES.forEach(c => {
    let o = document.createElement("option");
    o.text = c.name;
    sel.add(o);
  });
}

// ===== GENERATE CHARACTER =====
function generateCharacter() {
  let name = document.getElementById("name").value || "Hero";
  let cls = document.getElementById("class").value;
  let lvl = +document.getElementById("level").value;

  let hp = 10 + lvl * 5;

  let classSpells = SPELLS.filter(s =>
    s.classes?.some(c => c.name === cls)
  ).slice(0, 6);

  document.getElementById("sheet").innerHTML = `
    <div class="card">
      <b>${name}</b><br>
      ${cls} Level ${lvl}<br>
      HP: ${hp}
    </div>

    <div class="card">
      <b>Spells:</b><br>
      ${classSpells.map(s => s.name).join(", ")}
    </div>
  `;
}

// ===== SPELL SEARCH =====
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

// START
loadData();
