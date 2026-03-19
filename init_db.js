const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDB() {
    try {
        console.log("Connecting to MySQL server to initialize database...");
        
        // Connect without a specific database to create it first
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        ssl: { rejectUnauthorized: false },
        multipleStatements: true
        });

        const sqlScript = `
        CREATE DATABASE IF NOT EXISTS IPL_2025;
        USE IPL_2025;

        CREATE TABLE IF NOT EXISTS TEAM (
            SHORT_CODE  VARCHAR(5)   PRIMARY KEY,
            NAME        VARCHAR(50)  NOT NULL,
            CITY        VARCHAR(30)  NOT NULL,
            HOME_GROUND VARCHAR(60)  NOT NULL
        );

        CREATE TABLE IF NOT EXISTS PLAYER (
            PlayerID   INT          PRIMARY KEY AUTO_INCREMENT,
            NAME       VARCHAR(50)  NOT NULL,
            SHORT_CODE VARCHAR(5)   NOT NULL,
            FOREIGN KEY (SHORT_CODE) REFERENCES TEAM(SHORT_CODE)
                ON DELETE CASCADE ON UPDATE CASCADE
        );

        CREATE TABLE IF NOT EXISTS PLAYER_ROLE (
            PlayerID INT         NOT NULL,
            ROLE     VARCHAR(30) NOT NULL,
            PRIMARY KEY (PlayerID, ROLE),
            FOREIGN KEY (PlayerID) REFERENCES PLAYER(PlayerID)
                ON DELETE CASCADE ON UPDATE CASCADE
        );

        CREATE TABLE IF NOT EXISTS VENUE (
            VenueID          INT         PRIMARY KEY AUTO_INCREMENT,
            PITCH_CONDITIONS VARCHAR(30) NOT NULL,
            LOCATION         VARCHAR(60) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS MATCH_INFO (
            MatchID      INT         PRIMARY KEY AUTO_INCREMENT,
            WINNING_TEAM VARCHAR(5)  NOT NULL,
            LOSING_TEAM  VARCHAR(5)  NOT NULL,
            DATE         DATE        NOT NULL,
            MATCH_TYPE   VARCHAR(20) NOT NULL,
            FOREIGN KEY (WINNING_TEAM) REFERENCES TEAM(SHORT_CODE),
            FOREIGN KEY (LOSING_TEAM)  REFERENCES TEAM(SHORT_CODE)
        );

        CREATE TABLE IF NOT EXISTS COMPETE (
            SHORT_CODE VARCHAR(5) NOT NULL,
            MatchID    INT        NOT NULL,
            PRIMARY KEY (SHORT_CODE, MatchID),
            FOREIGN KEY (SHORT_CODE) REFERENCES TEAM(SHORT_CODE)
                ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (MatchID) REFERENCES MATCH_INFO(MatchID)
                ON DELETE CASCADE ON UPDATE CASCADE
        );

        CREATE TABLE IF NOT EXISTS HELD (
            MatchID INT NOT NULL,
            VenueID INT NOT NULL,
            PRIMARY KEY (MatchID, VenueID),
            FOREIGN KEY (MatchID) REFERENCES MATCH_INFO(MatchID)
                ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (VenueID) REFERENCES VENUE(VenueID)
                ON DELETE CASCADE ON UPDATE CASCADE
        );

        CREATE TABLE IF NOT EXISTS OWNER (
            OwnerID    INT         PRIMARY KEY AUTO_INCREMENT,
            NAME       VARCHAR(50) NOT NULL,
            EMAIL      VARCHAR(80) UNIQUE NOT NULL,
            SHORT_CODE VARCHAR(5)  NOT NULL,
            FOREIGN KEY (SHORT_CODE) REFERENCES TEAM(SHORT_CODE)
                ON DELETE CASCADE ON UPDATE CASCADE
        );

        CREATE TABLE IF NOT EXISTS TEAM_SPONSORS (
            SHORT_CODE VARCHAR(5)  NOT NULL,
            SPONSORS   VARCHAR(60) NOT NULL,
            PRIMARY KEY (SHORT_CODE, SPONSORS),
            FOREIGN KEY (SHORT_CODE) REFERENCES TEAM(SHORT_CODE)
                ON DELETE CASCADE ON UPDATE CASCADE
        );

        -- TRUNCATE TABLES BEFORE INSERT TO ALLOW RE-RUNNING SCRIPT
        SET FOREIGN_KEY_CHECKS = 0;
        TRUNCATE TABLE TEAM_SPONSORS;
        TRUNCATE TABLE OWNER;
        TRUNCATE TABLE HELD;
        TRUNCATE TABLE COMPETE;
        TRUNCATE TABLE MATCH_INFO;
        TRUNCATE TABLE VENUE;
        TRUNCATE TABLE PLAYER_ROLE;
        TRUNCATE TABLE PLAYER;
        TRUNCATE TABLE TEAM;
        SET FOREIGN_KEY_CHECKS = 1;

        -- TEAMS
        INSERT INTO TEAM VALUES
        ('MI',   'Mumbai Indians',               'Mumbai',    'Wankhede Stadium'),
        ('CSK',  'Chennai Super Kings',          'Chennai',   'MA Chidambaram Stadium'),
        ('RCB',  'Royal Challengers Bengaluru',  'Bengaluru', 'M. Chinnaswamy Stadium'),
        ('KKR',  'Kolkata Knight Riders',        'Kolkata',   'Eden Gardens'),
        ('DC',   'Delhi Capitals',               'Delhi',     'Arun Jaitley Stadium'),
        ('SRH',  'Sunrisers Hyderabad',          'Hyderabad', 'Rajiv Gandhi Intl. Stadium'),
        ('RR',   'Rajasthan Royals',             'Jaipur',    'Sawai Mansingh Stadium'),
        ('PBKS', 'Punjab Kings',                 'Mohali',    'PCA Stadium'),
        ('GT',   'Gujarat Titans',               'Ahmedabad', 'Narendra Modi Stadium'),
        ('LSG',  'Lucknow Super Giants',         'Lucknow',   'BRSABV Ekana Cricket Stadium');

        -- PLAYERS (30 players, 3 per team)
        INSERT INTO PLAYER (NAME, SHORT_CODE) VALUES
        ('Rohit Sharma','MI'),('Jasprit Bumrah','MI'),('Hardik Pandya','MI'),
        ('MS Dhoni','CSK'),('Ruturaj Gaikwad','CSK'),('Deepak Chahar','CSK'),
        ('Virat Kohli','RCB'),('Faf du Plessis','RCB'),('Mohammed Siraj','RCB'),
        ('Shreyas Iyer','KKR'),('Sunil Narine','KKR'),('Andre Russell','KKR'),
        ('David Warner','DC'),('Axar Patel','DC'),('Anrich Nortje','DC'),
        ('Pat Cummins','SRH'),('Heinrich Klaasen','SRH'),('Bhuvneshwar Kumar','SRH'),
        ('Sanju Samson','RR'),('Jos Buttler','RR'),('Yuzvendra Chahal','RR'),
        ('Shikhar Dhawan','PBKS'),('Arshdeep Singh','PBKS'),('Liam Livingstone','PBKS'),
        ('Shubman Gill','GT'),('Rashid Khan','GT'),('Mohammed Shami','GT'),
        ('KL Rahul','LSG'),('Quinton de Kock','LSG'),('Ravi Bishnoi','LSG');

        -- PLAYER ROLES
        INSERT INTO PLAYER_ROLE VALUES
        (1,'Batsman'),(2,'Bowler'),(3,'All-Rounder'),
        (4,'Wicket-Keeper'),(4,'Batsman'),(5,'Batsman'),(6,'Bowler'),
        (7,'Batsman'),(8,'Batsman'),(9,'Bowler'),
        (10,'Batsman'),(11,'All-Rounder'),(12,'All-Rounder'),
        (13,'Batsman'),(14,'All-Rounder'),(15,'Bowler'),
        (16,'Bowler'),(16,'All-Rounder'),(17,'Wicket-Keeper'),(17,'Batsman'),(18,'Bowler'),
        (19,'Wicket-Keeper'),(19,'Batsman'),(20,'Wicket-Keeper'),(20,'Batsman'),(21,'Bowler'),
        (22,'Batsman'),(23,'Bowler'),(24,'All-Rounder'),
        (25,'Batsman'),(26,'Bowler'),(27,'Bowler'),
        (28,'Wicket-Keeper'),(28,'Batsman'),(29,'Wicket-Keeper'),(30,'Bowler');

        -- VENUES
        INSERT INTO VENUE (PITCH_CONDITIONS, LOCATION) VALUES
        ('Batting Friendly','Mumbai'),('Balanced','Chennai'),
        ('Batting Friendly','Bengaluru'),('Spin Friendly','Kolkata'),
        ('Batting Friendly','Delhi'),('Pace Friendly','Hyderabad'),
        ('Balanced','Jaipur'),('Batting Friendly','Ahmedabad');

        -- MATCHES
        INSERT INTO MATCH_INFO (WINNING_TEAM, LOSING_TEAM, DATE, MATCH_TYPE) VALUES
        ('MI', 'CSK', '2025-03-22','League'),
        ('RCB','DC',  '2025-03-23','League'),
        ('KKR','SRH', '2025-03-24','League'),
        ('RR', 'PBKS','2025-03-25','League'),
        ('GT', 'LSG', '2025-03-26','League'),
        ('CSK','RCB', '2025-03-28','League'),
        ('MI', 'KKR', '2025-03-29','League'),
        ('SRH','DC',  '2025-03-30','League'),
        ('LSG','RR',  '2025-03-31','League'),
        ('PBKS','GT', '2025-04-01','League'),
        ('MI', 'RCB', '2025-04-20','Eliminator 1'),
        ('KKR','CSK', '2025-04-21','Eliminator 2'),
        ('MI', 'KKR', '2025-04-27','Final');

        -- COMPETE
        INSERT INTO COMPETE VALUES
        ('MI',1),('CSK',1),('RCB',2),('DC',2),('KKR',3),('SRH',3),
        ('RR',4),('PBKS',4),('GT',5),('LSG',5),('CSK',6),('RCB',6),
        ('MI',7),('KKR',7),('SRH',8),('DC',8),('LSG',9),('RR',9),
        ('PBKS',10),('GT',10),('MI',11),('RCB',11),('KKR',12),('CSK',12),('MI',13),('KKR',13);

        -- HELD
        INSERT INTO HELD VALUES
        (1,1),(2,3),(3,4),(4,7),(5,8),(6,2),(7,1),(8,6),(9,8),(10,7),(11,1),(12,4),(13,8);

        -- OWNERS
        INSERT INTO OWNER (NAME, EMAIL, SHORT_CODE) VALUES
        ('Mukesh Ambani','mukesh@mi.com','MI'),('N. Srinivasan','srini@csk.com','CSK'),
        ('Anand Mahindra','anand@rcb.com','RCB'),('Shah Rukh Khan','srk@kkr.com','KKR'),
        ('JSW Group','jsw@dc.com','DC'),('Kavya Maran','kavya@srh.com','SRH'),
        ('Manoj Badale','manoj@rr.com','RR'),('Mohit Burman','mohit@pbks.com','PBKS'),
        ('CVC Capital','cvc@gt.com','GT'),('RPSG Group','rpsg@lsg.com','LSG');

        -- SPONSORS
        INSERT INTO TEAM_SPONSORS VALUES
        ('MI','DLF'),('MI','Jio'),('CSK','Amul'),('CSK','TVS'),
        ('RCB','Muthoot Finance'),('RCB','Naukri.com'),
        ('KKR','Myntra'),('KKR','Gulf Oil'),('DC','Delhivery'),('DC','BYJUS'),
        ('SRH','CEAT'),('SRH','Astral'),('RR','TataSky'),('PBKS','BKT Tyres'),
        ('GT','TATA Motors'),('LSG','Unacademy'),('LSG','Puma');
        `;

        await connection.query(sqlScript);
        console.log("Database initialized and populated successfully with IPL 2025 data!");
        process.exit(0);

    } catch (err) {
        console.error("Failed to initialize database. Ensure MySQL is running and credentials are correct.");
        console.error(err.message);
        process.exit(1);
    }
}

initializeDB();
