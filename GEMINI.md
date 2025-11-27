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

### Root Directory
*   `index.html`: The entry point. Initializes the canvas and loads the game module.
*   `assets/`: Contains static assets (images, CSS).
*   `tests/`: Contains test suites and runners.

### Source Code (`src/`)
*   **Core (`src/core/`)**
    *   `game.js`: Main game loop and initialization.
    *   `gamestate.js`: Global state management.
    *   `constants.js`: Enums and game constants.
    *   `saveload.js`: Persistence logic.
*   **Systems (`src/systems/`)**
    *   `racing.js`: Simulation engine (Physics, AI, Burner Phone).
    *   `generators.js`: Procedural content generation (Drivers, Seasons).
    *   `segmentTrackGenerator.js`: Track generation logic.
*   **Models (`src/models/`)**
    *   `track.js`: Data structure for tracks.
*   **Utils (`src/utils/`)**
    *   `utils.js`: Helper functions (Math, collisions).
    *   `enhanced_race_rendering.js`: Rendering helpers.
*   **Screens (`src/screens/`)**
    *   `mainMenuScreen.js`, `raceScreen.js`, etc.: UI and Logic for each game state.

### Important Notes
*   **Imports:** All imports now use relative paths (e.g., `../core/constants.js`).
*   **Track Export:** `src/models/track.js` uses a **default export**.
*   **Generators Export:** `src/systems/generators.js` uses **named exports**.

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
*   **Track Export:** `track.js` uses a **default export**. When importing, ensure the path points to `src/models/track.js`.
*   **Generators Export:** `generators.js` uses **named exports**.
*   **Package Type:** The `package.json` specifies `"type": "module"`.
*   **CI/CD:** The game has CI/CD setup with GitHub pages. Once the code is fully ready for production commit and push to the local branch. After a 60 second wait for the pipeline the site will be avaiable at https://pojo134.github.io/
