/**
 * REDLINE ROULETTE - GAME STATE MANAGEMENT
 *
 * Central state object that tracks all game data and progression.
 * This is the single source of truth for the entire game.
 */

class GameState {
    constructor() {
        this.reset();
    }

    /**
     * Resets game state to initial values (new game)
     */    reset() {
        // Player progression
        this.player = {
            bankroll: 10000,
            startingBankroll: 10000,
            season: 1,
            week: 1,
            tier: 1,
            upgrades: [], // Array of purchased upgrade IDs
            totalWins: 0,
            totalRaces: 0,
            totalProfit: 0
        };

        // Audio settings
        this.audio = {
            musicVolume: 0.5, // Default 50%
            sfxVolume: 0.5,
            muted: false
        };

        // Current season data
        this.season = {
            calendar: null,
            currentWeek: 1,
            weeklyContracts: null,
            selectedContract: null,
            seasonStats: {
                racesWon: 0,
                top3Finishes: 0,
                totalWinnings: 0,
                totalSpent: 0,
                netProfit: 0
            }
        };

        // Current race data
        this.race = {
            drivers: null,
            track: null,
            trackName: null,
            contract: null,
            field: null,
            odds: null,
            currentBet: null,
            raceState: 'not_started', // not_started, running, finished
            raceResults: null,
            betResult: null,
            simulation: null
        };

        // UI state
        this.ui = {
            currentScreen: 'main_menu',
            previousScreen: null
        };

        // Meta
        this.gameStarted = false;
        this.lastSaveTime = null;
    }

    /**
     * Starts a new game
     */
    startNewGame(tier = 1) {
        // Preserve audio settings across reset
        const currentAudio = { ...this.audio };
        
        this.reset();
        
        // Restore audio settings
        this.audio = currentAudio;
        
        this.player.tier = tier;
        this.player.bankroll = this.calculateStartingBankroll(tier);
        this.player.startingBankroll = this.player.bankroll;
        this.gameStarted = true;
    }

    /**
     * Calculates starting bankroll based on tier
     */
    calculateStartingBankroll(tier) {
        return 10000 * tier;
    }

    /**
     * Purchases an upgrade
     */
    purchaseUpgrade(upgradeId, price) {
        if (this.player.bankroll >= price && !this.player.upgrades.includes(upgradeId)) {
            this.player.bankroll -= price;
            this.player.upgrades.push(upgradeId);
            return true;
        }
        return false;
    }

    /**
     * Checks if player owns an upgrade
     */
    hasUpgrade(upgradeId) {
        return this.player.upgrades.includes(upgradeId);
    }

    /**
     * Sets the current season calendar
     */
    setSeasonCalendar(calendar) {
        this.season.calendar = calendar;
        this.generateWeeklyContracts();
    }

    /**
     * Generates contracts for the current week
     */
    generateWeeklyContracts() {
        if (!this.season.calendar) return;

        const currentWeek = this.season.calendar[this.player.week - 1];
        if (currentWeek) {
            this.season.weeklyContracts = currentWeek.contracts;
        }
    }

    /**
     * Selects a contract for the current week
     */
    selectContract(contractIndex) {
        if (!this.season.weeklyContracts) return false;

        this.season.selectedContract = this.season.weeklyContracts[contractIndex];
        return true;
    }

    /**
     * Sets up a race with drivers, track, and odds
     */
    setupRace(drivers, track, contract, raceSettings = {}) {
        this.race.drivers = drivers;
        // Track is now a Track object with name property
        this.race.track = track;
        this.race.trackName = track?.name || 'UNKNOWN TRACK';
        this.race.contract = contract;
        this.race.raceSettings = raceSettings; // New: Store race settings
        this.race.field = drivers;
        this.race.raceState = 'not_started';
        this.race.raceResults = null;
        this.race.betResult = null;
    }

    /**
     * Sets the odds for the current race
     */
    setRaceOdds(odds) {
        this.race.odds = odds;
    }

    /**
     * Places a bet
     */
    placeBet(driverName, amount, betType) {
        if (amount <= 0) {
            return false;
        }

        if (this.player.bankroll < amount) {
            return false;
        }

        this.race.currentBet = {
            driverName,
            amount,
            betType,
            timestamp: Date.now()
        };

        // Deduct bet amount from bankroll
        this.player.bankroll -= amount;
        this.season.seasonStats.totalSpent += amount;

        return true;
    }

    /**
     * Starts the race
     */
    startRace() {
        this.race.raceState = 'running';
    }

    /**
     * Finishes the race with results
     */
    finishRace(results, simulation) {
        this.race.raceState = 'finished';
        this.race.raceResults = results;
        this.race.simulation = simulation;
        this.player.totalRaces++;

        // Calculate bet result if a bet was placed
        if (this.race.currentBet) {
            this.calculateBetResult(results);
        }
    }

