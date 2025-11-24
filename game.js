/* ========================================
   REDLINE ROULETTE - CORE GAME ENGINE
   Production-ready modular architecture
   ======================================== */

// ===== GAME STATES =====
const GameStates = Object.freeze({
    MAIN_MENU: 'MAIN_MENU',
    GARAGE: 'GARAGE',
    BETTING: 'BETTING',
    RACE: 'RACE',
    DRAG_RACE: 'DRAG_RACE', // Added DRAG_RACE state
    RESULTS: 'RESULTS',
    SETTINGS: 'SETTINGS',
    LOAD_GAME: 'LOAD_GAME',
    GAME_OVER: 'GAME_OVER',
    TIER_ADVANCEMENT: 'TIER_ADVANCEMENT'
});

// ===== ASSET MANAGER =====
class AssetManager {
    constructor() {
        this.images = new Map();
        this.loadQueue = [];
        this.loadedCount = 0;
        this.totalAssets = 0;
    }

    /**
     * Queue an image for loading
     * @param {string} key - Identifier for the asset
     * @param {string} path - Path to the image file
     */
    queueImage(key, path) {
        this.loadQueue.push({ key, path, type: 'image' });
        this.totalAssets++;
    }

    /**
     * Load all queued assets
     * @returns {Promise} Resolves when all assets are loaded
     */
    loadAll() {
        return new Promise((resolve, reject) => {
            if (this.loadQueue.length === 0) {
                resolve();
                return;
            }

            this.loadQueue.forEach(asset => {
                if (asset.type === 'image') {
                    this._loadImage(asset.key, asset.path, resolve, reject);
                }
            });
        });
    }

    /**
     * Load individual image
     * @private
     */
    _loadImage(key, path, resolve, reject) {
        const img = new Image();

        img.onload = () => {
            this.images.set(key, img);
            this.loadedCount++;

            if (this.loadedCount === this.totalAssets) {
                resolve();
            }
        };

        img.onerror = () => {
            reject(new Error(`Failed to load image: ${path}`));
        };

        img.src = path;
    }

    /**
     * Get loaded image
     * @param {string} key - Asset identifier
     * @returns {HTMLImageElement|null}
     */
    getImage(key) {
        return this.images.get(key) || null;
    }

    /**
     * Get loading progress (0-1)
     * @returns {number}
     */
    getProgress() {
        return this.totalAssets === 0 ? 1 : this.loadedCount / this.totalAssets;
    }
}

// ===== INPUT MANAGER =====
class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.mouse = { x: 0, y: 0, pressed: false, clicked: false };
        this.keys = new Set();
        this.keysPressed = new Set();

        this._setupEventListeners();
    }

    /**
     * Setup all input event listeners
     * @private
     */
    _setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this._handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this._handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this._handleMouseUp(e));

        // Keyboard events
        window.addEventListener('keydown', (e) => this._handleKeyDown(e));
        window.addEventListener('keyup', (e) => this._handleKeyUp(e));

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Mouse move handler
     * @private
     */
    _handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    /**
     * Mouse down handler
     * @private
     */
    _handleMouseDown(e) {
        this.mouse.pressed = true;
        this.mouse.clicked = true;
    }

    /**
     * Mouse up handler
     * @private
     */
    _handleMouseUp(e) {
        this.mouse.pressed = false;
    }

    /**
     * Key down handler
     * @private
     */
    _handleKeyDown(e) {
        if (!this.keys.has(e.key)) {
            this.keysPressed.add(e.key);
        }
        this.keys.add(e.key);
    }

    /**
     * Key up handler
     * @private
     */
    _handleKeyUp(e) {
        this.keys.delete(e.key);
    }

    /**
     * Check if key is currently held
     * @param {string} key
     * @returns {boolean}
     */
    isKeyDown(key) {
        return this.keys.has(key);
    }

    /**
     * Check if key was just pressed this frame
     * @param {string} key
     * @returns {boolean}
     */
    isKeyPressed(key) {
        return this.keysPressed.has(key);
    }

    /**
     * Check if mouse was clicked this frame
     * @returns {boolean}
     */
    isMouseClicked() {
        return this.mouse.clicked;
    }

    /**
     * Get mouse position
     * @returns {{x: number, y: number}}
     */
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    /**
     * Reset frame-specific input states (call at end of frame)
     */
    reset() {
        this.mouse.clicked = false;
        this.keysPressed.clear();
    }
}

