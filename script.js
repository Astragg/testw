// FULL FIXED CREDENTIALS
window.SUPABASE_URL = 'https://prngglvbtvijbpxydupd.supabase.co';
window.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybmdnbHZidHZpamJweHlkdXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTY4MjQsImV4cCI6MjA5MzA3MjgyNH0.y0iZ00nlsiXk_aAVVlW6FZdO3yjjJrVZZVHBgfZZ5io';

const _sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
const ADMIN_KEY = "SCOUT2026";
let user = null;
let isSignUp = false;
let players = [];

// 1. AUTH LOGIC
_sb.auth.onAuthStateChange((evt, session) => {
    user = session?.user || null;
    const panel = document.getElementById('authPanel');
    const addBtn = document.getElementById('addBtn');
    if (user) {
        panel.innerHTML = `<span style="font-size:0.7rem; color:#888;">${user.email}</span> <button class="btn-text" onclick="_sb.auth.signOut()">Logout</button>`;
        addBtn.style.display = 'block';
    } else {
        panel.innerHTML = `<button class="btn-outline" onclick="toggleModal('authModal')">Login / Sign Up</button>`;
        addBtn.style.display = 'none';
    }
});

async function handleAuth() {
    const email = document.getElementById('aemail').value;
    const pass = document.getElementById('apass').value;
    const { error } = isSignUp ? await _sb.auth.signUp({ email, password: pass }) : await _sb.auth.signInWithPassword({ email, password: pass });
    if (error) alert(error.message); else toggleModal('authModal');
}

function swapAuth() {
    isSignUp = !isSignUp;
    document.getElementById('atitle').innerText = isSignUp ? "Sign Up" : "Login";
    document.getElementById('aswitch').innerText = isSignUp ? "Already have an account? Login" : "Need an account? Sign Up";
}

// 2. DATA LOAD
async function load() {
    const { data } = await _sb.from('players').select('*').order('created_at', { ascending: false });
    players = data || [];
    render(players);
}

function render(list) {
    const grid = document.getElementById('grid');
    grid.innerHTML = list.map(p => `
        <div class="player-card">
            <div class="c-header"><small>Player Profile</small><h2>${p.name}</h2><p>${p.position} • Class of ${p.class_year} • #${p.number}</p></div>
            <div class="divider">
                <div class="stat-row"><label>Height</label> <b>${p.height}</b></div>
                <div class="stat-row"><label>Weight</label> <b>${p.weight}</b></div>
                <div class="stat-row"><label>Age</label> <b>${p.age} YRS</b></div>
                <div class="stat-row"><label>State Rank</label> <b>${p.rank}</b></div>
            </div>
            <div class="stats-grid">
                <div class="stat-box"><small>PTS</small><b>${p.averages?.pts || '0'}</b></div>
                <div class="stat-box"><small>AST</small><b>${p.averages?.ast || '0'}</b></div>
                <div class="stat-box"><small>REB</small><b>${p.averages?.reb || '0'}</b></div>
                <div class="stat-box"><small>TIME</small><b>${p.averages?.time || '0.00'}</b></div>
            </div>
            <div class="arch-pill"><span>Archetype</span><strong>${p.archetype}</strong></div>
            <div class="skills-grid">
                ${(p.skills || []).map(s => `<div class="skill-item"><b>${s.name}</b><small>••• ${s.level}</small></div>`).join('')}
            </div>
            ${p.video_url ? `<a href="${p.video_url}" target="_blank" class="vid-link">WATCH HIGHLIGHTS</a>` : ''}
            <div style="margin-top:20px; display:flex; justify-content:center; gap:20px;">
                ${user?.id === p.user_id ? `<button class="btn-text" onclick="edit('${p.id}')">Edit</button>` : ''}
                <button class="btn-text" onclick="del('${p.id}')" style="color:red">Delete (Admin)</button>
            </div>
        </div>
    `).join('');
}

