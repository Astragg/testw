// ===== UTILS =====
const mod = s => Math.floor((s - 10) / 2);
const prof = lvl =>
  lvl <= 4 ? 2 :
  lvl <= 8 ? 3 :
  lvl <= 12 ? 4 :
  lvl <= 16 ? 5 : 6;

function calcHP(hitDie, level, conMod) {
  let avg = Math.ceil(hitDie / 2) + 1;
  return hitDie + conMod + (level - 1) * (avg + conMod);
}

// ===== UI =====
function showTab(id) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ===== GENERATOR =====
function generateCharacter() {
  let race = raceSel.value;
  let cls = classSel.value;
  let lvl = +levelInput.value;

  let stats = { str:15, dex:14, con:13, int:12, wis:10, cha:8 };

  // apply race
  let r = RACES[race];
  if (r.all) Object.keys(stats).forEach(k => stats[k] += r.all);
  else Object.keys(r).forEach(k => { if(stats[k]!=null) stats[k]+=r[k]; });

  let mods = {};
  Object.keys(stats).forEach(k => mods[k] = mod(stats[k]));

  let hp = calcHP(CLASSES[cls].hitDie, lvl, mods.con);
  let ac = 10 + mods.dex;
  let attack = prof(lvl) + mods[CLASSES[cls].primary];

  let spells = SPELL_DB.filter(s =>
    s.classes.includes(cls) && s.level <= Math.ceil(lvl / 2)
  );

  let items = ITEMS.sort(() => 0.5 - Math.random()).slice(0, 2);

  let char = {
    name: nameInput.value || "Hero",
    race, cls, lvl,
    stats, hp, ac, attack,
    spells, items
  };

  localStorage.setItem("char", JSON.stringify(char));
  renderSheet(char);
}

// ===== SHEET =====
function renderSheet(c) {
  sheetView.innerHTML = `
    <div class="card"><b>${c.name}</b><br>${c.race} ${c.cls} lvl ${c.lvl}</div>
    <div class="card">HP: ${c.hp} | AC: ${c.ac} | ATK: ${c.attack}</div>
    <div class="card">Stats: ${JSON.stringify(c.stats)}</div>
    <div class="card">Items: ${c.items.map(i=>i.name).join(", ")}</div>
    <div class="card">Spells: ${c.spells.map(s=>s.name).join(", ")}</div>
  `;
}

// ===== SPELLS =====
function renderSpells() {
  let q = spellSearch.value.toLowerCase();
  spellList.innerHTML = SPELL_DB
    .filter(s => s.name.toLowerCase().includes(q))
    .map(s => `<div class="card"><b>${s.name}</b> (lvl ${s.level})<br>${s.desc}</div>`)
    .join("");
}

// ===== RULES =====
function renderRules() {
  let q = ruleSearch.value.toLowerCase();
  ruleList.innerHTML = RULES
    .filter(r => r.name.toLowerCase().includes(q))
    .map(r => `<div class="card"><b>${r.name}</b><br>${r.desc}</div>`)
    .join("");
}

// ===== INIT =====
function init() {
  window.raceSel = document.getElementById("race");
  window.classSel = document.getElementById("class");
  window.levelInput = document.getElementById("level");
  window.nameInput = document.getElementById("name");

  window.sheetView = document.getElementById("sheetView");
  window.spellSearch = document.getElementById("spellSearch");
  window.spellList = document.getElementById("spellList");
  window.ruleSearch = document.getElementById("ruleSearch");
  window.ruleList = document.getElementById("ruleList");

  Object.keys(RACES).forEach(r => {
    let o = document.createElement("option");
    o.text = r;
    raceSel.add(o);
  });

  Object.keys(CLASSES).forEach(c => {
    let o = document.createElement("option");
    o.text = c;
    classSel.add(o);
  });

  spellSearch.oninput = renderSpells;
  ruleSearch.oninput = renderRules;

  renderSpells();
  renderRules();

  let saved = localStorage.getItem("char");
  if (saved) renderSheet(JSON.parse(saved));
}

init();
