# Redline Roulette - Project Context (GEMINI.md)

## Project Overview
**Redline Roulette** is a browser-based racing betting simulator with roguelike elements. Players take on the role of a gambler in an underground racing circuit. The goal is to analyze procedural odds, place bets, and influence race outcomes using a "Burner Phone" mechanic to progress through racing tiers.

The project is built using **Vanilla JavaScript (ES Modules)** and renders to an **HTML5 Canvas**. It requires no compilation step and runs directly in modern browsers.

## Key Technical Characteristics
*   **Language:** JavaScript (ES6+ Modules).
*   **Rendering:** HTML5 Canvas API (`CanvasRenderingContext2D`).
*   **Architecture:** Component-based State Machine.
*   **Persistence:** `localStorage` for save data.
*   **Physics:** Waypoint-based simulation with collision, drafting, and stat-based performance.
*   **Procedural Generation:** Drivers, tracks, and seasons are generated algorithmically.

## Project Structure

### Core Files
*   `index.html`: The entry point. Initializes the canvas and loads `game.js` as a module.
*   `game.js`: The main game loop. Handles initialization, input management, and switching between screens.
*   `gamestate.js`: Singleton-like class (`GameState`) managing the global state (player bankroll, current season, active race data).
*   `constants.js`: Defines Enums/Constants for `GameStates`, `RaceState`, `CarStatus`, `EventType`, etc.

### Systems
*   `racing.js`:
    *   `RaceSimulator`: Manages the race loop, events (crashes, overtaking), and the leaderboard.
    *   `RacingPhysics`: Handles car movement, speed calculations based on stats/terrain, and AI behavior.
    *   `BurnerPhoneSystem`: Logic for the cheat mechanics (Spotter, Marshal, etc.).
*   `generators.js`: Procedural generation logic.
    *   `DriverGenerator`: Creates drivers with stats and hidden traits.
    *   `TrackGenerator`: Generates track layouts (waypoints) and names.
    *   `SeasonGenerator`: Creates race calendars and contracts.
    *   `OddsCalculator`: Determines betting odds based on driver stats vs. track characteristics.
*   `track.js`: Defines the `Track` class, handling layout data and visualization logic.
*   `saveload.js`: Manages serialization/deserialization of `GameState` to `localStorage`.

### UI / Screens
Located in the `screens/` directory. Each class typically implements `update(deltaTime)` and `render(ctx)`.
*   `mainMenuScreen.js`: Start/Load/Settings.
*   `garageScreen.js`: Player hub between races.
*   `bettingScreen.js`: Odds display and wager placement.
*   `raceScreen.js`: Real-time visualization of the race.
*   `resultsScreen.js`: Post-race summary.
*   `dragRaceScreen.js`: Special event screen for drag races.
*   ...and others (`gameOverScreen.js`, `tierAdvancementScreen.js`, etc.).

## Development & Usage

### Running the Project
Since this uses ES Modules, you cannot simply open `index.html` via the file protocol (`file://`). You must serve the directory via a local web server.

**Examples:**
*   **Python:** `python -m http.server 8000`
*   **Node.js:** `npx serve`
*   **VS Code:** "Live Server" extension.

Navigate to `http://localhost:8000` (or provided port) to play.

### Testing
An automated test suite is included.
*   **Run Tests:** Open `test.html` in a browser (served via web server).
*   **Test File:** `test-suite.js` contains the assertions and test cases.

### Coding Conventions
*   **Modules:** Use `import` / `export` syntax.
*   **Classes:** Use ES6 Classes for structural components (Screens, Generators, Simulators).
*   **Constants:** Use `Object.freeze` in `constants.js` for enumerations.
*   **State:** Avoid storing local state in screens if it needs to persist; use `GameState` for persistent data.
*   **Rendering:** Draw calls happen in `render(ctx, gameState)`. 1280x720 reference resolution.
*   **Pathfinding:** Cars follow a list of `{x, y}` waypoints defined in the `Track` object.

### Important Notes
*   **Track Export:** `track.js` uses a **default export**. When importing, use `import Track from './track.js'`.
*   **Generators Export:** `generators.js` uses **named exports**. Use `import { DriverGenerator, ... } from './generators.js'`.
*   **Package Type:** The `package.json` specifies `"type": "module"` to support Node.js context if needed (e.g. for CLI verification scripts), though the game is browser-native.
*   **CI/CD:** The game has CI/CD setup with GitHub pages. Once the code is fully ready for production commit and push to the local branch. After a 60 second wait for the pipeline the site will be avaiable at https://pojo134.github.io/