// ===== SCREEN MANAGER =====
class ScreenManager {
    constructor() {
        this.currentState = GameStates.MAIN_MENU;
        this.previousState = null;
        this.transitionProgress = 0;
        this.isTransitioning = false;
        this.transitionDuration = 0.3; // seconds
    }

    /**
     * Change to a new game state
     * @param {string} newState - Target GameStates
     */
    changeState(newState) {
        if (this.isTransitioning || newState === this.currentState) {
            return;
        }

        this.previousState = this.currentState;
        this.currentState = newState;
        this.isTransitioning = true;
        this.transitionProgress = 0;
    }

    /**
     * Update transition animation
     * @param {number} deltaTime
     */
    updateTransition(deltaTime) {
        if (!this.isTransitioning) {
            return;
        }

        this.transitionProgress += deltaTime / this.transitionDuration;

        if (this.transitionProgress >= 1) {
            this.transitionProgress = 1;
            this.isTransitioning = false;
        }
    }

    /**
     * Get current state
     * @returns {string}
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * Check if currently transitioning
     * @returns {boolean}
     */
    isInTransition() {
        return this.isTransitioning;
    }

    /**
     * Get transition progress (0-1)
     * @returns {number}
     */
    getTransitionProgress() {
        return this.transitionProgress;
    }
}

// ===== RENDERER =====
class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    /**
     * Clear the entire canvas
     * @param {string} color - Fill color (default: black)
     */
    clear(color = '#000000') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Draw text with retro styling
     * @param {string} text
     * @param {number} x
     * @param {number} y
     * @param {object} options
     */
    drawText(text, x, y, options = {}) {
        const {
            font = '16px "Courier New", monospace',
            color = '#ffffff',
            align = 'left',
            baseline = 'top',
            shadow = false
        } = options;

        this.ctx.save();
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;

        if (shadow) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
        }

        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    /**
     * Draw a rectangle
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {object} options
     */
    drawRect(x, y, width, height, options = {}) {
        const { fill = null, stroke = null, lineWidth = 1 } = options;

        this.ctx.save();

        if (fill) {
            this.ctx.fillStyle = fill;
            this.ctx.fillRect(x, y, width, height);
        }

        if (stroke) {
            this.ctx.strokeStyle = stroke;
            this.ctx.lineWidth = lineWidth;
            this.ctx.strokeRect(x, y, width, height);
        }

        this.ctx.restore();
    }

    /**
     * Draw an image
     * @param {HTMLImageElement} img
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    drawImage(img, x, y, width = null, height = null) {
        if (!img) return;

        if (width && height) {
            this.ctx.drawImage(img, x, y, width, height);
        } else {
            this.ctx.drawImage(img, x, y);
        }
    }

    /**
     * Apply fade transition effect
     * @param {number} progress - 0 to 1
     */
    applyFadeTransition(progress) {
        const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    }

    /**
     * Reset renderer state
     */
    reset() {
        this.ctx.globalAlpha = 1;
    }
}

