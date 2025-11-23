/**
 * REDLINE ROULETTE - Screen System
 * Retro racing betting game with a fighting game aesthetic
 */

// ===========================
// MAIN MENU SCREEN
// ===========================
class MainMenuScreen {
    constructor() {
        this.flashTimer = 0;
        this.buttons = [
            { text: 'NEW GAME', x: 400, y: 250, width: 300, height: 60, action: 'newGame' },
            { text: 'CONTINUE', x: 400, y: 330, width: 300, height: 60, action: 'continue' },
            { text: 'LOAD GAME', x: 400, y: 410, width: 300, height: 60, action: 'loadGame' },
            { text: 'SETTINGS', x: 400, y: 490, width: 300, height: 60, action: 'settings' },
            { text: 'EXIT', x: 400, y: 570, width: 300, height: 60, action: 'exit' }
        ];
        this.selectedButton = null;
    }

    update(deltaTime, gameState) {
        this.flashTimer += deltaTime;
    }

    render(ctx, gameState) {
        const canvas = ctx.canvas;

        // Background - dark gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#1a0a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid pattern background
        ctx.strokeStyle = 'rgba(255, 0, 100, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 40) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }

        // Title - "REDLINE ROULETTE" with flashing effect
        const flash = Math.sin(this.flashTimer * 0.003) > 0.7;

        // Title shadow/glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = flash ? '#ff0066' : '#ff00ff';

        ctx.font = 'bold 72px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = flash ? '#ffffff' : '#ffff00';
        ctx.fillText('REDLINE', canvas.width / 2, 120);

        ctx.fillStyle = flash ? '#ff0066' : '#00ffff';
        ctx.fillText('ROULETTE', canvas.width / 2, 190);

        ctx.shadowBlur = 0;

        // Subtitle
        ctx.font = '20px "Courier New", monospace';
        ctx.fillStyle = '#888888';
        ctx.fillText('BET ON THE EDGE', canvas.width / 2, 220);

        // Render buttons
        this.buttons.forEach(button => {
            const isHovered = this.selectedButton === button;

            // Button background
            ctx.fillStyle = isHovered ? '#ff0066' : '#330033';
            ctx.fillRect(button.x - button.width / 2, button.y, button.width, button.height);

            // Button border
            ctx.strokeStyle = isHovered ? '#ffffff' : '#ff0066';
            ctx.lineWidth = 3;
            ctx.strokeRect(button.x - button.width / 2, button.y, button.width, button.height);

            // Button text
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.fillStyle = isHovered ? '#ffffff' : '#00ffff';
            ctx.textAlign = 'center';
            ctx.fillText(button.text, button.x, button.y + 38);
        });

        // Version/Credits
        ctx.font = '14px "Courier New", monospace';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'center';
        ctx.fillText('v1.0 - A Retro Racing Experience', canvas.width / 2, canvas.height - 20);
    }

    handleClick(x, y, gameState) {
        for (let button of this.buttons) {
            const left = button.x - button.width / 2;
            const right = left + button.width;
            const top = button.y;
            const bottom = top + button.height;

            if (x >= left && x <= right && y >= top && y <= bottom) {
                return button.action;
            }
        }
        return null;
    }

    handleMouseMove(x, y) {
        this.selectedButton = null;
        for (let button of this.buttons) {
            const left = button.x - button.width / 2;
            const right = left + button.width;
            const top = button.y;
            const bottom = top + button.height;

            if (x >= left && x <= right && y >= top && y <= bottom) {
                this.selectedButton = button;
                break;
            }
        }
    }
}

// ===========================
// GARAGE SCREEN
// ===========================
class GarageScreen {
    constructor() {
        this.scrollOffset = 0;
        this.selectedContract = null;
        this.hoveredUpgrade = null;
        this.hoveredContract = null;

        this.upgrades = [
            {
                id: 'tv_setup',
                name: 'TV SETUP',
                price: 5000,
                description: 'Watch races with better camera angles',
                x: 50, y: 150, width: 350, height: 120
            },
            {
                id: 'rolodex',
                name: 'ROLODEX',
                price: 8000,
                description: 'Access to driver stats and histories',
                x: 50, y: 290, width: 350, height: 120
            },
            {
                id: 'minibar',
                name: 'MINIBAR',
                price: 3000,
                description: 'Unlock special betting options',
                x: 50, y: 430, width: 350, height: 120
            }
        ];

        this.contractSlots = [
            { x: 450, y: 150, width: 330, height: 130 },
            { x: 450, y: 300, width: 330, height: 130 },
            { x: 450, y: 450, width: 330, height: 130 }
        ];
    }

    update(deltaTime, gameState) {
        // Animation updates can go here
    }

    render(ctx, gameState) {
        const canvas = ctx.canvas;

        // Background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header section
        ctx.fillStyle = '#1a0a1a';
        ctx.fillRect(0, 0, canvas.width, 100);

        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.fillStyle = '#ff0066';
        ctx.textAlign = 'left';
        ctx.fillText('GARAGE', 20, 60);

        // Bankroll display
        const bankroll = gameState?.player?.bankroll || 10000;
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'right';
        ctx.fillText(`$${bankroll.toLocaleString()}`, canvas.width - 20, 40);

        // Season progress
        const season = gameState?.player?.season || 1;
        const week = gameState?.player?.week || 1;
        ctx.font = '18px "Courier New", monospace';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(`SEASON ${season} - WEEK ${week}/16`, canvas.width - 20, 70);

        // Upgrade shop section
        ctx.font = 'bold 28px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'left';
        ctx.fillText('UPGRADE SHOP', 50, 130);

        this.upgrades.forEach(upgrade => {
            const owned = gameState?.player?.upgrades?.includes(upgrade.id) || false;
            const isHovered = this.hoveredUpgrade === upgrade;

            // Upgrade box
            ctx.fillStyle = owned ? '#001a00' : (isHovered ? '#330033' : '#1a1a1a');
            ctx.fillRect(upgrade.x, upgrade.y, upgrade.width, upgrade.height);

            ctx.strokeStyle = owned ? '#00ff00' : (isHovered ? '#ff0066' : '#444444');
            ctx.lineWidth = 2;
            ctx.strokeRect(upgrade.x, upgrade.y, upgrade.width, upgrade.height);

            // Upgrade name
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.fillStyle = owned ? '#00ff00' : '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(upgrade.name, upgrade.x + 10, upgrade.y + 30);

            // Description
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = '#aaaaaa';
            this.wrapText(ctx, upgrade.description, upgrade.x + 10, upgrade.y + 55, upgrade.width - 20, 18);

            // Price or owned status
            ctx.font = 'bold 18px "Courier New", monospace';
            if (owned) {
                ctx.fillStyle = '#00ff00';
                ctx.fillText('OWNED', upgrade.x + 10, upgrade.y + 105);
            } else {
                ctx.fillStyle = '#ffff00';
                ctx.fillText(`$${upgrade.price.toLocaleString()}`, upgrade.x + 10, upgrade.y + 105);
            }
        });

        // Contracts section
        ctx.font = 'bold 28px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'left';
        ctx.fillText('RACE CONTRACTS', 450, 130);

        const contracts = gameState?.season?.weeklyContracts || this.generateDummyContracts();

        contracts.forEach((contract, index) => {
            if (index >= this.contractSlots.length) return;

            const slot = this.contractSlots[index];
            const isSelected = this.selectedContract === index;
            const isHovered = this.hoveredContract === index;

            // Contract box with hover effect
            ctx.fillStyle = isSelected ? '#1a1a00' : (isHovered ? '#2a2a1a' : '#1a1a1a');
            ctx.fillRect(slot.x, slot.y, slot.width, slot.height);

            // Border with glow effect on hover/select
            if (isSelected) {
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 3;
                ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);
            } else if (isHovered) {
                ctx.strokeStyle = '#888888';
                ctx.lineWidth = 3;
                ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);
            } else {
                ctx.strokeStyle = '#444444';
                ctx.lineWidth = 2;
                ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);
            }

