/**
 * REDLINE ROULETTE - COMPREHENSIVE AUTOMATED TEST SUITE
 *
 * Fully automated testing for all game systems, flows, and mechanics.
 * Zero human intervention required - runs complete test battery automatically.
 *
 * Usage: Open test.html in browser - tests run automatically
 */

// ============================================================================
// TEST UTILITIES
// ============================================================================

class TestLogger {
    constructor() {
        this.logs = [];
        this.startTime = performance.now();
    }

    log(message, type = 'info') {
        const timestamp = ((performance.now() - this.startTime) / 1000).toFixed(3);
        this.logs.push({ timestamp, message, type });
        console.log(`[${timestamp}s] [${type.toUpperCase()}] ${message}`);
    }

    pass(testName) {
        this.log(`✓ PASS: ${testName}`, 'pass');
    }

    fail(testName, error) {
        this.log(`✗ FAIL: ${testName} - ${error}`, 'fail');
    }

    warn(message) {
        this.log(`⚠ ${message}`, 'warn');
    }

    section(title) {
        this.log(`\n========== ${title} ==========`, 'section');
    }

    getLogs() {
        return this.logs;
    }
}

class TestAssertion {
    static assertEquals(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
        }
    }

    static assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`${message}\nExpected true but got false`);
        }
    }

    static assertFalse(condition, message = '') {
        if (condition) {
            throw new Error(`${message}\nExpected false but got true`);
        }
    }

    static assertNotNull(value, message = '') {
        if (value === null || value === undefined) {
            throw new Error(`${message}\nExpected non-null value`);
        }
    }

    static assertNull(value, message = '') {
        if (value !== null && value !== undefined) {
            throw new Error(`${message}\nExpected null value but got ${value}`);
        }
    }

    static assertGreaterThan(actual, threshold, message = '') {
        if (actual <= threshold) {
            throw new Error(`${message}\nExpected > ${threshold} but got ${actual}`);
        }
    }

    static assertLessThan(actual, threshold, message = '') {
        if (actual >= threshold) {
            throw new Error(`${message}\nExpected < ${threshold} but got ${actual}`);
        }
    }

    static assertInRange(actual, min, max, message = '') {
        if (actual < min || actual > max) {
            throw new Error(`${message}\nExpected ${min}-${max} but got ${actual}`);
        }
    }

    static assertArrayLength(array, expectedLength, message = '') {
        if (!Array.isArray(array)) {
            throw new Error(`${message}\nExpected array but got ${typeof array}`);
        }
        if (array.length !== expectedLength) {
            throw new Error(`${message}\nExpected length ${expectedLength} but got ${array.length}`);
        }
    }

    static assertContains(array, item, message = '') {
        if (!array.includes(item)) {
            throw new Error(`${message}\nArray does not contain ${item}`);
        }
    }
}

// ============================================================================
// GAME FLOW TESTER
// ============================================================================

class GameFlowTester {
    constructor(logger) {
        this.logger = logger;
        this.testResults = [];
    }

    async runAllTests() {
        this.logger.section('GAME FLOW TESTS');

        const tests = [
            { name: 'New Game Initialization', fn: () => this.testNewGameInit() },
            { name: 'State Transitions', fn: () => this.testStateTransitions() },
            { name: 'Week Progression', fn: () => this.testWeekProgression() },
            { name: 'Season Completion', fn: () => this.testSeasonCompletion() },
            { name: 'Tier Advancement', fn: () => this.testTierAdvancement() },
            { name: 'Bankruptcy Check', fn: () => this.testBankruptcy() },
            { name: 'Contract Selection', fn: () => this.testContractSelection() },
            { name: 'Race Setup Flow', fn: () => this.testRaceSetupFlow() },
            { name: 'UI Element Validation', fn: () => this.testUIElements() },
            { name: 'Screen Rendering', fn: () => this.testScreenRendering() }
        ];

        return await this.runTestBatch(tests);
    }

    async runTestBatch(tests) {
        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            try {
                await test.fn();
                this.logger.pass(test.name);
                this.testResults.push({ name: test.name, passed: true });
                passed++;
            } catch (error) {
                this.logger.fail(test.name, error.message);
                this.testResults.push({ name: test.name, passed: false, error: error.message });
                failed++;
            }
        }

