
class CreditsScreen {
    constructor() {
        // No special initialization needed
    }

    update(deltaTime, gameState) {
        // Could add animations here if needed
    }

    render(ctx, gameState, assetManager) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;

        // Draw Background
        let bgDrawn = false;
        if (assetManager) {
            const bg = assetManager.getImage('endgame-bg');
            if (bg) {
                ctx.drawImage(bg, 0, 0, width, height);
                bgDrawn = true;
            }
        }

        if (!bgDrawn) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
        }

        // Overlay for text readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);

        // Center Content
        const centerX = width / 2;
        const centerY = height / 2;

        // Title
        ctx.font = 'bold 64px "Courier New", monospace';
        ctx.fillStyle = '#00ff00'; // Matrix green
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 20;
        ctx.fillText('CONGRATULATIONS!', centerX, centerY - 150);
        ctx.shadowBlur = 0;

        // Main Text Body
        ctx.font = '24px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        
        const lines = [
            "Now that you have gotten this much money from gambling",
            "you can now buy a car and start driving.",
            "",
            "Thanks from Brad and Gemini."
        ];

        let textY = centerY - 50;
        lines.forEach(line => {
            ctx.fillText(line, centerX, textY);
            textY += 40;
        });

        // "Click to Return" hint
        ctx.font = 'italic 16px "Courier New", monospace';
        ctx.fillStyle = '#888888';
        ctx.fillText('(Click anywhere to return to Main Menu)', centerX, height - 50);
    }

    handleClick(x, y, gameState) {
        // Click anywhere to return to main menu
        return { action: 'mainMenu' };
    }

    handleMouseMove(x, y) {
        // No interaction needed
    }
}

export default CreditsScreen;
