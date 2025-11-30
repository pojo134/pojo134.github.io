class SettingsScreen {
    constructor() {
        this.selectedTab = 'audio';
        this.tabs = ['audio', 'graphics', 'gameplay'];
        this.hoveredButton = null;
    }

    update(deltaTime, gameState) {
        // Animation updates
    }

    handleInput(x, y, gameState) {
        // Check Audio Settings for Sliders (continuous update)
        if (this.selectedTab === 'audio') {
            // Music Slider (490, 340, 300, 10) - Expanded hit area for easier grabbing
            if (x >= 480 && x <= 800 && y >= 320 && y <= 370) {
                const val = (x - 490) / 300;
                gameState.audio.musicVolume = Math.max(0, Math.min(1, val));
                return { action: 'updateVolume' };
            }

            // SFX Slider (490, 420, 300, 10)
            if (x >= 480 && x <= 800 && y >= 400 && y <= 450) {
                const val = (x - 490) / 300;
                gameState.audio.sfxVolume = Math.max(0, Math.min(1, val));
                return { action: 'updateVolume' };
            }
        }
        return null;
    }

    render(ctx, gameState, assetManager) {
        const canvas = ctx.canvas;

        // Background
        let bgDrawn = false;
        if (assetManager) {
            const bg = assetManager.getImage('settings-bg');
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
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.fillStyle = '#ff0066';
        ctx.textAlign = 'center';
        ctx.fillText('SETTINGS', canvas.width / 2, 55);

        // Tabs
        this.renderTabs(ctx, 200, 100);

        // Settings panel
        this.renderSettingsPanel(ctx, 200, 160, 880, 450, gameState);

        // Back button
        this.renderBackButton(ctx, canvas.width / 2 - 100, 630, 200, 50);
    }

    renderTabs(ctx, x, y) {
        const tabWidth = 200;
        const tabHeight = 50;

        this.tabs.forEach((tab, index) => {
            const tabX = x + index * (tabWidth + 10);
            const isSelected = this.selectedTab === tab;

            ctx.fillStyle = isSelected ? 'rgba(51, 0, 51, 0.85)' : 'rgba(26, 26, 26, 0.85)';
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

    renderSettingsPanel(ctx, x, y, width, height, gameState) {
        ctx.fillStyle = 'rgba(26, 26, 26, 0.85)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.font = '20px "Courier New", monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.selectedTab.toUpperCase()} SETTINGS`, x + width / 2, y + 40);

        if (this.selectedTab === 'audio') {
            this.renderAudioSettings(ctx, x, y, width, height, gameState);
        } else {
            ctx.font = '16px "Courier New", monospace';
            ctx.fillStyle = '#666';
            ctx.fillText('[Settings panel - implementation pending]', x + width / 2, y + 150);
        }
    }

    renderAudioSettings(ctx, x, y, width, height, gameState) {
        const centerX = x + width / 2;
        const startY = y + 100;

        // Mute Toggle
        const isMuted = gameState.audio.muted;
        this.drawCheckbox(ctx, centerX - 20, startY, isMuted, "Mute Audio");

        // Music Volume
        this.drawSlider(ctx, centerX - 150, startY + 80, 300, gameState.audio.musicVolume, "Music Volume");

        // SFX Volume
        this.drawSlider(ctx, centerX - 150, startY + 160, 300, gameState.audio.sfxVolume, "SFX Volume");
    }

    drawCheckbox(ctx, x, y, checked, label) {
        const size = 30;
        
        // Label
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px "Courier New", monospace';
        ctx.fillText(label, x - 15, y + size / 1.5);

        // Box
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);

        // Checkmark
        if (checked) {
            ctx.fillStyle = '#ff0066';
            ctx.fillRect(x + 5, y + 5, size - 10, size - 10);
        }
        
        // Hover effect handled by global mouse cursor usually, 
        // but we can highlight if needed.
    }

    drawSlider(ctx, x, y, width, value, label) {
        const height = 10;

        // Label
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px "Courier New", monospace';
        ctx.fillText(label, x + width / 2, y - 10);

        // Track
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, width, height);

        // Filled part
        ctx.fillStyle = '#ff0066';
        ctx.fillRect(x, y, width * value, height);

        // Thumb
        ctx.fillStyle = '#ffffff';
        const thumbX = x + width * value;
        ctx.fillRect(thumbX - 5, y - 5, 10, height + 10);
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

        // Check Audio Settings
        if (this.selectedTab === 'audio') {
            const panelX = 200;
            const panelY = 160;
            const panelW = 880;
            const centerX = panelX + panelW / 2; // 640
            const startY = panelY + 100; // 260

            // Mute Checkbox (620, 260, 30, 30)
            if (x >= 620 && x <= 650 && y >= 260 && y <= 290) {
                // Don't toggle here, let AudioManager handle it via action
                return { action: 'toggleMute' }; 
            }

            // Music Slider (490, 340, 300, 10) - Allow some padding
            if (x >= 490 && x <= 790 && y >= 330 && y <= 360) {
                const val = (x - 490) / 300;
                gameState.audio.musicVolume = Math.max(0, Math.min(1, val));
                return { action: 'updateVolume' };
            }

            // SFX Slider (490, 420, 300, 10)
            if (x >= 490 && x <= 790 && y >= 410 && y <= 440) {
                const val = (x - 490) / 300;
                gameState.audio.sfxVolume = Math.max(0, Math.min(1, val));
                return { action: 'updateVolume' };
            }
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