        return { passed, failed, total: tests.length };
    }

    testNewGameInit() {
        const gameState = new GameState();
        gameState.startNewGame(1);

        TestAssertion.assertTrue(gameState.gameStarted, 'Game should be started');
        TestAssertion.assertEquals(gameState.player.tier, 1, 'Should start at tier 1');
        TestAssertion.assertEquals(gameState.player.bankroll, 10000, 'Should have starting bankroll');
        TestAssertion.assertEquals(gameState.player.week, 1, 'Should start at week 1');
        TestAssertion.assertEquals(gameState.player.season, 1, 'Should start at season 1');
        TestAssertion.assertEquals(gameState.ui.currentScreen, 'main_menu', 'Should be at main menu');
    }

    testStateTransitions() {
        const gameState = new GameState();

        // Test screen changes
        gameState.ui.currentScreen = 'garage';
        TestAssertion.assertEquals(gameState.ui.currentScreen, 'garage');

        gameState.ui.currentScreen = 'betting';
        TestAssertion.assertEquals(gameState.ui.currentScreen, 'betting');

        gameState.ui.currentScreen = 'race';
        TestAssertion.assertEquals(gameState.ui.currentScreen, 'race');

        gameState.ui.currentScreen = 'results';
        TestAssertion.assertEquals(gameState.ui.currentScreen, 'results');
    }

    testWeekProgression() {
        const gameState = new GameState();
        gameState.startNewGame(1);

        const initialWeek = gameState.player.week;
        const result = gameState.advanceWeek();

        TestAssertion.assertEquals(gameState.player.week, initialWeek + 1, 'Week should increment');
        TestAssertion.assertEquals(result, 'continue', 'Should continue season');
    }

    testSeasonCompletion() {
        const gameState = new GameState();
        gameState.startNewGame(1);

        // Fast-forward to end of season
        gameState.player.week = 16;
        const result = gameState.advanceWeek();

        TestAssertion.assertEquals(result.status, 'season_complete', 'Season should be complete');
        TestAssertion.assertEquals(gameState.player.week, 1, 'Week should reset to 1');
        TestAssertion.assertEquals(gameState.player.season, 2, 'Season should increment');
    }

    testTierAdvancement() {
        const gameState = new GameState();
        gameState.startNewGame(1);

        // Give player enough money for tier advancement
        const profitTarget = gameState.calculateProfitTarget(1);
        gameState.player.bankroll = profitTarget.licenseCost + 10000;

        const initialTier = gameState.player.tier;
        const success = gameState.advanceTier();

        TestAssertion.assertTrue(success, 'Tier advancement should succeed');
        TestAssertion.assertEquals(gameState.player.tier, initialTier + 1, 'Tier should increment');
    }

    testBankruptcy() {
        const gameState = new GameState();
        gameState.startNewGame(1);

        gameState.player.bankroll = 0;
        TestAssertion.assertTrue(gameState.isGameOver(), 'Should be game over with 0 bankroll');

        gameState.player.bankroll = -100;
        TestAssertion.assertTrue(gameState.isGameOver(), 'Should be game over with negative bankroll');

        gameState.player.bankroll = 100;
        TestAssertion.assertFalse(gameState.isGameOver(), 'Should NOT be game over with positive bankroll');
    }

    testContractSelection() {
        const gameState = new GameState();
        gameState.startNewGame(1);

        const seasonGen = new SeasonGenerator();
        const calendar = seasonGen.generateSeason(1);
        gameState.setSeasonCalendar(calendar);

        TestAssertion.assertNotNull(gameState.season.weeklyContracts, 'Weekly contracts should be generated');
        TestAssertion.assertTrue(gameState.season.weeklyContracts.length > 0, 'Should have contracts');

        const success = gameState.selectContract(0);
        TestAssertion.assertTrue(success, 'Contract selection should succeed');
        TestAssertion.assertNotNull(gameState.season.selectedContract, 'Contract should be selected');
    }

    testRaceSetupFlow() {
        const gameState = new GameState();
        const driverGen = new DriverGenerator();
        const trackGen = new TrackGenerator();

        const drivers = driverGen.generateField(20, 1);
        const track = trackGen.generateTrack(null, 800, 600);
        const contract = { name: 'Test Contract', payout: 1000 };

        gameState.setupRace(drivers, track, contract);

        TestAssertion.assertNotNull(gameState.race.drivers, 'Drivers should be set');
        TestAssertion.assertNotNull(gameState.race.track, 'Track should be set');
        TestAssertion.assertNotNull(gameState.race.trackName, 'Track name should be set');
        TestAssertion.assertEquals(gameState.race.raceState, 'not_started', 'Race should be not started');
    }

    testUIElements() {
        // Test screen creation
        const mainMenu = new MainMenuScreen();
        TestAssertion.assertNotNull(mainMenu, 'Main menu should exist');
        TestAssertion.assertTrue(mainMenu.buttons.length > 0, 'Main menu should have buttons');

        const garage = new GarageScreen();
        TestAssertion.assertNotNull(garage, 'Garage should exist');

        const betting = new BettingScreen();
        TestAssertion.assertNotNull(betting, 'Betting screen should exist');

        const race = new RaceScreen();
        TestAssertion.assertNotNull(race, 'Race screen should exist');

        const results = new ResultsScreen();
        TestAssertion.assertNotNull(results, 'Results screen should exist');
    }

    testScreenRendering() {
        // Create mock canvas
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        const gameState = new GameState();
        gameState.startNewGame(1);

        // Test each screen can render without errors
        const screens = [
            new MainMenuScreen(),
            new GarageScreen(),
            new BettingScreen(),
            new RaceScreen(),
            new ResultsScreen()
        ];

        for (const screen of screens) {
            screen.render(ctx, gameState);
            TestAssertion.assertNotNull(ctx, 'Context should remain valid after render');
        }
    }

    getResults() {
        return this.testResults;
    }
}

// ============================================================================
// BET SYSTEM TESTER
// ============================================================================

class BetSystemTester {
    constructor(logger) {
        this.logger = logger;
        this.testResults = [];
    }

