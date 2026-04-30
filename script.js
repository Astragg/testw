const URL = 'https://prngglvbtvijbpxydupd.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybmdnbHZidHZpamJweHlkdXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTY4MjQsImV4cCI6MjA5MzA3MjgyNH0.y0iZ00nlsiXk_aAVVlW6FZdO3yjjJrVZZVHBgfZZ5io';

const _sb = supabase.createClient(URL, KEY);

let user = null;
let signUpMode = false;
let profiles = [];

// 1. AUTH OBSERVER
_sb.auth.onAuthStateChange((_, session) => {
    user = session?.user || null;
    const panel = document.getElementById('authArea');
    const addBtn = document.getElementById('addBtn');
    
    if (panel) {
        if (user) {
            panel.innerHTML = `<span style="font-size:0.7rem; color:#888; margin-right:10px;">${user.email}</span> <button class="btn-text" onclick="signOut()">Logout</button>`;
            if (addBtn) addBtn.style.display = 'block';
        } else {
            panel.innerHTML = `<button class="btn-create" onclick="toggleModal('authModal')">Login</button>`;
            if (addBtn) addBtn.style.display = 'none';
        }
    }
});

async function handleAuth() {
    const email = document.getElementById('aEmail').value;
    const pass = document.getElementById('aPass').value;
    const { error } = signUpMode ? await _sb.auth.signUp({email, password: pass}) : await _sb.auth.signInWithPassword({email, password: pass});
    if (error) alert(error.message); else closeModal('authModal');
}

async function signOut() {
    await _sb.auth.signOut();
    window.location.reload();
}

// 2. DATA LOADING
async function init() {
    console.log("ApexScout: Initializing Data...");
    const { data, error } = await _sb.from('players').select('*').order('created_at', { ascending: false });
    
    if (error) {
        console.error("Supabase Error:", error.message);
        document.getElementById('grid').innerHTML = `<p style="text-align:center; color:red; width:100%;">Database Connection Error: ${error.message}</p>`;
        return;
    }

    profiles = data || [];
    render(profiles);
}

function render(list) {
    const grid = document.getElementById('grid');
    if (!grid) return;

    if (list.length === 0) {
        grid.innerHTML = `<div style="text-align:center; width:100%; padding:50px; color:#888;">
            <h3>No Athletes Found</h3>
            <p>Login and click "+ Create Profile" to add the first athlete to ApexScout.</p>
        </div>`;
        return;
    }

    grid.innerHTML = list.map(p => `
        <div class="player-card">
            <div class="c-header"><span class="tag">Player Profile</span><h2>${p.name}</h2><p>${p.position} • Class of ${p.class_year} • #${p.number}</p></div>
            
            <div class="data-table">
                <div class="row"><span>Height</span><b>${p.height || '--'}</b></div>
                <div class="row"><span>Weight</span><b>${p.weight || '--'} LB</b></div>
                <div class="row"><span>Age</span><b>${p.age || '--'} YRS</b></div>
                <div class="row"><span>From</span><b>${p.location || 'Global'}</b></div>
                <div class="row"><span>State Rank</span><b>${p.rank || 'Unranked'}</b></div>
            </div>

            <div class="avg-grid">
                <div class="avg-box"><small>PTS</small><b>${p.averages?.pts || '0'} PPG</b></div>
                <div class="avg-box"><small>AST</small><b>${p.averages?.ast || '0'} APG</b></div>
                <div class="avg-box"><small>REB</small><b>${p.averages?.reb || '0'} RPG</b></div>
                <div class="avg-box"><small>TIME</small><b>${p.averages?.time || '0.00'}</b></div>
            </div>

            <div class="arch-box"><span>Archetype</span><strong>${p.archetype || 'Prospect'}</strong></div>

            <div class="skill-grid">
                ${(p.skills || []).map(s => `<div class="skill-card"><b>${s.name}</b><small>••• ${s.level}</small></div>`).join('')}
            </div>

            ${p.video_url ? `<a href="${p.video_url}" target="_blank" class="btn-highlights">WATCH HIGHLIGHTS</a>` : ''}

            <div style="margin-top:25px; display:flex; justify-content:center; gap:20px;">
                ${user?.id === p.user_id ? `<button class="btn-text" onclick="edit('${p.id}')">Edit</button>` : ''}
                <button class="btn-text" style="color:red" onclick="adminDel('${p.id}')">Delete (Admin)</button>
            </div>
        </div>
    `).join('');
}

