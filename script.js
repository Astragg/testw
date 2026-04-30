const SUPABASE_URL = 'https://prngglvbtvijbpxydupd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Use your full key
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_KEY = "SECRET123";
let currentUser = null;
let isSignUp = false;
let allPlayers = [];

// AUTH OBSERVER
_supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    updateAuthUI();
});

function updateAuthUI() {
    const container = document.getElementById('authContainer');
    const addBtn = document.getElementById('addPlayerBtn');
    if (currentUser) {
        container.innerHTML = `<span style="font-size:0.8rem; color:#757575; margin-right:10px;">${currentUser.email}</span><button class="btn-text" onclick="_supabase.auth.signOut()">Logout</button>`;
        addBtn.style.display = 'block';
    } else {
        container.innerHTML = `<button class="btn-outline" onclick="openAuthModal()">Login / Sign Up</button>`;
        addBtn.style.display = 'none';
    }
}

// FETCH & RENDER
async function fetchPlayers() {
    const { data, error } = await _supabase.from('players').select('*').order('created_at', { ascending: false });
    if (!error) {
        allPlayers = data;
        renderPlayers(data);
    }
}

function renderPlayers(players) {
    const grid = document.getElementById('playerGrid');
    grid.innerHTML = players.map(p => `
        <div class="player-card">
            <div class="card-top">
                <div class="label">Player Profile</div>
                <h2>${p.name}</h2>
                <p>${p.position || 'Prospect'} • Class of ${p.class_year || 'TBD'} • #${p.number || '0'}</p>
            </div>

            <div class="stats-container">
                <div class="stat-row"><label>Height</label> <b>${p.height || '--'}</b></div>
                <div class="stat-row"><label>Weight</label> <b>${p.weight || '--'} LB</b></div>
                <div class="stat-row"><label>Age</label> <b>${p.age || '--'} YRS</b></div>
                <div class="stat-row"><label>From</label> <b>${p.location || '--'}</b></div>
                <div class="stat-row"><label>State Rank</label> <b>${p.rank || '--'}</b></div>
            </div>

            <div class="archetype-pill">
                <span>Archetype</span>
                <strong>${p.archetype || 'Specialist'}</strong>
            </div>

            <div class="skills-title">Skill Set</div>
            <div class="skills-grid">
                ${(p.skills || []).map(s => `
                    <div class="skill-box">
                        <b>${s.name}</b>
                        <small>••• ${s.level}</small>
                    </div>
                `).join('')}
            </div>

            ${p.video_url ? `<a href="${p.video_url}" target="_blank" class="highlights-btn">WATCH HIGHLIGHTS</a>` : ''}

            <div class="admin-tools">
                ${currentUser && currentUser.id === p.user_id ? `<button onclick="openPlayerModal('${p.id}')">Edit</button>` : ''}
                <button onclick="adminDelete('${p.id}')">Delete (Admin)</button>
            </div>
        </div>
    `).join('');
}

// FORM LOGIC
function addSkillRow() {
    const container = document.getElementById('skillsEntryContainer');
    const div = document.createElement('div');
    div.className = 'skill-input-row';
    div.innerHTML = `
        <select class="skill-name">
            <option value="Shooting">Shooting</option><option value="Passing">Passing</option>
            <option value="Rebounding">Rebounding</option><option value="Dunking">Dunking</option>
            <option value="Defense">Defense</option><option value="Mechanics">Mechanics</option>
            <option value="Driving">Driving</option>
        </select>
        <select class="skill-level">
            <option value="ELITE">ELITE</option><option value="GREAT">GREAT</option>
            <option value="SITUATIONAL">SITUATIONAL</option><option value="DEVELOPING">DEVELOPING</option>
        </select>
    `;
    container.appendChild(div);
}

document.getElementById('playerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('playerId').value;
    const skillRows = document.querySelectorAll('.skill-input-row');
    const skills = Array.from(skillRows).map(row => ({
        name: row.querySelector('.skill-name').value,
        level: row.querySelector('.skill-level').value
    }));

    const data = {
        name: document.getElementById('name').value,
        position: document.getElementById('position').value,
        class_year: document.getElementById('classYear').value,
        number: document.getElementById('number').value,
        height: document.getElementById('height').value,
        weight: document.getElementById('weight').value,
        age: parseInt(document.getElementById('age').value),
        location: document.getElementById('location').value,
        rank: document.getElementById('rank').value,
        archetype: document.getElementById('archetype').value,
        video_url: document.getElementById('video_url').value,
        skills: skills,
        user_id: currentUser.id
    };

    if (id) await _supabase.from('players').update(data).eq('id', id);
    else await _supabase.from('players').insert([data]);

    closeModal('playerModal');
    fetchPlayers();
});

// AUTH LOGIC
async function handleAuth() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPass').value;
    const { error } = isSignUp 
        ? await _supabase.auth.signUp({ email, password })
        : await _supabase.auth.signInWithPassword({ email, password });
    
    if (error) alert(error.message);
    else closeModal('authModal');
}

function toggleAuthMode() {
    isSignUp = !isSignUp;
    document.getElementById('authTitle').innerText = isSignUp ? "Sign Up" : "Login";
    document.getElementById('authToggle').innerText = isSignUp ? "Already have an account? Login" : "Need an account? Sign Up";
}

// ADMIN DELETE
async function adminDelete(id) {
    const key = prompt("Enter Admin Key:");
    if (key === ADMIN_KEY) {
        await _supabase.from('players').delete().eq('id', id);
        fetchPlayers();
    }
}

// MODAL UTILS
function openPlayerModal(id = null) {
    document.getElementById('playerModal').style.display = 'block';
    if (id) {
        const p = allPlayers.find(x => x.id === id);
        document.getElementById('playerId').value = p.id;
        document.getElementById('name').value = p.name;
        // ... fill other fields ...
    } else {
        document.getElementById('playerForm').reset();
        document.getElementById('playerId').value = '';
    }
}
function openAuthModal() { document.getElementById('authModal').style.display = 'block'; }
function closeModal(m) { document.getElementById(m).style.display = 'none'; }

fetchPlayers();
