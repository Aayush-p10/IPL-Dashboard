document.addEventListener("DOMContentLoaded", () => {
    // 1. Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.data-section');
    const dropBtn = document.querySelector('.dropbtn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // If the clicked tab is inside the dropdown, also highlight the dropdown button title
            if (btn.closest('.dropdown-content')) {
                dropBtn.style.color = 'var(--accent)';
            } else {
                dropBtn.style.color = 'var(--text-muted)';
            }

            // Show target section
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Base API URL
    const API_BASE = "/api";

    // 2. Fetch and render functions
    async function fetchData(endpoint) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return null;
        }
    }

    // Render Points Table
    async function loadPointsTable() {
        const data = await fetchData('/points-table');
        const container = document.getElementById('points-table-container');

        if (!data) {
            container.innerHTML = `<p class="error">Failed to load points table. Ensure MySQL and NodeJS server are running.</p>`;
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>Matches</th>
                        <th>Wins</th>
                        <th>Losses</th>
                    </tr>
                </thead>
                <tbody>
        `;
        data.forEach(row => {
            html += `
                <tr>
                    <td><strong>${row.Team_Name}</strong> (${row.SHORT_CODE})</td>
                    <td>${row.Total_Matches}</td>
                    <td><span class="highlight" style="font-size: 1.2rem; font-weight:900;">${row.Wins}</span></td>
                    <td>${row.Losses}</td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        container.innerHTML = html;
    }

    // Render Players
    async function loadPlayers() {
        const data = await fetchData('/players');
        const container = document.getElementById('players-container');

        if (!data) {
            container.innerHTML = `<p class="error">Failed to load players.</p>`;
            return;
        }

        container.innerHTML = data.map(p => {
            const rolesHtml = p.ROLE.split(',').map(r => `<span class="badge">${r}</span>`).join(' ');
            return `
            <div class="card">
                <h4 class="card-title">${p.Player_Name}</h4>
                <div class="card-subtitle">${p.Team_Name} • ${p.CITY}</div>
                <div style="margin-top:auto;">${rolesHtml}</div>
            </div>
            `;
        }).join('');
    }

    // Render Venues
    async function loadVenues() {
        const data = await fetchData('/venues');
        const container = document.getElementById('venues-container');

        if (!data) {
            container.innerHTML = `<p class="error">Failed to load venues.</p>`;
            return;
        }

        container.innerHTML = data.map(v => {
            const stadium = v.STADIUM_NAME ? v.STADIUM_NAME : `${v.LOCATION} Stadium`;
            return `
            <div class="card" style="border-top: 3px solid var(--accent)">
                <h4 class="card-title">${stadium}</h4>
                <div class="card-subtitle">Pitch: ${v.PITCH_CONDITIONS}</div>
                <p style="color:var(--text-muted); margin-top: auto; font-size: 0.9rem;">Total Matches Hosted: <strong style="color:var(--text-main); font-size:1.1rem">${v.Matches_Hosted}</strong></p>
            </div>
            `;
        }).join('');
    }

    // Render Teams
    async function loadTeams() {
        const data = await fetchData('/teams');
        const container = document.getElementById('teams-container');

        if (!data) {
            container.innerHTML = `<p class="error">Failed to load teams.</p>`;
            return;
        }

        container.innerHTML = data.map(t => {
            const sponsors = t.Sponsors ? t.Sponsors.split(', ').map(s => `<span class="badge">${s}</span>`).join('') : '<span class="badge">No Sponsors</span>';
            return `
            <div class="card">
                <h4 class="card-title">${t.Team_Name} (${t.SHORT_CODE})</h4>
                <div class="card-subtitle">${t.HOME_GROUND}</div>
                <p style="font-size: 0.9rem; margin-bottom: 0.5rem; color:var(--text-muted);">Owner: <strong style="color:var(--text-main);">${t.Owner_Name}</strong></p>
                <div style="margin-top: auto; padding-top:1rem;">
                    ${sponsors}
                </div>
            </div>
        `}).join('');
    }

    // Render Playoffs
    async function loadPlayoffs() {
        const data = await fetchData('/playoffs');
        const container = document.getElementById('playoffs-container');

        if (!data) {
            container.innerHTML = `<p class="error">Failed to load playoff data.</p>`;
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Match Type</th>
                        <th>Competitor</th>
                        <th>City</th>
                    </tr>
                </thead>
                <tbody>
        `;
        data.forEach(row => {
            const dateObj = new Date(row.DATE);
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            html += `
                <tr>
                    <td>${formattedDate}</td>
                    <td><span class="badge" style="background: rgba(255,255,255,0.1); color: var(--text-main); border: 1px solid rgba(255,255,255,0.3);">${row.MATCH_TYPE}</span></td>
                    <td><strong style="color:var(--text-main)">${row.Team_Name}</strong> <span style="color:var(--text-muted)">(${row.SHORT_CODE})</span></td>
                    <td>${row.CITY}</td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        container.innerHTML = html;
    }

    // Load Entity Data
    async function loadEntityPlayers() {
        const data = await fetchData('/entity/players');
        const c = document.getElementById('entity-players-container');
        if (!data) return c.innerHTML = '<p class="error">Error loading</p>';
        let html = '<table><thead><tr><th>ID</th><th>Name</th><th>Team Code</th></tr></thead><tbody>';
        data.forEach(r => html += `<tr><td>${r.PlayerID}</td><td><strong style="color:var(--text-main)">${r.NAME}</strong></td><td><span class="badge">${r.SHORT_CODE}</span></td></tr>`);
        c.innerHTML = html + '</tbody></table>';
    }

    async function loadEntityTeams() {
        const data = await fetchData('/entity/teams');
        const c = document.getElementById('entity-teams-container');
        if (!data) return c.innerHTML = '<p class="error">Error loading</p>';
        let html = '<table><thead><tr><th>Code</th><th>Name</th><th>City</th><th>Home Ground</th></tr></thead><tbody>';
        data.forEach(r => html += `<tr><td><span class="badge">${r.SHORT_CODE}</span></td><td><strong style="color:var(--text-main)">${r.NAME}</strong></td><td>${r.CITY}</td><td>${r.HOME_GROUND}</td></tr>`);
        c.innerHTML = html + '</tbody></table>';
    }

    async function loadEntityOwners() {
        const data = await fetchData('/entity/owners');
        const c = document.getElementById('entity-owners-container');
        if (!data) return c.innerHTML = '<p class="error">Error loading</p>';
        let html = '<table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Team</th></tr></thead><tbody>';
        data.forEach(r => html += `<tr><td>${r.OwnerID}</td><td><strong style="color:var(--text-main)">${r.NAME}</strong></td><td>${r.EMAIL}</td><td><span class="badge">${r.SHORT_CODE}</span></td></tr>`);
        c.innerHTML = html + '</tbody></table>';
    }

    async function loadEntityVenues() {
        const data = await fetchData('/entity/venues');
        const c = document.getElementById('entity-venues-container');
        if (!data) return c.innerHTML = '<p class="error">Error loading</p>';
        let html = '<table><thead><tr><th>ID</th><th>Pitch Conditions</th><th>Location</th></tr></thead><tbody>';
        data.forEach(r => html += `<tr><td>${r.VenueID}</td><td>${r.PITCH_CONDITIONS}</td><td><strong style="color:var(--text-main)">${r.LOCATION}</strong></td></tr>`);
        c.innerHTML = html + '</tbody></table>';
    }

    async function loadEntityMatches() {
        const data = await fetchData('/entity/matches');
        const c = document.getElementById('entity-matches-container');
        if (!data) return c.innerHTML = '<p class="error">Error loading</p>';
        let html = '<table><thead><tr><th>ID</th><th>Date</th><th>Type</th><th>Winner</th><th>Loser</th></tr></thead><tbody>';
        data.forEach(r => {
            const d = new Date(r.DATE).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            html += `<tr><td>${r.MatchID}</td><td>${d}</td><td><span class="badge" style="background:transparent;border:1px solid rgba(255,255,255,0.2)">${r.MATCH_TYPE}</span></td><td><span class="badge">${r.WINNING_TEAM}</span></td><td><span class="badge" style="background:rgba(239,68,68,0.2);color:#f87171">${r.LOSING_TEAM}</span></td></tr>`;
        });
        c.innerHTML = html + '</tbody></table>';
    }

    // Load data silently so tabs are ready
    loadPointsTable();
    loadPlayers();
    loadVenues();
    loadTeams();
    loadPlayoffs();

    // Load entities
    loadEntityPlayers();
    loadEntityTeams();
    loadEntityOwners();
    loadEntityVenues();
    loadEntityMatches();
});
