class GameOverScreen {
    constructor() {
        this.animationTimer = 0;
        this.flashTimer = 0;
    }

    update(deltaTime, gameState) {
        this.animationTimer += deltaTime;
        this.flashTimer += deltaTime;
    }

    render(ctx, gameState, assetManager) {
        const canvas = ctx.canvas;

        // Background
        let bgDrawn = false;
        if (assetManager) {
            const bg = assetManager.getImage('gameover-bg');
            if (bg) {
                ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
                bgDrawn = true;
            }
        }

        // Pulsing red overlay (or base background if image missing)
        const pulse = Math.sin(this.animationTimer * 0.002) * 0.3 + 0.7;
        if (bgDrawn) {
             // Light red overlay if BG exists
             ctx.fillStyle = `rgba(50, 0, 0, ${pulse * 0.5})`; 
        } else {
             // Original opaque pulse if no BG
             ctx.fillStyle = `rgba(20, 0, 0, ${pulse})`;
        }
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

export default GameOverScreen;