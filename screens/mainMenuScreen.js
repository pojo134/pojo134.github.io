class MainMenuScreen {
    constructor() {
        this.flashTimer = 0;
        // Buttons will be positioned dynamically in render based on canvas width
        this.buttonDefs = [
            { text: 'NEW GAME', y: 250, width: 300, height: 60, action: 'newGame' },
            { text: 'CONTINUE', y: 330, width: 300, height: 60, action: 'continue' },
            { text: 'LOAD GAME', y: 410, width: 300, height: 60, action: 'loadGame' },
            { text: 'SETTINGS', y: 490, width: 300, height: 60, action: 'settings' },
            { text: 'EXIT', y: 570, width: 300, height: 60, action: 'exit' }
        ];
        this.buttons = []; // Will be populated in render
        this.selectedButton = null;
    }

    update(deltaTime, gameState) {
        this.flashTimer += deltaTime;
    }

    render(ctx, gameState) {
        const canvas = ctx.canvas;

        // Update button positions based on actual canvas width
        this.buttons = this.buttonDefs.map(def => ({
            ...def,
            x: canvas.width / 2
        }));

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

export default MainMenuScreen;