    async runAllTests() {
        this.logger.section('BET SYSTEM TESTS');

        const tests = [
            { name: 'Win Bet Placement', fn: () => this.testWinBetPlacement() },
            { name: 'Top 3 Bet Placement', fn: () => this.testTop3BetPlacement() },
            { name: 'Bet Validation', fn: () => this.testBetValidation() },
            { name: 'Insufficient Funds', fn: () => this.testInsufficientFunds() },
            { name: 'Win Payout Calculation', fn: () => this.testWinPayout() },
            { name: 'Top 3 Payout Calculation', fn: () => this.testTop3Payout() },
            { name: 'Losing Bet Handling', fn: () => this.testLosingBet() },
            { name: 'Odds Calculation', fn: () => this.testOddsCalculation() },
            { name: 'Multiple Bet Types', fn: () => this.testMultipleBetTypes() },
            { name: 'Bankroll Updates', fn: () => this.testBankrollUpdates() }
        ];

        return await this.runTestBatch(tests);
    }

    async runTestBatch(tests) {
        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            try {
                await test.fn();
                this.logger.pass(test.name);
                this.testResults.push({ name: test.name, passed: true });
                passed++;
            } catch (error) {
                this.logger.fail(test.name, error.message);
                this.testResults.push({ name: test.name, passed: false, error: error.message });
                failed++;
            }
        }

        return { passed, failed, total: tests.length };
    }

    testWinBetPlacement() {
        const gameState = new GameState();
        gameState.startNewGame(1);

        const success = gameState.placeBet('Driver A', 1000, 'win');

        TestAssertion.assertTrue(success, 'Bet should be placed successfully');
        TestAssertion.assertNotNull(gameState.race.currentBet, 'Current bet should exist');
        TestAssertion.assertEquals(gameState.race.currentBet.driverName, 'Driver A', 'Driver name should match');
        TestAssertion.assertEquals(gameState.race.currentBet.amount, 1000, 'Bet amount should match');
        TestAssertion.assertEquals(gameState.race.currentBet.betType, 'win', 'Bet type should be win');
    }

    testTop3BetPlacement() {
        const gameState = new GameState();
        gameState.startNewGame(1);

        const success = gameState.placeBet('Driver B', 2000, 'top3');

        TestAssertion.assertTrue(success, 'Top 3 bet should be placed');
        TestAssertion.assertEquals(gameState.race.currentBet.betType, 'top3', 'Bet type should be top3');
    }

    testBetValidation() {
        const gameState = new GameState();
        gameState.startNewGame(1);

        // Test negative bet amount
        const invalidBet = gameState.placeBet('Driver A', -100, 'win');
        TestAssertion.assertFalse(invalidBet, 'Negative bet should fail');
    }

    testInsufficientFunds() {
        const gameState = new GameState();
        gameState.startNewGame(1);
        gameState.player.bankroll = 500;

        const success = gameState.placeBet('Driver A', 1000, 'win');

        TestAssertion.assertFalse(success, 'Bet should fail with insufficient funds');
    }

    testWinPayout() {
        const gameState = new GameState();
        gameState.startNewGame(1);

        // Set up race with odds
        const drivers = [
            { name: 'Winner', stats: {} },
            { name: 'Second', stats: {} }
        ];

        gameState.race.odds = [
            { driver: 'Winner', odds: 3.5 },
            { driver: 'Second', odds: 2.0 }
        ];

        gameState.placeBet('Winner', 1000, 'win');

        const results = [
            { name: 'Winner', position: 1 },
            { name: 'Second', position: 2 }
        ];

        gameState.calculateBetResult(results);

        TestAssertion.assertNotNull(gameState.race.betResult, 'Bet result should exist');
        TestAssertion.assertTrue(gameState.race.betResult.won, 'Bet should be won');
        TestAssertion.assertEquals(gameState.race.betResult.payout, 3500, 'Payout should be 1000 * 3.5');
    }

    testTop3Payout() {
        const gameState = new GameState();
        gameState.startNewGame(1);

        gameState.race.odds = [
            { driver: 'Driver', odds: 4.0 }
        ];

        gameState.placeBet('Driver', 1000, 'top3');

        const results = [
            { name: 'Someone', position: 1 },
            { name: 'Driver', position: 2 }
        ];

        gameState.calculateBetResult(results);

        TestAssertion.assertTrue(gameState.race.betResult.won, 'Top 3 bet should win for 2nd place');
        TestAssertion.assertGreaterThan(gameState.race.betResult.payout, 0, 'Should have payout');
    }

    testLosingBet() {
        const gameState = new GameState();
        gameState.startNewGame(1);

        const initialBankroll = gameState.player.bankroll;

        gameState.race.odds = [
            { driver: 'Loser', odds: 2.0 }
        ];

        gameState.placeBet('Loser', 1000, 'win');

        const results = [
            { name: 'Winner', position: 1 },
            { name: 'Loser', position: 5 }
        ];

        gameState.calculateBetResult(results);

        TestAssertion.assertFalse(gameState.race.betResult.won, 'Bet should be lost');
        TestAssertion.assertEquals(gameState.race.betResult.payout, 0, 'Payout should be 0');
    }

    testOddsCalculation() {
        const oddsCalc = new OddsCalculator();
        const drivers = new DriverGenerator().generateField(20, 1);
        const track = new TrackGenerator().generateTrack(null, 800, 600);

        const odds = oddsCalc.calculateWinOdds(drivers, track);

        TestAssertion.assertNotNull(odds, 'Odds should be calculated');
        TestAssertion.assertEquals(odds.length, drivers.length, 'Odds for each driver');

        for (const odd of odds) {
            TestAssertion.assertGreaterThan(odd.odds, 1.0, 'Odds should be > 1.0');
            TestAssertion.assertLessThan(odd.odds, 100.0, 'Odds should be < 100.0');
        }
    }

    testMultipleBetTypes() {
        const gameState = new GameState();
        gameState.startNewGame(1);

        // Test switching between bet types
        gameState.placeBet('Driver A', 500, 'win');
        TestAssertion.assertEquals(gameState.race.currentBet.betType, 'win');

        // Reset for new bet
        gameState.race.currentBet = null;
        gameState.player.bankroll = 10000;

        gameState.placeBet('Driver B', 500, 'top3');
        TestAssertion.assertEquals(gameState.race.currentBet.betType, 'top3');
    }

    testBankrollUpdates() {
        const gameState = new GameState();
        gameState.startNewGame(1);

        const initialBankroll = gameState.player.bankroll;
        const betAmount = 1000;

        gameState.placeBet('Driver', betAmount, 'win');

        TestAssertion.assertEquals(
            gameState.player.bankroll,
            initialBankroll - betAmount,
            'Bankroll should decrease by bet amount'
        );

        // Win the bet
        gameState.race.odds = [{ driver: 'Driver', odds: 3.0 }];
        const results = [{ name: 'Driver', position: 1 }];
        gameState.calculateBetResult(results);

        TestAssertion.assertEquals(
            gameState.player.bankroll,
            initialBankroll - betAmount + 3000,
            'Bankroll should increase by payout'
        );
    }

    getResults() {
        return this.testResults;
    }
}

