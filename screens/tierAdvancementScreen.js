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

export default TierAdvancementScreen;