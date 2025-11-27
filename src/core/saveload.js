/* ========================================
   REDLINE ROULETTE - SAVE/LOAD SYSTEM
   Bulletproof save management with versioning
   ======================================== */

// ===== CONSTANTS =====
const SAVE_VERSION = '1.0.0';
const MAX_SAVE_SLOTS = 3;
const AUTO_SAVE_SLOT = 'autosave';
const SETTINGS_KEY = 'redline_settings';
const BACKUP_SUFFIX = '_backup';

// ===== SAVE SLOT STRUCTURE =====
class SaveSlot {
    constructor(slotId) {
        this.slotId = slotId;
        this.metadata = this._createDefaultMetadata();
        this.gameState = this._createDefaultGameState();
    }

    /**
     * Create default metadata for a new save
     * @private
     */
    _createDefaultMetadata() {
        return {
            version: SAVE_VERSION,
            saveDate: new Date().toISOString(),
            playtime: 0, // Total playtime in seconds
            created: new Date().toISOString(),
            isValid: true,
            slotName: 'Empty Slot'
        };
    }

    /**
     * Create default game state for a new game
     * @private
     */
    _createDefaultGameState() {
        return {
            // Player Economy
            bankroll: 10000,
            totalEarnings: 0,
            totalLosses: 0,
            netProfit: 0,

            // Progression
            currentTier: 1, // Racing league tier (1-4)
            currentSeason: 1,
            currentWeek: 1,
            reputationScore: 0,
            licensesPurchased: ['kart'], // Vehicle types unlocked

            // Garage Upgrades
            ownedUpgrades: {
                tvSetup: 0, // 0-3 tiers
                rolodex: 0, // 0-3 tiers
                minibar: 0  // 0-3 tiers
            },

            // Driver Roster (current season)
            currentRoster: [],

            // Race History (last 50 races)
            raceHistory: [],

            // Statistics
            stats: {
                totalRaces: 0,
                totalWins: 0,
                totalBets: 0,
                winRate: 0,
                biggestWin: 0,
                biggestLoss: 0,
                favoriteTrack: null,
                favoriteVehicleType: null,
                heatIncidents: 0, // Times caught cheating
                perfectRaces: 0   // Races won without using phone
            },

            // Active Contacts (Burner Phone)
            availableContacts: [
                'spotter', // Starting contacts
            ],

            // Flags & Events
            flags: {
                tutorialCompleted: false,
                firstSeasonComplete: false,
                unlockedDragStrip: false,
                investigationActive: false,
                investigationCooldown: 0
            }
        };
    }

    /**
     * Update metadata (timestamp, playtime)
     */
    updateMetadata(playtimeIncrement = 0) {
        this.metadata.saveDate = new Date().toISOString();
        this.metadata.playtime += playtimeIncrement;

        // Generate descriptive slot name
        const tier = this.gameState.currentTier;
        const bankroll = this.gameState.bankroll;
        this.metadata.slotName = `Tier ${tier} - $${bankroll.toLocaleString()}`;
    }

    /**
     * Validate save data integrity
     * @returns {boolean}
     */
    validate() {
        try {
            // Check required fields exist
            if (!this.metadata || !this.gameState) return false;
            if (!this.metadata.version) return false;

            // Validate critical game state
            if (typeof this.gameState.bankroll !== 'number') return false;
            if (!Array.isArray(this.gameState.raceHistory)) return false;
            if (!this.gameState.stats) return false;

            // Check for data corruption (negative values where invalid)
            if (this.gameState.bankroll < 0) return false;
            if (this.gameState.currentTier < 1 || this.gameState.currentTier > 4) return false;

            this.metadata.isValid = true;
            return true;

        } catch (error) {
            console.error('Save validation failed:', error);
            this.metadata.isValid = false;
            return false;
        }
    }

    /**
     * Serialize to JSON
     * @returns {string}
     */
    toJSON() {
        return JSON.stringify({
            metadata: this.metadata,
            gameState: this.gameState
        }, null, 2); // Pretty print for debugging
    }

    /**
     * Deserialize from JSON
     * @param {string} jsonData
     * @returns {boolean} Success status
     */
    fromJSON(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            if (!data.metadata || !data.gameState) {
                throw new Error('Invalid save structure');
            }

            this.metadata = data.metadata;
            this.gameState = data.gameState;

            return this.validate();

        } catch (error) {
            console.error('Failed to parse save data:', error);
            return false;
        }
    }
}

// ===== SETTINGS MANAGER =====
class SettingsManager {
    constructor() {
        this.settings = this._createDefaultSettings();
    }

