class BettingScreen {
    constructor() {
        this.selectedDriver = null;
        this.betAmount = 100;
        this.betType = 'win'; // win, top3, h2h
        this.scrollOffset = 0;
        this.scrollX = 0; // Horizontal scroll
        this.maxScrollX = 0;
        this.hoveredDriver = null;
        this.driverListY = 300;
        this.portraitFlashTimer = 0;
        
        // Sort state
        this.currentSort = { column: 'position', direction: 'asc' };
        this.lastSortedDrivers = [];
        
        // Comprehensive Column Configuration
        this.columnConfig = [
            { key: 'qualifyingPosition', label: 'POS', width: 50 },
            { key: 'name', label: 'DRIVER', width: 240 }, // Wider for name + nickname
            { key: 'teamName', label: 'TEAM', width: 180 },
            { key: 'teamColor', label: 'CLR', width: 50, type: 'color' },
            { key: 'hometown', label: 'HOMETOWN', width: 150 },
            { key: 'nationality', label: 'NATION', width: 140 }, // Wider
            { key: 'age', label: 'AGE', width: 50 },
            { key: 'gender', label: 'GENDER', width: 70 },
            { key: 'height', label: 'HGT', width: 60 },
            { key: 'weight', label: 'WGT', width: 60 },
            { key: 'handedness', label: 'HAND', width: 80 },
            { key: 'vision', label: 'VISION', width: 100 }, // Wider
            { key: 'yearsPro', label: 'EXP', width: 50 },
            { key: 'carNumber', label: '#', width: 40 },
            { key: 'overall', label: 'OVR', width: 50 },
            
            // Stats
            { key: 'stats.topSpeed', label: 'SPD', width: 60 },
            { key: 'stats.acceleration', label: 'ACC', width: 60 },
            { key: 'stats.braking', label: 'BRK', width: 60 },
            { key: 'stats.cornering', label: 'CRN', width: 60 },
            { key: 'stats.overtaking', label: 'OVR', width: 60 },
            { key: 'stats.defending', label: 'DEF', width: 60 },
            { key: 'stats.consistency', label: 'CON', width: 60 },
            { key: 'stats.focus', label: 'FOC', width: 60 },
            { key: 'stats.aggression', label: 'AGG', width: 60 },
            { key: 'stats.wetSkill', label: 'WET', width: 60 },
            { key: 'stats.tireManagement', label: 'TIRE', width: 60 },
            { key: 'stats.fuelEfficiency', label: 'FUEL', width: 60 },

            // Physical/Mental
            { key: 'reactionTime', label: 'RT', width: 60 },
            { key: 'recovery', label: 'REC', width: 60 },
            { key: 'composure', label: 'CMP', width: 60 },
            { key: 'adaptability', label: 'ADP', width: 60 },
            { key: 'mechanicRapport', label: 'MECH', width: 60 },
            { key: 'drafting', label: 'DFT', width: 60 },
            { key: 'nightVision', label: 'NV', width: 60 },
            { key: 'stamina', label: 'STA', width: 60 },

            // Personality
            { key: 'luckyCharm', label: 'LUCKY CHARM', width: 150 },
            { key: 'preRaceRitual', label: 'RITUAL', width: 160 }, // Wider
            { key: 'phobia', label: 'PHOBIA', width: 120 },
            { key: 'allergy', label: 'ALLERGY', width: 120 },
            { key: 'spiritAnimal', label: 'SPIRIT', width: 100 },
            { key: 'zodiacSign', label: 'ZODIAC', width: 80 },
            { key: 'leastFavVeg', label: 'HATES VEG', width: 130 }, // Wider
            { key: 'sleepAvg', label: 'SLEEP', width: 60 },
            { key: 'coffeeOrder', label: 'COFFEE', width: 120 },
            { key: 'petName', label: 'PET', width: 100 },
            { key: 'petSpecies', label: 'PET TYPE', width: 100 },
            { key: 'highSchoolGPA', label: 'GPA', width: 50 },
            { key: 'favColor', label: 'FAV CLR', width: 60, type: 'color' },

            // Social
            { key: 'charisma', label: 'CHA', width: 50 },
            { key: 'loyalty', label: 'LOY', width: 50 },
            { key: 'greed', label: 'GRD', width: 50 },
            { key: 'mediaSavvy', label: 'MEDIA', width: 50 },
            { key: 'fanBaseName', label: 'FANS', width: 150 },
            { key: 'catchphrase', label: 'PHRASE', width: 220 }, // Wider

            // RPG
            { key: 'morale', label: 'MOR', width: 50 },
            { key: 'ego', label: 'EGO', width: 50 },
            { key: 'luck', label: 'LCK', width: 50 },
            { key: 'clutchFactor', label: 'CLUTCH', width: 60 },
            { key: 'intimidation', label: 'INTIM', width: 60 },

            // Booleans
            { key: 'rainHate', label: 'HATES RAIN', width: 80, type: 'bool' },
            { key: 'heatStroker', label: 'BAD IN HEAT', width: 80, type: 'bool' },
            { key: 'ovalSpecialist', label: 'OVAL SPEC', width: 80, type: 'bool' },
            { key: 'homeBonus', label: 'HOME ADV', width: 80, type: 'bool' },
            { key: 'morningPerson', label: 'MORNING', width: 70, type: 'bool' },

            // Risks
            { key: 'hangoverRisk', label: 'HANGOVER', width: 70 },
            { key: 'careerDNF', label: 'DNFs', width: 50 },

            // Bio
            { key: 'preferredWeather', label: 'PREF WTHR', width: 100 },
            { key: 'bloodType', label: 'BLOOD', width: 50 },
            { key: 'shoeSize', label: 'SHOE', width: 50 },
            { key: 'restingHeartRate', label: 'HR', width: 50 },
            { key: 'tattooCount', label: 'TATS', width: 50 },
            { key: 'siblingCount', label: 'SIBS', width: 50 },
            { key: 'yearbookSuperlative', label: 'YEARBOOK', width: 200 }, // Wider

            // Favorites
            { key: 'pizzaTopping', label: 'PIZZA', width: 100 },
            { key: 'favDinosaur', label: 'DINO', width: 140 }, // Wider
            { key: 'favTool', label: 'TOOL', width: 100 },
            { key: 'preferredHotSauce', label: 'HOT SAUCE', width: 80 }, // Numeric scale

            // Quirks
            { key: 'typingSpeed', label: 'WPM', width: 50 },
            { key: 'sockStyle', label: 'SOCKS', width: 100 },
            { key: 'phoneBattery', label: 'BATTERY', width: 60 },
            { key: 'mostOverusedEmoji', label: 'EMOJI', width: 50 },
            { key: 'satScore', label: 'SAT', width: 60 },
            { key: 'favCheese', label: 'CHEESE', width: 100 },
            { key: 'podcastGenre', label: 'PODCAST', width: 120 },
            { key: 'tShirtSize', label: 'SHIRT', width: 50 },
            { key: 'catsOrDogs', label: 'CAT/DOG', width: 80 },
            { key: 'tpOrientation', label: 'TP', width: 80 },
            { key: 'fruitOrRobot', label: 'F/R', width: 80 }
        ];

        // Calculate cumulative x-offsets
        let currentX = 0;
        this.columnConfig.forEach(col => {
            col.xOffset = currentX;
            currentX += col.width;
        });
        this.totalTableWidth = currentX;
    }