            // Contract name
            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.fillStyle = '#00ffff';
            ctx.textAlign = 'left';
            const contractName = contract.type || contract.track || 'Unknown';
            ctx.fillText(contractName, slot.x + 10, slot.y + 25);

            // Details
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = '#aaaaaa';
            const fieldSize = contract.fieldSize || 20;
            const description = contract.description || `${contract.laps || 10} Laps - ${contract.difficulty || 'Medium'}`;
            ctx.fillText(`${fieldSize} Drivers - ${description}`, slot.x + 10, slot.y + 50);

            // Entry fee
            if (contract.entryFee) {
                ctx.font = '12px "Courier New", monospace';
                ctx.fillStyle = '#ff6666';
                ctx.fillText(`Entry: $${contract.entryFee.toLocaleString()}`, slot.x + 10, slot.y + 70);
            }

            // Prize pool / Payout
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.fillStyle = '#00ff00';
            const payout = contract.prizePool || contract.basePayout || 1000;
            const payoutLabel = contract.prizePool ? 'Prize Pool' : 'Base Payout';
            ctx.fillText(`${payoutLabel}: $${payout.toLocaleString()}`, slot.x + 10, slot.y + 90);

            // Gimmick for special contracts
            if (contract.gimmick) {
                ctx.font = 'italic 12px "Courier New", monospace';
                ctx.fillStyle = '#ff00ff';
                this.wrapText(ctx, contract.gimmick, slot.x + 10, slot.y + 110, slot.width - 20, 14);
            }

            // Selection indicator in corner
            if (isSelected) {
                ctx.fillStyle = '#ffff00';
                ctx.font = 'bold 14px "Courier New", monospace';
                ctx.textAlign = 'right';
                ctx.fillText('✓ SELECTED', slot.x + slot.width - 10, slot.y + 20);
            }
        });

        // Continue button
        const continueBtn = { x: canvas.width - 200, y: canvas.height - 80, width: 180, height: 50 };
        const canContinue = this.selectedContract !== null;

        ctx.fillStyle = canContinue ? '#ff0066' : '#333333';
        ctx.fillRect(continueBtn.x, continueBtn.y, continueBtn.width, continueBtn.height);
        ctx.strokeStyle = canContinue ? '#ffffff' : '#666666';
        ctx.lineWidth = 3;
        ctx.strokeRect(continueBtn.x, continueBtn.y, continueBtn.width, continueBtn.height);

        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = canContinue ? '#ffffff' : '#666666';
        ctx.textAlign = 'center';
        ctx.fillText('CONTINUE', continueBtn.x + continueBtn.width / 2, continueBtn.y + 32);
    }

    handleClick(x, y, gameState) {
        const canvas = { width: 1280, height: 720 }; // Canvas dimensions

        // Check upgrade purchases
        for (let upgrade of this.upgrades) {
            if (x >= upgrade.x && x <= upgrade.x + upgrade.width &&
                y >= upgrade.y && y <= upgrade.y + upgrade.height) {
                const owned = gameState?.player?.upgrades?.includes(upgrade.id) || false;
                if (!owned && gameState?.player?.bankroll >= upgrade.price) {
                    return { action: 'buyUpgrade', upgradeId: upgrade.id, price: upgrade.price };
                }
            }
        }

        // Check contract selection
        this.contractSlots.forEach((slot, index) => {
            if (x >= slot.x && x <= slot.x + slot.width &&
                y >= slot.y && y <= slot.y + slot.height) {
                this.selectedContract = index;
            }
        });

        // Check continue button
        const continueBtn = { x: canvas.width - 200, y: canvas.height - 80, width: 180, height: 50 };
        if (x >= continueBtn.x && x <= continueBtn.x + continueBtn.width &&
            y >= continueBtn.y && y <= continueBtn.y + continueBtn.height &&
            this.selectedContract !== null) {
            return { action: 'startRace', contractIndex: this.selectedContract };
        }

        return null;
    }

    handleMouseMove(x, y) {
        // Track hovered upgrade
        this.hoveredUpgrade = null;
        for (let upgrade of this.upgrades) {
            if (x >= upgrade.x && x <= upgrade.x + upgrade.width &&
                y >= upgrade.y && y <= upgrade.y + upgrade.height) {
                this.hoveredUpgrade = upgrade;
                break;
            }
        }

        // Track hovered contract
        this.hoveredContract = null;
        this.contractSlots.forEach((slot, index) => {
            if (x >= slot.x && x <= slot.x + slot.width &&
                y >= slot.y && y <= slot.y + slot.height) {
                this.hoveredContract = index;
            }
        });
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }

    generateDummyContracts() {
        const tracks = ['MONACO NIGHTS', 'TOKYO DRIFT', 'DESERT STORM'];
        const difficulties = ['EASY', 'MEDIUM', 'HARD'];

        return tracks.map((track, i) => ({
            track,
            laps: 10 + i * 5,
            difficulty: difficulties[i],
            basePayout: 1000 + i * 500
        }));
    }
}