    /**
     * Create default settings
     * @private
     */
    _createDefaultSettings() {
        return {
            version: SAVE_VERSION,

            // Audio
            audio: {
                masterVolume: 0.8,
                sfxVolume: 1.0,
                musicVolume: 0.6,
                engineVolume: 0.7,
                uiVolume: 0.5,
                muted: false
            },

            // Graphics
            graphics: {
                quality: 'high', // 'low', 'medium', 'high'
                particleEffects: true,
                screenShake: true,
                weatherEffects: true,
                showFPS: false
            },

            // Controls
            controls: {
                mouseEnabled: true,
                keyboardEnabled: true,
                confirmBeforeBet: true,
                quickSaveEnabled: true,
                pauseOnFocusLoss: true
            },

            // Accessibility
            accessibility: {
                highContrast: false,
                colorblindMode: 'none', // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
                textSize: 'normal', // 'small', 'normal', 'large'
                reducedMotion: false
            },

            // Gameplay
            gameplay: {
                autoSaveEnabled: true,
                raceSpeed: 'normal', // 'slow', 'normal', 'fast'
                showOdds: true,
                showHiddenTraits: false, // Unlocked via TV upgrade
                tutorialEnabled: true
            }
        };
    }

    /**
     * Load settings from localStorage
     */
    load() {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);

            if (!stored) {
                return false;
            }

            const loaded = JSON.parse(stored);

            // Merge with defaults (in case new settings were added)
            this.settings = this._mergeWithDefaults(loaded);

            return true;

        } catch (error) {
            console.error('Failed to load settings:', error);
            return false;
        }
    }

    /**
     * Save settings to localStorage
     */
    save() {
        try {
            const json = JSON.stringify(this.settings, null, 2);
            localStorage.setItem(SETTINGS_KEY, json);
            return true;

        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    /**
     * Merge loaded settings with defaults (for new fields)
     * @private
     */
    _mergeWithDefaults(loaded) {
        const defaults = this._createDefaultSettings();

        // Deep merge
        const merge = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    target[key] = target[key] || {};
                    merge(target[key], source[key]);
                } else {
                    target[key] = source[key] !== undefined ? source[key] : target[key];
                }
            }
            return target;
        };

        return merge(defaults, loaded);
    }

    /**
     * Reset settings to defaults
     */
    reset() {
        this.settings = this._createDefaultSettings();
        this.save();
    }

    /**
     * Get specific setting value
     * @param {string} category
     * @param {string} key
     */
    get(category, key) {
        return this.settings[category]?.[key];
    }

    /**
     * Set specific setting value
     * @param {string} category
     * @param {string} key
     * @param {*} value
     */
    set(category, key, value) {
        if (!this.settings[category]) {
            console.error(`Invalid settings category: ${category}`);
            return false;
        }

        this.settings[category][key] = value;
        return this.save();
    }
}

// ===== SAVE MANAGER =====
class SaveManager {
    constructor() {
        this.currentSlot = null;
        this.sessionStartTime = Date.now();
        this.settingsManager = new SettingsManager();
        this.migrationHandlers = this._setupMigrations();

        // Load settings immediately
        this.settingsManager.load();
    }

    /**
     * Setup version migration handlers
     * @private
     */
    _setupMigrations() {
        return {
            // Migration from 0.9.x to 1.0.0
            '0.9.x_to_1.0.0': (saveData) => {
                // Add new fields that didn't exist in 0.9.x
                if (!saveData.gameState.flags) {
                    saveData.gameState.flags = {
                        tutorialCompleted: false,
                        firstSeasonComplete: false,
                        unlockedDragStrip: false,
                        investigationActive: false,
                        investigationCooldown: 0
                    };
                }

                saveData.metadata.version = '1.0.0';
                return saveData;
            },

            // Template for future migrations
            '1.0.0_to_1.1.0': (saveData) => {
                // Example: Add new feature data
                saveData.metadata.version = '1.1.0';
                return saveData;
            }
        };
    }

    /**
     * Migrate save data to current version
     * @private
     */
    _migrateSave(saveSlot) {
        const currentVersion = saveSlot.metadata.version;

        if (currentVersion === SAVE_VERSION) {
            return saveSlot; // Already up to date
        }

        console.log(`Migrating save from ${currentVersion} to ${SAVE_VERSION}`);

        // Apply migrations sequentially
        const migrations = Object.keys(this.migrationHandlers).sort();

        for (const migrationKey of migrations) {
            const handler = this.migrationHandlers[migrationKey];
            saveSlot = handler(saveSlot);
        }

        return saveSlot;
    }

    /**
     * Get localStorage key for slot
     * @private
     */
    _getSlotKey(slotId) {
        return `redline_save_${slotId}`;
    }

