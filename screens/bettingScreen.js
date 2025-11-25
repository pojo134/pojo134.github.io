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

        // Driver portrait (top right)
        this.renderDriverPortrait(ctx, gameState, canvas.width - 300, 100, 280, 180);

        // Bet type selector
        this.renderBetTypeSelector(ctx, 320, 100, 280, 60);

        // Driver list
        const DRIVER_LIST_START_X = 20;
        const DRIVER_LIST_WIDTH = (canvas.width - 300) - DRIVER_LIST_START_X - 20; // x-start of betting slip - driver list start x - padding between lists
        this.renderDriverList(ctx, gameState, DRIVER_LIST_START_X, this.driverListY, DRIVER_LIST_WIDTH, 250);

        // Betting slip
        this.renderBettingSlip(ctx, gameState, canvas.width - 300, 300, 280, 280);
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
        const trackName = track?.name || 'UNKNOWN TRACK';
        ctx.font = '14px "Courier New", monospace';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(trackName, x + 10, y + 45);

        // Draw actual track if available
        if (track && track.waypoints && track.waypoints.length > 1) {
            const displayX = x + 15;
            const displayY = y + 65;
            const displayWidth = width - 30;
            const displayHeight = height - 90;

            const bounds = track.visualBounds;
            const scaleX = displayWidth / bounds.width;
            const scaleY = displayHeight / bounds.height;

            // Draw track
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 3;
            ctx.beginPath();

            const firstWP = track.waypoints[0];
            ctx.moveTo(displayX + (firstWP.x - bounds.minX) * scaleX, displayY + (firstWP.y - bounds.minY) * scaleY);

            for (let i = 1; i < track.waypoints.length; i++) {
                const wp = track.waypoints[i];
                ctx.lineTo(displayX + (wp.x - bounds.minX) * scaleX, displayY + (wp.y - bounds.minY) * scaleY);
            }

            ctx.closePath();
            ctx.stroke();

            // Start/Finish line
            const startX = displayX + (firstWP.x - bounds.minX) * scaleX;
            const startY = displayY + (firstWP.y - bounds.minY) * scaleY;

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX - 5, startY - 8);
            ctx.lineTo(startX - 5, startY + 8);
            ctx.stroke();

            ctx.font = '9px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('S/F', startX, startY - 12);
        } else {
            // Fallback to simple track
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

    renderBetTypeSelector(ctx, x, y, width, height) {
        const betTypes = [
            { id: 'win', label: 'WIN', width: 90 },
            { id: 'top3', label: 'TOP 3', width: 90 },
            { id: 'h2h', label: 'H2H', width: 90 }
        ];

        let currentX = x;
        betTypes.forEach(type => {
            const isSelected = this.betType === type.id;

            ctx.fillStyle = isSelected ? '#ff0066' : '#1a1a1a';
            ctx.fillRect(currentX, y, type.width, height);
            ctx.strokeStyle = isSelected ? '#ffffff' : '#444444';
            ctx.lineWidth = 2;
            ctx.strokeRect(currentX, y, type.width, height);

            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.fillStyle = isSelected ? '#ffffff' : '#888888';
            ctx.textAlign = 'center';
            ctx.fillText(type.label, currentX + type.width / 2, y + 38);

            currentX += type.width + 5;
        });
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

        if (this.selectedDriver) {
            // Selection
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText('DRIVER:', x + 20, y + 55);
            ctx.fillStyle = '#00ffff';
            ctx.fillText(this.selectedDriver.name || 'UNKNOWN', x + 90, y + 55);

            ctx.fillStyle = '#ffffff';
            ctx.fillText('BET TYPE:', x + 20, y + 80);
            ctx.fillStyle = '#00ffff';
            ctx.fillText(this.betType.toUpperCase(), x + 110, y + 80);

            // Get odds from driver or from gameState odds array
            const driverOdds = this.getDriverOdds(this.selectedDriver, gameState);
            ctx.fillStyle = '#ffffff';
            ctx.fillText('ODDS:', x + 20, y + 105);
            ctx.fillStyle = '#00ff00';
            ctx.fillText(driverOdds, x + 80, y + 105);

            // Bet amount controls
            ctx.fillStyle = '#ffffff';
            ctx.fillText('BET AMOUNT:', x + 20, y + 140);

            // Decrease button
            ctx.fillStyle = '#333333';
            ctx.fillRect(x + 20, y + 150, 40, 30);
            ctx.strokeStyle = '#666666';
            ctx.strokeRect(x + 20, y + 150, 40, 30);
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('-', x + 40, y + 173);

            // Amount display
            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.fillStyle = '#ffff00';
            ctx.fillText(`$${this.betAmount}`, x + width / 2, y + 173);

            // Increase button
            ctx.fillStyle = '#333333';
            ctx.fillRect(x + width - 60, y + 150, 40, 30);
            ctx.strokeStyle = '#666666';
            ctx.strokeRect(x + width - 60, y + 150, 40, 30);
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('+', x + width - 40, y + 173);

            // Potential payout
            const potentialPayout = this.calculatePayout(this.betAmount, driverOdds);
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText('POTENTIAL PAYOUT:', x + 20, y + 210);
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.fillStyle = '#00ff00';
            ctx.textAlign = 'center';
            ctx.fillText(`$${potentialPayout}`, x + width / 2, y + 235);

            // Place bet button
            const canBet = gameState?.player?.bankroll >= this.betAmount;
            ctx.fillStyle = canBet ? '#ff0066' : '#333333';
            ctx.fillRect(x + 20, y + height - 60, width - 40, 40);
            ctx.strokeStyle = canBet ? '#ffffff' : '#666666';
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 20, y + height - 60, width - 40, 40);

            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.fillStyle = canBet ? '#ffffff' : '#666666';
            ctx.fillText('PLACE BET', x + width / 2, y + height - 33);
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

        // Check bet type selector
        const betTypes = [
            { id: 'win', x: 320, width: 90 },
            { id: 'top3', x: 415, width: 90 },
            { id: 'h2h', x: 510, width: 90 }
        ];

        for (let type of betTypes) {
            if (x >= type.x && x <= type.x + type.width && y >= 100 && y <= 160) {
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
            if (x >= 20 && x <= 960 && y >= rowY - 20 && y <= rowY + 15) { // Adjusted right boundary for new driver list width
                this.selectedDriver = driver;
            }
        });

        // Check betting slip controls
        const slipX = canvas.width - 300;
        const slipY = 300;

        // Decrease bet
        if (x >= slipX + 20 && x <= slipX + 60 && y >= slipY + 150 && y <= slipY + 180) {
            this.betAmount = Math.max(10, this.betAmount - 10);
        }

        // Increase bet
        if (x >= slipX + 240 && x <= slipX + 280 && y >= slipY + 150 && y <= slipY + 180) {
            this.betAmount = Math.min(10000, this.betAmount + 10);
        }

        // Place bet button
        if (this.selectedDriver && x >= slipX + 20 && x <= slipX + 260 &&
            y >= slipY + 220 && y <= slipY + 260 && gameState?.player?.bankroll >= this.betAmount) {
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
        // Track hovered driver in list
        const listY = this.driverListY;
        const drivers = this.generateDummyDrivers();
        const rowHeight = 35;
        const startY = listY + 40;

        this.hoveredDriver = null;
        drivers.forEach((driver, index) => {
            const rowY = startY + index * rowHeight - this.scrollOffset;
            if (x >= 20 && x <= 960 && y >= rowY - 20 && y <= rowY + 15) { // Adjusted right boundary for new driver list width
                this.hoveredDriver = driver;
            }
        });
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

    calculatePayout(bet, odds) {
        if (!odds) return 0;
        // Handle both string format ("2.5x") and numeric format (2.5)
        const oddsStr = typeof odds === 'string' ? odds : String(odds);
        const multiplier = parseFloat(oddsStr.replace('x', ''));
        return isNaN(multiplier) ? 0 : Math.floor(bet * multiplier);
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