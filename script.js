const ADMIN_KEY = "ADMIN123"; // Change this to your secret key
let currentUser = null;
let isSignUp = false;

// 1. AUTHENTICATION LOGIC
_supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    updateUI();
});

function updateUI() {
    const status = document.getElementById('authStatus');
    const addBtn = document.getElementById('addBtn');
    if (currentUser) {
        status.innerHTML = `<small>${currentUser.email}</small> <button onclick="_supabase.auth.signOut()">Logout</button>`;
        addBtn.style.display = 'block';
    } else {
        status.innerHTML = `<button class="btn-secondary" onclick="openAuth()">Login / Sign Up</button>`;
        addBtn.style.display = 'none';
    }
}

async function handleAuth() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPass').value;
    const { error } = isSignUp 
        ? await _supabase.auth.signUp({ email, password })
        : await _supabase.auth.signInWithPassword({ email, password });
    
    if (error) alert(error.message);
    else closeModal('authModal');
}

// 2. DELETE WITH ADMIN KEY
async function deletePlayer(id) {
    const key = prompt("Enter Admin Key to delete this profile:");
    if (key === ADMIN_KEY) {
        const { error } = await _supabase.from('players').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchPlayers();
    } else {
        alert("Incorrect Admin Key.");
    }
}

// 3. UPDATED RENDER (With Video Link)
function renderPlayers(players) {
    const grid = document.getElementById('playerGrid');
    grid.innerHTML = players.map(p => `
        <div class="player-card">
            <!-- ... existing card header ... -->
            
            ${p.video_url ? `<a href="${p.video_url}" target="_blank" class="video-link-btn">▶ Watch Highlights</a>` : ''}

            <div class="skills-grid">
                ${p.skills.map(s => `<div class="skill-box"><b>${s.name}</b><small>••• ${s.level}</small></div>`).join('')}
            </div>

            <div class="admin-actions">
                ${currentUser && currentUser.id === p.user_id ? `<button onclick="openModal('${p.id}')">Edit</button>` : ''}
                <button class="del-btn" onclick="deletePlayer('${p.id}')">Delete (Admin)</button>
            </div>
        </div>
    `).join('');
}

// 4. SAVE WITH USER_ID
async function savePlayer(e) {
    e.preventDefault();
    const id = document.getElementById('playerId').value;
    
    // Collect dropdown skills
    const rows = document.querySelectorAll('.skill-input-row');
    const skills = Array.from(rows).map(row => ({
        name: row.querySelector('.skill-name').value,
        level: row.querySelector('.skill-level').value
    }));

    const playerData = {
        name: document.getElementById('name').value,
        video_url: document.getElementById('video_url').value,
        user_id: currentUser.id,
        skills: skills,
        // ... include other fields
    };

    if (id) {
        await _supabase.from('players').update(playerData).eq('id', id);
    } else {
        await _supabase.from('players').insert([playerData]);
    }
    fetchPlayers();
    closeModal();
}