// ===========================
// BETTING SCREEN
// ===========================
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
        this.renderDriverList(ctx, gameState, 20, this.driverListY, canvas.width - 40, 250);

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

        const trackName = gameState?.currentTrack?.name || 'MONACO NIGHTS';
        ctx.font = '14px "Courier New", monospace';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(trackName, x + 10, y + 45);

        // Simple track visualization (example circuit)
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
            if (x >= 20 && x <= canvas.width - 40 && y >= rowY - 20 && y <= rowY + 15) {
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
            if (x >= 20 && x <= 760 && y >= rowY - 20 && y <= rowY + 15) {
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

// ===========================
// RACE SCREEN
// ===========================
class RaceScreen {
    constructor() {
        this.raceTime = 0;
        this.eventLog = [];
        this.maxLogEntries = 5;
        this.tickerScrollX = 0;

        // Burner Phone UI state
        this.phoneExpanded = false;
        this.selectedContact = null;
        this.selectedDriver = null;
        this.hoveredContact = null;
        this.hoveredDriver = null;
        this.contactNotification = null;
        this.notificationTimer = 0;
    }

    update(deltaTime, gameState) {
        this.raceTime += deltaTime;
        this.tickerScrollX -= deltaTime * 0.05;

        // Update notification timer
        if (this.contactNotification) {
            this.notificationTimer += deltaTime;
            if (this.notificationTimer > 3000) { // 3 seconds
                this.contactNotification = null;
                this.notificationTimer = 0;
            }
        }

        // Get race events from simulator if available
        if (gameState?.race?.simulation) {
            const raceState = gameState.race.simulation.getRaceState();
            if (raceState.events && raceState.events.length > 0) {
                // Add new events to log
                raceState.events.forEach(event => {
                    if (!this.eventLog.includes(event.message)) {
                        this.eventLog.unshift(event.message);
                    }
                });

                // Keep log size manageable
                if (this.eventLog.length > 50) {
                    this.eventLog = this.eventLog.slice(0, 50);
                }
            }
        }
    }

    render(ctx, gameState) {
        const canvas = ctx.canvas;

        // Background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Race info header (top)
        this.renderRaceInfo(ctx, gameState, 0, 0, canvas.width, 40);

        // Main track view (large, takes most of the space)
        this.renderTrackView(ctx, gameState, 10, 50, 770, 520);

        // Side panel: Leaderboard and info (top-right)
        this.renderLeaderboard(ctx, gameState, 790, 50, 230, 300);

        // Side panel: Burner Phone (middle-right)
        this.renderBurnerPhone(ctx, gameState, 790, 360, 230, 130);

        // Event ticker (bottom)
        this.renderEventTicker(ctx, gameState, 10, 580, 1010, 40);

        // Contact notification overlay
        if (this.contactNotification) {
            this.renderContactNotification(ctx, canvas.width / 2, 100);
        }
    }

    renderContactNotification(ctx, x, y) {
        const notification = this.contactNotification;
        const width = 400;
        const height = 60;
        const notifX = x - width / 2;

        // Fade effect based on timer
        const fadeTime = 500; // 500ms fade in/out
        let alpha = 1.0;

        if (this.notificationTimer < fadeTime) {
            alpha = this.notificationTimer / fadeTime;
        } else if (this.notificationTimer > 2500) {
            alpha = (3000 - this.notificationTimer) / fadeTime;
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(notifX, y, width, height);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(notifX, y, width, height);

        // Title
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'center';
        ctx.fillText(`CONTACT USED: ${notification.type}`, x, y + 22);

        // Message
        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(notification.message.substring(0, 60), x, y + 42);

        ctx.restore();
    }

    renderRaceInfo(ctx, gameState, x, y, width, height) {
        ctx.fillStyle = '#1a0a1a';
        ctx.fillRect(x, y, width, height);

        const trackName = gameState?.currentTrack?.name || 'MONACO NIGHTS';
        const lap = gameState?.race?.currentLap || 1;
        const totalLaps = gameState?.race?.totalLaps || 20;

        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = '#ff0066';
        ctx.textAlign = 'left';
        ctx.fillText(trackName, 20, 27);

        ctx.fillStyle = '#00ffff';
        ctx.textAlign = 'right';
        ctx.fillText(`LAP ${lap}/${totalLaps}`, width - 20, 27);
    }

    renderTrackView(ctx, gameState, x, y, width, height) {
        // Track container with clean border
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Get track and car data
        const track = gameState?.race?.track;
        const standings = gameState?.race?.raceStandings || [];
        const simulation = gameState?.race?.simulation;

        if (!track || !track.waypoints || track.waypoints.length === 0) {
            // Fallback if no real track data
            this._renderFallbackTrack(ctx, x, y, width, height);
            return;
        }

        // Calculate track bounds and scale
        const { minX, minY, maxX, maxY } = this._calculateTrackBounds(track.waypoints);
        const trackWidth = maxX - minX;
        const trackHeight = maxY - minY;
        
        // Calculate scaling to fit track nicely in view with padding
        const padding = 40;
        const availWidth = width - padding * 2;
        const availHeight = height - padding * 2;
        
        const scaleX = availWidth / (trackWidth || 1);
        const scaleY = availHeight / (trackHeight || 1);
        const scale = Math.min(scaleX, scaleY);
        
        // Center the scaled track
        const centerX = x + width / 2 - ((minX + maxX) / 2 * scale);
        const centerY = y + height / 2 - ((minY + maxY) / 2 * scale);

        // Draw track surface and markings
        this._drawTrackSurface(ctx, track.waypoints, scale, centerX, centerY);

        // Draw pit area if applicable
        this._drawPitArea(ctx, track.waypoints, scale, centerX, centerY);

        // Draw grid/starting positions
        this._drawGridPositions(ctx, track.waypoints, standings, scale, centerX, centerY);

        // Draw cars at their current positions
        this._drawCars(ctx, standings, simulation, track.waypoints, scale, centerX, centerY);

        // Draw start/finish line
        this._drawStartFinishLine(ctx, track.waypoints, scale, centerX, centerY);

        // Draw lap counter and timing
        this._drawTrackInfo(ctx, gameState, simulation, x, y, width);
    }

    /**
     * Calculate bounds of waypoint array
     * @private
     */
    _calculateTrackBounds(waypoints) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        waypoints.forEach(wp => {
            minX = Math.min(minX, wp.x);
            minY = Math.min(minY, wp.y);
            maxX = Math.max(maxX, wp.x);
            maxY = Math.max(maxY, wp.y);
        });
        return { minX, minY, maxX, maxY };
    }

    /**
     * Draw the track surface and markings
     * @private
     */
    _drawTrackSurface(ctx, waypoints, scale, centerX, centerY) {
        if (waypoints.length < 2) return;

        // Draw track asphalt/surface
        ctx.fillStyle = '#1a1a1a';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 25 * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(centerX + waypoints[0].x * scale, centerY + waypoints[0].y * scale);
        
        // Use quadratic curves for smooth track
        for (let i = 1; i < waypoints.length; i++) {
            const curr = waypoints[i];
            const next = waypoints[(i + 1) % waypoints.length];
            
            // Draw line to next point (simplified - could use bezier for smoother curves)
            ctx.lineTo(centerX + curr.x * scale, centerY + curr.y * scale);
        }
        ctx.closePath();
        ctx.stroke();

        // Draw track boundaries (red outer wall)
        ctx.strokeStyle = '#cc0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX + waypoints[0].x * scale, centerY + waypoints[0].y * scale);
        for (let i = 1; i < waypoints.length; i++) {
            const curr = waypoints[i];
            ctx.lineTo(centerX + curr.x * scale, centerY + curr.y * scale);
        }
        ctx.closePath();
        ctx.stroke();

        // Draw center line
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(centerX + waypoints[0].x * scale, centerY + waypoints[0].y * scale);
        for (let i = 1; i < waypoints.length; i++) {
            const curr = waypoints[i];
            ctx.lineTo(centerX + curr.x * scale, centerY + curr.y * scale);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * Draw pit area
     * @private
     */
    _drawPitArea(ctx, waypoints, scale, centerX, centerY) {
        if (waypoints.length < 1) return;

        // Draw simple pit area indicator near start
        const startX = centerX + waypoints[0].x * scale;
        const startY = centerY + waypoints[0].y * scale;
        
        ctx.fillStyle = 'rgba(255, 200, 0, 0.1)';
        ctx.fillRect(startX - 40, startY - 30, 80, 60);
        
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX - 40, startY - 30, 80, 60);
    }

    /**
     * Draw grid/starting positions
     * @private
     */
    _drawGridPositions(ctx, waypoints, standings, scale, centerX, centerY) {
        // This is shown before race starts
        // Could indicate starting grid positions
    }

    /**
     * Draw cars at current positions on track
     * @private
     */
    _drawCars(ctx, standings, simulation, waypoints, scale, centerX, centerY) {
        if (!standings || standings.length === 0) return;

        standings.forEach((entry, position) => {
            // Get car state
            const car = entry;
            
            // Get driver info
            const driverName = car.driver?.name || car.name || `P${position + 1}`;
            const teamColor = car.driver?.teamColor || car.teamColor || '#00ffff';

            // Calculate position on track
            // Use waypoint progress to find current location
            let trackX, trackY;
            
            if (car.currentWaypoint !== undefined && waypoints.length > 0) {
                const idx = Math.min(car.currentWaypoint, waypoints.length - 1);
                const nextIdx = (idx + 1) % waypoints.length;
                const progress = car.waypointProgress !== undefined ? car.waypointProgress : 0;
                
                const curr = waypoints[idx];
                const next = waypoints[nextIdx];
                
                trackX = curr.x + (next.x - curr.x) * progress;
                trackY = curr.y + (next.y - curr.y) * progress;
            } else {
                // Fallback: place cars around the track based on position
                const angle = (position / Math.max(standings.length, 1)) * Math.PI * 2;
                trackX = 400 + Math.cos(angle) * 200;
                trackY = 300 + Math.sin(angle) * 150;
            }

            const screenX = centerX + trackX * scale;
            const screenY = centerY + trackY * scale;

            // Draw car dot
            ctx.fillStyle = teamColor;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
            ctx.fill();

            // Draw position indicator
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 8px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(position + 1), screenX, screenY);

            // Draw driver abbreviation above car
            ctx.fillStyle = teamColor;
            ctx.font = '7px "Courier New", monospace';
            ctx.fillText(driverName.substring(0, 3), screenX, screenY - 8);
        });
    }

    /**
     * Draw start/finish line
     * @private
     */
    _drawStartFinishLine(ctx, waypoints, scale, centerX, centerY) {
        if (waypoints.length < 2) return;

        const p1 = waypoints[0];
        const p2 = waypoints[1];

        // Calculate perpendicular direction for line
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const px = -dy / len * 15;
        const py = dx / len * 15;

        // Draw checkered pattern
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
            const offset = (i - 1.5) * 6;
            ctx.beginPath();
            ctx.moveTo(centerX + (p1.x + px * offset) * scale, centerY + (p1.y + py * offset) * scale);
            ctx.lineTo(centerX + (p1.x - px * offset) * scale, centerY + (p1.y - py * offset) * scale);
            ctx.stroke();
        }

        // Label
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'center';
        ctx.fillText('S/F', centerX + p1.x * scale, centerY + p1.y * scale - 20);
    }

    /**
     * Draw track info overlay
     * @private
     */
    _drawTrackInfo(ctx, gameState, simulation, x, y, width) {
        const raceState = simulation?.getRaceState?.() || { currentLap: 1, totalLaps: 20, state: 'RACING' };
        
        // Lap info
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'left';
        ctx.fillText(`LAP ${raceState.currentLap} / ${raceState.totalLaps}`, x + 20, y + 28);
    }

    /**
     * Draw fallback track if no waypoint data available
     * @private
     */
    _renderFallbackTrack(ctx, x, y, width, height) {
        // Simple oval fallback
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(x, y, width, height);

        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radiusX = width * 0.3;
        const radiusY = height * 0.3;

        // Draw oval
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Center point
        ctx.fillStyle = '#666666';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderLeaderboard(ctx, gameState, x, y, width, height) {
        // Leaderboard container
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = this.selectedContact ? '#ff0066' : '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Title
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillStyle = this.selectedContact ? '#ff0066' : '#ffff00';
        ctx.textAlign = 'left';
        ctx.fillText(this.selectedContact ? 'TARGET' : 'STANDINGS', x + 8, y + 16);

        // Show instruction if contact selected
        if (this.selectedContact) {
            ctx.font = '8px "Courier New", monospace';
            ctx.fillStyle = '#00ff00';
            ctx.fillText(`[${this.selectedContact}]`, x + 8, y + 26);
        }

        // Driver standings
        const drivers = gameState?.race?.raceStandings || this.generateDummyStandings();
        const rowHeight = 28;
        const startY = y + (this.selectedContact ? 32 : 22);
        const maxRows = Math.floor((height - startY + y) / rowHeight);

        drivers.slice(0, maxRows).forEach((driver, index) => {
            const rowY = startY + index * rowHeight;
            
            // Handle both car state objects and dummy standings
            const driverName = driver.driver?.name || driver.name || 'UNKNOWN';
            const gap = driver.gap !== undefined ? driver.gap : (index === 0 ? 'LEADER' : `+${(index * 1.5).toFixed(1)}s`);
            
            const isHovered = this.hoveredDriver === driverName;
            const isTargetable = this.selectedContact !== null;

            // Highlight row if hovering with contact selected
            if (isHovered && isTargetable) {
                ctx.fillStyle = 'rgba(255, 0, 102, 0.2)';
                ctx.fillRect(x + 2, rowY - 14, width - 4, rowHeight - 2);
            }

            // Position number
            ctx.font = 'bold 11px "Courier New", monospace';
            ctx.fillStyle = index === 0 ? '#ffff00' : '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(`${index + 1}.`, x + 5, rowY);

            // Driver name (shortened)
            ctx.font = '10px "Courier New", monospace';
            ctx.fillStyle = isHovered && isTargetable ? '#ff0066' : '#aaaaaa';
            ctx.fillText(driverName.substring(0, 6), x + 25, rowY);

            // Gap (right aligned)
            ctx.font = '9px "Courier New", monospace';
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'right';
            ctx.fillText(typeof gap === 'string' ? gap : gap.toFixed(2), x + width - 5, rowY);
        });
    }

    renderEventTicker(ctx, gameState, x, y, width, height) {
        // Ticker container
        ctx.fillStyle = '#1a0a1a';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Title
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'left';
        ctx.fillText('LIVE EVENTS', x + 10, y + 15);

        // Event log
        const events = this.eventLog.slice(0, this.maxLogEntries);
        ctx.font = '11px "Courier New", monospace';

        events.forEach((event, index) => {
            const eventY = y + 35 + index * 14;
            ctx.fillStyle = index === 0 ? '#00ff00' : '#888888';
            ctx.fillText(`> ${event}`, x + 10, eventY);
        });
    }

    renderBurnerPhone(ctx, gameState, x, y, width, height) {
        // Check if Rolodex upgrade is owned
        const hasRolodex = gameState?.player?.upgrades?.includes('rolodex') || false;

        // Phone container
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = hasRolodex ? '#ff0066' : '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Title
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.fillStyle = hasRolodex ? '#ff0066' : '#666666';
        ctx.textAlign = 'left';
        ctx.fillText('BURNER', x + 8, y + 14);

        if (!hasRolodex) {
            // Locked state
            ctx.font = '9px "Courier New", monospace';
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'center';
            ctx.fillText('LOCKED', x + width / 2, y + height / 2);
            return;
        }

        // Get burner phone status from race simulation
        const phoneStatus = gameState?.race?.simulation?.burnerPhone?.getStatus();
        if (!phoneStatus) {
            ctx.font = '9px "Courier New", monospace';
            ctx.fillStyle = '#aaaaaa';
            ctx.textAlign = 'left';
            ctx.fillText('No signal', x + 8, y + 35);
            return;
        }

        // Battery display (compact)
        const batteryY = y + 25;
        ctx.font = '8px "Courier New", monospace';
        ctx.fillStyle = '#888888';
        ctx.textAlign = 'left';
        ctx.fillText('BAT:', x + 8, batteryY);

        // Battery bars (small)
        const barWidth = 8;
        const barHeight = 6;
        for (let i = 0; i < 3; i++) {
            const barX = x + 32 + i * (barWidth + 1);
            const filled = i < phoneStatus.battery;
            ctx.fillStyle = filled ? '#00ff00' : '#333333';
            ctx.fillRect(barX, batteryY - 5, barWidth, barHeight);
        }

        // Heat display
        const heatY = batteryY + 12;
        ctx.font = '8px "Courier New", monospace';
        ctx.fillStyle = '#888888';
        ctx.textAlign = 'left';
        ctx.fillText('HEAT:', x + 8, heatY);

        // Heat bar
        const heatBarWidth = width - 35;
        const heatBarX = x + 32;
        const heatBarHeight = 4;
        const heatPercent = phoneStatus.heat / phoneStatus.maxHeat;

        ctx.fillStyle = '#333333';
        ctx.fillRect(heatBarX, heatY - 3, heatBarWidth, heatBarHeight);

        const heatFillWidth = heatBarWidth * heatPercent;
        if (heatFillWidth > 0) {
            const heatColor = this.getHeatColor(heatPercent);
            ctx.fillStyle = heatColor;
            ctx.fillRect(heatBarX, heatY - 3, heatFillWidth, heatBarHeight);
        }

        // Active contacts list (compact)
        const contactsY = heatY + 10;
        ctx.font = '8px "Courier New", monospace';
        const contacts = ['Spotter', 'Marshal', 'Heckler', 'Engineer'];
        
        contacts.forEach((contact, idx) => {
            const canUse = phoneStatus && idx < 4;
            const contactY = contactsY + idx * 10;
            
            ctx.fillStyle = this.selectedContact === contact ? '#ff0066' : (canUse ? '#00ff00' : '#444444');
            ctx.textAlign = 'left';
            ctx.fillText(`${idx + 1}.${contact.substring(0, 4)}`, x + 8, contactY);
        });
    }

    getHeatColor(heatPercent) {
        if (heatPercent < 0.5) {
            // Green to yellow
            const r = Math.floor(255 * (heatPercent * 2));
            return `rgb(${r}, 255, 0)`;
        } else {
            // Yellow to red
            const g = Math.floor(255 * (1 - (heatPercent - 0.5) * 2));
            return `rgb(255, ${g}, 0)`;
        }
    }

    renderContactTooltip(ctx, contact, x, y) {
        const tooltipWidth = 140;
        const tooltipHeight = 40;

        // Tooltip background
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, tooltipWidth, tooltipHeight);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, tooltipWidth, tooltipHeight);

        // Tooltip text
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(contact.type, x + 5, y + 12);

        ctx.font = '9px "Courier New", monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(contact.desc, x + 5, y + 25);

        ctx.fillStyle = '#ffff00';
        ctx.fillText(`Cost: ${contact.cost} Battery`, x + 5, y + 35);
    }

    handleClick(x, y, gameState) {
        // Check if Rolodex is unlocked
        const hasRolodex = gameState?.player?.upgrades?.includes('rolodex') || false;
        if (!hasRolodex) return null;

        // Burner phone bounds (right side, middle)
        const phoneX = 790;
        const phoneY = 360;
        const phoneWidth = 230;
        const phoneHeight = 130;

        // Check if click is in burner phone area
        if (x >= phoneX && x <= phoneX + phoneWidth && y >= phoneY && y <= phoneY + phoneHeight) {
            const contactsY = phoneY + 35;
            const contacts = ['Spotter', 'Marshal', 'Heckler', 'Engineer'];

            // Check if clicking on a contact button
            contacts.forEach((contact, index) => {
                const contactY = contactsY + index * 20;
                if (y >= contactY && y <= contactY + 18) {
                    if (gameState?.race?.simulation?.burnerPhone?.canUseContact(contact) || false) {
                        // Select this contact
                        this.selectedContact = contact;
                    }
                }
            });
        }

        // Check if clicking on leaderboard to select driver (when contact is selected)
        if (this.selectedContact) {
            const leaderboardX = 790;
            const leaderboardY = 50;
            const leaderboardWidth = 230;
            const leaderboardHeight = 300;

            if (x >= leaderboardX && x <= leaderboardX + leaderboardWidth &&
                y >= leaderboardY && y <= leaderboardY + leaderboardHeight) {

                const drivers = gameState?.race?.raceStandings || this.generateDummyStandings();
                const rowHeight = 35;
                const startY = leaderboardY + 45;

                drivers.forEach((driver, index) => {
                    const rowY = startY + index * rowHeight;
                    if (y >= rowY - 20 && y <= rowY + 15) {
                        // Use contact on this driver
                        const driverName = driver.driver?.name || driver.name || 'UNKNOWN';
                        return this.useContactOnDriver(driverName, gameState);
                    }
                });
            }
        }

        return null;
    }

    handleMouseMove(x, y, gameState) {
        // Reset hover states
        this.hoveredContact = null;
        this.hoveredDriver = null;

        // Check if Rolodex is unlocked
        const hasRolodex = gameState?.player?.upgrades?.includes('rolodex') || false;
        if (!hasRolodex) return;

        // Burner phone bounds (right side, middle)
        const phoneX = 790;
        const phoneY = 360;
        const phoneWidth = 230;
        const phoneHeight = 130;

        // Check hover on contacts
        if (x >= phoneX && x <= phoneX + phoneWidth && y >= phoneY && y <= phoneY + phoneHeight) {
            const contactsY = phoneY + 35;
            const contacts = ['Spotter', 'Marshal', 'Heckler', 'Engineer'];

            contacts.forEach((contact, index) => {
                const contactY = contactsY + index * 20;
                if (y >= contactY && y <= contactY + 18) {
                    this.hoveredContact = contact;
                }
            });
        }

        // Check hover on drivers (when contact selected)
        if (this.selectedContact) {
            const leaderboardX = 550;
            const leaderboardY = 50;
            const leaderboardWidth = 240;
            const leaderboardHeight = 350;

            if (x >= leaderboardX && x <= leaderboardX + leaderboardWidth &&
                y >= leaderboardY && y <= leaderboardY + leaderboardHeight) {

                const drivers = gameState?.race?.raceStandings || this.generateDummyStandings();
                const rowHeight = 35;
                const startY = leaderboardY + 45;

                drivers.forEach((driver, index) => {
                    const rowY = startY + index * rowHeight;
                    if (y >= rowY - 20 && y <= rowY + 15) {
                        const driverName = driver.driver?.name || driver.name || 'UNKNOWN';
                        this.hoveredDriver = driverName;
                    }
                });
            }
        }
    }

    useContactOnDriver(driverName, gameState) {
        if (!this.selectedContact || !gameState?.race?.simulation) {
            return null;
        }

        // Use the burner phone contact
        const result = gameState.race.simulation.useBurnerPhone(this.selectedContact, driverName);

        if (result.success) {
            // Show notification
            this.contactNotification = {
                type: this.selectedContact,
                target: driverName,
                message: result.effect
            };
            this.notificationTimer = 0;

            // Clear selection
            this.selectedContact = null;

            return { action: 'contactUsed', result };
        }

        return null;
    }

    generateDummyPositions(count) {
        return Array.from({ length: count }, (_, i) => ({
            angle: (i / count) * Math.PI * 2 + Math.random() * 0.3
        }));
    }

    generateDummyStandings() {
        const names = ['HAMILTON', 'VERSTAPPEN', 'LECLERC', 'SAINZ', 'NORRIS', 'PIASTRI', 'RUSSELL', 'ALONSO'];
        return names.map((name, i) => ({
            name,
            gap: i === 0 ? 'LEADER' : `+${(i * 1.5).toFixed(1)}s`
        }));
    }
}