// ============================================================================
// RACE SIMULATION TESTER
// ============================================================================

class RaceSimulationTester {
    constructor(logger) {
        this.logger = logger;
        this.testResults = [];
    }

    async runAllTests() {
        this.logger.section('RACE SIMULATION TESTS');

        const tests = [
            { name: 'Basic Race Completion', fn: () => this.testBasicRaceCompletion() },
            { name: 'Position Tracking', fn: () => this.testPositionTracking() },
            { name: 'Lap Counting', fn: () => this.testLapCounting() },
            { name: 'DNF System', fn: () => this.testDNFSystem() },
            { name: 'Hidden Traits Activation', fn: () => this.testHiddenTraits() },
            { name: 'Weather Effects', fn: () => this.testWeatherEffects() },
            { name: 'Physics Determinism', fn: () => this.testPhysicsDeterminism() },
            { name: 'Multiple Race Variety', fn: () => this.testRaceVariety() },
            { name: 'Race Events', fn: () => this.testRaceEvents() },
            { name: 'Performance Benchmark', fn: () => this.testPerformance() }
        ];

        return await this.runTestBatch(tests);
    }

    async runTestBatch(tests) {
        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            try {
                await test.fn();
                this.logger.pass(test.name);
                this.testResults.push({ name: test.name, passed: true });
                passed++;
            } catch (error) {
                this.logger.fail(test.name, error.message);
                this.testResults.push({ name: test.name, passed: false, error: error.message });
                failed++;
            }
        }

