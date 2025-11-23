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