// ===========================
// RESULTS SCREEN
// ===========================
class ResultsScreen {
    constructor() {
        this.animationTimer = 0;
        this.showPayout = false;
    }

    update(deltaTime, gameState) {
        this.animationTimer += deltaTime;

        // Show payout after 2 seconds
        if (this.animationTimer > 2000 && !this.showPayout) {
            this.showPayout = true;
        }
    }

    render(ctx, gameState) {
        const canvas = ctx.canvas;

        // Background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#1a0a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.fillStyle = '#ff0066';
        ctx.textAlign = 'center';
        ctx.fillText('RACE RESULTS', canvas.width / 2, 60);

        // Podium display
        this.renderPodium(ctx, gameState, 150, 100, 500, 250);

        // Payout breakdown
        if (this.showPayout) {
            this.renderPayoutBreakdown(ctx, gameState, 150, 370, 500, 150);
        }

        // Continue button
        this.renderContinueButton(ctx, canvas.width / 2 - 100, 540, 200, 50);
    }

    renderPodium(ctx, gameState, x, y, width, height) {
        // Handle both real results (with finalStandings) and dummy results (array)
        let standings = this.generateDummyResults();
        if (gameState?.race?.raceResults?.finalStandings) {
            standings = gameState.race.raceResults.finalStandings;
        }

        // Podium positions (2nd, 1st, 3rd)
        const positions = [
            { pos: 2, x: x + 50, height: 120, color: '#888888' },
            { pos: 1, x: x + 200, height: 160, color: '#ffff00' },
            { pos: 3, x: x + 350, height: 100, color: '#cd7f32' }
        ];

        positions.forEach(({ pos, x: posX, height: podiumHeight, color }) => {
            const driver = standings[pos - 1];

            // Podium block
            ctx.fillStyle = color;
            ctx.fillRect(posX, y + (height - podiumHeight), 100, podiumHeight);

            // Position number on block
            ctx.font = 'bold 48px "Courier New", monospace';
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.fillText(String(pos), posX + 50, y + height - podiumHeight / 2 + 15);

            // Driver name above podium
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            const driverName = driver?.name || driver?.driver?.name || 'UNKNOWN';
            ctx.fillText(driverName, posX + 50, y + (height - podiumHeight) - 30);

            // Trophy/medal for winner
            if (pos === 1) {
                ctx.font = '32px "Courier New", monospace';
                ctx.fillText('🏆', posX + 50, y + (height - podiumHeight) - 60);
            }
        });
    }