    update(deltaTime, gameState) {
        this.portraitFlashTimer += deltaTime;
    }
    
    sortDrivers(drivers, gameState) {
        if (!drivers) return [];
        
        // Ensure qualifying position is set (assuming input array is in grid order)
        drivers.forEach((d, i) => {
            if (d.qualifyingPosition === undefined) {
                d.qualifyingPosition = i + 1;
            }
        });

        const { column, direction } = this.currentSort;
        
        // Create shallow copy to sort
        const sorted = [...drivers];
        
        sorted.sort((a, b) => {
            let valA, valB;

            if (column === 'position') {
                valA = a.qualifyingPosition;
                valB = b.qualifyingPosition;
            } else if (column === 'name') {
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
            } else if (column === 'teamName') {
                valA = (a.teamName || '').toLowerCase();
                valB = (b.teamName || '').toLowerCase();
            } else if (column === 'hometown') {
                valA = (a.hometown || '').toLowerCase();
                valB = (b.hometown || '').toLowerCase();
            } else if (column === 'skill') {
                valA = this.getDriverRawSkill(a);
                valB = this.getDriverRawSkill(b);
            } else if (column === 'form') {
                valA = this.getFormValue(this.getDriverForm(a));
                valB = this.getFormValue(this.getDriverForm(b));
            } else if (column === 'odds') {
                valA = this.parseOdds(this.getDriverOdds(a, gameState));
                valB = this.parseOdds(this.getDriverOdds(b, gameState));
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sorted;
    }

    getDriverRawSkill(driver) {
        if (driver.skill !== undefined) return parseInt(driver.skill) || 0;
        if (driver.stats) {
             return Math.round((driver.stats.topSpeed + driver.stats.cornering + driver.stats.reliability) / 3);
        }
        return 0;
    }

    getFormValue(formStr) {
        const map = { 'HOT': 4, 'GOOD': 3, 'AVG': 2, 'COLD': 1 }; 
        return map[formStr] || 0;
    }
    
    parseOdds(oddsStr) {
        if (typeof oddsStr === 'number') return oddsStr;
        if (!oddsStr) return 999;
        return parseFloat(String(oddsStr).replace('x', '')) || 999;
    }

    getDriverOdds(driver, gameState) {
        // Try to get odds from driver.odds first
        if (driver.odds) {
            return driver.odds;
        }
        
        // Try to find odds from gameState.race.odds array
        if (gameState?.race?.odds && Array.isArray(gameState.race.odds)) {
            const oddsEntry = gameState.race.odds.find(o => {
                return o.driverData?.name === driver.name || 
                       (o.driver && o.driver.name === driver.name);
            });
            if (oddsEntry) {
                const odds = oddsEntry.odds;
                return typeof odds === 'number' ? `${odds.toFixed(2)}x` : odds;
            }
        }
        
        // Fallback for dummy drivers or dummy odds
        return '2.0x';
    }

    getDriverSkill(driver) {
        // If driver has skill property directly (dummy driver)
        if (driver.skill !== undefined) {
            return driver.skill;
        }
        
        // Calculate from stats if available
        if (driver.stats) {
            // Average of top 3 stats or overall rating
            return String(driver.overall || Math.round(
                (driver.stats.topSpeed + driver.stats.cornering + driver.stats.reliability) / 3
            ));
        }
        
        return 'N/A';
    }

    getDriverForm(driver) {
        // If driver has form property directly (dummy driver)
        if (driver.form !== undefined) {
            return driver.form;
        }
        
        // For real drivers, determine form based on recent performance
        // For now, assign form based on consistency
        if (driver.stats) {
            const stats = driver.stats;
            const consistency = 100 - Math.abs(stats.topSpeed - stats.cornering) - 
                               Math.abs(stats.reliability - stats.stamina);
            if (consistency > 150) return 'HOT';
            if (consistency > 100) return 'GOOD';
            return 'AVG';
        }
        
        return 'AVG';
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((o, k) => (o || {})[k], obj);
    }

    render(ctx, gameState, assetManager) {
        const canvas = ctx.canvas;

        // Background
        let bgDrawn = false;
        if (assetManager) {
            const bg = assetManager.getImage('bettingdesk-bg');
            if (bg) {
                ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
                bgDrawn = true;
            }
        }

        if (!bgDrawn) {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Header
        ctx.fillStyle = 'rgba(26, 10, 26, 0.85)';
        ctx.fillRect(0, 0, canvas.width, 80);

        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.fillStyle = '#ff0066';
        ctx.textAlign = 'left';
        ctx.fillText('BETTING DESK', 20, 50);

        // Track map (top left)
        this.renderTrackMap(ctx, gameState, 20, 100, 280, 180);

        // Track info (to the right of track map)
        this.renderTrackInfo(ctx, gameState, 320, 100, 640, 180);

        // Driver portrait (top right)
        this.renderDriverPortrait(ctx, gameState, canvas.width - 300, 100, 280, 180, assetManager);

        // Driver list
        const DRIVER_LIST_START_X = 20;
        const DRIVER_LIST_WIDTH = (canvas.width - 300) - DRIVER_LIST_START_X - 20; // x-start of betting slip - driver list start x - padding between lists
        const DRIVER_LIST_HEIGHT = 400;
        this.renderDriverList(ctx, gameState, DRIVER_LIST_START_X, this.driverListY, DRIVER_LIST_WIDTH, DRIVER_LIST_HEIGHT);

        // Betting slip
        this.renderBettingSlip(ctx, gameState, canvas.width - 300, 300, 280, 400);
    }

    renderTrackMap(ctx, gameState, x, y, width, height) {
        // Track map box
        ctx.fillStyle = 'rgba(26, 26, 26, 0.85)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Title
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'left';
        ctx.fillText('TRACK MAP', x + 10, y + 25);

        // Get track object
        const track = gameState?.currentTrack;

        // Draw actual track if available - full track rendering like in test visualizer
        if (track && track.waypoints && track.waypoints.length > 1) {
            const displayX = x + 10;
            const displayY = y + 35;
            const displayWidth = width - 20;
            const displayHeight = height - 45;

            // Render full track with 0.1x line width multiplier for finer detail (like test visualizer)
            track.renderFullTrack(ctx, displayX, displayY, displayWidth, displayHeight, 0.1);
        } else {
            // Fallback to simple track preview
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 40, y + 70);
            ctx.lineTo(x + 240, y + 70);
            ctx.quadraticCurveTo(x + 260, y + 70, x + 260, y + 90);
            ctx.lineTo(x + 260, y + 140);
            ctx.quadraticCurveTo(x + 260, y + 160, x + 240, y + 160);
            ctx.lineTo(x + 40, y + 160);
            ctx.quadraticCurveTo(x + 20, y + 160, x + 20, y + 140);
            ctx.lineTo(x + 20, y + 90);
            ctx.quadraticCurveTo(x + 20, y + 70, x + 40, y + 70);
            ctx.stroke();

            // Start/Finish line
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 40, y + 65);
            ctx.lineTo(x + 40, y + 75);
            ctx.stroke();

            ctx.font = '10px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('START', x + 45, y + 73);
        }
    }

    renderTrackInfo(ctx, gameState, x, y, width, height) {
        // Track info box
        ctx.fillStyle = 'rgba(26, 26, 26, 0.85)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Title
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'left';
        ctx.fillText('TRACK INFO', x + 10, y + 25);

        // Get track object
        const track = gameState?.currentTrack;

        if (track) {
            const trackInfo = track.getInfo();

            // Track name
            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.fillStyle = '#00ffff';
            ctx.fillText(track.name || 'UNKNOWN TRACK', x + 10, y + 55);

            // Track type
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = '#cccccc';
            ctx.fillText(`Type: ${trackInfo.type}`, x + 10, y + 80);

            // Track details
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`Length: ${trackInfo.totalDistance}m`, x + 10, y + 105);
            ctx.fillText(`Waypoints: ${trackInfo.waypointCount}`, x + 10, y + 125);

            // Race info
            const laps = gameState?.race?.totalLaps || 1;
            ctx.fillText(`Laps: ${laps}`, x + 10, y + 145);

            // Total distance
            const totalDistance = Math.floor(parseFloat(trackInfo.totalDistance) * laps);
            ctx.fillStyle = '#00ff00';
            ctx.fillText(`Total: ${totalDistance}m`, x + 10, y + 165);
        } else {
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = '#666666';
            ctx.fillText('NO TRACK DATA', x + 10, y + 100);
        }
    }

    renderDriverPortrait(ctx, gameState, x, y, width, height, assetManager) { // Added assetManager param to method signature in this snippet context, but in class method it is called as render(..., assetManager) so we need to ensure assetManager is passed down.
        // Wait, the render method calls renderDriverPortrait. I need to update render method to pass assetManager to sub-methods first?
        // Looking at render method in BettingScreen:
        // render(ctx, gameState, assetManager) { ... this.renderDriverPortrait(ctx, gameState, ..., assetManager); ... }
        
        // I will handle the sub-call update in a separate block or ensure this block covers it if I replace the whole render method.
        // Actually, `render` was not fully shown in the previous turn's context for BettingScreen, but I know I updated it to accept assetManager.
        // I need to update `render` to pass `assetManager` to `renderDriverPortrait` and then update `renderDriverPortrait` to use it.
        
        // Let's update `renderDriverPortrait` first. I'll assume it gets `assetManager`.
        // Actually, I should update `render` to pass it down too.
        
        // Let's do it in one go if possible, or two replacements.
        // First, let's update `renderDriverPortrait` implementation.
        const flash = Math.sin(this.portraitFlashTimer * 0.005) > 0.5;

        // Portrait box
        ctx.fillStyle = 'rgba(26, 26, 26, 0.85)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = this.selectedDriver ? (flash ? '#ff0066' : '#ffff00') : '#444444';
        ctx.lineWidth = this.selectedDriver ? 3 : 2;
        ctx.strokeRect(x, y, width, height);

        if (this.selectedDriver) {
            // Driver info
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(this.selectedDriver.name, x + width / 2, y + 30);

            // Portrait Image
            let portraitDrawn = false;
            if (assetManager && this.selectedDriver.portraitId) {
                const img = assetManager.getImage(this.selectedDriver.portraitId);
                if (img) {
                    // Draw image centered
                    // Image aspect ratio handling? Assuming square-ish or just fitting.
                    // Window for image is roughly (x+60, y+50, 160, 80) from old code?
                    // Old code: ctx.fillRect(x + 60, y + 50, 160, 80);
                    // Let's make it a square portrait 80x80 or 100x100 centered.
                    const imgSize = 100;
                    const imgX = x + width / 2 - imgSize / 2;
                    const imgY = y + 40;
                    
                    ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
                    
                    // Add a border around the image
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(imgX, imgY, imgSize, imgSize);
                    
                    portraitDrawn = true;
                }
            }

            if (!portraitDrawn) {
                // Fallback Portrait
                ctx.fillStyle = '#330033';
                ctx.fillRect(x + width / 2 - 40, y + 50, 80, 80);
                ctx.font = '48px "Courier New", monospace';
                ctx.fillStyle = '#ff0066';
                ctx.textAlign = 'center';
                ctx.fillText('🏎️', x + width / 2, y + 105);
            }

            // Stats
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = '#00ffff';
            ctx.textAlign = 'left';
            const skillValue = this.getDriverSkill(this.selectedDriver);
            ctx.fillText(`SKILL: ${skillValue}`, x + 20, y + 155);
            const formValue = this.getDriverForm(this.selectedDriver);
            ctx.fillText(`FORM: ${formValue}`, x + 150, y + 155);
            const displayOdds = this.getDriverOdds(this.selectedDriver, gameState);
            ctx.fillText(`ODDS: ${displayOdds}`, x + 20, y + 175);
        } else {
            ctx.font = '18px "Courier New", monospace';
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'center';
            ctx.fillText('SELECT A DRIVER', x + width / 2, y + height / 2);
        }
    }

    renderDriverList(ctx, gameState, x, y, width, height) {
        // Dimensions
        const headerHeight = 35;
        const scrollBarSize = 15;
        const contentY = y + headerHeight;
        const visibleWidth = width - scrollBarSize; // Reserve space for vertical scrollbar
        const visibleHeight = height - headerHeight - scrollBarSize; // Reserve space for horizontal scrollbar
        const rowHeight = 35;

        // Update max scrolls
        const totalContentHeight = (this.lastSortedDrivers.length || 0) * rowHeight;
        this.maxScroll = Math.max(0, totalContentHeight - visibleHeight);
        this.maxScrollX = Math.max(0, this.totalTableWidth - visibleWidth);

        // Clamp scrolls
        this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScroll));
        this.scrollX = Math.max(0, Math.min(this.scrollX, this.maxScrollX));