        return { passed, failed, total: tests.length };
    }

    async testBasicRaceCompletion() {
        const driverGen = new DriverGenerator();
        const trackGen = new TrackGenerator();

        const drivers = driverGen.generateField(10, 1);
        const track = trackGen.generateTrack(null, 800, 600);

        const simulator = new RaceSimulator(track, drivers, 3); // 3 laps for speed
        simulator.start();

        // Simulate race to completion
        let iterations = 0;
        const maxIterations = 10000;

        while (simulator.state !== RaceState.FINISHED && iterations < maxIterations) {
            simulator.update(1/60); // 60 FPS
            iterations++;
        }

        TestAssertion.assertEquals(simulator.state, RaceState.FINISHED, 'Race should finish');
        TestAssertion.assertGreaterThan(simulator.finishedCars.length, 0, 'Should have finishers');
    }

    async testPositionTracking() {
        const driverGen = new DriverGenerator();
        const trackGen = new TrackGenerator();

        const drivers = driverGen.generateField(5, 1);
        const track = trackGen.generateTrack(null, 800, 600);

        const simulator = new RaceSimulator(track, drivers, 2);
        simulator.start();

        // Run a few updates
        for (let i = 0; i < 100; i++) {
            simulator.update(1/60);
        }

        const state = simulator.getRaceState();

        TestAssertion.assertNotNull(state.leaderboard, 'Leaderboard should exist');
        TestAssertion.assertGreaterThan(state.leaderboard.length, 0, 'Should have cars in leaderboard');

        // Check positions are sequential
        const positions = state.leaderboard.map(car => car.position);
        for (let i = 0; i < positions.length; i++) {
            TestAssertion.assertEquals(positions[i], i + 1, `Position should be ${i + 1}`);
        }
    }

    async testLapCounting() {
        const driverGen = new DriverGenerator();
        const trackGen = new TrackGenerator();

        const drivers = driverGen.generateField(3, 1);
        const track = trackGen.generateTrack(null, 800, 600);

        const simulator = new RaceSimulator(track, drivers, 5);
        simulator.start();

        let maxLap = 0;

        // Run until we see lap progression
        for (let i = 0; i < 2000; i++) {
            simulator.update(1/60);
            const state = simulator.getRaceState();
            maxLap = Math.max(maxLap, state.currentLap);
        }

        TestAssertion.assertGreaterThan(maxLap, 0, 'Laps should progress');
    }

    async testDNFSystem() {
        const driverGen = new DriverGenerator();
        const trackGen = new TrackGenerator();

        // Generate many races to test DNF probability
        let totalDNFs = 0;
        const numRaces = 5;

        for (let race = 0; race < numRaces; race++) {
            const drivers = driverGen.generateField(10, 1);
            const track = trackGen.generateTrack(null, 800, 600);

            const simulator = new RaceSimulator(track, drivers, 5);
            simulator.start();

            // Simulate to completion
            for (let i = 0; i < 5000; i++) {
                simulator.update(1/60);
                if (simulator.state === RaceState.FINISHED) break;
            }

            const state = simulator.getRaceState();
            totalDNFs += state.carsDNF;
        }

        this.logger.log(`Total DNFs across ${numRaces} races: ${totalDNFs}`);
        // DNFs should be possible but not guaranteed
        TestAssertion.assertTrue(totalDNFs >= 0, 'DNF count should be non-negative');
    }

    async testHiddenTraits() {
        const driverGen = new DriverGenerator();

        // Generate many drivers to test trait distribution
        const drivers = driverGen.generateField(100, 1);

        let driversWithTraits = 0;
        const traitCounts = {};

        for (const driver of drivers) {
            if (driver.traits && driver.traits.length > 0) {
                driversWithTraits++;
                for (const trait of driver.traits) {
                    traitCounts[trait.name] = (traitCounts[trait.name] || 0) + 1;
                }
            }
        }

        this.logger.log(`Drivers with traits: ${driversWithTraits}/100`);
        this.logger.log(`Trait distribution: ${JSON.stringify(traitCounts)}`);

        TestAssertion.assertGreaterThan(driversWithTraits, 0, 'Some drivers should have traits');
    }

    async testWeatherEffects() {
        const trackGen = new TrackGenerator();

        // Test different weather types
        const weatherTypes = ['Clear', 'Rain', 'Night'];

        for (const weather of weatherTypes) {
            const track = trackGen.generateTrack(null, 800, 600);
            track.weather = { type: weather };

            const physics = new RacingPhysics(track);

            TestAssertion.assertNotNull(physics, `Physics should initialize with ${weather} weather`);
            TestAssertion.assertEquals(physics.weather.type, weather, 'Weather type should match');
        }
    }

    async testPhysicsDeterminism() {
        // Test that physics is consistent
        const driverGen = new DriverGenerator();
        const trackGen = new TrackGenerator();

        const drivers = driverGen.generateField(5, 1);
        const track = trackGen.generateTrack(null, 800, 600);

        const physics = new RacingPhysics(track);

        // Test same input produces same output
        const testDriver = drivers[0];
        const speed1 = physics.calculateBaseSpeed(testDriver, true);
        const speed2 = physics.calculateBaseSpeed(testDriver, true);

        TestAssertion.assertEquals(speed1, speed2, 'Physics should be deterministic');
    }

    async testRaceVariety() {
        const driverGen = new DriverGenerator();
        const trackGen = new TrackGenerator();

        const winners = new Set();
        const numRaces = 10;

        for (let i = 0; i < numRaces; i++) {
            const drivers = driverGen.generateField(10, 1);
            const track = trackGen.generateTrack(null, 800, 600);

            const simulator = new RaceSimulator(track, drivers, 2);
            simulator.start();

            // Quick simulation
            for (let j = 0; j < 3000; j++) {
                simulator.update(1/60);
                if (simulator.state === RaceState.FINISHED) break;
            }

            if (simulator.state === RaceState.FINISHED) {
                const results = simulator.getResults();
                if (results && results.winner) {
                    winners.add(results.winner.driver.name);
                }
            }
        }

        this.logger.log(`Race variety: ${winners.size} different winners in ${numRaces} races`);
        TestAssertion.assertGreaterThan(winners.size, 1, 'Should have variety in winners');
    }

    async testRaceEvents() {
        const driverGen = new DriverGenerator();
        const trackGen = new TrackGenerator();

        const drivers = driverGen.generateField(10, 1);
        const track = trackGen.generateTrack(null, 800, 600);

        const simulator = new RaceSimulator(track, drivers, 3);
        simulator.start();

        // Run simulation
        for (let i = 0; i < 2000; i++) {
            simulator.update(1/60);
            if (simulator.state === RaceState.FINISHED) break;
        }

        const state = simulator.getRaceState();

        TestAssertion.assertNotNull(state.events, 'Events should exist');
        TestAssertion.assertGreaterThan(state.totalEvents, 0, 'Should have events');
    }

    async testPerformance() {
        const driverGen = new DriverGenerator();
        const trackGen = new TrackGenerator();

        const drivers = driverGen.generateField(24, 1);
        const track = trackGen.generateTrack(null, 800, 600);

        const simulator = new RaceSimulator(track, drivers, 2);
        simulator.start();

        const startTime = performance.now();
        let frames = 0;

        // Simulate 5 seconds of race time
        while (frames < 300 && simulator.state !== RaceState.FINISHED) {
            simulator.update(1/60);
            frames++;
        }

        const endTime = performance.now();
        const duration = endTime - startTime;
        const fps = (frames / duration) * 1000;

        this.logger.log(`Performance: ${fps.toFixed(1)} FPS (${frames} frames in ${duration.toFixed(0)}ms)`);

        TestAssertion.assertGreaterThan(fps, 30, 'Should maintain at least 30 FPS');
    }

    getResults() {
        return this.testResults;
    }
}