    renderPayoutBreakdown(ctx, gameState, x, y, width, height) {
        const betResult = gameState?.race?.betResult || { won: false, betAmount: 100, payout: 0 };

        // Container
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = betResult.won ? '#00ff00' : '#ff0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Win/Loss indicator
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.fillStyle = betResult.won ? '#00ff00' : '#ff0000';
        ctx.textAlign = 'center';
        ctx.fillText(betResult.won ? 'YOU WIN!' : 'YOU LOSE', x + width / 2, y + 40);

        // Bet breakdown
        ctx.font = '16px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText('BET AMOUNT:', x + 30, y + 75);
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'right';
        ctx.fillText(`$${betResult.betAmount}`, x + width - 30, y + 75);

        if (betResult.won) {
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText('PAYOUT:', x + 30, y + 105);
            ctx.fillStyle = '#00ff00';
            ctx.textAlign = 'right';
            ctx.fillText(`$${betResult.payout}`, x + width - 30, y + 105);

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText('NET PROFIT:', x + 30, y + 135);
            ctx.fillStyle = '#00ff00';
            ctx.textAlign = 'right';
            ctx.fillText(`+$${betResult.payout - betResult.betAmount}`, x + width - 30, y + 135);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText('NET LOSS:', x + 30, y + 105);
            ctx.fillStyle = '#ff0000';
            ctx.textAlign = 'right';
            ctx.fillText(`-$${betResult.betAmount}`, x + width - 30, y + 105);
        }
    }