        // List container background
        ctx.fillStyle = 'rgba(26, 26, 26, 0.85)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Clip for content (Headers + Rows)
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, visibleWidth, height - scrollBarSize);
        ctx.clip();

        // Apply horizontal scroll translation
        ctx.translate(-this.scrollX, 0);

        // --- HEADERS ---
        const headerY = y;
        ctx.fillStyle = 'rgba(13, 13, 13, 0.95)'; // Slightly more opaque
        // Draw header background spanning full totalWidth
        ctx.fillRect(x + this.scrollX, headerY, visibleWidth, headerHeight); // Fixed background? No, it scrolls?
        // Actually, usually headers scroll horizontally but stay fixed vertically.
        // If I translate -scrollX, I draw headers at x. They move left. Correct.
        // But the background should fill the visible area?
        // Let's draw header background *before* translation? No, simpler to draw it per column or big rect.
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, headerY, this.totalTableWidth, headerHeight);
        ctx.fillStyle = '#444444';
        ctx.fillRect(x, headerY + headerHeight - 2, this.totalTableWidth, 2); // Separator

        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'left';
        
        this.columnConfig.forEach(col => {
             const colX = x + col.xOffset;
             // Highlight sorted column
             ctx.fillStyle = this.currentSort.column === col.key ? '#ffffff' : '#ffff00';
             ctx.fillText(col.label, colX + 5, headerY + 23);
             
             // Sort indicator
             if (this.currentSort.column === col.key) {
                 const arrow = this.currentSort.direction === 'asc' ? '▲' : '▼';
                 const textWidth = ctx.measureText(col.label).width;
                 ctx.font = '12px "Courier New", monospace';
                 ctx.fillText(arrow, colX + 5 + textWidth + 5, headerY + 23);
                 ctx.font = 'bold 14px "Courier New", monospace'; 
             }
             
             // Column divider
             ctx.fillStyle = '#333333';
             ctx.fillRect(colX + col.width - 1, headerY, 1, headerHeight);
        });

        // --- ROWS ---
        const drivers = this.lastSortedDrivers.length > 0 ? this.lastSortedDrivers : 
                       this.sortDrivers(gameState?.race?.drivers || this.generateDummyDrivers(), gameState);
        this.lastSortedDrivers = drivers;

        const textBaselineOffset = 23;

        drivers.forEach((driver, index) => {
            const rowTop = contentY + index * rowHeight - this.scrollOffset;
            
            // Optimization: Visibility Check
            if (rowTop + rowHeight < contentY || rowTop > contentY + visibleHeight) return;

            const isSelected = this.selectedDriver === driver;
            const isHovered = this.hoveredDriver === driver;

            // Row Background
            let bgCol = index % 2 === 1 ? 'rgba(20, 20, 20, 0.5)' : 'rgba(0,0,0,0)';
            if (isHovered) bgCol = 'rgba(26, 26, 0, 0.85)';
            if (isSelected) bgCol = 'rgba(51, 0, 51, 0.85)';

            ctx.fillStyle = bgCol;
            ctx.fillRect(x, rowTop, this.totalTableWidth, rowHeight);

            // Render Cells
            ctx.fillStyle = isSelected ? '#ffffff' : '#aaaaaa';
            ctx.font = '14px "Courier New", monospace';

            this.columnConfig.forEach(col => {
                const cellX = x + col.xOffset;
                const val = this.getNestedValue(driver, col.key);

                // Special Types
                if (col.type === 'bool') {
                    ctx.fillStyle = val ? '#00ff00' : '#ff0000';
                    ctx.fillText(val ? 'YES' : 'NO', cellX + 5, rowTop + textBaselineOffset);
                } else if (col.type === 'color') {
                    if (val) {
                        ctx.save();
                        ctx.fillStyle = val;
                        ctx.beginPath();
                        ctx.arc(cellX + 20, rowTop + rowHeight / 2, 8, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        ctx.restore();
                    }
                } else {
                    // Standard Text
                    // Format numbers
                    let textVal = val;
                    if (typeof val === 'number') {
                        // If float, fix to 2 dec?
                        // Determine if float by checking remainder
                        if (val % 1 !== 0) textVal = val.toFixed(2);
                    }
                    if (val === undefined || val === null) textVal = '-';
                    
                    ctx.fillStyle = isSelected ? '#ffffff' : '#aaaaaa';
                    ctx.fillText(String(textVal), cellX + 5, rowTop + textBaselineOffset);
                }
                
                // Cell border (subtle)
                ctx.fillStyle = '#222222';
                ctx.fillRect(cellX + col.width - 1, rowTop, 1, rowHeight);
            });
            
            // Row bottom border
            ctx.fillStyle = '#222222';
            ctx.fillRect(x, rowTop + rowHeight - 1, this.totalTableWidth, 1);
        });

        ctx.restore(); // End translation/clipping

        // --- SCROLLBARS ---
        // Vertical Scrollbar
        if (this.maxScroll > 0) {
            const sbX = x + width - scrollBarSize;
            const sbY = contentY;
            const sbH = visibleHeight;
            
            ctx.fillStyle = '#111111';
            ctx.fillRect(sbX, sbY, scrollBarSize, sbH);
            
            const thumbH = Math.max(20, (visibleHeight / totalContentHeight) * sbH);
            const thumbY = sbY + (this.scrollOffset / this.maxScroll) * (sbH - thumbH);
            
            ctx.fillStyle = '#ff0066';
            ctx.fillRect(sbX + 2, thumbY, scrollBarSize - 4, thumbH);
        }

        // Horizontal Scrollbar
        if (this.maxScrollX > 0) {
            const sbX = x;
            const sbY = y + height - scrollBarSize;
            const sbW = visibleWidth;
            
            ctx.fillStyle = '#111111';
            ctx.fillRect(sbX, sbY, sbW, scrollBarSize);
            
            const thumbW = Math.max(20, (visibleWidth / this.totalTableWidth) * sbW);
            const thumbX = sbX + (this.scrollX / this.maxScrollX) * (sbW - thumbW);
            
            ctx.fillStyle = '#ff0066';
            ctx.fillRect(thumbX, sbY + 2, thumbW, scrollBarSize - 4);
        }
    }

    renderBettingSlip(ctx, gameState, x, y, width, height) {
        // Slip container
        ctx.fillStyle = 'rgba(26, 26, 26, 0.85)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Title
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'center';
        ctx.fillText('BETTING SLIP', x + width / 2, y + 25);

        // Bet type selector (moved to betting slip)
        const betTypes = [
            { id: 'win', label: 'WIN', width: 85 },
            { id: 'top3', label: 'TOP 3', width: 85 },
            { id: 'h2h', label: 'H2H', width: 85 }
        ];

        let currentX = x + 10;
        const selectorY = y + 35;
        betTypes.forEach(type => {
            const isSelected = this.betType === type.id;

            ctx.fillStyle = isSelected ? '#ff0066' : '#2a2a2a';
            ctx.fillRect(currentX, selectorY, type.width, 30);
            ctx.strokeStyle = isSelected ? '#ffffff' : '#444444';
            ctx.lineWidth = 2;
            ctx.strokeRect(currentX, selectorY, type.width, 30);

            ctx.font = 'bold 12px "Courier New", monospace';
            ctx.fillStyle = isSelected ? '#ffffff' : '#888888';
            ctx.textAlign = 'center';
            ctx.fillText(type.label, currentX + type.width / 2, selectorY + 20);

            currentX += type.width + 5;
        });

        if (this.selectedDriver) {
            // Selection
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText('DRIVER:', x + 20, y + 90);
            ctx.fillStyle = '#00ffff';
            ctx.fillText(this.selectedDriver.name || 'UNKNOWN', x + 90, y + 90);

            // Get odds from driver or from gameState odds array
            const driverOdds = this.getDriverOdds(this.selectedDriver, gameState);
            ctx.fillStyle = '#ffffff';
            ctx.fillText('ODDS:', x + 20, y + 105);
            ctx.fillStyle = '#00ff00';
            ctx.fillText(driverOdds, x + 80, y + 105);

            // Bet amount controls
            ctx.fillStyle = '#ffffff';
            ctx.fillText('BET AMOUNT:', x + 20, y + 140);
            
            // Amount display
            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.fillStyle = '#ffff00';
            ctx.textAlign = 'center';
            ctx.fillText(`$${this.betAmount}`, x + width / 2, y + 173);

            // Increment/Decrement buttons
            let buttonY = y + 185;
            const buttonHeight = 25;
            const smallButtonWidth = Math.floor((width - 40 - (5 * 5)) / 6); // 6 buttons in a row, with 5px spacing between them
            let currentButtonX = x + 20;

            const betIncrements = [-1000, -100, -10, 10, 100, 1000];
            
            // Render fixed increment buttons
            betIncrements.forEach(inc => {
                let buttonLabel;
                if (inc === 1000) {
                    buttonLabel = '+1K';
                } else if (inc === -1000) {
                    buttonLabel = '-1K';
                } else {
                    buttonLabel = inc > 0 ? `+${inc}` : String(inc);
                }
                this.drawButton(ctx, currentButtonX, buttonY, smallButtonWidth, buttonHeight, buttonLabel, false);
                currentButtonX += smallButtonWidth + 5;
            });
            
            buttonY += buttonHeight + 5; // Move to next row
            currentButtonX = x + 20; // Reset X for percentage buttons
            const percentageButtonWidth = (width - 40 - 15) / 4; // 4 buttons in a row
            const percentageIncrements = ['10%', '25%', '50%', 'MAX'];

            percentageIncrements.forEach(label => {
                this.drawButton(ctx, currentButtonX, buttonY, percentageButtonWidth, buttonHeight, label, false);
                currentButtonX += percentageButtonWidth + 5;
            });

            // Potential payout
            const potentialPayout = this.calculatePayout(this.betAmount, driverOdds);
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText('POTENTIAL PAYOUT:', x + 20, y + 280); // Adjusted Y
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.fillStyle = '#00ff00';
            ctx.textAlign = 'center';
            ctx.fillText(`$${potentialPayout}`, x + width / 2, y + 305); // Adjusted Y

            // Place bet button
            const canBet = gameState?.player?.bankroll >= this.betAmount;
            ctx.fillStyle = canBet ? '#ff0066' : '#333333';
            ctx.fillRect(x + 20, y + height - 50, width - 40, 40);
            ctx.strokeStyle = canBet ? '#ffffff' : '#666666';
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 20, y + height - 50, width - 40, 40);

            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.fillStyle = canBet ? '#ffffff' : '#666666';
            ctx.fillText('PLACE BET', x + width / 2, y + height - 23);
        } else {
            ctx.font = '16px "Courier New", monospace';
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'center';
            ctx.fillText('SELECT A DRIVER', x + width / 2, y + height / 2);
            ctx.fillText('TO PLACE BET', x + width / 2, y + height / 2 + 25);
        }
    }

    handleClick(x, y, gameState) {
        const canvas = { width: 1280, height: 720 }; // Canvas dimensions
        const DRIVER_LIST_START_X = 20;
        const DRIVER_LIST_WIDTH = (canvas.width - 300) - DRIVER_LIST_START_X - 20; // x-start of betting slip - driver list start x - padding between lists
        const DRIVER_LIST_HEIGHT = 400;
        const scrollBarSize = 15;

        // Check bet type selector (now in betting slip)
        const slipX = canvas.width - 300;
        const selectorY = 335; // y + 35 where y = 300
        const betTypes = [
            { id: 'win', xOffset: 10, width: 85 },
            { id: 'top3', xOffset: 100, width: 85 },
            { id: 'h2h', xOffset: 190, width: 85 }
        ];

        for (let type of betTypes) {
            const typeX = slipX + type.xOffset;
            if (x >= typeX && x <= typeX + type.width && y >= selectorY && y <= selectorY + 30) {
                this.betType = type.id;
                return null;
            }
        }

        // Check driver list interactions
        const listY = this.driverListY;
        const headerHeight = 35;
        const visibleListWidth = DRIVER_LIST_WIDTH - scrollBarSize;
        const visibleListHeight = DRIVER_LIST_HEIGHT - headerHeight - scrollBarSize;

        // 1. Header Clicks (Sorting)
        if (x >= DRIVER_LIST_START_X && x <= DRIVER_LIST_START_X + visibleListWidth && 
            y >= listY && y <= listY + headerHeight) {
            
            // Translate click X to content coordinates
            const contentClickX = x - DRIVER_LIST_START_X + this.scrollX;

            for (let col of this.columnConfig) {
                if (contentClickX >= col.xOffset && contentClickX < col.xOffset + col.width) {
                    if (this.currentSort.column === col.key) {
                        this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
                    } else {
                        this.currentSort.column = col.key;
                        this.currentSort.direction = 'desc'; // Default to desc (usually better for numbers)
                        if (col.key === 'name' || col.key === 'teamName' || col.key === 'hometown') {
                            this.currentSort.direction = 'asc';
                        }
                    }
                    return null;
                }
            }
        }
        
        // Use cached sorted drivers to match what user sees
        const drivers = this.lastSortedDrivers.length > 0 ? this.lastSortedDrivers : this.sortDrivers(gameState?.race?.drivers || this.generateDummyDrivers(), gameState);
        
        const rowHeight = 35;
        const startY = listY + headerHeight;

        // Vertical Scroll bar interaction
        const vScrollBarX = DRIVER_LIST_START_X + DRIVER_LIST_WIDTH - scrollBarSize;
        const vScrollBarY = startY;
        const vScrollBarHeight = visibleListHeight;

        if (x >= vScrollBarX && x <= vScrollBarX + scrollBarSize &&
            y >= vScrollBarY && y <= vScrollBarY + vScrollBarHeight) {
            
            const clickRelativeY = y - vScrollBarY;
            const scrollPercentage = clickRelativeY / vScrollBarHeight;
            
            const totalContentHeight = drivers.length * rowHeight;
            const maxScroll = Math.max(0, totalContentHeight - visibleListHeight);
            
            this.scrollOffset = scrollPercentage * maxScroll;
            return null; // Handled scroll click
        }

        // Horizontal Scroll bar interaction
        const hScrollBarX = DRIVER_LIST_START_X;
        const hScrollBarY = listY + DRIVER_LIST_HEIGHT - scrollBarSize;
        const hScrollBarWidth = visibleListWidth;

        if (x >= hScrollBarX && x <= hScrollBarX + hScrollBarWidth &&
            y >= hScrollBarY && y <= hScrollBarY + scrollBarSize) {
            
            const clickRelativeX = x - hScrollBarX;
            const scrollPercentage = clickRelativeX / hScrollBarWidth;
            
            this.scrollX = scrollPercentage * this.maxScrollX;
            return null; // Handled scroll click
        }

        // Row Clicks
        if (x >= DRIVER_LIST_START_X && x <= DRIVER_LIST_START_X + visibleListWidth &&
            y >= startY && y <= startY + visibleListHeight) {
            
            drivers.forEach((driver, index) => {
                const rowY = startY + index * rowHeight - this.scrollOffset;
                // Check Y bounds
                if (y >= rowY && y <= rowY + rowHeight) {
                    this.selectedDriver = driver;
                }
            });
        }

        // Check betting slip controls
        // slipX already declared above for bet type selector
        const slipY = 300;
        const width = 280; // Betting slip width, explicitly defined
        const height = 400; // Betting slip height, explicitly defined as in render method

        // Define button dimensions and positions (should match renderBettingSlip)
        const buttonHeight = 25;
        let buttonY = slipY + 185;
        const smallButtonWidth = Math.floor((width - 40 - (5 * 5)) / 6);
        const percentageButtonWidth = (width - 40 - 15) / 4;

        const betIncrements = [-1000, -100, -10, 10, 100, 1000];
        const percentageIncrements = ['10%', '25%', '50%', 'MAX'];

        // Check fixed increment buttons
        let currentButtonX = slipX + 20;
        betIncrements.forEach(inc => {
            if (x >= currentButtonX && x <= currentButtonX + smallButtonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                this.betAmount = Math.max(10, Math.min(gameState.player.bankroll, this.betAmount + inc));
            }
            currentButtonX += smallButtonWidth + 5;
        });

        // Check percentage increment buttons
        buttonY += buttonHeight + 5; // Move to next row
        currentButtonX = slipX + 20;
        percentageIncrements.forEach(label => {
            if (x >= currentButtonX && x <= currentButtonX + percentageButtonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                this.betAmount = Math.max(10, Math.min(gameState.player.bankroll, this.calculateBetPercentage(label, gameState.player.bankroll)));
            }
            currentButtonX += percentageButtonWidth + 5;
        });

        // Place bet button
        if (this.selectedDriver && x >= slipX + 20 && x <= slipX + 260 &&
            y >= slipY + height - 50 && y <= slipY + height - 10 && gameState?.player?.bankroll >= this.betAmount) {
            return {
                action: 'placeBet',
                driver: this.selectedDriver,
                amount: this.betAmount,
                betType: this.betType
            };
        }

        return null;
    }

    handleMouseMove(x, y, isMouseDown) {
        const canvas = { width: 1280, height: 720 }; // Canvas dimensions
        const DRIVER_LIST_START_X = 20;
        const DRIVER_LIST_WIDTH = (canvas.width - 300) - DRIVER_LIST_START_X - 20;
        const DRIVER_LIST_HEIGHT = 400;
        const scrollBarSize = 15;
        const rowHeight = 35;
        const headerHeight = 35;
        const contentStartY = this.driverListY + headerHeight;
        const visibleListWidth = DRIVER_LIST_WIDTH - scrollBarSize;
        const visibleListHeight = DRIVER_LIST_HEIGHT - headerHeight - scrollBarSize;

        // Vertical Scroll bar drag logic
        const vScrollBarX = DRIVER_LIST_START_X + DRIVER_LIST_WIDTH - scrollBarSize;
        const vScrollBarY = contentStartY;
        const vScrollBarHeight = visibleListHeight;

        if (isMouseDown && x >= vScrollBarX && x <= vScrollBarX + scrollBarSize &&
            y >= vScrollBarY && y <= vScrollBarY + vScrollBarHeight) {
            
            const clickRelativeY = y - vScrollBarY;
            const scrollPercentage = Math.max(0, Math.min(1, clickRelativeY / vScrollBarHeight));
            
            if (this.maxScroll !== undefined) {
                this.scrollOffset = scrollPercentage * this.maxScroll;
            }
        }

        // Horizontal Scroll bar drag logic
        const hScrollBarX = DRIVER_LIST_START_X;
        const hScrollBarY = this.driverListY + DRIVER_LIST_HEIGHT - scrollBarSize;
        const hScrollBarWidth = visibleListWidth;

        if (isMouseDown && x >= hScrollBarX && x <= hScrollBarX + hScrollBarWidth &&
            y >= hScrollBarY && y <= hScrollBarY + scrollBarSize) {
            
            const clickRelativeX = x - hScrollBarX;
            const scrollPercentage = Math.max(0, Math.min(1, clickRelativeX / hScrollBarWidth));
            
            if (this.maxScrollX !== undefined) {
                this.scrollX = scrollPercentage * this.maxScrollX;
            }
        }

        // Track hovered driver in list
        const drivers = this.lastSortedDrivers.length > 0 ? this.lastSortedDrivers : this.generateDummyDrivers();
        
        this.hoveredDriver = null;
        
        drivers.forEach((driver, index) => {
            const rowTop = contentStartY + index * rowHeight - this.scrollOffset;
            // Check X bounds within visible list width
            if (x >= DRIVER_LIST_START_X && x <= DRIVER_LIST_START_X + visibleListWidth &&
                y >= contentStartY && y <= contentStartY + visibleListHeight && 
                y >= rowTop && y <= rowTop + rowHeight) {
                this.hoveredDriver = driver;
            }
        });
    }

    handleWheel(wheelDelta, gameState) {
        const DRIVER_LIST_HEIGHT = 400;
        const rowHeight = 35;
        const headerHeight = 35;
        const scrollBarSize = 15;
        
        // Use sorted drivers if available or re-sort
        const drivers = this.lastSortedDrivers.length > 0 ? this.lastSortedDrivers : 
                       (gameState?.race?.drivers || this.generateDummyDrivers());

        const totalContentHeight = drivers.length * rowHeight;
        const visibleListHeight = DRIVER_LIST_HEIGHT - headerHeight - scrollBarSize;

        let maxScroll = Math.max(0, totalContentHeight - visibleListHeight);

        // Update scrollOffset
        this.scrollOffset += wheelDelta;

        // Clamp scrollOffset
        this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));
    }

    getSkillColor(skill) {
        const value = parseInt(skill);
        if (value >= 80) return '#00ff00';
        if (value >= 60) return '#ffff00';
        return '#ff6600';
    }

    getFormColor(form) {
        if (form === 'HOT') return '#ff0000';
        if (form === 'GOOD') return '#00ff00';
        return '#888888';
    }

    drawButton(ctx, x, y, width, height, text, isSelected) {
        ctx.fillStyle = isSelected ? '#ff0066' : '#333333';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = isSelected ? '#ffffff' : '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.font = 'bold 12px "Courier New", monospace'; 
        ctx.fillStyle = isSelected ? '#ffffff' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + width / 2, y + height / 2 + 5);
    }

    calculatePayout(bet, odds) {
        if (!odds) return 0;
        // Handle both string format ("2.5x") and numeric format (2.5)
        const oddsStr = typeof odds === 'string' ? odds : String(odds);
        const multiplier = parseFloat(oddsStr.replace('x', ''));
        return isNaN(multiplier) ? 0 : Math.floor(bet * multiplier);
    }

    calculateBetPercentage(percentage, bankroll) {
        if (percentage === 'MAX') {
            return bankroll;
        }
        const value = parseInt(percentage.replace('%', ''));
        return Math.floor(bankroll * (value / 100));
    }

    reset() {
        this.selectedDriver = null;
        this.betAmount = 100;
        this.betType = 'win';
        this.scrollOffset = 0;
        this.hoveredDriver = null;
        this.currentSort = { column: 'position', direction: 'asc' };
        this.lastSortedDrivers = [];
    }

    generateDummyDrivers() {
        const names = [
            'Dummy Driver 1', 'Dummy Driver 2', 'Dummy Driver 3', 'Dummy Driver 4', 'Dummy Driver 6',
        ];
        
        return names.map((name, i) => {
            // Generate deterministic pseudo-random stats for consistency
            const baseSkill = 95 - Math.floor(i * 1.5);
            const skill = Math.max(60, baseSkill);
            const oddsVal = (2.0 + (i * 0.5)).toFixed(1);
            
            return {
                name,
                skill: String(skill),
                form: ['HOT', 'GOOD', 'AVG', 'COLD'][i % 4],
                odds: `${oddsVal}x`,
                stats: {
                    topSpeed: skill,
                    cornering: skill - 5,
                    reliability: 80
                }
            };
        });
    }
}

export default BettingScreen;