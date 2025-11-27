import { RaceState } from '../core/constants.js';

class DragRaceScreen {
    constructor() {
        this.animationTimer = 0;
        this.bracketState = null;
        this.continueButtonBounds = null;
        
        // Visual settings
        this.colors = {
            background: '#0a0a0a',
            panelBg: '#111111',
            panelBorder: '#333333',
            text: '#ffffff',
            textHighlight: '#ffff00',
            accent: '#ff0066',
            lane1: '#ff0066',
            lane2: '#00ffff',
            treeOff: '#221111',
            treeYellow: '#ffcc00',
            treeGreen: '#00ff00',
            treeRed: '#ff0000'
        };
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
        const width = canvas.width;
        const height = canvas.height;
        
        // Reset interactive elements
        this.continueButtonBounds = null;

        // Clear screen
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, width, height);

        if (!this.bracketState) {
            this.renderLoading(ctx, width, height);
            return;
        }

        // Main Layout: Split Screen
        // Left 60%: Tournament Bracket
        // Right 40%: Vertical Drag Strip & Tree
        const bracketWidth = width * 0.6;
        const raceWidth = width * 0.4;

        // Render Panels
        this.renderBracketPanel(ctx, 0, 0, bracketWidth, height);
        this.renderRacePanel(ctx, bracketWidth, 0, raceWidth, height);