    renderContinueButton(ctx, x, y, width, height) {
        // Button
        ctx.fillStyle = '#ff0066';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Text
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('CONTINUE', x + width / 2, y + 32);
    }

    handleClick(x, y, gameState) {
        const canvas = { width: 1280, height: 720 }; // Canvas dimensions
        const btnX = canvas.width / 2 - 100;
        const btnY = 540;
        const btnWidth = 200;
        const btnHeight = 50;

        if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
            return { action: 'continue' };
        }

        return null;
    }

    generateDummyResults() {
        return [
            { name: 'VERSTAPPEN', time: '1:32:45.123' },
            { name: 'HAMILTON', time: '1:32:47.456' },
            { name: 'LECLERC', time: '1:32:49.789' }
        ];
    }

    reset() {
        this.animationTimer = 0;
        this.showPayout = false;
    }
}

// Export classes for use in main game

// ===========================
// SETTINGS SCREEN
// ===========================
class SettingsScreen {
    constructor() {
        this.selectedTab = 'audio';
        this.tabs = ['audio', 'graphics', 'gameplay'];
        this.hoveredButton = null;
    }

    update(deltaTime, gameState) {
        // Animation updates
    }

    render(ctx, gameState) {
        const canvas = ctx.canvas;

        // Background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header
        ctx.fillStyle = '#1a0a1a';
        ctx.fillRect(0, 0, canvas.width, 80);
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.fillStyle = '#ff0066';
        ctx.textAlign = 'center';
        ctx.fillText('SETTINGS', canvas.width / 2, 55);

        // Tabs
        this.renderTabs(ctx, 200, 100);

        // Settings panel
        this.renderSettingsPanel(ctx, 200, 160, 880, 450);

        // Back button
        this.renderBackButton(ctx, canvas.width / 2 - 100, 630, 200, 50);
    }