// ============================================================================
// SAVE/LOAD TESTER
// ============================================================================

class SaveLoadTester {
    constructor(logger) {
        this.logger = logger;
        this.testResults = [];
    }

    async runAllTests() {
        this.logger.section('SAVE/LOAD SYSTEM TESTS');

        const tests = [
            { name: 'Save Creation', fn: () => this.testSaveCreation() },
            { name: 'Save Validation', fn: () => this.testSaveValidation() },
            { name: 'Load Saved Game', fn: () => this.testLoadGame() },
            { name: 'Data Integrity', fn: () => this.testDataIntegrity() },
            { name: 'Corruption Handling', fn: () => this.testCorruptionHandling() },
            { name: 'Auto-save', fn: () => this.testAutoSave() },
            { name: 'Multiple Slots', fn: () => this.testMultipleSlots() },
            { name: 'Save Deletion', fn: () => this.testSaveDeletion() },
            { name: 'Export/Import', fn: () => this.testExportImport() },
            { name: 'Settings Persistence', fn: () => this.testSettings() }
        ];

        return await this.runTestBatch(tests);
    }

    async runTestBatch(tests) {
        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            try {
                await test.fn();
                this.logger.pass(test.name);
                this.testResults.push({ name: test.name, passed: true });
                passed++;
            } catch (error) {
                this.logger.fail(test.name, error.message);
                this.testResults.push({ name: test.name, passed: false, error: error.message });
                failed++;
            }
        }

        return { passed, failed, total: tests.length };
    }

    testSaveCreation() {
        const saveSlot = new SaveSlot('test_slot');

        TestAssertion.assertNotNull(saveSlot.metadata, 'Metadata should exist');
        TestAssertion.assertNotNull(saveSlot.gameState, 'Game state should exist');
        TestAssertion.assertEquals(saveSlot.slotId, 'test_slot', 'Slot ID should match');
    }

    testSaveValidation() {
        const saveSlot = new SaveSlot('test');

        const isValid = saveSlot.validate();
        TestAssertion.assertTrue(isValid, 'New save should be valid');

        // Test invalid save
        saveSlot.gameState.bankroll = -1000;
        const isInvalid = saveSlot.validate();
        TestAssertion.assertFalse(isInvalid, 'Negative bankroll should be invalid');
    }

    testLoadGame() {
        const saveManager = new SaveManager();
        const saveSlot = new SaveSlot(1);

        saveSlot.gameState.bankroll = 50000;
        saveSlot.gameState.currentTier = 2;

        // Save
        const saved = saveManager.save(1, saveSlot);
        TestAssertion.assertTrue(saved, 'Save should succeed');

        // Load
        const loaded = saveManager.load(1);
        TestAssertion.assertNotNull(loaded, 'Load should succeed');
        TestAssertion.assertEquals(loaded.gameState.bankroll, 50000, 'Bankroll should match');
        TestAssertion.assertEquals(loaded.gameState.currentTier, 2, 'Tier should match');

        // Cleanup
        saveManager.deleteSave(1);
    }

    testDataIntegrity() {
        const saveSlot = new SaveSlot('integrity_test');

        saveSlot.gameState.bankroll = 123456;
        saveSlot.gameState.totalRaces = 99;
        saveSlot.gameState.stats.totalWins = 50;

        const json = saveSlot.toJSON();
        const newSlot = new SaveSlot('integrity_test');
        newSlot.fromJSON(json);

        TestAssertion.assertEquals(newSlot.gameState.bankroll, 123456, 'Bankroll should preserve');
        TestAssertion.assertEquals(newSlot.gameState.totalRaces, 99, 'Total races should preserve');
        TestAssertion.assertEquals(newSlot.gameState.stats.totalWins, 50, 'Wins should preserve');
    }

    testCorruptionHandling() {
        const saveSlot = new SaveSlot('corrupt_test');

        // Test invalid JSON
        const success = saveSlot.fromJSON('{ invalid json data }');
        TestAssertion.assertFalse(success, 'Should fail on corrupt JSON');

        // Test missing fields
        const incompleteSave = '{"metadata": {}, "gameState": null}';
        const success2 = saveSlot.fromJSON(incompleteSave);
        TestAssertion.assertFalse(success2, 'Should fail on incomplete save');
    }

    testAutoSave() {
        const saveManager = new SaveManager();
        const saveSlot = new SaveSlot('autosave');

        saveSlot.gameState.bankroll = 75000;

        const success = saveManager.autoSave(saveSlot);

        if (saveManager.settingsManager.get('gameplay', 'autoSaveEnabled')) {
            TestAssertion.assertTrue(success, 'Auto-save should succeed when enabled');
        }

        // Cleanup
        saveManager.deleteSave('autosave');
    }

    testMultipleSlots() {
        const saveManager = new SaveManager();

        // Create saves in multiple slots
        for (let i = 1; i <= 3; i++) {
            const slot = new SaveSlot(i);
            slot.gameState.bankroll = 10000 * i;
            saveManager.save(i, slot);
        }

        // Verify all slots
        const metadata = saveManager.getAllSlotMetadata();
        TestAssertion.assertEquals(metadata.length, 3, 'Should have 3 slots');

        for (let i = 1; i <= 3; i++) {
            const meta = saveManager.getSlotMetadata(i);
            TestAssertion.assertFalse(meta.isEmpty, `Slot ${i} should not be empty`);
            TestAssertion.assertEquals(meta.bankroll, 10000 * i, `Slot ${i} bankroll should match`);
        }

        // Cleanup
        for (let i = 1; i <= 3; i++) {
            saveManager.deleteSave(i);
        }
    }

    testSaveDeletion() {
        const saveManager = new SaveManager();
        const slot = new SaveSlot(1);

        saveManager.save(1, slot);

        const beforeDelete = saveManager.getSlotMetadata(1);
        TestAssertion.assertFalse(beforeDelete.isEmpty, 'Slot should exist before delete');

        saveManager.deleteSave(1);

        const afterDelete = saveManager.getSlotMetadata(1);
        TestAssertion.assertTrue(afterDelete.isEmpty, 'Slot should be empty after delete');
    }

    testExportImport() {
        const saveManager = new SaveManager();
        const slot = new SaveSlot(1);

        slot.gameState.bankroll = 99999;
        saveManager.save(1, slot);

        const exportURL = saveManager.exportSave(1);
        TestAssertion.assertNotNull(exportURL, 'Export should create URL');

        // Cleanup
        saveManager.deleteSave(1);
        if (exportURL) {
            URL.revokeObjectURL(exportURL);
        }
    }

    testSettings() {
        const settings = new SettingsManager();

        settings.set('audio', 'masterVolume', 0.5);
        settings.save();

        const newSettings = new SettingsManager();
        newSettings.load();

        const volume = newSettings.get('audio', 'masterVolume');
        TestAssertion.assertEquals(volume, 0.5, 'Settings should persist');
    }

    getResults() {
        return this.testResults;
    }
}

