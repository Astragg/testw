const SUPABASE_URL = 'https://prngglvbtvijbpxydupd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybmdnbHZidHZpamJweHlkdXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTY4MjQsImV4cCI6MjA5MzA3MjgyNH0.y0iZ00nlsiXk_aAVVlW6FZdO3yjjJrVZZVHBgfZZ5io'; // Ensure the full key is used
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_KEY = "SCOUT2026";
let user = null;
let signUp = false;
let players = [];

// AUTH HANDLERS
_sb.auth.onAuthStateChange((evt, session) => {
    user = session?.user || null;
    const panel = document.getElementById('authPanel');
    const addBtn = document.getElementById('addBtn');
    
    if (user) {
        panel.innerHTML = `<small>${user.email}</small> <button class="btn-text" onclick="_sb.auth.signOut()">Logout</button>`;
        addBtn.style.display = 'block';
    } else {
        panel.innerHTML = `<button class="btn-outline" onclick="toggleModal('authModal')">Login / Sign Up</button>`;
        addBtn.style.display = 'none';
    }
});

async function handleAuth() {
    const email = document.getElementById('aemail').value;
    const pass = document.getElementById('apass').value;
    const { error } = signUp 
        ? await _sb.auth.signUp({ email, password: pass })
        : await _sb.auth.signInWithPassword({ email, password: pass });
    
    if (error) alert(error.message);
    else toggleModal('authModal');
}

function swapAuth() {
    signUp = !signUp;
    document.getElementById('atitle').innerText = signUp ? "Sign Up" : "Login";
    document.getElementById('aswitch').innerText = signUp ? "Already have an account? Login" : "Need an account? Sign Up";
}

// DATA HANDLERS
async function load() {
    const { data } = await _sb.from('players').select('*').order('created_at', { ascending: false });
    players = data || [];
    render(players);
}

function render(list) {
    const grid = document.getElementById('grid');
    grid.innerHTML = list.map(p => `
        <div class="player-card">
            <div class="c-top">
                <small>Player Profile</small>
                <h2>${p.name}</h2>
                <p>${p.position} • Class of ${p.class_year} • #${p.number}</p>
            </div>

            <div class="dashed-section">
                <div class="stat-row"><label>Height</label> <b>${p.height}</b></div>
                <div class="stat-row"><label>Weight</label> <b>${p.weight} LB</b></div>
                <div class="stat-row"><label>Age</label> <b>${p.age} YRS</b></div>
                <div class="stat-row"><label>From</label> <b>${p.location}</b></div>
                <div class="stat-row"><label>State Rank</label> <b>${p.rank}</b></div>
            </div>

            <div class="averages-box">
                <div class="avg-item"><small>PTS</small><b>${p.averages?.pts}</b></div>
                <div class="avg-item"><small>AST</small><b>${p.averages?.ast}</b></div>
                <div class="avg-item"><small>REB</small><b>${p.averages?.reb}</b></div>
                <div class="avg-item"><small>TIME</small><b>${p.averages?.time}</b></div>
            </div>

            ${p.game_log?.length ? `
                <div class="game-log">
                    <label>Last Game Result</label>
                    <p>${p.game_log[0].opp} | ${p.game_log[0].score} | ${p.game_log[0].pts} Pts/Time</p>
                </div>
            ` : ''}

            <div class="arch-pill"><span>Archetype</span><strong>${p.archetype}</strong></div>

            <div class="skills-grid">
                ${p.skills.map(s => `<div class="skill-box"><b>${s.name}</b><small>••• ${s.level}</small></div>`).join('')}
            </div>

            ${p.video_url ? `<a href="${p.video_url}" target="_blank" class="vid-btn">WATCH HIGHLIGHTS</a>` : ''}

            <div style="margin-top:20px; display:flex; justify-content:center; gap:15px">
                ${user?.id === p.user_id ? `<button class="btn-text" onclick="edit('${p.id}')">Edit</button>` : ''}
                <button class="btn-text" onclick="del('${p.id}')" style="color:red">Delete (Admin)</button>
            </div>
        </div>
    `).join('');
}

// FORM LOGIC
document.getElementById('playerForm').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('pid').value;
    const skillRows = document.querySelectorAll('.skill-row');
    
    const payload = {
        user_id: user.id,
        name: document.getElementById('name').value,
        position: document.getElementById('pos').value,
        class_year: document.getElementById('year').value,
        number: document.getElementById('num').value,
        height: document.getElementById('h').value,
        weight: document.getElementById('weight').value,
        age: parseInt(document.getElementById('age').value),
        location: document.getElementById('location').value,
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

    if (id) await _sb.from('players').update(payload).eq('id', id);
    else await _sb.from('players').insert([payload]);

    toggleModal('editorModal');
    load();
};

function addSkillRow() {
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.innerHTML = `<select class="s-name"><option>Shooting</option><option>Passing</option><option>Defense</option><option>Mechanics</option></select>
                     <select class="s-lvl"><option>ELITE</option><option>GREAT</option><option>SITUATIONAL</option></select>`;
    document.getElementById('skillsEntry').appendChild(row);
}

async function del(id) {
    if (prompt("Admin Key:") === ADMIN_KEY) {
        await _sb.from('players').delete().eq('id', id);
        load();
    }
}

function toggleModal(m) {
    const el = document.getElementById(m);
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

function openEditor() {
    document.getElementById('playerForm').reset();
    document.getElementById('pid').value = '';
    toggleModal('editorModal');
}

load();
