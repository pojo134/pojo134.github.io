# Redline Roulette - Project Architecture & Context

## 1. Overview
Redline Roulette is a browser-based (Canvas API) racing betting simulator with roguelike elements.
- **Stack**: Vanilla JavaScript (ES Modules), HTML5 Canvas, CSS.
- **Execution**: Runs directly in browser via local server (no build step).
- **Resolution**: 1280x720 (Fixed Canvas).

## 2. Core Architecture
- **Entry**: `index.html` loads `src/core/game.js`.
- **Game Loop**: `Game` class (`src/core/game.js`) handles the RequestAnimationFrame loop, `update()`, and `render()`.
- **State Management**: `GameState` (`src/core/gamestate.js`) is the singleton source of truth.
    - Persists: Player bankroll, Tier, Season, Week, Upgrades.
    - Transient: Current race data, simulation state, active bet.
- **Screen System**: `ScreenManager` transitions between discrete screen classes:
    - `MainMenu`, `Garage` (Hub), `Betting` (Pre-race), `Race` (Active view), `Results`, `DragRace`.

## 3. Simulation Systems (`src/systems/`)
- **Racing (`racing.js`)**:
    - `RaceSimulator`: Main engine. Uses waypoint-based pathfinding, deterministic physics, and probabilistic events (DNF, Overtake).
    - `DragRaceSimulator`: Simplified physics for straight-line drag events.
    - `RacingPhysics`: Calculates speed modifiers (Cornering, Drafting, Weather).
    - `BurnerPhoneSystem`: Mechanics for player influence (Spotter, Marshal, etc.).
- **Generators (`generators.js`)**:
    - Procedural generation for Drivers (stats/traits), Seasons, and Contracts.
    - `TrackGenerator`: Creates track layouts.

## 4. Key Data Models
- **Track (`src/models/track.js`)**:
    - Defines waypoints, visuals (`renderFullTrack`), and characteristics.
- **Driver**:
    - Objects containing Stats (Speed, Cornering, Reliability) and Traits (e.g., "Choker", "Rain Master").

## 5. Development Context
- **Active Area**: Betting Screen UI (`src/screens/bettingScreen.js`).
- **Recent Focus**: Drag race integration, UI improvements, Track visualization.
- **Conventions**:
    - ES6 Classes.
    - Relative imports.
    - Constants in `src/core/constants.js`.
