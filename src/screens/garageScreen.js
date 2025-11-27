class GarageScreen {
    constructor() {
        this.scrollOffset = 0;
        this.selectedContract = null;
        this.hoveredUpgrade = null;
        this.hoveredContract = null;
        this.debugDragBtnBounds = null; // To store bounds for click detection

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

        // --- DRAG DEBUG BUTTON ---
        const debugDragBtn = { x: canvas.width - 200, y: canvas.height - 140, width: 180, height: 50 };
        this.debugDragBtnBounds = debugDragBtn; // Store for click detection

        ctx.fillStyle = '#0066ff'; // Blue color for debug button
        ctx.fillRect(debugDragBtn.x, debugDragBtn.y, debugDragBtn.width, debugDragBtn.height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(debugDragBtn.x, debugDragBtn.y, debugDragBtn.width, debugDragBtn.height);

        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('DRAG DEBUG', debugDragBtn.x + debugDragBtn.width / 2, debugDragBtn.y + 32);
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

        // Check DRAG DEBUG button
        if (this.debugDragBtnBounds && 
            x >= this.debugDragBtnBounds.x && x <= this.debugDragBtnBounds.x + this.debugDragBtnBounds.width &&
            y >= this.debugDragBtnBounds.y && y <= this.debugDragBtnBounds.y + this.debugDragBtnBounds.height) {
            
            return { action: 'debugDragRace' };
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

export default GarageScreen;