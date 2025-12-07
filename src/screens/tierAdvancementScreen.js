class TierAdvancementScreen {
    constructor() {
        this.animationTimer = 0;
        this.showDetails = false;
    }

    update(deltaTime, gameState) {
        this.animationTimer += deltaTime;

        if (this.animationTimer > 1.0 && !this.showDetails) {
            this.showDetails = true;
        }
    }

    render(ctx, gameState, assetManager) {
        const canvas = ctx.canvas;
        const currentTier = gameState?.player?.tier || 1;
        
        // Determine background image
        const bgMap = {
            1: 'kart_upgrade',
            2: 'dirt_upgrade',
            3: 'gt_upgrade',
            4: 'lm_upgrade',
            5: 'stock_upgrade',
            6: 'open_upgrade'
        };
        const bgKey = bgMap[currentTier] || 'kart_upgrade';
        
        let bgDrawn = false;
        if (assetManager) {
            const bg = assetManager.getImage(bgKey);
            if (bg) {
                ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
                bgDrawn = true;
            }
        }

        if (!bgDrawn) {
            // Fallback Background - gradient celebration
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#001a00');
            gradient.addColorStop(1, '#000a00');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Semi-transparent overlay for readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Tier advancement text
        const pulse = Math.sin(this.animationTimer * 3) * 20 + 60;
        ctx.font = 'bold 72px "Courier New", monospace';
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'center';
        ctx.shadowBlur = pulse;
        ctx.shadowColor = '#00ff00';
        
        const title = currentTier === 1 ? 'WELCOME ROOKIE!' : 'TIER ADVANCED!';
        ctx.fillText(title, canvas.width / 2, 180);
        ctx.shadowBlur = 0;

        // New tier info
        const tierNames = ['', 'Go-Kart', 'Dirt Track', 'GT3', 'LM', 'Stock Car', 'Open Wheel'];
        ctx.font = '48px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`TIER ${currentTier}: ${tierNames[currentTier] || 'Unknown'}`, canvas.width / 2, 260);

        if (this.showDetails) {
            this.renderDetails(ctx, gameState, canvas.width / 2 - 300, 320, 600, 250, currentTier);
        }

        // Continue button
        this.renderContinueButton(ctx, canvas.width / 2 - 100, 600, 200, 50);
    }

    renderDetails(ctx, gameState, x, y, width, height, tier) {
        ctx.fillStyle = 'rgba(0, 20, 0, 0.85)'; // Darker background
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        ctx.font = '24px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(tier === 1 ? 'LEAGUE DETAILS' : 'NEW FEATURES UNLOCKED', x + width / 2, y + 40);

        ctx.font = '18px "Courier New", monospace';
        ctx.fillStyle = '#00ffff';
        ctx.textAlign = 'left';
        
        // Customize text based on tier
        if (tier === 1) {
            ctx.fillText('• Basic Go-Karts', x + 50, y + 90);
            ctx.fillText('• Learn the ropes of racing', x + 50, y + 120);
            ctx.fillText('• Low stakes betting', x + 50, y + 150);
            ctx.fillText('• Simple track layouts', x + 50, y + 180);
            ctx.fillText('• Earn $50,000 to advance!', x + 50, y + 210);
        } else {
            ctx.fillText('• Faster vehicles', x + 50, y + 90);
            ctx.fillText('• Higher stakes races', x + 50, y + 120);
            ctx.fillText('• New track types', x + 50, y + 150);
            ctx.fillText('• Advanced betting options', x + 50, y + 180);
            ctx.fillText('• Increased payout multipliers', x + 50, y + 210);
            ctx.fillText('• Unlocked Drag Race Bonus Round!', x + 50, y + 240);
        }
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