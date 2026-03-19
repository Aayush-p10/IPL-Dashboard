const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Serve the static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to catch database errors nicely
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(err => {
        console.error("Database error ->", err);
        res.status(500).json({ error: "Failed to load data from the database. Make sure MySQL is running." });
    });

// ------------------------------------------------------------------
// QUERY 1: Points Table — Wins & Losses per team
// ------------------------------------------------------------------
app.get('/api/points-table', asyncHandler(async (req, res) => {
    const query = `
        SELECT
            T.SHORT_CODE,
            T.NAME AS Team_Name,
            COUNT(CASE WHEN M.WINNING_TEAM = T.SHORT_CODE THEN 1 END) AS Wins,
            COUNT(CASE WHEN M.LOSING_TEAM  = T.SHORT_CODE THEN 1 END) AS Losses,
            COUNT(CASE WHEN M.WINNING_TEAM = T.SHORT_CODE
                       OR   M.LOSING_TEAM  = T.SHORT_CODE THEN 1 END) AS Total_Matches
        FROM TEAM T
        LEFT JOIN MATCH_INFO M
               ON M.WINNING_TEAM = T.SHORT_CODE OR M.LOSING_TEAM = T.SHORT_CODE
        GROUP BY T.SHORT_CODE, T.NAME
        ORDER BY Wins DESC;
    `;
    const [rows] = await db.query(query);
    res.json(rows);
}));

// ------------------------------------------------------------------
// QUERY 2: Player roster with team city and role(s)
// ------------------------------------------------------------------
app.get('/api/players', asyncHandler(async (req, res) => {
    const query = `
        SELECT P.PlayerID, P.NAME AS Player_Name,
               T.NAME AS Team_Name, T.CITY, T.SHORT_CODE,
               GROUP_CONCAT(PR.ROLE ORDER BY PR.ROLE SEPARATOR ',') AS ROLE
        FROM PLAYER P
        JOIN TEAM        T  ON P.SHORT_CODE = T.SHORT_CODE
        JOIN PLAYER_ROLE PR ON P.PlayerID   = PR.PlayerID
        GROUP BY P.PlayerID, P.NAME, T.NAME, T.CITY, T.SHORT_CODE
        ORDER BY T.NAME, P.NAME;
    `;
    const [rows] = await db.query(query);
    res.json(rows);
}));

// ------------------------------------------------------------------
// QUERY 3: Venues that hosted more than 1 match
// ------------------------------------------------------------------
app.get('/api/venues', asyncHandler(async (req, res) => {
    const query = `
        SELECT V.VenueID, V.LOCATION, V.PITCH_CONDITIONS,
               COUNT(H.MatchID) AS Matches_Hosted,
               MAX(T.HOME_GROUND) AS STADIUM_NAME
        FROM VENUE V
        JOIN HELD H ON V.VenueID = H.VenueID
        LEFT JOIN TEAM T ON V.LOCATION = T.CITY
        GROUP BY V.VenueID, V.LOCATION, V.PITCH_CONDITIONS
        HAVING COUNT(H.MatchID) > 1
        ORDER BY Matches_Hosted DESC;
    `;
    const [rows] = await db.query(query);
    res.json(rows);
}));

// ------------------------------------------------------------------
// QUERY 4: Full team profile — owner + all sponsors in one row
// ------------------------------------------------------------------
app.get('/api/teams', asyncHandler(async (req, res) => {
    const query = `
        SELECT T.SHORT_CODE, T.NAME AS Team_Name, T.HOME_GROUND,
               O.NAME AS Owner_Name, O.EMAIL AS Owner_Email,
               GROUP_CONCAT(TS.SPONSORS ORDER BY TS.SPONSORS SEPARATOR ', ') AS Sponsors
        FROM TEAM T
        LEFT JOIN OWNER         O  ON T.SHORT_CODE = O.SHORT_CODE
        LEFT JOIN TEAM_SPONSORS TS ON T.SHORT_CODE = TS.SHORT_CODE
        GROUP BY T.SHORT_CODE, T.NAME, T.HOME_GROUND, O.NAME, O.EMAIL
        ORDER BY T.NAME;
    `;
    const [rows] = await db.query(query);
    res.json(rows);
}));

// ------------------------------------------------------------------
// QUERY 5: Teams that made it to the Playoffs
// ------------------------------------------------------------------
app.get('/api/playoffs', asyncHandler(async (req, res) => {
    const query = `
        SELECT DISTINCT T.SHORT_CODE, T.NAME AS Team_Name, T.CITY,
               M.MATCH_TYPE, M.DATE
        FROM TEAM T
        JOIN COMPETE    C ON T.SHORT_CODE = C.SHORT_CODE
        JOIN MATCH_INFO M ON C.MatchID    = M.MatchID
        WHERE M.MATCH_TYPE IN ('Eliminator 1','Qualifier 2','Eliminator 2','Final')
        ORDER BY M.DATE, T.NAME;
    `;
    const [rows] = await db.query(query);
    res.json(rows);
}));

// ------------------------------------------------------------------
// ENTITY DATA ENDPOINTS
// ------------------------------------------------------------------
app.get('/api/entity/players', asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT * FROM PLAYER');
    res.json(rows);
}));
app.get('/api/entity/teams', asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT * FROM TEAM');
    res.json(rows);
}));
app.get('/api/entity/owners', asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT * FROM OWNER');
    res.json(rows);
}));
app.get('/api/entity/venues', asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT * FROM VENUE');
    res.json(rows);
}));
app.get('/api/entity/matches', asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT * FROM MATCH_INFO ORDER BY MatchID ASC');
    res.json(rows);
}));

// Catch-all: serve index.html for any non-API route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start HTTP server
app.listen(PORT, () => {
    console.log(`IPL Dashboard API server is running on http://localhost:${PORT}`);
});