    /**
     * Calculates the result of the player's bet
     */
    calculateBetResult(results) {
        const bet = this.race.currentBet;
        if (!bet) return;

        let won = false;
        let payout = 0;

        // Handle both result formats: array (legacy) or object with finalStandings
        const standings = Array.isArray(results) ? results : (results?.finalStandings || []);
        if (standings.length === 0) return;

        // Find the driver in results
        const driverResult = standings.find(r => r.name === bet.driverName || r.driver?.name === bet.driverName);
        if (!driverResult) return;

        // Find odds for the driver
        const driverOdds = this.race.odds.find(o => o.driver === bet.driverName || o.driver?.name === bet.driverName);
        if (!driverOdds) return;

        // Check bet type
        switch (bet.betType) {
            case 'win':
                const position = standings.indexOf(driverResult) + 1;
                won = position === 1;
                if (won) {
                    payout = Math.floor(bet.amount * driverOdds.odds);
                }
                break;

            case 'top3':
                const position3 = standings.indexOf(driverResult) + 1;
                won = position3 <= 3;
                if (won) {
                    // Top 3 odds are typically lower
                    const top3Multiplier = driverOdds.odds * 0.33; // Approximate top 3 odds
                    payout = Math.floor(bet.amount * top3Multiplier);
                }
                break;

            case 'h2h':
                // Head-to-head requires two drivers - not fully implemented yet
                won = false;
                break;
        }

        // Update bet result
        const finishPosition = standings.indexOf(driverResult) + 1;
        this.race.betResult = {
            won,
            betAmount: bet.amount,
            payout: won ? payout : 0,
            driver: bet.driverName,
            betType: bet.betType,
            finishPosition: finishPosition
        };

        // Update bankroll and stats if won
        if (won) {
            this.player.bankroll += payout;
            this.season.seasonStats.totalWinnings += payout;
            this.player.totalProfit += (payout - bet.amount);

            if (finishPosition === 1) {
                this.player.totalWins++;
                this.season.seasonStats.racesWon++;
            }

            if (finishPosition <= 3) {
                this.season.seasonStats.top3Finishes++;
            }
        } else {
            this.player.totalProfit -= bet.amount;
        }

        this.season.seasonStats.netProfit =
            this.season.seasonStats.totalWinnings - this.season.seasonStats.totalSpent;
    }

    /**
     * Advances to the next week
     */
    advanceWeek() {
        this.player.week++;
        this.season.currentWeek++;

        // Clear race data
        this.race = {
            drivers: null,
            track: null,
            trackName: null,
            contract: null,
            field: null,
            odds: null,
            currentBet: null,
            raceState: 'not_started',
            raceResults: null,
            betResult: null,
            simulation: null
        };

        // Check if season is complete
        if (this.player.week > 5) {
            return this.completeSeason();
        }

        // Generate new weekly contracts
        this.generateWeeklyContracts();

        return 'continue';
    }

    /**
     * Completes the current season
     */
    completeSeason() {
        this.player.season++;
        this.player.week = 1;
        this.season.currentWeek = 1;

        // Calculate if player can advance tier
        const profitTarget = this.calculateProfitTarget(this.player.tier);

        return {
            status: 'season_complete',
            stats: this.season.seasonStats,
            profitTarget,
            canAdvance: this.player.bankroll >= profitTarget.licenseCost
        };
    }

    /**
     * Advances to the next tier
     */
    advanceTier() {
        const profitTarget = this.calculateProfitTarget(this.player.tier);

        if (this.player.bankroll >= profitTarget.licenseCost) {
            this.player.bankroll -= profitTarget.licenseCost;
            this.player.tier++;

            // Reset season stats
            this.season.seasonStats = {
                racesWon: 0,
                top3Finishes: 0,
                totalWinnings: 0,
                totalSpent: 0,
                netProfit: 0
            };

            return true;
        }

        return false;
    }

    /**
     * Calculates profit target for tier advancement
     */
    calculateProfitTarget(tier) {
        const baseCost = 50000;
        const licenseCost = baseCost * Math.pow(2, tier - 1);

        return {
            tier,
            licenseCost,
            recommendedBankroll: licenseCost * 1.5,
            description: `Purchase Tier ${tier + 1} License for $${licenseCost.toLocaleString()}`
        };
    }

    /**
     * Checks if the game is over (bankrupt)
     */
    isGameOver() {
        return this.player.bankroll <= 0;
    }

    /**
     * Gets current tier name
     */
    getTierName() {
        const tiers = {
            1: 'Go-Kart',
            2: 'Dirt Track',
            3: 'GT',
            4: 'Le Mans',
            5: 'Stock Car',
            6: 'Open Wheel'
        };
        return tiers[this.player.tier] || 'Unknown';
    }

    /**
     * Serializes state to JSON for saving
     */
    toJSON() {
        return {
            player: this.player,
            season: this.season,
            race: this.race,
            ui: this.ui,
            audio: this.audio, // Include audio settings
            gameStarted: this.gameStarted,
            lastSaveTime: Date.now()
        };
    }

    /**
     * Loads state from JSON
     */
    fromJSON(data) {
        if (!data) return false;

        try {
            this.player = data.player || this.player;
            this.season = data.season || this.season;
            this.race = data.race || this.race;
            this.ui = data.ui || this.ui;
            this.audio = data.audio || this.audio;
            this.gameStarted = data.gameStarted || false;
            this.lastSaveTime = data.lastSaveTime || null;

            return true;
        } catch (error) {
            console.error('Failed to load game state:', error);
            return false;
        }
    }

    /**
     * Gets a summary of current game state for display
     */
    getSummary() {
        return {
            bankroll: this.player.bankroll,
            tier: this.player.tier,
            tierName: this.getTierName(),
            season: this.player.season,
            week: this.player.week,
            totalWins: this.player.totalWins,
            totalRaces: this.player.totalRaces,
            totalProfit: this.player.totalProfit,
            winRate: this.player.totalRaces > 0
                ? ((this.player.totalWins / this.player.totalRaces) * 100).toFixed(1)
                : '0.0'
        };
    }
}

export { GameState };