// 3. PUBLISHING LOGIC (Fixes the failure)
document.getElementById('playerForm').onsubmit = async (e) => {
    e.preventDefault();
    if(!user) return alert("Please Login First");

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
        age: parseInt(document.getElementById('age').value),
        rank: document.getElementById('rank').value,
        archetype: document.getElementById('arch').value,
        video_url: document.getElementById('vid').value,
        averages: {
            pts: document.getElementById('avg_pts').value,
            ast: document.getElementById('avg_ast').value,
            reb: document.getElementById('avg_reb').value,
            time: document.getElementById('avg_time').value
        },
        game_log: [{
            opp: document.getElementById('last_opp').value,
            score: document.getElementById('last_score').value,
            pts: document.getElementById('last_pts').value
        }],
        skills: Array.from(skillRows).map(r => ({
            name: r.querySelector('.s-name').value,
            level: r.querySelector('.s-lvl').value
        }))
    };

    const { error } = id ? await _sb.from('players').update(payload).eq('id', id) : await _sb.from('players').insert([payload]);
    if(error) alert("Error: " + error.message); else { closeModal('editorModal'); load(); }
};

// MODAL UTILS
function addSkillRow(name = "Shooting", level = "ELITE") {
    const row = document.createElement('div');
    row.className = 'row skill-row';
    row.innerHTML = `
        <select class="s-name">
            <option ${name==='Shooting'?'selected':''}>Shooting</option><option ${name==='Passing'?'selected':''}>Passing</option>
            <option ${name==='Defense'?'selected':''}>Defense</option><option ${name==='Mechanics'?'selected':''}>Mechanics</option>
            <option ${name==='Dunking'?'selected':''}>Dunking</option><option ${name==='Driving'?'selected':''}>Driving</option>
        </select>
        <select class="s-lvl">
            <option ${level==='ELITE'?'selected':''}>ELITE</option><option ${level==='GREAT'?'selected':''}>GREAT</option>
            <option ${level==='SITUATIONAL'?'selected':''}>SITUATIONAL</option><option ${level==='DEVELOPING'?'selected':''}>DEVELOPING</option>
        </select>
    `;
    document.getElementById('skillsContainer').appendChild(row);
}

function openEditor() {
    document.getElementById('playerForm').reset();
    document.getElementById('pid').value = '';
    document.getElementById('skillsContainer').innerHTML = '';
    addSkillRow();
    toggleModal('editorModal');
}

function edit(id) {
    const p = players.find(x => x.id === id);
    document.getElementById('pid').value = p.id;
    document.getElementById('name').value = p.name;
    document.getElementById('pos').value = p.position;
    document.getElementById('year').value = p.class_year;
    document.getElementById('num').value = p.number;
    document.getElementById('h').value = p.height;
    document.getElementById('w').value = p.weight;
    document.getElementById('age').value = p.age;
    document.getElementById('rank').value = p.rank;
    document.getElementById('arch').value = p.archetype;
    document.getElementById('vid').value = p.video_url;
    document.getElementById('avg_pts').value = p.averages.pts;
    document.getElementById('avg_ast').value = p.averages.ast;
    document.getElementById('avg_reb').value = p.averages.reb;
    document.getElementById('avg_time').value = p.averages.time;
    document.getElementById('last_opp').value = p.game_log[0]?.opp || '';
    document.getElementById('last_score').value = p.game_log[0]?.score || '';
    document.getElementById('last_pts').value = p.game_log[0]?.pts || '';
    
    document.getElementById('skillsContainer').innerHTML = '';
    p.skills.forEach(s => addSkillRow(s.name, s.level));
    toggleModal('editorModal');
}

async function del(id) {
    if(prompt("Enter Admin Key:") === ADMIN_KEY) { await _sb.from('players').delete().eq('id', id); load(); }
}

function toggleModal(m) { const el = document.getElementById(m); el.style.display = el.style.display === 'block' ? 'none' : 'block'; }
function closeModal(m) { document.getElementById(m).style.display = 'none'; }
function filter() { const val = document.getElementById('search').value.toLowerCase(); render(players.filter(p => p.name.toLowerCase().includes(val) || p.rank.toLowerCase().includes(val))); }

load();
