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

export default SettingsScreen;