    renderTabs(ctx, x, y) {
        const tabWidth = 200;
        const tabHeight = 50;

        this.tabs.forEach((tab, index) => {
            const tabX = x + index * (tabWidth + 10);
            const isSelected = this.selectedTab === tab;

            ctx.fillStyle = isSelected ? '#330033' : '#1a1a1a';
            ctx.fillRect(tabX, y, tabWidth, tabHeight);
            ctx.strokeStyle = isSelected ? '#ff0066' : '#444444';
            ctx.lineWidth = 2;
            ctx.strokeRect(tabX, y, tabWidth, tabHeight);

            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.fillStyle = isSelected ? '#ffffff' : '#888888';
            ctx.textAlign = 'center';
            ctx.fillText(tab.toUpperCase(), tabX + tabWidth / 2, y + 32);
        });
    }

    renderSettingsPanel(ctx, x, y, width, height) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.font = '20px "Courier New", monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.selectedTab.toUpperCase()} SETTINGS`, x + width / 2, y + 40);

        ctx.font = '16px "Courier New", monospace';
        ctx.fillText('[Settings panel - implementation pending]', x + width / 2, y + 100);
        ctx.fillText('Audio/Graphics/Gameplay controls will be added here', x + width / 2, y + 130);
    }

    renderBackButton(ctx, x, y, width, height) {
        const isHovered = this.hoveredButton === 'back';

        ctx.fillStyle = isHovered ? '#ff0066' : '#333333';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = isHovered ? '#ffffff' : '#666666';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('BACK', x + width / 2, y + 32);
    }

    handleClick(x, y, gameState) {
        const canvas = { width: 1280, height: 720 };

        // Check tabs
        const tabWidth = 200;
        const tabHeight = 50;
        this.tabs.forEach((tab, index) => {
            const tabX = 200 + index * (tabWidth + 10);
            if (x >= tabX && x <= tabX + tabWidth && y >= 100 && y <= 100 + tabHeight) {
                this.selectedTab = tab;
            }
        });

        // Check back button
        const btnX = canvas.width / 2 - 100;
        const btnY = 630;
        if (x >= btnX && x <= btnX + 200 && y >= btnY && y <= btnY + 50) {
            return { action: 'back' };
        }

        return null;
    }

    handleMouseMove(x, y) {
        const canvas = { width: 1280, height: 720 };
        const btnX = canvas.width / 2 - 100;
        const btnY = 630;

        this.hoveredButton = null;
        if (x >= btnX && x <= btnX + 200 && y >= btnY && y <= btnY + 50) {
            this.hoveredButton = 'back';
        }
    }
}

// ===========================
// LOAD GAME SCREEN
// ===========================
class LoadGameScreen {
    constructor() {
        this.selectedSlot = null;
        this.hoveredSlot = null;
    }

    update(deltaTime, gameState) {
        // Animation updates
    }

    render(ctx, gameState) {
        const canvas = ctx.canvas;

        // Background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header
        ctx.fillStyle = '#1a0a1a';
        ctx.fillRect(0, 0, canvas.width, 80);
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.fillStyle = '#ff0066';
        ctx.textAlign = 'center';
        ctx.fillText('LOAD GAME', canvas.width / 2, 55);

        // Save slots
        this.renderSaveSlots(ctx, 200, 120);

        // Back button
        this.renderBackButton(ctx, canvas.width / 2 - 100, 630, 200, 50);
    }

    renderSaveSlots(ctx, x, y) {
        const slotWidth = 880;
        const slotHeight = 120;
        const slotSpacing = 20;

        for (let i = 0; i < 3; i++) {
            const slotY = y + i * (slotHeight + slotSpacing);
            const isSelected = this.selectedSlot === i;
            const isHovered = this.hoveredSlot === i;

            ctx.fillStyle = isHovered ? '#1a1a00' : '#1a1a1a';
            ctx.fillRect(x, slotY, slotWidth, slotHeight);
            ctx.strokeStyle = isSelected ? '#ffff00' : (isHovered ? '#ff0066' : '#444444');
            ctx.lineWidth = 2;
            ctx.strokeRect(x, slotY, slotWidth, slotHeight);

            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.fillStyle = '#00ffff';
            ctx.textAlign = 'left';
            ctx.fillText(`SLOT ${i + 1}`, x + 20, slotY + 35);

            ctx.font = '16px "Courier New", monospace';
            ctx.fillStyle = '#aaaaaa';
            ctx.fillText('[Empty Slot - Save data will appear here]', x + 20, slotY + 70);
        }
    }

