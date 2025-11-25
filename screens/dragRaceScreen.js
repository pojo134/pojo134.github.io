class DragRaceScreen {
    constructor() {
        this.animationTimer = 0;
        this.bracketState = null; // Will hold the state from DragRaceSimulator
    }

    update(deltaTime, gameState) {
        this.animationTimer += deltaTime;

        // Update bracket state from simulation
        if (gameState?.race?.simulation?.getRaceState) {
            this.bracketState = gameState.race.simulation.getRaceState();
        }
    }

    render(ctx, gameState) {
        const canvas = ctx.canvas;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.fillStyle = '#ff0066';
        ctx.textAlign = 'center';
        ctx.fillText('DRAG RACE', canvas.width / 2, 60);

        if (!this.bracketState) {
            ctx.font = '24px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('LOADING BRACKET...', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Render the drag race bracket on the left
        this.renderBracket(ctx, this.bracketState);

        // Render the dedicated race display on the right
        this.renderRaceDisplay(ctx, this.bracketState);

        // Render champion (if race finished)
        if (this.bracketState.state === RaceState.FINISHED && this.bracketState.champion) {
            ctx.font = 'bold 48px "Courier New", monospace';
            ctx.fillStyle = '#ffff00';
            ctx.fillText(`CHAMPION: ${this.bracketState.champion.name}`, canvas.width / 2, canvas.height - 100);

            // Add a continue button
            this.renderContinueButton(ctx, canvas.width / 2 - 100, canvas.height - 50, 200, 40);
        }
    }

    renderBracket(ctx, bracketState) {
        const canvas = ctx.canvas;
        // Total width available for bracket, considering padding
        const bracketDisplayWidth = canvas.width * 0.9; 
        const bracketDisplayX = (canvas.width - bracketDisplayWidth) / 2;

        const maxRounds = Math.ceil(Math.log2(bracketState.bracket.length)); // e.g., 8 drivers = 3 rounds
        const roundWidth = bracketDisplayWidth / maxRounds;
        const heatHeight = 80;
        const driverHeight = heatHeight / 2;

        let currentRoundX = bracketDisplayX;

        // Draw initial drivers (Round 0 for visual clarity, not a formal simulation round)
        const initialDrivers = bracketState.bracket;
        let initialY = 150;
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'left';
        ctx.fillText('DRIVERS', currentRoundX, 120);
        initialDrivers.forEach(driver => {
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(driver.name, currentRoundX, initialY);
            initialY += driverHeight;
        });
        currentRoundX += roundWidth;


        for (let r = 0; r < maxRounds; r++) { // Iterate through simulation rounds
            const driversInRound = bracketState.bracket[r]; // Participants for current sim round
            const winnersOfRound = bracketState.bracket[r + 1]; // Winners of current sim round (participants for next)

            // Round Title
            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.fillStyle = '#ffff00';
            ctx.textAlign = 'left';
            ctx.fillText(`ROUND ${r + 1}`, currentRoundX, 120);

            let heatY = 150;
            // Iterate through heats of the current round
            for (let i = 0; i < driversInRound.length; i += 2) {
                const driver1 = driversInRound[i];
                const driver2 = driversInRound[i + 1]; 
                const heatWinner = winnersOfRound[i / 2]; // Get the winner for this heat

                // Draw heat box
                ctx.strokeStyle = '#444444';
                ctx.lineWidth = 2;
                ctx.strokeRect(currentRoundX, heatY, roundWidth - 50, heatHeight);

                // Driver 1
                if (driver1) {
                    ctx.font = '14px "Courier New", monospace';
                    ctx.fillStyle = (heatWinner && heatWinner.name === driver1.name) ? '#00ff00' : '#ffffff';
                    ctx.fillText(driver1.name, currentRoundX + 10, heatY + driverHeight - 5);
                }

                // Driver 2
                if (driver2) {
                    ctx.font = '14px "Courier New", monospace';
                    ctx.fillStyle = (heatWinner && heatWinner.name === driver2.name) ? '#00ff00' : '#ffffff';
                    ctx.fillText(driver2.name, currentRoundX + 10, heatY + heatHeight - 5);
                }

                // Draw line from heat to next round winner slot if winner exists
                if (heatWinner) {
                    ctx.beginPath();
                    ctx.strokeStyle = '#ffff00';
                    ctx.lineWidth = 2;
                    ctx.moveTo(currentRoundX + roundWidth - 50, heatY + heatHeight / 2); // End of heat box
                    // Adjust targetY for winner line to align with the start of the next heat slot
                    const targetY = 150 + (i / 2) * (heatHeight + 20) + heatHeight / 2; // For the next round, i/2 heat index
                    ctx.lineTo(currentRoundX + roundWidth + 20, targetY); 
                    ctx.stroke();
                }

                heatY += heatHeight + 20; // Space between heats
            }
            currentRoundX += roundWidth; // Advance X for next round
        }
    }


    renderCurrentHeat(ctx, bracketState) {
        // This method will now call renderRaceDisplay
        this.renderRaceDisplay(ctx, bracketState);
    }

    renderRaceDisplay(ctx, bracketState) {
        const canvas = ctx.canvas;
        const raceDisplayWidth = canvas.width * 0.4; // Right 40% of screen
        const raceDisplayX = canvas.width * 0.6; // Starts after bracket
        const raceDisplayY = 100;
        const raceDisplayHeight = canvas.height - raceDisplayY - 80; // Adjusted for title and footer

        // Draw background for race display
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(raceDisplayX, raceDisplayY, raceDisplayWidth, raceDisplayHeight);
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.strokeRect(raceDisplayX, raceDisplayY, raceDisplayWidth, raceDisplayHeight);

        // Title
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'center';
        ctx.fillText('CURRENT HEAT', raceDisplayX + raceDisplayWidth / 2, raceDisplayY + 30);

        // Dividing line (track lines)
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 4; // Thicker lines for track boundaries
        ctx.beginPath();
        // Top lane boundary
        ctx.moveTo(raceDisplayX + 20, raceDisplayY + raceDisplayHeight / 2 - 40);
        ctx.lineTo(raceDisplayX + raceDisplayWidth - 20, raceDisplayY + raceDisplayHeight / 2 - 40);
        // Bottom lane boundary
        ctx.moveTo(raceDisplayX + 20, raceDisplayY + raceDisplayHeight / 2 + 40);
        ctx.lineTo(raceDisplayX + raceDisplayWidth - 20, raceDisplayY + raceDisplayHeight / 2 + 40);
        ctx.stroke();

        // Start line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(raceDisplayX + 30, raceDisplayY + raceDisplayHeight / 2 - 40);
        ctx.lineTo(raceDisplayX + 30, raceDisplayY + raceDisplayHeight / 2 + 40);
        ctx.stroke();

        // Finish line (DRAG_DISTANCE in simulator, map to display)
        const finishLineX = raceDisplayX + raceDisplayWidth - 30; // 30px from right edge
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(finishLineX, raceDisplayY + raceDisplayHeight / 2 - 40);
        ctx.lineTo(finishLineX, raceDisplayY + raceDisplayHeight / 2 + 40);
        ctx.stroke();


        // Render drag tree dynamically
        this.renderDragTree(ctx, raceDisplayX + raceDisplayWidth / 2, raceDisplayY + raceDisplayHeight - 80, bracketState.startLightState);

        // Render cars if a heat is active
        const heatState = bracketState.heatState;
        if (heatState && heatState.car1 && heatState.car2) {
            const car1 = heatState.car1;
            const car2 = heatState.car2;

            // Map car progress (currentWaypoint from 0 to DRAG_DISTANCE) to display X-position
            const trackStartX = raceDisplayX + 30; // After start line
            const trackEndX = finishLineX;        // At finish line
            const trackLength = trackEndX - trackStartX;
            
            // Calculate display position (clamp to prevent going off-screen before finish)
            const car1DisplayX = trackStartX + (car1.currentWaypoint / bracketState.DRAG_DISTANCE) * trackLength;
            const car2DisplayX = trackStartX + (car2.currentWaypoint / bracketState.DRAG_DISTANCE) * trackLength;

            // Car 1 (top lane)
            ctx.font = '16px "Courier New", monospace';
            ctx.fillStyle = heatState.heatWinner && heatState.heatWinner.name === car1.driver.name ? '#00ff00' : '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(car1.driver.name, car1DisplayX, raceDisplayY + raceDisplayHeight / 2 - 20);

            // Car 2 (bottom lane)
            ctx.font = '16px "Courier New", monospace';
            ctx.fillStyle = heatState.heatWinner && heatState.heatWinner.name === car2.driver.name ? '#00ff00' : '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(car2.driver.name, car2DisplayX, raceDisplayY + raceDisplayHeight / 2 + 30);
            
            // If heat finished, display winner prominently
            if (heatState.heatFinished && heatState.heatWinner) {
                 ctx.font = 'bold 24px "Courier New", monospace';
                 ctx.fillStyle = '#00ff00';
                 ctx.textAlign = 'center';
                 ctx.fillText(`WINNER: ${heatState.heatWinner.name}`, raceDisplayX + raceDisplayWidth / 2, raceDisplayY + raceDisplayHeight - 120);
            }

        } else {
            ctx.font = '18px "Courier New", monospace';
            ctx.fillStyle = '#888888';
            ctx.textAlign = 'center';
            ctx.fillText('Waiting for heat to start...', raceDisplayX + raceDisplayWidth / 2, raceDisplayY + raceDisplayHeight / 2);
        }
    }

    renderDragTree(ctx, x, y, startLightState) {
        // Yellow lights
        ctx.fillStyle = startLightState === 'YELLOW1' ? '#ffff00' : '#333300';
        ctx.beginPath();
        ctx.arc(x, y - 40, 10, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = startLightState === 'YELLOW2' ? '#ffff00' : '#333300';
        ctx.beginPath();
        ctx.arc(x, y - 20, 10, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = startLightState === 'YELLOW3' ? '#ffff00' : '#333300';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();

        // Green/Red light
        let mainLightColor = '#330000'; // Off state
        if (startLightState === 'GREEN') {
            mainLightColor = '#00ff00';
        } else if (startLightState === 'RED') { // For false starts
            mainLightColor = '#ff0000';
        }
        ctx.fillStyle = mainLightColor;
        ctx.beginPath();
        ctx.arc(x, y + 20, 15, 0, Math.PI * 2); ctx.fill();
    }

    renderContinueButton(ctx, x, y, width, height) {
        ctx.fillStyle = '#ff0066';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('CONTINUE', x + width / 2, y + 32);
    }

    handleClick(x, y, gameState) {
        // Handle continue button click
        const canvas = { width: 1280, height: 720 }; // Canvas dimensions
        const btnX = canvas.width / 2 - 100;
        const btnY = canvas.height - 50;
        const btnWidth = 200;
        const btnHeight = 40;

        if (this.bracketState.state === RaceState.FINISHED &&
            x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
            return { action: 'continue' };
        }
        return null;
    }

    reset() {
        this.animationTimer = 0;
        this.bracketState = null;
    }
}

export default DragRaceScreen;