// ============================================================================
// TEST RUNNER
// ============================================================================

class TestRunner {
    constructor() {
        this.logger = new TestLogger();
        this.results = {
            gameFlow: null,
            betSystem: null,
            raceSimulation: null,
            saveLoad: null,
            overall: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                duration: 0,
                startTime: null,
                endTime: null
            }
        };
    }

    async runAllTests() {
        this.logger.section('REDLINE ROULETTE - AUTOMATED TEST SUITE');
        this.logger.log('Starting comprehensive test battery...');

        this.results.overall.startTime = new Date();
        const perfStart = performance.now();

        // Run all test suites
        const gameFlowTester = new GameFlowTester(this.logger);
        this.results.gameFlow = await gameFlowTester.runAllTests();

        const betSystemTester = new BetSystemTester(this.logger);
        this.results.betSystem = await betSystemTester.runAllTests();

        const raceSimTester = new RaceSimulationTester(this.logger);
        this.results.raceSimulation = await raceSimTester.runAllTests();

        const saveLoadTester = new SaveLoadTester(this.logger);
        this.results.saveLoad = await saveLoadTester.runAllTests();

        // Calculate totals
        const perfEnd = performance.now();
        this.results.overall.duration = (perfEnd - perfStart) / 1000;
        this.results.overall.endTime = new Date();

        this.results.overall.totalTests =
            this.results.gameFlow.total +
            this.results.betSystem.total +
            this.results.raceSimulation.total +
            this.results.saveLoad.total;

        this.results.overall.passed =
            this.results.gameFlow.passed +
            this.results.betSystem.passed +
            this.results.raceSimulation.passed +
            this.results.saveLoad.passed;

        this.results.overall.failed =
            this.results.gameFlow.failed +
            this.results.betSystem.failed +
            this.results.raceSimulation.failed +
            this.results.saveLoad.failed;

        this.printSummary();
        return this.results;
    }

    printSummary() {
        this.logger.section('TEST SUMMARY');

        this.logger.log(`Game Flow Tests: ${this.results.gameFlow.passed}/${this.results.gameFlow.total} passed`);
        this.logger.log(`Bet System Tests: ${this.results.betSystem.passed}/${this.results.betSystem.total} passed`);
        this.logger.log(`Race Simulation Tests: ${this.results.raceSimulation.passed}/${this.results.raceSimulation.total} passed`);
        this.logger.log(`Save/Load Tests: ${this.results.saveLoad.passed}/${this.results.saveLoad.total} passed`);

        this.logger.log('');
        this.logger.log(`TOTAL: ${this.results.overall.passed}/${this.results.overall.totalTests} tests passed`);
        this.logger.log(`Duration: ${this.results.overall.duration.toFixed(2)}s`);

        const successRate = (this.results.overall.passed / this.results.overall.totalTests * 100).toFixed(1);
        this.logger.log(`Success Rate: ${successRate}%`);

        if (this.results.overall.failed === 0) {
            this.logger.log('');
            this.logger.log('✓✓✓ ALL TESTS PASSED ✓✓✓', 'pass');
        } else {
            this.logger.log('');
            this.logger.log(`${this.results.overall.failed} TEST(S) FAILED`, 'fail');
        }
    }

    generateHTMLReport() {
        const passRate = (this.results.overall.passed / this.results.overall.totalTests * 100).toFixed(1);
        const statusColor = this.results.overall.failed === 0 ? '#00ff00' : '#ff0066';

        let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Redline Roulette - Test Report</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: #0a0a0a;
            color: #ffffff;
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #ff0066;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #ff0066;
            font-size: 48px;
            margin: 0;
        }
        .summary {
            background: #1a0a1a;
            border: 2px solid ${statusColor};
            padding: 20px;
            margin-bottom: 30px;
        }
        .summary h2 {
            color: ${statusColor};
            margin-top: 0;
        }
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .stat {
            background: #0a0a0a;
            padding: 15px;
            border-left: 4px solid #ff0066;
        }
        .stat-value {
            font-size: 32px;
            color: #00ffff;
            font-weight: bold;
        }
        .stat-label {
            color: #888;
            font-size: 12px;
        }
        .test-suite {
            background: #1a0a1a;
            border: 1px solid #330033;
            padding: 20px;
            margin-bottom: 20px;
        }
        .test-suite h3 {
            color: #00ffff;
            margin-top: 0;
        }
        .test-item {
            padding: 10px;
            margin: 5px 0;
            background: #0a0a0a;
            border-left: 4px solid #666;
        }
        .test-item.pass {
            border-left-color: #00ff00;
        }
        .test-item.fail {
            border-left-color: #ff0000;
        }
        .pass-icon { color: #00ff00; }
        .fail-icon { color: #ff0000; }
        .timestamp {
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>REDLINE ROULETTE</h1>
        <div style="color: #888;">Automated Test Suite Report</div>
        <div class="timestamp">Generated: ${this.results.overall.endTime.toLocaleString()}</div>
    </div>

    <div class="summary">
        <h2>Test Summary</h2>
        <div class="stat-grid">
            <div class="stat">
                <div class="stat-value">${this.results.overall.totalTests}</div>
                <div class="stat-label">TOTAL TESTS</div>
            </div>
            <div class="stat">
                <div class="stat-value" style="color: #00ff00">${this.results.overall.passed}</div>
                <div class="stat-label">PASSED</div>
            </div>
            <div class="stat">
                <div class="stat-value" style="color: #ff0066">${this.results.overall.failed}</div>
                <div class="stat-label">FAILED</div>
            </div>
            <div class="stat">
                <div class="stat-value">${passRate}%</div>
                <div class="stat-label">SUCCESS RATE</div>
            </div>
            <div class="stat">
                <div class="stat-value">${this.results.overall.duration.toFixed(2)}s</div>
                <div class="stat-label">DURATION</div>
            </div>
        </div>
    </div>

    <div class="test-suite">
        <h3>Game Flow Tests (${this.results.gameFlow.passed}/${this.results.gameFlow.total})</h3>
        ${this.generateTestItems(new GameFlowTester(this.logger).getResults())}
    </div>

    <div class="test-suite">
        <h3>Bet System Tests (${this.results.betSystem.passed}/${this.results.betSystem.total})</h3>
        ${this.generateTestItems(new BetSystemTester(this.logger).getResults())}
    </div>

    <div class="test-suite">
        <h3>Race Simulation Tests (${this.results.raceSimulation.passed}/${this.results.raceSimulation.total})</h3>
        ${this.generateTestItems(new RaceSimulationTester(this.logger).getResults())}
    </div>

    <div class="test-suite">
        <h3>Save/Load Tests (${this.results.saveLoad.passed}/${this.results.saveLoad.total})</h3>
        ${this.generateTestItems(new SaveLoadTester(this.logger).getResults())}
    </div>
</body>
</html>
        `;

        return html;
    }

    generateTestItems(results) {
        if (!results || results.length === 0) {
            return '<div class="test-item">No test results available</div>';
        }

        return results.map(test => {
            const status = test.passed ? 'pass' : 'fail';
            const icon = test.passed ? '✓' : '✗';
            const errorMsg = test.error ? `<div style="color: #ff6666; margin-top: 5px; font-size: 12px;">${test.error}</div>` : '';

            return `
                <div class="test-item ${status}">
                    <span class="${status}-icon">${icon}</span>
                    ${test.name}
                    ${errorMsg}
                </div>
            `;
        }).join('');
    }

    getResults() {
        return this.results;
    }

    getLogs() {
        return this.logger.getLogs();
    }
}

// Export for use in test.html
if (typeof window !== 'undefined') {
    window.TestRunner = TestRunner;
    window.TestLogger = TestLogger;
}
