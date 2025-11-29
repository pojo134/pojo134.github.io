class BettingScreen {
    constructor() {
        this.selectedDriver = null;
        this.betAmount = 100;
        this.betType = 'win'; // win, top3, h2h
        this.scrollOffset = 0;
        this.hoveredDriver = null;
        this.driverListY = 300;
        this.portraitFlashTimer = 0;
    }

    update(deltaTime, gameState) {
        this.portraitFlashTimer += deltaTime;
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

    render(ctx, gameState) {
        const canvas = ctx.canvas;

        // Background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header
        ctx.fillStyle = '#1a0a1a';
        ctx.fillRect(0, 0, canvas.width, 80);

        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.fillStyle = '#ff0066';
        ctx.textAlign = 'left';
        ctx.fillText('BETTING DESK', 20, 50);

        // Track map (top left)
        this.renderTrackMap(ctx, gameState, 20, 100, 280, 180);

        // Track info (to the right of track map)
        this.renderTrackInfo(ctx, gameState, 320, 100, 280, 180);

        // Driver portrait (top right)
        this.renderDriverPortrait(ctx, gameState, canvas.width - 300, 100, 280, 180);

        // Driver list
        const DRIVER_LIST_START_X = 20;
        const DRIVER_LIST_WIDTH = (canvas.width - 300) - DRIVER_LIST_START_X - 20; // x-start of betting slip - driver list start x - padding between lists
        const DRIVER_LIST_HEIGHT = canvas.height - this.driverListY - 150;
        this.renderDriverList(ctx, gameState, DRIVER_LIST_START_X, this.driverListY, DRIVER_LIST_WIDTH, DRIVER_LIST_HEIGHT);

        // Betting slip
        this.renderBettingSlip(ctx, gameState, canvas.width - 300, 300, 280, 350);
    }

    renderTrackMap(ctx, gameState, x, y, width, height) {
        // Track map box
        ctx.fillStyle = '#1a1a1a';
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
        ctx.fillStyle = '#1a1a1a';
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

    renderDriverPortrait(ctx, gameState, x, y, width, height) {
        const flash = Math.sin(this.portraitFlashTimer * 0.005) > 0.5;

        // Portrait box
        ctx.fillStyle = '#1a1a1a';
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

            // Portrait placeholder (would be actual sprite/image)
            ctx.fillStyle = '#330033';
            ctx.fillRect(x + 60, y + 50, 160, 80);
            ctx.font = '48px "Courier New", monospace';
            ctx.fillStyle = '#ff0066';
            ctx.fillText('🏎️', x + width / 2, y + 105);

            // Stats
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = '#00ffff';
            ctx.textAlign = 'left';
            const skillValue = this.getDriverSkill(this.selectedDriver);
            ctx.fillText(`SKILL: ${skillValue}`, x + 20, y + 150);
            const formValue = this.getDriverForm(this.selectedDriver);
            ctx.fillText(`FORM: ${formValue}`, x + 150, y + 150);
            const displayOdds = this.getDriverOdds(this.selectedDriver, gameState);
            ctx.fillText(`ODDS: ${displayOdds}`, x + 20, y + 170);
        } else {
            ctx.font = '18px "Courier New", monospace';
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'center';
            ctx.fillText('SELECT A DRIVER', x + width / 2, y + height / 2);
        }
    }

    renderDriverList(ctx, gameState, x, y, width, height) {
        // List container
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Header
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'left';
        ctx.fillText('DRIVER', x + 10, y + 20);
        ctx.fillText('SKILL', x + 250, y + 20);
        ctx.fillText('FORM', x + 350, y + 20);
        ctx.fillText('ODDS', x + 450, y + 20);

        // Drivers
        const drivers = gameState?.race?.drivers || this.generateDummyDrivers();
        const rowHeight = 35;
        const startY = y + 40;

        drivers.forEach((driver, index) => {
            const rowY = startY + index * rowHeight - this.scrollOffset;

            if (rowY < y + 30 || rowY > y + height - 10) return; // Skip if out of view

            const isSelected = this.selectedDriver === driver;
            const isHovered = this.hoveredDriver === driver;

            // Row background
            if (isSelected) {
                ctx.fillStyle = '#330033';
                ctx.fillRect(x + 5, rowY - 20, width - 10, rowHeight - 2);
            } else if (isHovered) {
                ctx.fillStyle = '#1a1a00';
                ctx.fillRect(x + 5, rowY - 20, width - 10, rowHeight - 2);
            }

            // Driver data
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = isSelected ? '#ffffff' : '#aaaaaa';
            ctx.textAlign = 'left';
            ctx.fillText(`${index + 1}. ${driver.name}`, x + 10, rowY);

            const skillValue = this.getDriverSkill(driver);
            ctx.fillStyle = this.getSkillColor(skillValue);
            ctx.fillText(skillValue, x + 265, rowY);

            const formValue = this.getDriverForm(driver);
            ctx.fillStyle = this.getFormColor(formValue);
            ctx.fillText(formValue, x + 365, rowY);

            const oddsValue = this.getDriverOdds(driver, gameState);
            ctx.fillStyle = '#00ff00';
            ctx.fillText(oddsValue, x + 460, rowY);
        });

        // Scroll indicator
        if (drivers.length * rowHeight > height - 40) {
            ctx.fillStyle = '#666666';
            ctx.fillRect(x + width - 15, y + 30, 10, height - 40);

            const scrollHeight = (height - 40) * (height / (drivers.length * rowHeight));
            const scrollY = y + 30 + (this.scrollOffset / (drivers.length * rowHeight)) * (height - 40);
            ctx.fillStyle = '#ff0066';
            ctx.fillRect(x + width - 15, scrollY, 10, scrollHeight);
        }
    }

    renderBettingSlip(ctx, gameState, x, y, width, height) {
        // Slip container
        ctx.fillStyle = '#1a1a1a';
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
            const smallButtonWidth = (width - 40 - 20) / 5; // 5 buttons in a row, with 5px spacing between them
            let currentButtonX = x + 20;

            const betIncrements = [-1000, -100, -10, 10, 100, 1000];
            
            // Render fixed increment buttons
            betIncrements.forEach(inc => {
                const buttonLabel = inc > 0 ? `+${inc}` : String(inc);
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
            ctx.fillRect(x + 20, y + height - 30, width - 40, 40);
            ctx.strokeStyle = canBet ? '#ffffff' : '#666666';
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 20, y + height - 30, width - 40, 40);

            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.fillStyle = canBet ? '#ffffff' : '#666666';
            ctx.fillText('PLACE BET', x + width / 2, y + height - 3);
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
        const DRIVER_LIST_HEIGHT = canvas.height - this.driverListY - 150;

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

        // Check driver list
        const listY = this.driverListY;
        const drivers = gameState?.race?.drivers || this.generateDummyDrivers();
        const rowHeight = 35;
        const startY = listY + 40;

        drivers.forEach((driver, index) => {
            const rowY = startY + index * rowHeight - this.scrollOffset;
            if (x >= DRIVER_LIST_START_X && x <= DRIVER_LIST_START_X + DRIVER_LIST_WIDTH &&
                y >= listY && y <= listY + DRIVER_LIST_HEIGHT && // Ensure click is within the overall list bounds
                y >= rowY - 20 && y <= rowY + 15) {
                this.selectedDriver = driver;
            }
        });

        // Check betting slip controls
        // slipX already declared above for bet type selector
        const slipY = 300;
        const width = 280; // Betting slip width, explicitly defined
        const height = 350; // Betting slip height, explicitly defined as in render method

        // Define button dimensions and positions (should match renderBettingSlip)
        const buttonHeight = 25;
        let buttonY = slipY + 185;
        const smallButtonWidth = (width - 40 - 20) / 5;
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
            y >= slipY + height - 30 && y <= slipY + height + 10 && gameState?.player?.bankroll >= this.betAmount) {
            return {
                action: 'placeBet',
                driver: this.selectedDriver,
                amount: this.betAmount,
                betType: this.betType
            };
        }

        return null;
    }

    handleMouseMove(x, y) {
        const canvas = { width: 1280, height: 720 }; // Canvas dimensions
        const DRIVER_LIST_START_X = 20;
        const DRIVER_LIST_WIDTH = (canvas.width - 300) - DRIVER_LIST_START_X - 20;
        const DRIVER_LIST_HEIGHT = canvas.height - this.driverListY - 150;

        // Track hovered driver in list
        const listY = this.driverListY;
        const drivers = this.generateDummyDrivers();
        const rowHeight = 35;
        const startY = listY + 40;

        this.hoveredDriver = null;
        drivers.forEach((driver, index) => {
            const rowY = startY + index * rowHeight - this.scrollOffset;
            if (x >= DRIVER_LIST_START_X && x <= DRIVER_LIST_START_X + DRIVER_LIST_WIDTH &&
                y >= listY && y <= listY + DRIVER_LIST_HEIGHT && // Ensure mouse is within the overall list bounds
                y >= rowY - 20 && y <= rowY + 15) {
                this.hoveredDriver = driver;
            }
        });
    }

    handleWheel(event, gameState) {
        const canvas = { width: 1280, height: 720 };
        const DRIVER_LIST_HEIGHT = canvas.height - this.driverListY - 150;
        const rowHeight = 35;
        const drivers = gameState?.race?.drivers || this.generateDummyDrivers();

        const totalContentHeight = drivers.length * rowHeight;
        const visibleListHeight = DRIVER_LIST_HEIGHT - 40; // Accounting for padding in renderDriverList

        let maxScroll = Math.max(0, totalContentHeight - visibleListHeight);

        // Update scrollOffset
        this.scrollOffset -= event.wheelDeltaY;

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

        ctx.font = 'bold 14px "Courier New", monospace';
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

    generateDummyDrivers() {
        const names = ['HAMILTON', 'VERSTAPPEN', 'LECLERC', 'SAINZ', 'NORRIS', 'PIASTRI', 'RUSSELL', 'ALONSO'];
        const skills = ['95', '92', '88', '85', '83', '82', '86', '84'];
        const forms = ['HOT', 'GOOD', 'GOOD', 'AVG', 'HOT', 'GOOD', 'AVG', 'GOOD'];
        const odds = ['2.5x', '3.0x', '4.5x', '5.0x', '6.5x', '7.0x', '4.0x', '5.5x'];

        return names.map((name, i) => ({
            name,
            skill: skills[i],
            form: forms[i],
            odds: odds[i]
        }));
    }
}

export default BettingScreen;