// SUPABASE CONFIGURATION
const SUPABASE_URL = 'https://prngglvbtvijbpxydupd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybmdnbHZidHZpamJweHlkdXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTY4MjQsImV4cCI6MjA5MzA3MjgyNH0.y0iZ00nlsiXk_aAVVlW6FZdO3yjjJrVZZVHBgfZZ5io';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allPlayers = [];

// FETCH DATA
async function fetchPlayers() {
    const { data, error } = await _supabase
        .from('players')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching players:', error);
        return;
    }
    allPlayers = data;
    renderPlayers(data);
}

// RENDER CARDS
function renderPlayers(players) {
    const grid = document.getElementById('playerGrid');
    grid.innerHTML = players.map(p => `
        <div class="player-card">
            <div class="card-header">
                <div class="label">Player Profile</div>
                <h2>${p.name}</h2>
                <p>${p.position} • Class of ${p.class_year} • #${p.number || '0'}</p>
            </div>

            <div class="stats-grid">
                <div class="stat-item"><span>Height</span> <span>${p.height || '--'}</span></div>
                <div class="stat-item"><span>Weight</span> <span>${p.weight || '--'}</span></div>
                <div class="stat-item"><span>Age</span> <span>${p.age || '--'} YRS</span></div>
                <div class="stat-item"><span>From</span> <span>${p.location || '--'}</span></div>
                <div class="stat-item"><span>State Rank</span> <span>${p.rank || '--'}</span></div>
            </div>

            <div class="archetype-pill">
                <span>Archetype</span>
                <strong>${p.archetype || 'Prospect'}</strong>
            </div>

            <div class="skill-set-header">Skill Set</div>
            <div class="skills-grid">
                ${renderSkills(p.skills)}
            </div>

            <button class="edit-btn" onclick="openModal('${p.id}')">Edit Profile</button>
        </div>
    `).join('');
}

function renderSkills(skills) {
    if (!skills || !Array.isArray(skills)) return '';
    return skills.map(s => `
        <div class="skill-box">
            <b>${s.name}</b>
            <small>••• ${s.level}</small>
        </div>
    `).join('');
}

// SAVE / UPDATE LOGIC
document.getElementById('playerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('playerId').value;
    const skillsArray = document.getElementById('skillsInput').value.split(',').map(item => {
        const [name, level] = item.split(':');
        return { name: name?.trim(), level: level?.trim() || 'N/A' };
    }).filter(s => s.name);

    const playerData = {
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
        skills: skillsArray
    };

    let result;
    if (id) {
        result = await _supabase.from('players').update(playerData).eq('id', id);
    } else {
        result = await _supabase.from('players').insert([playerData]);
    }

    if (result.error) {
        alert('Error saving player: ' + result.error.message);
    } else {
        closeModal();
        fetchPlayers();
    }
});

// FILTERING
function filterPlayers() {
    const query = document.getElementById('searchBar').value.toLowerCase();
    const filtered = allPlayers.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.position.toLowerCase().includes(query)
    );
    renderPlayers(filtered);
}

// MODAL CONTROLS
function openModal(id = null) {
    const modal = document.getElementById('playerModal');
    const title = document.getElementById('modalTitle');
    modal.style.display = 'block';

    if (id) {
        title.innerText = "Edit Profile";
        const p = allPlayers.find(x => x.id == id);
        document.getElementById('playerId').value = p.id;
        document.getElementById('name').value = p.name;
        document.getElementById('position').value = p.position;
        document.getElementById('classYear').value = p.class_year;
        document.getElementById('number').value = p.number;
        document.getElementById('height').value = p.height;
        document.getElementById('weight').value = p.weight;
        document.getElementById('age').value = p.age;
        document.getElementById('location').value = p.location;
        document.getElementById('rank').value = p.rank;
        document.getElementById('archetype').value = p.archetype;
        document.getElementById('skillsInput').value = p.skills.map(s => `${s.name}:${s.level}`).join(', ');
    } else {
        title.innerText = "Add New Player";
        document.getElementById('playerForm').reset();
        document.getElementById('playerId').value = '';
    }
}

function closeModal() {
    document.getElementById('playerModal').style.display = 'none';
}

// Initial Load
fetchPlayers();