    /**
     * Save to specific slot
     * @param {number|string} slotId - Slot number (1-3) or 'autosave'
     * @param {SaveSlot} saveSlot - Save data
     * @returns {boolean} Success status
     */
    save(slotId, saveSlot) {
        try {
            // Validate before saving
            if (!saveSlot.validate()) {
                throw new Error('Save validation failed');
            }

            // Update metadata
            const sessionTime = (Date.now() - this.sessionStartTime) / 1000;
            saveSlot.updateMetadata(sessionTime);
            this.sessionStartTime = Date.now(); // Reset for next save

            const key = this._getSlotKey(slotId);
            const json = saveSlot.toJSON();

            // Create backup of existing save
            const existing = localStorage.getItem(key);
            if (existing) {
                localStorage.setItem(key + BACKUP_SUFFIX, existing);
            }

            // Save new data
            localStorage.setItem(key, json);

            console.log(`Saved to slot ${slotId}`);
            return true;

        } catch (error) {
            console.error('Save failed:', error);

            // Attempt to restore from backup
            this._restoreBackup(slotId);

            return false;
        }
    }

    /**
     * Load from specific slot
     * @param {number|string} slotId
     * @returns {SaveSlot|null}
     */
    load(slotId) {
        try {
            const key = this._getSlotKey(slotId);
            const json = localStorage.getItem(key);

            if (!json) {
                console.log(`No save found in slot ${slotId}`);
                return null;
            }

            const saveSlot = new SaveSlot(slotId);

            if (!saveSlot.fromJSON(json)) {
                throw new Error('Failed to parse save data');
            }

            // Migrate if necessary
            if (saveSlot.metadata.version !== SAVE_VERSION) {
                saveSlot = this._migrateSave(saveSlot);

                // Save migrated version
                this.save(slotId, saveSlot);
            }

            this.currentSlot = slotId;
            console.log(`Loaded from slot ${slotId}`);

            return saveSlot;

        } catch (error) {
            console.error(`Load failed for slot ${slotId}:`, error);

            // Attempt to restore from backup
            return this._loadBackup(slotId);
        }
    }

    /**
     * Auto-save current game state
     * @param {SaveSlot} saveSlot
     */
    autoSave(saveSlot) {
        if (!this.settingsManager.get('gameplay', 'autoSaveEnabled')) {
            return false;
        }

        console.log('Auto-saving...');
        return this.save(AUTO_SAVE_SLOT, saveSlot);
    }

    /**
     * Quick save to current slot
     * @param {SaveSlot} saveSlot
     */
    quickSave(saveSlot) {
        if (!this.settingsManager.get('controls', 'quickSaveEnabled')) {
            return false;
        }

        if (!this.currentSlot) {
            console.warn('No current slot for quick save');
            return this.autoSave(saveSlot);
        }

        console.log('Quick saving...');
        return this.save(this.currentSlot, saveSlot);
    }

    /**
     * Delete save slot
     * @param {number|string} slotId
     * @returns {boolean}
     */
    deleteSave(slotId) {
        try {
            const key = this._getSlotKey(slotId);
            localStorage.removeItem(key);
            localStorage.removeItem(key + BACKUP_SUFFIX);

            console.log(`Deleted slot ${slotId}`);
            return true;

        } catch (error) {
            console.error('Delete failed:', error);
            return false;
        }
    }

    /**
     * Get metadata for all save slots
     * @returns {Array<Object>}
     */
    getAllSlotMetadata() {
        const slots = [];

        for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
            const metadata = this.getSlotMetadata(i);
            slots.push({
                slotId: i,
                ...metadata
            });
        }

