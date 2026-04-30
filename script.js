// SUPABASE CONNECTION
const SUPABASE_URL = 'https://prngglvbtvijbpxydupd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybmdnbHZidHZpamJweHlkdXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTY4MjQsImV4cCI6MjA5MzA3MjgyNH0.y0iZ00nlsiXk_aAVVlW6FZdO3yjjJrVZZVHBgfZZ5io';

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_KEY = "SCOUT2026"; // Change this to your preferred deletion key
let user = null;
let isSignUpMode = false;
let allPlayers = [];

// 1. AUTHENTICATION LOGIC (Fixes the login/signup buttons)
_sb.auth.onAuthStateChange((event, session) => {
    user = session?.user || null;
    const panel = document.getElementById('authPanel');
    const addBtn = document.getElementById('addBtn');
    
    if (user) {
        panel.innerHTML = `<span class="user-tag">${user.email}</span> <button class="btn-text" onclick="signOut()">Logout</button>`;
        addBtn.style.display = 'block';
    } else {
        panel.innerHTML = `<button class="btn-outline" onclick="toggleModal('authModal')">Login / Sign Up</button>`;
        addBtn.style.display = 'none';
    }
});

async function handleAuth() {
    const email = document.getElementById('aemail').value;
    const password = document.getElementById('apass').value;

    if (!email || !password) return alert("Please fill in all fields.");

    const { data, error } = isSignUpMode 
        ? await _sb.auth.signUp({ email, password })
        : await _sb.auth.signInWithPassword({ email, password });
    
    if (error) {
        alert("Auth Error: " + error.message);
    } else {
        toggleModal('authModal');
        if (isSignUpMode) alert("Check your email for a confirmation link!");
    }
}

async function signOut() {
    await _sb.auth.signOut();
    window.location.reload();
}

function swapAuth() {
    isSignUpMode = !isSignUpMode;
    document.getElementById('atitle').innerText = isSignUpMode ? "Sign Up" : "Login";
    document.getElementById('aswitch').innerText = isSignUpMode ? "Already have an account? Login" : "Need an account? Sign Up";
}

// 2. DATA RENDERING (Scouting & Coach Features)
async function fetchAllProfiles() {
    const { data, error } = await _sb.from('players').select('*').order('created_at', { ascending: false });
    if (error) return console.error(error);
    allPlayers = data;
    renderGrid(data);
}

function renderGrid(list) {
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
                <div class="avg-item"><small>PTS</small><b>${p.averages?.pts || '0'}</b></div>
                <div class="avg-item"><small>AST</small><b>${p.averages?.ast || '0'}</b></div>
                <div class="avg-item"><small>REB</small><b>${p.averages?.reb || '0'}</b></div>
                <div class="avg-item"><small>TIME/SCORE</small><b>${p.averages?.time || '0.00'}</b></div>
            </div>

            ${p.game_log && p.game_log.length > 0 ? `
                <div class="game-log">
                    <label>Last Game Result</label>
                    <p>${p.game_log[0].opp} | ${p.game_log[0].score} | ${p.game_log[0].pts} Pts/Time</p>
                </div>
            ` : ''}

            <div class="arch-pill"><span>Archetype</span><strong>${p.archetype}</strong></div>

            <div class="skills-grid">
                ${(p.skills || []).map(s => `
                    <div class="skill-box">
                        <b>${s.name}</b>
                        <small>••• ${s.level}</small>
                    </div>
                `).join('')}
            </div>

            ${p.video_url ? `<a href="${p.video_url}" target="_blank" class="vid-btn">WATCH HIGHLIGHTS</a>` : ''}

            <div class="card-footer">
                ${user?.id === p.user_id ? `<button class="edit-link" onclick="openEditor('${p.id}')">Edit Profile</button>` : ''}
                <button class="del-link" onclick="adminDelete('${p.id}')">Delete (Admin)</button>
            </div>
        </div>
    `).join('');
}

// 3. EDITOR LOGIC
document.getElementById('playerForm').onsubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in to save a profile.");

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

    const { error } = id 
        ? await _sb.from('players').update(payload).eq('id', id)
        : await _sb.from('players').insert([payload]);

    if (error) alert(error.message);
    else {
        toggleModal('editorModal');
        fetchAllProfiles();
    }
};

// UTILITIES
function toggleModal(m) {
    const modal = document.getElementById(m);
    modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
}

function addSkillRow() {
    const container = document.getElementById('skillsEntry');
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.innerHTML = `
        <select class="s-name">
            <option>Shooting</option><option>Passing</option><option>Defense</option>
            <option>Mechanics</option><option>Driving</option><option>Dunking</option>
        </select>
        <select class="s-lvl">
            <option>ELITE</option><option>GREAT</option><option>SITUATIONAL</option><option>DEVELOPING</option>
        </select>
    `;
    container.appendChild(row);
}

async function adminDelete(id) {
    const key = prompt("Enter Admin Key to delete:");
    if (key === ADMIN_KEY) {
        await _sb.from('players').delete().eq('id', id);
        fetchAllProfiles();
    }
}

function openEditor(id = null) {
    document.getElementById('playerForm').reset();
    document.getElementById('pid').value = '';
    document.getElementById('skillsEntry').innerHTML = '';
    addSkillRow(); // Start with one row
    
    if (id) {
        const p = allPlayers.find(x => x.id === id);
        document.getElementById('pid').value = p.id;
        document.getElementById('name').value = p.name;
        document.getElementById('pos').value = p.position;
        document.getElementById('year').value = p.class_year;
        document.getElementById('num').value = p.number;
        document.getElementById('h').value = p.height;
        document.getElementById('weight').value = p.weight;
        document.getElementById('age').value = p.age;
        document.getElementById('location').value = p.location;
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
    }
    toggleModal('editorModal');
}

fetchAllProfiles();