// 3. PUBLISH / EDIT LOGIC
document.getElementById('playerForm').onsubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please Login First.");

    const id = document.getElementById('pid').value;
    const skillRows = document.querySelectorAll('.skill-row');
    const payload = {
        user_id: user.id,
        name: document.getElementById('name').value,
        position: document.getElementById('pos').value,
        class_year: document.getElementById('year').value,
        number: document.getElementById('num').value,
        height: document.getElementById('h').value,
        weight: document.getElementById('w').value,
        age: parseInt(document.getElementById('age').value) || 0,
        location: document.getElementById('loc').value,
        rank: document.getElementById('rank').value,
        archetype: document.getElementById('arch').value,
        video_url: document.getElementById('vid').value,
        averages: {
            pts: document.getElementById('avg_pts').value,
            ast: document.getElementById('avg_ast').value,
            reb: document.getElementById('avg_reb').value,
            time: document.getElementById('avg_time').value
        },
        skills: Array.from(skillRows).map(r => ({
            name: r.querySelector('.s-name').value,
            level: r.querySelector('.s-lvl').value
        }))
    };

    const { error } = id ? await _sb.from('players').update(payload).eq('id', id) : await _sb.from('players').insert([payload]);
    if (error) alert(error.message); else { closeModal('playerModal'); init(); }
};

// MODAL UTILS
function addSkillRow(name = "Shooting", level = "ELITE") {
    const div = document.createElement('div');
    div.className = 'stat-inputs skill-row';
    div.style.marginBottom = "10px";
    div.innerHTML = `
        <select class="s-name">
            <option ${name==='Shooting'?'selected':''}>Shooting</option><option ${name==='Passing'?'selected':''}>Passing</option>
            <option ${name==='Defense'?'selected':''}>Defense</option><option ${name==='Mechanics'?'selected':''}>Mechanics</option>
            <option ${name==='Driving'?'selected':''}>Driving</option>
        </select>
        <select class="s-lvl">
            <option ${level==='ELITE'?'selected':''}>ELITE</option><option ${level==='GREAT'?'selected':''}>GREAT</option>
            <option ${level==='SITUATIONAL'?'selected':''}>SITUATIONAL</option>
        </select>
    `;
    document.getElementById('skillsList').appendChild(div);
}

function openEditor() {
    document.getElementById('playerForm').reset();
    document.getElementById('pid').value = '';
    document.getElementById('skillsList').innerHTML = '';
    addSkillRow(); 
    toggleModal('playerModal');
}

function edit(id) {
    const p = profiles.find(x => x.id === id);
    document.getElementById('pid').value = p.id;
    document.getElementById('name').value = p.name;
    document.getElementById('pos').value = p.position;
    document.getElementById('year').value = p.class_year;
    document.getElementById('num').value = p.number;
    document.getElementById('h').value = p.height;
    document.getElementById('w').value = p.weight;
    document.getElementById('age').value = p.age;
    document.getElementById('loc').value = p.location;
    document.getElementById('rank').value = p.rank;
    document.getElementById('arch').value = p.archetype;
    document.getElementById('vid').value = p.video_url;
    document.getElementById('avg_pts').value = p.averages?.pts || '';
    document.getElementById('avg_ast').value = p.averages?.ast || '';
    document.getElementById('avg_reb').value = p.averages?.reb || '';
    document.getElementById('avg_time').value = p.averages?.time || '';
    
    document.getElementById('skillsList').innerHTML = '';
    (p.skills || []).forEach(s => addSkillRow(s.name, s.level));
    toggleModal('playerModal');
}

function toggleModal(m) { document.getElementById(m).style.display = 'block'; }
function closeModal(m) { document.getElementById(m).style.display = 'none'; }
function swapAuth() { signUpMode = !signUpMode; document.getElementById('aTitle').innerText = signUpMode ? "Sign Up" : "Sign In"; }
async function adminDel(id) { if (prompt("Admin Key:") === "SCOUT2026") { await _sb.from('players').delete().eq('id', id); init(); } }

init();