        // Overlay for Champion
        if (this.bracketState.state === RaceState.FINISHED && this.bracketState.champion) {
            this.renderChampionOverlay(ctx, width, height);
        }
    }

    renderLoading(ctx, width, height) {
        ctx.font = '24px "Courier New", monospace';
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'center';
        ctx.fillText('LOADING DRAG EVENT...', width / 2, height / 2);
    }

    renderBracketPanel(ctx, x, y, width, height) {
        // Panel Background
        ctx.fillStyle = this.colors.panelBg;
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Header
        ctx.fillStyle = this.colors.textHighlight;
        ctx.font = 'bold 32px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = this.colors.accent;
        ctx.shadowBlur = 10;
        ctx.fillText('TOURNAMENT BRACKET', x + width / 2, y + 50);
        ctx.shadowBlur = 0;

        // Bracket Logic
        const bracket = this.bracketState.bracket;
        if (!bracket || bracket.length === 0) return;

        const numRounds = Math.ceil(Math.log2(bracket[0].length)); 
        const columnWidth = (width - 40) / (numRounds + 1); 
        
        let currentX = x + 20;

        for (let r = 0; r <= numRounds; r++) {
            const participants = (r < bracket.length) ? bracket[r] : [];
            const isChampionSlot = (r === numRounds);
            
            // Round Label
            ctx.fillStyle = this.colors.text;
            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.textAlign = 'center';
            let roundName = `ROUND ${r + 1}`;
            if (isChampionSlot) roundName = "CHAMPION";
            else if (r === numRounds - 1) roundName = "FINALS";
            else if (r === numRounds - 2) roundName = "SEMI-FINALS";
            
            ctx.fillText(roundName, currentX + columnWidth / 2, y + 90);

            const totalSlots = isChampionSlot ? 1 : Math.pow(2, numRounds - r);
            const slotHeight = 40;
            const slotSpacing = (height - 150) / totalSlots;
            
            for (let i = 0; i < totalSlots; i++) {
                const slotY = y + 150 + (i * slotSpacing) + (slotSpacing / 2) - (slotHeight / 2);
                
                // Determine if this slot is part of the active heat
                let isActiveSlot = false;
                let driverName = "---";
                let nameColor = '#666'; // Dim for empty/inactive

                if (participants && participants[i]) {
                    driverName = participants[i].name;
                    nameColor = '#fff'; // Standard white for present drivers

                    // Check if active in current heat
                    if (this.bracketState.heatState && 
                       (this.bracketState.heatState.driver1?.name === driverName || 
                        this.bracketState.heatState.driver2?.name === driverName)) {
                        isActiveSlot = true;
                        nameColor = this.colors.accent;
                    }
                } else if (isChampionSlot && this.bracketState.champion) {
                    driverName = this.bracketState.champion.name;
                    nameColor = this.colors.textHighlight;
                    isActiveSlot = true; // Highlight champion
                }

                // Draw Box
                ctx.strokeStyle = isActiveSlot ? this.colors.accent : '#444';
                ctx.lineWidth = isActiveSlot ? 3 : 1;
                if (isActiveSlot) {
                    ctx.shadowColor = this.colors.accent;
                    ctx.shadowBlur = 10;
                }
                
                ctx.strokeRect(currentX + 10, slotY, columnWidth - 20, slotHeight);
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(currentX + 10, slotY, columnWidth - 20, slotHeight);
                
                ctx.shadowBlur = 0; // Reset glow

                // Fill Name
                ctx.fillStyle = nameColor;
                ctx.font = isActiveSlot ? 'bold 14px "Courier New", monospace' : '14px "Courier New", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(driverName, currentX + 20, slotY + 25);
                
                // Connectors
                if (!isChampionSlot) {
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 2;
                    if (i % 2 === 0) {
                        ctx.beginPath();
                        ctx.moveTo(currentX + columnWidth - 10, slotY + slotHeight / 2);
                        ctx.lineTo(currentX + columnWidth, slotY + slotHeight / 2);
                        ctx.lineTo(currentX + columnWidth, slotY + slotHeight / 2 + slotSpacing / 2);
                        ctx.stroke();
                    } else {
                        ctx.beginPath();
                        ctx.moveTo(currentX + columnWidth - 10, slotY + slotHeight / 2);
                        ctx.lineTo(currentX + columnWidth, slotY + slotHeight / 2);
                        ctx.lineTo(currentX + columnWidth, slotY + slotHeight / 2 - slotSpacing / 2);
                        ctx.lineTo(currentX + columnWidth + 20, slotY + slotHeight / 2 - slotSpacing / 2);
                        ctx.stroke();
                    }
                }
            }
            
            currentX += columnWidth;
        }
    }

    renderRacePanel(ctx, x, y, width, height) {
        // Panel Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.strokeRect(x, y, width, height);

        // The Vertical Track (Taking up full panel space now)
        const trackY = y + 20;
        const trackHeight = height - 40;
        const trackWidth = width - 20;
        const trackX = x + 10;

        this.renderVerticalTrack(ctx, trackX, trackY, trackWidth, trackHeight);
    }

    renderChristmasTree(ctx, x, y, lightState) {
        // Only render if in PRE_HEAT or just started
        // We want it to persist for a moment on Green
        
        // Tree Box
        ctx.fillStyle = 'rgba(17, 17, 17, 0.9)'; // Semi-transparent background
        ctx.fillRect(x - 40, y - 60, 80, 160);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(x - 40, y - 60, 80, 160);

        // Pre-Stage / Stage (Small Blue lights at top) - simulating staging
        ctx.fillStyle = '#0033cc'; 
        ctx.beginPath(); ctx.arc(x - 15, y - 45, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 15, y - 45, 5, 0, Math.PI*2); ctx.fill();

        // Yellow 1
        ctx.fillStyle = (lightState === 'YELLOW1' || lightState === 'YELLOW2' || lightState === 'YELLOW3') ? this.colors.treeYellow : this.colors.treeOff;
        ctx.beginPath(); ctx.arc(x, y - 15, 10, 0, Math.PI*2); ctx.fill();

        // Yellow 2
        ctx.fillStyle = (lightState === 'YELLOW2' || lightState === 'YELLOW3') ? this.colors.treeYellow : this.colors.treeOff;
        ctx.beginPath(); ctx.arc(x, y + 15, 10, 0, Math.PI*2); ctx.fill();

        // Yellow 3
        ctx.fillStyle = (lightState === 'YELLOW3') ? this.colors.treeYellow : this.colors.treeOff;
        ctx.beginPath(); ctx.arc(x, y + 45, 10, 0, Math.PI*2); ctx.fill();

        // Green / Red
        let mainColor = this.colors.treeOff;
        if (lightState === 'GREEN') mainColor = this.colors.treeGreen;
        if (lightState === 'RED') mainColor = this.colors.treeRed;
        
        ctx.fillStyle = mainColor;
        ctx.beginPath(); ctx.arc(x, y + 80, 15, 0, Math.PI*2); ctx.fill();
    }

    renderVerticalTrack(ctx, x, y, width, height) {
        // 1. Terrain (Grass/Dirt surrounding track)
        ctx.fillStyle = '#1a2a1a'; // Dark green/mud
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Track Dimensions
        const trackWidth = width * 0.6; // Track takes up 60% of the panel width
        const trackX = x + (width - trackWidth) / 2;
        
        // 2. Track Surface (Asphalt)
        ctx.fillStyle = '#222222';
        ctx.fillRect(trackX, y, trackWidth, height);

        // 3. Curbs (Red/White strips on edges)
        const curbWidth = 10;
        const numStripes = 20;
        const stripeHeight = height / numStripes;
        
        for (let i = 0; i < numStripes; i++) {
            ctx.fillStyle = (i % 2 === 0) ? '#cc0000' : '#eeeeee';
            // Left Curb
            ctx.fillRect(trackX - curbWidth, y + i * stripeHeight, curbWidth, stripeHeight);
            // Right Curb
            ctx.fillRect(trackX + trackWidth, y + i * stripeHeight, curbWidth, stripeHeight);
        }

        // 4. Lane Dividers
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 20]); // Dashed line
        ctx.beginPath();
        ctx.moveTo(trackX + trackWidth / 2, y);
        ctx.lineTo(trackX + trackWidth / 2, y + height);
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        // 5. Start & Finish Lines
        const startY = y + height - 50;
        const finishY = y + 50;

        // Start Line (Thick White)
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(trackX, startY);
        ctx.lineTo(trackX + trackWidth, startY);
        ctx.stroke();

        // Finish Line (Checkered Pattern)
        const checkSize = 10;
        const numChecks = trackWidth / checkSize;
        for (let i = 0; i < numChecks; i++) {
            ctx.fillStyle = (i % 2 === 0) ? '#ffffff' : '#000000';
            ctx.fillRect(trackX + i * checkSize, finishY, checkSize, checkSize);
            ctx.fillStyle = (i % 2 !== 0) ? '#ffffff' : '#000000';
            ctx.fillRect(trackX + i * checkSize, finishY + checkSize, checkSize, checkSize);
        }

        // Labels
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText('FINISH', trackX - 15, finishY + 15);
        ctx.fillText('START', trackX - 15, startY + 5);

        // Render Cars
        if (this.bracketState.heatState) {
            const heat = this.bracketState.heatState;
            const laneWidth = trackWidth / 2;
            
            // Lane 1 (Left)
            this.renderCarOnStrip(ctx, trackX + laneWidth * 0.5, startY, finishY + checkSize, heat.car1, heat.driver1, heat.car1ET);
            
            // Lane 2 (Right)
            this.renderCarOnStrip(ctx, trackX + laneWidth * 1.5, startY, finishY + checkSize, heat.car2, heat.driver2, heat.car2ET);
        }

        // 6. Render Christmas Tree (Overlay)
        // Hide after race starts (allow a brief moment on Green)
        const isPreHeat = this.bracketState.state === RaceState.PRE_HEAT;
        // Allow showing for 1s after start
        const isJustStarted = this.bracketState.state === RaceState.RACING && this.bracketState.heatState && this.bracketState.heatState.heatRaceTime < 1.0;
        
        if (isPreHeat || isJustStarted) {
            this.renderChristmasTree(ctx, trackX + trackWidth / 2, y + 100, this.bracketState.startLightState);
        }
    }

    renderCarOnStrip(ctx, centerX, startY, finishY, carController, driver, et) {
        if (!carController) return;
        
        // Use the actual DRAG_DISTANCE from the simulation state, default to 1200
        const dragDistance = this.bracketState.DRAG_DISTANCE || 1200;
        
        // Normalize position: 0 at start, 1 at finish
        // Clamp to 0-1 to ensure it stays on track
        let progress = carController.currentWaypoint / dragDistance;
        progress = Math.max(0, Math.min(1, progress));
        
        // Visual Y position (moving UP)
        // startY is high value (bottom), finishY is low value (top)
        const trackLength = startY - finishY;
        const carY = startY - (progress * trackLength);

        // 1. Draw Car Body (Circle)
        const teamColor = driver.teamColor || '#00ffff';
        ctx.fillStyle = teamColor;
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = teamColor;
        
        ctx.beginPath();
        ctx.arc(centerX, carY, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0; // Reset glow

        // 2. Driver Initial/Number
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = driver.name ? driver.name.substring(0, 1).toUpperCase() : '#';
        ctx.fillText(label, centerX, carY);
        ctx.textBaseline = 'alphabetic'; // Reset

        // 3. Name Label (Below car)
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(driver.name, centerX, carY + 25);

        // 4. ET Display (if finished)
        if (et) {
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 5;
            ctx.fillText(`${et.toFixed(3)}s`, centerX, carY - 25);
            ctx.shadowBlur = 0;
        }
    }

    renderChampionOverlay(ctx, width, height) {
        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = this.colors.textHighlight;
        ctx.font = 'bold 60px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = this.colors.accent;
        ctx.shadowBlur = 20;
        ctx.fillText('TOURNAMENT CHAMPION', width / 2, height / 2 - 50);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px "Courier New", monospace';
        ctx.fillText(this.bracketState.champion.name, width / 2, height / 2 + 20);

        // Continue Button
        const btnX = width / 2 - 100;
        const btnY = height / 2 + 100;
        const btnW = 200;
        const btnH = 50;
        
        // Store bounds for click handler
        this.continueButtonBounds = { x: btnX, y: btnY, width: btnW, height: btnH };

        ctx.fillStyle = this.colors.accent;
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(btnX, btnY, btnW, btnH);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillText('CONTINUE', width / 2, btnY + 33);
    }

    handleClick(x, y, gameState) {
        if (this.continueButtonBounds) {
            const b = this.continueButtonBounds;
            if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
                return { action: 'continue' };
            }
        }
        return null;
    }
    
    handleMouseMove(x, y) {
        // Could add hover effects later
    }

    reset() {
        this.animationTimer = 0;
        this.bracketState = null;
        this.continueButtonBounds = null;
    }
}

export default DragRaceScreen;