    renderBackButton(ctx, x, y, width, height) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('BACK', x + width / 2, y + 32);
    }

    handleClick(x, y, gameState) {
        const canvas = { width: 1280, height: 720 };

        // Check save slots
        const slotWidth = 880;
        const slotHeight = 120;
        const slotSpacing = 20;
        for (let i = 0; i < 3; i++) {
            const slotY = 120 + i * (slotHeight + slotSpacing);
            if (x >= 200 && x <= 200 + slotWidth && y >= slotY && y <= slotY + slotHeight) {
                this.selectedSlot = i;
                return { action: 'loadSlot', slot: i };
            }
        }

        // Check back button
        const btnX = canvas.width / 2 - 100;
        const btnY = 630;
        if (x >= btnX && x <= btnX + 200 && y >= btnY && y <= btnY + 50) {
            return { action: 'back' };
        }

        return null;
    }

    handleMouseMove(x, y) {
        const slotWidth = 880;
        const slotHeight = 120;
        const slotSpacing = 20;

        this.hoveredSlot = null;
        for (let i = 0; i < 3; i++) {
            const slotY = 120 + i * (slotHeight + slotSpacing);
            if (x >= 200 && x <= 200 + slotWidth && y >= slotY && y <= slotY + slotHeight) {
                this.hoveredSlot = i;
            }
        }
    }
}

// ===========================
// GAME OVER SCREEN
// ===========================
class GameOverScreen {
    constructor() {
        this.animationTimer = 0;
        this.flashTimer = 0;
    }

    update(deltaTime, gameState) {
        this.animationTimer += deltaTime;
        this.flashTimer += deltaTime;
    }

    render(ctx, gameState) {
        const canvas = ctx.canvas;

        // Background - pulsing red
        const pulse = Math.sin(this.animationTimer * 0.002) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(20, 0, 0, ${pulse})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Game Over text
        const flash = Math.sin(this.flashTimer * 0.004) > 0;
        ctx.font = 'bold 96px "Courier New", monospace';
        ctx.fillStyle = flash ? '#ff0000' : '#ff6666';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff0000';
        ctx.fillText('GAME OVER', canvas.width / 2, 200);
        ctx.shadowBlur = 0;

        // Bankruptcy message
        ctx.font = '32px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('BANKRUPT', canvas.width / 2, 280);

        // Stats summary
        this.renderStats(ctx, gameState, canvas.width / 2 - 250, 350, 500, 200);

        // Buttons
        this.renderButton(ctx, canvas.width / 2 - 220, 580, 200, 50, 'NEW GAME', '#ff0066');
        this.renderButton(ctx, canvas.width / 2 + 20, 580, 200, 50, 'MAIN MENU', '#333333');
    }

    renderStats(ctx, gameState, x, y, width, height) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        const stats = gameState?.player || {};

        ctx.font = '20px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`Total Races: ${stats.totalRaces || 0}`, x + 20, y + 40);
        ctx.fillText(`Total Wins: ${stats.totalWins || 0}`, x + 20, y + 70);
        ctx.fillText(`Final Tier: ${stats.tier || 1}`, x + 20, y + 100);
        ctx.fillText(`Best Season: ${stats.season || 1}`, x + 20, y + 130);

        const winRate = stats.totalRaces > 0
            ? ((stats.totalWins / stats.totalRaces) * 100).toFixed(1)
            : '0.0';
        ctx.fillText(`Win Rate: ${winRate}%`, x + 20, y + 160);
    }

    renderButton(ctx, x, y, width, height, text, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + width / 2, y + 32);
    }

    handleClick(x, y, gameState) {
        const canvas = { width: 1280, height: 720 };

        // New Game button
        if (x >= canvas.width / 2 - 220 && x <= canvas.width / 2 - 20 &&
            y >= 580 && y <= 630) {
            return { action: 'newGame' };
        }

        // Main Menu button
        if (x >= canvas.width / 2 + 20 && x <= canvas.width / 2 + 220 &&
            y >= 580 && y <= 630) {
            return { action: 'mainMenu' };
        }

        return null;
    }

    handleMouseMove(x, y) {
        // Button hover effects can be added here
    }

    reset() {
        this.animationTimer = 0;
        this.flashTimer = 0;
    }
}

// ===========================
// TIER ADVANCEMENT SCREEN
// ===========================
class TierAdvancementScreen {
    constructor() {
        this.animationTimer = 0;
        this.showDetails = false;
    }

    update(deltaTime, gameState) {
        this.animationTimer += deltaTime;

        if (this.animationTimer > 2000 && !this.showDetails) {
            this.showDetails = true;
        }
    }

    render(ctx, gameState) {
        const canvas = ctx.canvas;

        // Background - gradient celebration
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#001a00');
        gradient.addColorStop(1, '#000a00');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Tier advancement text
        const pulse = Math.sin(this.animationTimer * 0.003) * 20 + 60;
        ctx.font = 'bold 72px "Courier New", monospace';
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'center';
        ctx.shadowBlur = pulse;
        ctx.shadowColor = '#00ff00';
        ctx.fillText('TIER ADVANCED!', canvas.width / 2, 180);
        ctx.shadowBlur = 0;

        // New tier info
        const newTier = gameState?.player?.tier || 2;
        const tierNames = ['', 'Go-Kart', 'Dirt Track', 'Stock Car', 'GT3', 'Open Wheel'];
        ctx.font = '48px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`TIER ${newTier}: ${tierNames[newTier]}`, canvas.width / 2, 260);

        if (this.showDetails) {
            this.renderDetails(ctx, gameState, canvas.width / 2 - 300, 320, 600, 250);
        }

        // Continue button
        this.renderContinueButton(ctx, canvas.width / 2 - 100, 600, 200, 50);
    }

    renderDetails(ctx, gameState, x, y, width, height) {
        ctx.fillStyle = 'rgba(0, 50, 0, 0.8)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        ctx.font = '24px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('NEW FEATURES UNLOCKED', x + width / 2, y + 40);

        ctx.font = '18px "Courier New", monospace';
        ctx.fillStyle = '#00ffff';
        ctx.textAlign = 'left';
        ctx.fillText('• Faster vehicles', x + 50, y + 90);
        ctx.fillText('• Higher stakes races', x + 50, y + 120);
        ctx.fillText('• New track types', x + 50, y + 150);
        ctx.fillText('• Advanced betting options', x + 50, y + 180);
        ctx.fillText('• Increased payout multipliers', x + 50, y + 210);
    }

    renderContinueButton(ctx, x, y, width, height) {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText('CONTINUE', x + width / 2, y + 32);
    }

    handleClick(x, y, gameState) {
        const canvas = { width: 1280, height: 720 };
        const btnX = canvas.width / 2 - 100;
        const btnY = 600;

        if (x >= btnX && x <= btnX + 200 && y >= btnY && y <= btnY + 50) {
            return { action: 'continue' };
        }

        return null;
    }

    handleMouseMove(x, y) {
        // Hover effects can be added here
    }

    reset() {
        this.animationTimer = 0;
        this.showDetails = false;
    }
}
