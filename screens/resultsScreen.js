/**
 * Linear interpolation (moved from screens.js)
 */
function lerp(start, end, t) {
    return start + (end - start) * t;
}

class ResultsScreen {
    constructor() {
        this.animationTimer = 0;
        this.showPayout = false;
        this.animatedNetChange = 0; // Tracks the animated profit/loss
        this.finalNetChange = 0;    // Stores the actual profit/loss
        this.animationDuration = 1.0; // seconds for the money animation
        this.bankrollAnimationStarted = false; // Flag to ensure animation plays once
        this.animationStartTime = 0; // To track when the animation started
    }

    update(deltaTime, gameState) {
        this.animationTimer += deltaTime;

        // Show payout after 2 seconds
        if (this.animationTimer > 2.0 && !this.showPayout) { // Changed from 2000 to 2.0 (seconds)
            this.showPayout = true;
            
            // Initialize net change for animation once payout is shown
            if (!this.bankrollAnimationStarted && gameState?.race?.betResult) {
                const betResult = gameState.race.betResult;
                this.finalNetChange = betResult.won ? (betResult.payout - betResult.betAmount) : -betResult.betAmount;
                this.animatedNetChange = 0; // Start animation from 0
                this.bankrollAnimationStarted = true;
                this.animationStartTime = this.animationTimer; // Store start time for animation
            }
        }

        // Animate money change
        if (this.bankrollAnimationStarted) {
            const animationProgress = (this.animationTimer - this.animationStartTime);
            if (animationProgress < this.animationDuration) {
                const progress = animationProgress / this.animationDuration;
                this.animatedNetChange = Math.round(lerp(0, this.finalNetChange, progress));
            } else {
                this.animatedNetChange = this.finalNetChange; // Ensure final value is set
            }
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
        const podiumWidth = 500;
        const podiumX = (canvas.width / 2) - (podiumWidth / 2);
        this.renderPodium(ctx, gameState, podiumX, 100, podiumWidth, 250);

        // Payout breakdown
        if (this.showPayout) {
            const payoutWidth = 500;
            const payoutX = (canvas.width / 2) - (payoutWidth / 2);
            this.renderPayoutBreakdown(ctx, gameState, payoutX, 370, payoutWidth, 150);
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
        const rawNetChange = betResult.won ? (betResult.payout - betResult.betAmount) : -betResult.betAmount;
        const displayNetChange = this.bankrollAnimationStarted ? this.animatedNetChange : rawNetChange;
        const netChangeText = `${displayNetChange >= 0 ? '+' : ''}$${Math.abs(displayNetChange).toLocaleString()}`; // Format as +$X or -$X
        const netChangeColor = displayNetChange >= 0 ? '#00ff00' : '#ff0000'; // Green for positive, red for negative

        // Container
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = netChangeColor; // Container border reflects win/loss
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Win/Loss indicator
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.fillStyle = netChangeColor; // Text color reflects win/loss
        ctx.textAlign = 'center';
        ctx.fillText(betResult.won ? 'YOU WIN!' : 'YOU LOSE', x + width / 2, y + 40);

        // Bet breakdown
        ctx.font = '16px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText('BET AMOUNT:', x + 30, y + 75);
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'right';
        ctx.fillText(`$${betResult.betAmount.toLocaleString()}`, x + width - 30, y + 75);

        if (betResult.won) {
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText('PAYOUT:', x + 30, y + 105);
            ctx.fillStyle = '#00ff00';
            ctx.textAlign = 'right';
            ctx.fillText(`$${betResult.payout.toLocaleString()}`, x + width - 30, y + 105);
        } else {
            // If lost, Payout line is not applicable, but show net change at same Y
            // So, no specific Payout line if lost, directly to net change.
        }

        // Display NET PROFIT/LOSS based on animated value
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(betResult.won ? 'NET PROFIT:' : 'NET LOSS:', x + 30, y + 135);
        ctx.fillStyle = netChangeColor;
        ctx.textAlign = 'right';
        ctx.fillText(netChangeText, x + width - 30, y + 135);
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
        this.animatedNetChange = 0;
        this.finalNetChange = 0;
        this.bankrollAnimationStarted = false;
        this.animationStartTime = 0;
    }
}

export default ResultsScreen;