        return slots;
    }

    /**
     * Get metadata for specific slot
     * @param {number|string} slotId
     * @returns {Object|null}
     */
    getSlotMetadata(slotId) {
        try {
            const key = this._getSlotKey(slotId);
            const json = localStorage.getItem(key);

            if (!json) {
                return {
                    isEmpty: true,
                    slotName: 'Empty Slot'
                };
            }

            const data = JSON.parse(json);

            return {
                isEmpty: false,
                slotName: data.metadata.slotName,
                saveDate: new Date(data.metadata.saveDate),
                playtime: data.metadata.playtime,
                tier: data.gameState.currentTier,
                bankroll: data.gameState.bankroll,
                version: data.metadata.version
            };

        } catch (error) {
            console.error(`Failed to load metadata for slot ${slotId}:`, error);
            return {
                isEmpty: true,
                slotName: 'Corrupted Save',
                isCorrupted: true
            };
        }
    }

    /**
     * Export save as downloadable JSON
     * @param {number|string} slotId
     * @returns {string|null} Download URL
     */
    exportSave(slotId) {
        try {
            const key = this._getSlotKey(slotId);
            const json = localStorage.getItem(key);

            if (!json) {
                console.error('No save to export');
                return null;
            }

            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            return url;

        } catch (error) {
            console.error('Export failed:', error);
            return null;
        }
    }

    /**
     * Import save from JSON file
     * @param {string} jsonData
     * @param {number|string} targetSlotId
     * @returns {boolean}
     */
    importSave(jsonData, targetSlotId) {
        try {
            const saveSlot = new SaveSlot(targetSlotId);

            if (!saveSlot.fromJSON(jsonData)) {
                throw new Error('Invalid save file');
            }

            // Migrate if necessary
            if (saveSlot.metadata.version !== SAVE_VERSION) {
                saveSlot = this._migrateSave(saveSlot);
            }

            return this.save(targetSlotId, saveSlot);

        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    /**
     * Restore save from backup
     * @private
     */
    _restoreBackup(slotId) {
        try {
            const key = this._getSlotKey(slotId);
            const backupKey = key + BACKUP_SUFFIX;
            const backup = localStorage.getItem(backupKey);

            if (!backup) {
                console.error('No backup available');
                return false;
            }

            localStorage.setItem(key, backup);
            console.log('Restored from backup');

            return true;

        } catch (error) {
            console.error('Backup restore failed:', error);
            return false;
        }
    }

    /**
     * Load from backup
     * @private
     */
    _loadBackup(slotId) {
        try {
            const key = this._getSlotKey(slotId);
            const backupKey = key + BACKUP_SUFFIX;
            const json = localStorage.getItem(backupKey);

            if (!json) {
                console.error('No backup to load');
                return null;
            }

            const saveSlot = new SaveSlot(slotId);

            if (!saveSlot.fromJSON(json)) {
                throw new Error('Backup is also corrupted');
            }

            console.log('Loaded from backup');
            return saveSlot;

        } catch (error) {
            console.error('Backup load failed:', error);
            return null;
        }
    }

    /**
     * Check localStorage availability and quota
     * @returns {Object}
     */
    checkStorage() {
        try {
            const testKey = 'redline_test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);

            // Estimate usage (not accurate in all browsers)
            let usage = 0;
            for (let key in localStorage) {
                if (key.startsWith('redline_')) {
                    usage += localStorage[key].length;
                }
            }

            return {
                available: true,
                usageBytes: usage,
                usageKB: Math.round(usage / 1024),
                estimatedSlots: Math.floor((5 * 1024 * 1024 - usage) / (usage / Object.keys(localStorage).length))
            };

        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Clear all game data (hard reset)
     * @param {boolean} includeSettings - Also clear settings
     */
    clearAllData(includeSettings = false) {
        try {
            // Clear all save slots
            for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
                this.deleteSave(i);
            }

            // Clear autosave
            this.deleteSave(AUTO_SAVE_SLOT);

            // Clear settings if requested
            if (includeSettings) {
                localStorage.removeItem(SETTINGS_KEY);
                this.settingsManager = new SettingsManager();
            }

            console.log('All data cleared');
            return true;

        } catch (error) {
            console.error('Clear all data failed:', error);
            return false;
        }
    }

    // ===== CLOUD SAVE PREPARATION =====

    /**
     * Prepare save data for cloud upload (GitHub Gist)
     * @param {number|string} slotId
     * @returns {Object|null} Cloud-ready save object
     */
    prepareCloudSave(slotId) {
        try {
            const key = this._getSlotKey(slotId);
            const json = localStorage.getItem(key);

            if (!json) {
                return null;
            }

            const saveData = JSON.parse(json);

            // Add cloud metadata
            return {
                game: 'Redline Roulette',
                version: SAVE_VERSION,
                uploadDate: new Date().toISOString(),
                checksum: this._generateChecksum(json),
                data: saveData
            };

        } catch (error) {
            console.error('Cloud save preparation failed:', error);
            return null;
        }
    }

    /**
     * Validate cloud save data
     * @param {Object} cloudData
     * @returns {boolean}
     */
    validateCloudSave(cloudData) {
        try {
            if (!cloudData.data || !cloudData.checksum) {
                return false;
            }

            const json = JSON.stringify(cloudData.data);
            const expectedChecksum = this._generateChecksum(json);

            return cloudData.checksum === expectedChecksum;

        } catch (error) {
            console.error('Cloud save validation failed:', error);
            return false;
        }
    }

    /**
     * Generate checksum for save data
     * @private
     */
    _generateChecksum(str) {
        // Simple hash function (CRC32-like)
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    /**
     * Get settings manager
     * @returns {SettingsManager}
     */
    getSettings() {
        return this.settingsManager;
    }
}

export { SaveManager, SaveSlot, SettingsManager };