// ===== MAIN GAME ENGINE =====
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        if (!this.ctx) {
            throw new Error('Failed to get canvas context');
        }

        // Core systems
        this.assetManager = new AssetManager();
        this.inputManager = new InputManager(this.canvas);
        this.screenManager = new ScreenManager();
        this.renderer = new Renderer(this.canvas, this.ctx);

        // Timing
        this.lastFrameTime = 0;
        this.targetFPS = 60;
        this.targetFrameTime = 1000 / this.targetFPS;

        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.assetsLoaded = false;

        // Initialize systems
        this._initializeSystems();

        // Queue assets
        this._queueAssets();
    }

    /**
     * Queue all game assets for loading
     * @private
     */
    _queueAssets() {
        // Vehicle sprites
        this.assetManager.queueImage('gokart', 'gokart.png');
        this.assetManager.queueImage('gt3', 'gt3.png');
        this.assetManager.queueImage('openwheel', 'openwheel.png');
        this.assetManager.queueImage('stockcar', 'stockcar.png');
        this.assetManager.queueImage('topfuel', 'topfuel.png');

        // Track textures
        this.assetManager.queueImage('dirt_sample', 'dirt_sample.png');
        this.assetManager.queueImage('grass_sample', 'grass_sample.png');
        this.assetManager.queueImage('track_sample', 'track_sample.png');
        this.assetManager.queueImage('track_side_strip', 'track_side_strip.png');
    }

    /**
     * Initialize and start the game
     */
    async start() {
        try {
            // Load all assets
            await this.assetManager.loadAll();
            this.assetsLoaded = true;

            // Start game loop
            this.isRunning = true;
            this.lastFrameTime = performance.now();
            this._gameLoop();

        } catch (error) {
            this._handleError(error);
        }
    }

    /**
     * Main game loop (60 FPS)
     * @private
     */
    _gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = currentTime;

        // Update and render
        this._update(deltaTime);
        this._render();

        // Request next frame
        requestAnimationFrame(() => this._gameLoop());
    }

    /**
     * Update game logic
     * @private
     */
    _update(deltaTime) {
        if (this.isPaused) return;

        // Scale deltaTime for simulation speed
        const scaledDeltaTime = deltaTime * this.timeScale;

        // Update screen transitions
        this.screenManager.updateTransition(deltaTime);

        // State-specific updates
        const currentState = this.screenManager.getCurrentState();

        switch (currentState) {
            case GameStates.MAIN_MENU:
                this._updateMainMenu(deltaTime);
                break;
            case GameStates.GARAGE:
                this._updateGarage(deltaTime);
                break;
            case GameStates.BETTING:
                this._updateBetting(deltaTime);
                break;
            case GameStates.RACE:
                this._updateRace(scaledDeltaTime);
                break;
            case GameStates.DRAG_RACE: // Added DRAG_RACE state
                this._updateDragRace(scaledDeltaTime);
                break;
            case GameStates.RESULTS:
                this._updateResults(deltaTime);
                break;
            case GameStates.SETTINGS:
                this._updateSettings(deltaTime);
                break;
            case GameStates.LOAD_GAME:
                this._updateLoadGame(deltaTime);
                break;
            case GameStates.GAME_OVER:
                this._updateGameOver(deltaTime);
                break;
            case GameStates.TIER_ADVANCEMENT:
                this._updateTierAdvancement(deltaTime);
                break;
        }

        // Reset input states for next frame
        this.inputManager.reset();
    }

    /**
     * Render game graphics
     * @private
     */
    _render() {
        // Clear canvas
        this.renderer.clear('#0a0a0a');

        // State-specific rendering
        const currentState = this.screenManager.getCurrentState();

        switch (currentState) {
            case GameStates.MAIN_MENU:
                this._renderMainMenu();
                break;
            case GameStates.GARAGE:
                this._renderGarage();
                break;
            case GameStates.BETTING:
                this._renderBetting();
                break;
            case GameStates.RACE:
                this._renderRace();
                break;
            case GameStates.DRAG_RACE: // Added DRAG_RACE state
                this._renderDragRace();
                break;
            case GameStates.RESULTS:
                this._renderResults();
                break;
            case GameStates.SETTINGS:
                this._renderSettings();
                break;
            case GameStates.LOAD_GAME:
                this._renderLoadGame();
                break;
            case GameStates.GAME_OVER:
                this._renderGameOver();
                break;
            case GameStates.TIER_ADVANCEMENT:
                this._renderTierAdvancement();
                break;
        }

        // Apply transition effects
        if (this.screenManager.isInTransition()) {
            this.renderer.applyFadeTransition(
                this.screenManager.getTransitionProgress()
            );
        }

        // Reset renderer state
        this.renderer.reset();
    }

    // ===== INITIALIZATION METHODS =====

    /**
     * Initializes game systems and generators
     * @private
     */
    _initializeSystems() {
        // Create generators
        this.driverGenerator = new DriverGenerator();
        this.trackGenerator = new TrackGenerator();
        this.oddsCalculator = new OddsCalculator();
        this.seasonGenerator = new SeasonGenerator(this.trackGenerator); // Pass TrackGenerator instance

        // Create screens
        this.screens = {
            mainMenu: new MainMenuScreen(),
            garage: new GarageScreen(),
            betting: new BettingScreen(),
            race: new RaceScreen(),
            dragRace: new DragRaceScreen(), // Added DragRaceScreen
            results: new ResultsScreen(),
            settings: new SettingsScreen(),
            loadGame: new LoadGameScreen(),
            gameOver: new GameOverScreen(),
            tierAdvancement: new TierAdvancementScreen()
        };

        // Create game state
        this.gameState = new GameState();

        // Create save manager
        this.saveManager = new SaveManager();

        // Race simulator (created when race starts)
        this.raceSimulator = null;
        
        // Time control
        this.timeScale = 1; // 1x, 2x, 5x speed
    }

    /**
     * Starts a new game
     * @private
     */
    _startNewGame() {
        this.gameState.startNewGame(1); // Start at tier 1

        // Generate season calendar
        const calendar = this.seasonGenerator.generateSeason(this.gameState.player.tier);
        this.gameState.setSeasonCalendar(calendar);

        // Transition to garage
        this.screenManager.changeState(GameStates.GARAGE);
    }

    // ===== STATE UPDATE METHODS =====

    _updateMainMenu(deltaTime) {
        this.screens.mainMenu.update(deltaTime, this.gameState);

        // Handle mouse clicks
        if (this.inputManager.isMouseClicked()) {
            const mouse = this.inputManager.getMousePosition();
            const action = this.screens.mainMenu.handleClick(mouse.x, mouse.y, this.gameState);

            if (action === 'newGame') {
                this._startNewGame();
            } else if (action === 'continue') {
                // Load autosave
                const saveData = this.saveManager.load('auto');
                if (saveData) {
                    this.gameState.fromJSON(saveData.gameState);
                    this.screenManager.changeState(GameStates.GARAGE);
                }
            } else if (action === 'loadGame') {
                this.screenManager.changeState(GameStates.LOAD_GAME);
            } else if (action === 'settings') {
                this.screenManager.changeState(GameStates.SETTINGS);
            }
        }

        // Handle mouse move for hover effects
        const mouse = this.inputManager.getMousePosition();
        this.screens.mainMenu.handleMouseMove(mouse.x, mouse.y);
    }

    _updateGarage(deltaTime) {
        this.screens.garage.update(deltaTime, this.gameState);

        // Handle mouse clicks
        if (this.inputManager.isMouseClicked()) {
            const mouse = this.inputManager.getMousePosition();
            const action = this.screens.garage.handleClick(mouse.x, mouse.y, this.gameState);

            if (action) {
                if (action.action === 'buyUpgrade') {
                    this.gameState.purchaseUpgrade(action.upgradeId, action.price);
                } else if (action.action === 'startRace') {
                    // Select contract and prepare race
                    this.gameState.selectContract(action.contractIndex);
                    this._prepareRace();
                    this.screenManager.changeState(GameStates.BETTING);
                }
            }
        }

        // Handle mouse move
        const mouse = this.inputManager.getMousePosition();
        this.screens.garage.handleMouseMove(mouse.x, mouse.y);
    }

    _updateBetting(deltaTime) {
        this.screens.betting.update(deltaTime, this.gameState);

        // Handle mouse clicks
        if (this.inputManager.isMouseClicked()) {
            const mouse = this.inputManager.getMousePosition();
            const action = this.screens.betting.handleClick(mouse.x, mouse.y, this.gameState);

            if (action) {
                if (action.action === 'placeBet') {
                    // Place bet and start race
                    const success = this.gameState.placeBet(
                        action.driver.name,
                        action.amount,
                        action.betType
                    );

                    if (success) {
                        this._startRace();
                        this.screenManager.changeState(GameStates.RACE);
                    }
                }
            }
        }

        // Handle mouse move
        const mouse = this.inputManager.getMousePosition();
        this.screens.betting.handleMouseMove(mouse.x, mouse.y);
    }

    _updateRace(scaledDeltaTime) {
        this.screens.race.update(scaledDeltaTime, this.gameState);

        // Update race simulator
        if (this.raceSimulator) {
            const raceState = this.raceSimulator.getRaceState();

            // Update race simulation
            this.raceSimulator.update(scaledDeltaTime);

            // Update game state with current race data
            this.gameState.race.raceStandings = raceState.leaderboard;
            this.gameState.race.carPositions = this.raceSimulator.getCarsForRender();
            this.gameState.race.currentLap = raceState.currentLap;
            this.gameState.race.totalLaps = raceState.totalLaps;

            // Check if race is complete
            if (raceState.state === 'FINISHED') {
                // Auto-transition to results after a delay
                if (!this._raceCompleteTime) {
                    this._raceCompleteTime = Date.now();
                }

                if (Date.now() - this._raceCompleteTime > 2000) {
                    this._finishRace();
                    this.screenManager.changeState(GameStates.RESULTS);
                    this._raceCompleteTime = null;
                }
            }
        }

        // Handle mouse clicks for burner phone
        if (this.inputManager.isMouseClicked()) {
            const mouse = this.inputManager.getMousePosition();
            const action = this.screens.race.handleClick(mouse.x, mouse.y, this.gameState);

            if (action && action.action === 'contactUsed') {
                // Contact was successfully used
            }
        }

        // Handle mouse move for hover effects
        const mouse = this.inputManager.getMousePosition();
        this.screens.race.handleMouseMove(mouse.x, mouse.y, this.gameState);
    }

    _updateDragRace(scaledDeltaTime) {
        this.screens.dragRace.update(scaledDeltaTime, this.gameState);

        // Update drag race simulator
        if (this.raceSimulator) { // This will be DragRaceSimulator instance
            this.raceSimulator.update(scaledDeltaTime);

            // Check if drag race is complete
            const dragRaceState = this.raceSimulator.getRaceState();
            if (dragRaceState.state === RaceState.FINISHED) {
                // Auto-transition to results after a delay
                if (!this._dragRaceCompleteTime) {
                    this._dragRaceCompleteTime = Date.now();
                }

                if (Date.now() - this._dragRaceCompleteTime > 2000) {
                    this._finishDragRace(); // New method to handle drag race results
                    this.screenManager.changeState(GameStates.RESULTS);
                    this._dragRaceCompleteTime = null;
                }
            }
        }

        // Handle mouse clicks for drag race screen
        if (this.inputManager.isMouseClicked()) {
            const mouse = this.inputManager.getMousePosition();
            const action = this.screens.dragRace.handleClick(mouse.x, mouse.y, this.gameState);

            if (action && action.action === 'continue') {
                // After drag race, transition back to garage or next relevant state
                this.screens.dragRace.reset();
                this.screenManager.changeState(GameStates.GARAGE);
            }
        }
    }

    _updateResults(deltaTime) {
        this.screens.results.update(deltaTime, this.gameState);

        // Handle mouse clicks
        if (this.inputManager.isMouseClicked()) {
            const mouse = this.inputManager.getMousePosition();
            const action = this.screens.results.handleClick(mouse.x, mouse.y, this.gameState);

            if (action && action.action === 'continue') {
                // Determine if the last completed race was a drag race
                const lastContractWasDragRace = this.gameState.season.selectedContract?.isDragRace;

                if (lastContractWasDragRace) {
                    // For drag races, reset the results screen and go back to garage
                    // Do NOT advance week or season
                    this.screens.results.reset();
                    this.screenManager.changeState(GameStates.GARAGE);
                } else {
                    // Original logic for regular races
                    // Advance to next week
                    const result = this.gameState.advanceWeek();

                    if (result === 'continue') {
                        // Continue to next week
                        this.screens.results.reset();
                        this.screenManager.changeState(GameStates.GARAGE);
                    } else if (result.status === 'season_complete') {
                        // Season complete - check if can advance tier
                        if (result.canAdvance && this.gameState.advanceTier()) {
                            this.screens.results.reset();
                            this.screenManager.changeState(GameStates.TIER_ADVANCEMENT);
                        } else {
                            // Can't advance - continue with same tier
                            this.screens.results.reset();
                            this.screenManager.changeState(GameStates.GARAGE);
                        }
                    }
                }

                // Autosave (always save after any race completion)
                this.saveManager.autoSave(this._createSaveSlot());
            }
        }

        // Check for game over
        if (this.gameState.isGameOver()) {
            this.screenManager.changeState(GameStates.GAME_OVER);
        }
    }

    _updateSettings(deltaTime) {
        this.screens.settings.update(deltaTime, this.gameState);

        if (this.inputManager.isMouseClicked()) {
            const mouse = this.inputManager.getMousePosition();
            const action = this.screens.settings.handleClick(mouse.x, mouse.y, this.gameState);

            if (action && action.action === 'back') {
                this.screenManager.changeState(GameStates.MAIN_MENU);
            }
        }

        const mouse = this.inputManager.getMousePosition();
        this.screens.settings.handleMouseMove(mouse.x, mouse.y);
    }

    _updateLoadGame(deltaTime) {
        this.screens.loadGame.update(deltaTime, this.gameState);

        if (this.inputManager.isMouseClicked()) {
            const mouse = this.inputManager.getMousePosition();
            const action = this.screens.loadGame.handleClick(mouse.x, mouse.y, this.gameState);

            if (action) {
                if (action.action === 'back') {
                    this.screenManager.changeState(GameStates.MAIN_MENU);
                } else if (action.action === 'loadSlot') {
                    // Load game from slot
                    // TODO: Wire up SaveManager to actually load the game state
                }
            }
        }

        const mouse = this.inputManager.getMousePosition();
        this.screens.loadGame.handleMouseMove(mouse.x, mouse.y);
    }

    _updateGameOver(deltaTime) {
        this.screens.gameOver.update(deltaTime, this.gameState);

        if (this.inputManager.isMouseClicked()) {
            const mouse = this.inputManager.getMousePosition();
            const action = this.screens.gameOver.handleClick(mouse.x, mouse.y, this.gameState);

            if (action) {
                if (action.action === 'newGame') {
                    this._startNewGame();
                } else if (action.action === 'mainMenu') {
                    this.screens.gameOver.reset();
                    this.screenManager.changeState(GameStates.MAIN_MENU);
                }
            }
        }

        const mouse = this.inputManager.getMousePosition();
        this.screens.gameOver.handleMouseMove(mouse.x, mouse.y);
    }

    _updateTierAdvancement(deltaTime) {
        this.screens.tierAdvancement.update(deltaTime, this.gameState);

        if (this.inputManager.isMouseClicked()) {
            const mouse = this.inputManager.getMousePosition();
            const action = this.screens.tierAdvancement.handleClick(mouse.x, mouse.y, this.gameState);

            if (action && action.action === 'continue') {
                this.screens.tierAdvancement.reset();
                this.screenManager.changeState(GameStates.GARAGE);
            }
        }

        const mouse = this.inputManager.getMousePosition();
        this.screens.tierAdvancement.handleMouseMove(mouse.x, mouse.y);
    }

    // ===== STATE RENDER METHODS =====

    _renderMainMenu() {
        this.screens.mainMenu.render(this.ctx, this.gameState);
    }

    _renderGarage() {
        this.screens.garage.render(this.ctx, this.gameState);
    }

    _renderBetting() {
        this.screens.betting.render(this.ctx, this.gameState);
    }

    _renderRace() {
        this.screens.race.render(this.ctx, this.gameState);
    }

    _renderDragRace() {
        this.screens.dragRace.render(this.ctx, this.gameState);
    }

    _renderResults() {
        this.screens.results.render(this.ctx, this.gameState);
    }

    _renderSettings() {
        this.screens.settings.render(this.ctx, this.gameState);
    }

    _renderLoadGame() {
        this.screens.loadGame.render(this.ctx, this.gameState);
    }

    _renderGameOver() {
        this.screens.gameOver.render(this.ctx, this.gameState);
    }

    _renderTierAdvancement() {
        this.screens.tierAdvancement.render(this.ctx, this.gameState);
    }

    // ===== RACE MANAGEMENT =====

    /**
     * Prepares a race by generating drivers, track, and odds
     * @private
     */
    _prepareRace() {
        const contract = this.gameState.season.selectedContract;
        if (!contract) return;

        // Generate drivers
        const drivers = this.driverGenerator.generateField(
            contract.fieldSize || 20,
            this.gameState.player.tier
        );

        // Generate race settings (Track, Laps, Rules)
        // Pass the contract's trackType and the current leagueTier to generateRaceSettings
        const raceSettings = this.trackGenerator.generateRaceSettings(
            null, // raceType is derived from contract
            contract.trackType, // Use the track type from the contract
            800, // default width
            600, // default height
            this.gameState.player.tier // Pass leagueTier
        );
        const track = raceSettings.track; // Extract track object

        // Calculate odds
        const winOdds = this.oddsCalculator.calculateWinOdds(drivers, track, raceSettings);

        // Setup race in game state (track is now a Track object with name)
        this.gameState.setupRace(drivers, track, contract, raceSettings);
        this.gameState.setRaceOdds(winOdds);

        // Store reference for screens
        this.gameState.currentTrack = track;
        this.gameState.raceSettings = raceSettings; // Store all race settings
    }

    /**
     * Starts the race simulation
     * @private
     */
    _startRace() {
        console.log("DEBUG: Game._startRace called.");
        const drivers = this.gameState.race.drivers;
        const track = this.gameState.race.track;
        const contract = this.gameState.race.contract;
        const leagueTier = this.gameState.player.tier; // Get current league tier

        // Always clear the previous simulator instance
        this.raceSimulator = null; 
        this.gameState.race.simulation = null; // Clear from gameState as well

        if (contract.isDragRace) {
            console.log("DEBUG: Game._startRace: Initiating DragRaceSimulator.");
            // If it's a drag race, use DragRaceSimulator
            const dragSimulator = new DragRaceSimulator(drivers, track, leagueTier);
            this.raceSimulator = dragSimulator;
            this.raceSimulator.start();
            this.gameState.race.simulation = this.raceSimulator; // Assign to gameState for screens
            this.screenManager.changeState(GameStates.DRAG_RACE); // Transition to DRAG_RACE screen
            console.log("DEBUG: Game._startRace: this.raceSimulator assigned (Drag):", this.raceSimulator);
            console.log("DEBUG: Game._startRace: this.raceSimulator is instanceof DragRaceSimulator?", this.raceSimulator instanceof DragRaceSimulator);
        } else {
            console.log("DEBUG: Game._startRace: Initiating RaceSimulator.");
            // Original logic for regular races
            // Get race settings for total laps
            const raceSettings = this.gameState.raceSettings;
            const totalLaps = raceSettings.totalLaps || 20;

            // Create regular race simulator
            const regularSimulator = new RaceSimulator(drivers, track, totalLaps);
            this.raceSimulator = regularSimulator;
            // Start the race
            this.raceSimulator.start();
            this.gameState.race.simulation = this.raceSimulator; // Assign to gameState for screens
            this.screenManager.changeState(GameStates.RACE); // Transition to regular RACE screen
            console.log("DEBUG: Game._startRace: this.raceSimulator assigned (Regular):", this.raceSimulator);
            console.log("DEBUG: Game._startRace: this.raceSimulator is instanceof RaceSimulator?", this.raceSimulator instanceof RaceSimulator);
        }

        this.gameState.startRace(); // This method might need to be adjusted if it assumes a regular race
        console.log("DEBUG: Game._startRace finished.");
    }

    /**
     * Finishes the race and calculates results
     * @private
     */
    _finishRace() {
        if (!this.raceSimulator) return;

        const results = this.raceSimulator.getResults();
        this.gameState.finishRace(results, this.raceSimulator);

        // Store results for results screen
        this.gameState.raceResults = results;
    }

    /**
     * Finishes the drag race and calculates results
     * @private
     */
    _finishDragRace() {
        if (!this.raceSimulator) return; // This will be DragRaceSimulator instance

        const results = this.raceSimulator.getResults(); // DragRaceSimulator.getResults()
        
        // Ensure results and champion are available
        if (!results || !results.champion) {
            console.error("DragRace: No champion found in results.");
            return;
        }

        // Store results for results screen
        this.gameState.raceResults = {
            finalStandings: [results.champion], // Simplified to just the champion
            winner: results.champion,
            totalTime: results.totalTime,
            isDragRace: true // Flag to indicate it was a drag race
        };

        // Mark the selected contract as completed
        if (this.gameState.season.selectedContract) {
            this.gameState.season.selectedContract.completed = true;
        }

        // Handle player's bet on the champion (if implemented)
        // For now, assume no betting is placed on drag races or it's a "free" event.
        // If the player had a bet for this event, we'd process it here.
        // Since drag races are "bonus rounds", there's no betting.
        // We'll explicitly set betResult to indicate no active bet.
        this.gameState.race.betResult = {
            betAmount: 0,
            payout: 0,
            won: false,
            message: "No bet placed for bonus drag race."
        };

        // This will be called in _updateResults after this method,
        // and _updateResults will handle advancing the week/season for non-drag races.
        // For drag races, _updateResults needs to know not to advance.
        // The flag `isDragRace` in `raceResults` will help with this.
    }

    /**
     * Creates a save slot from current game state
     * @private
     */
    _createSaveSlot() {
        const slot = new SaveSlot('auto');
        // Manually construct the gameState object to match the flat structure expected by SaveSlot.validate()
        slot.gameState = {
            // Player Economy
            bankroll: this.gameState.player.bankroll,
            totalEarnings: this.gameState.player.totalProfit, // GameState.player.totalProfit is net profit from bets
            totalLosses: this.gameState.player.totalLosses || 0, // Assuming totalLosses is directly on player
            netProfit: this.gameState.player.totalProfit,       // Net profit from GameState.player.totalProfit

            // Progression
            currentTier: this.gameState.player.tier,
            currentSeason: this.gameState.player.season,
            currentWeek: this.gameState.player.week,
            reputationScore: this.gameState.player.reputationScore || 0, // Default to 0 if not tracked
            licensesPurchased: this.gameState.player.licensesPurchased || ['kart'], // Default to ['kart'] if not tracked

            // Garage Upgrades: Convert array of upgrade IDs to an object mapping ID to level (assuming level 1 for now)
            ownedUpgrades: this.gameState.player.upgrades.reduce((acc, upgradeId) => {
                acc[upgradeId] = 1; // Assuming 1 is the base level if only ID is stored
                return acc;
            }, {}),

            // Driver Roster (current season)
            currentRoster: this.gameState.season.currentRoster || [], // Default to empty array

            // Race History (last 50 races) - GameState currently doesn't track this at top-level
            raceHistory: this.gameState.raceHistory || [], // Default to empty array

            // Statistics: Pull from GameState.player and GameState.season.seasonStats where available
            stats: {
                totalRaces: this.gameState.player.totalRaces,
                totalWins: this.gameState.player.totalWins,
                totalBets: this.gameState.season.seasonStats?.totalSpent || 0, // Total spent on bets, from seasonStats
                winRate: this.gameState.player.totalRaces > 0
                    ? (this.gameState.player.totalWins / this.gameState.player.totalRaces) * 100
                    : 0,
                biggestWin: this.gameState.player.biggestWin || 0, // Default to 0
                biggestLoss: this.gameState.player.biggestLoss || 0, // Default to 0
                favoriteTrack: this.gameState.player.favoriteTrack || null, // Default to null
                favoriteVehicleType: this.gameState.player.favoriteVehicleType || null, // Default to null
                heatIncidents: this.gameState.player.heatIncidents || 0, // Default to 0
                perfectRaces: this.gameState.player.perfectRaces || 0 // Default to 0
            },

            // Active Contacts (Burner Phone)
            availableContacts: this.gameState.player.availableContacts || ['spotter'], // Default to ['spotter']

            // Flags & Events
            flags: this.gameState.player.flags || { // Default to an object
                tutorialCompleted: false,
                firstSeasonComplete: false,
                unlockedDragStrip: false,
                investigationActive: false,
                investigationCooldown: 0
            }
        };
        return slot;
    }

    // ===== ERROR HANDLING =====

    /**
     * Handle runtime errors
     * @private
     */
    _handleError(error) {
        this.isRunning = false;

        this.renderer.clear('#0a0a0a');
        this.renderer.drawText('ERROR', this.canvas.width / 2, this.canvas.height / 2 - 40, {
            font: 'bold 32px "Courier New", monospace',
            color: '#ff0040',
            align: 'center'
        });
        this.renderer.drawText(error.message, this.canvas.width / 2, this.canvas.height / 2, {
            font: '18px "Courier New", monospace',
            color: '#ffffff',
            align: 'center'
        });
    }

    /**
     * Pause the game
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Resume the game
     */
    resume() {
        this.isPaused = false;
    }

    /**
     * Stop the game
     */
    stop() {
        this.isRunning = false;
    }
}

// ===== INITIALIZATION =====
window.addEventListener('load', () => {
    try {
        const game = new Game();
        game.start();

        // Make game instance globally accessible for debugging (dev only)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.game = game;
        }
    } catch (error) {
        document.body.innerHTML = `
            <div style="color: #ff0040; font-family: monospace; padding: 40px; text-align: center;">
                <h1>FATAL ERROR</h1>
                <p>${error.message}</p>
            </div>
        `;
    }
});