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
                let seedNum = "";

                if (participants && participants[i]) {
                    driverName = participants[i].name;
                    seedNum = participants[i].seed ? `${participants[i].seed} ` : "";
                    nameColor = '#fff'; // Standard white for present drivers

                    // Check if active in current heat AND it's the current round being simulated
                    if (r === (this.bracketState.currentRound -1) && this.bracketState.heatState && 
                       (this.bracketState.heatState.driver1?.name === driverName || 
                        this.bracketState.heatState.driver2?.name === driverName)) {
                        isActiveSlot = true;
                        nameColor = this.colors.accent;
                    }
                } else if (isChampionSlot && this.bracketState.champion) {
                    driverName = this.bracketState.champion.name;
                    seedNum = this.bracketState.champion.seed ? `${this.bracketState.champion.seed} ` : "";
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
                ctx.font = isActiveSlot ? 'bold 13px "Courier New", monospace' : '13px "Courier New", monospace';
                ctx.textAlign = 'left';
                
                // Draw Seed Number (Always white)
                if (seedNum) {
                    ctx.fillStyle = '#fff'; // Always white
                    ctx.fillText(seedNum, currentX + 20, slotY + 25);
                }
                
                // Draw Driver Name
                // Get the driver's team color, or a fallback if not available
                let driverTextColor = participants[i]?.teamColor || '#ffffff';
                
                // For Champion Slot, override team color with textHighlight, but only for text.
                if (isChampionSlot && this.bracketState.champion) {
                    driverTextColor = this.colors.textHighlight;
                }

                ctx.fillStyle = driverTextColor;
                
                // Measure seedNum width to position driverName correctly
                const seedNumWidth = seedNum ? ctx.measureText(seedNum).width : 0;
                ctx.fillText(driverName, currentX + 20 + seedNumWidth, slotY + 25);
                
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
        // Panel Background - Green "Grass"
        ctx.fillStyle = '#1a2a1a'; 
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.strokeRect(x, y, width, height);

        const track = this.bracketState.track;
        if (!track) return;

        // Calculate aspect-ratio-preserving centered rect
        // The drag strip is tall and narrow. The panel is likely wider.
        // We want to fit the track height into the panel height with padding,
        // and let the width fall where it may, centered.
        
        const padding = 20;
        const availW = width - 2 * padding;
        const availH = height - 2 * padding;
        
        const trackBounds = track.visualBounds;
        const trackAspect = trackBounds.width / trackBounds.height;
        const panelAspect = availW / availH;
        
        let renderW, renderH;
        
        if (trackAspect > panelAspect) {
            // Track is wider than panel relative to height (unlikely for drag strip)
            renderW = availW;
            renderH = renderW / trackAspect;
        } else {
            // Track is taller than panel relative to width (likely)
            renderH = availH;
            renderW = renderH * trackAspect;
        }
        
        const renderX = x + (width - renderW) / 2;
        const renderY = y + (height - renderH) / 2;

        // Render the generated track centered
        track.renderFullTrack(ctx, renderX, renderY, renderW, renderH);

        // Render Cars
        if (this.bracketState.heatState) {
            const heat = this.bracketState.heatState;
            
            // Lane 1 (Left)
            this.renderCarOnStrip(ctx, renderX, renderY, renderW, renderH, heat.car1, heat.driver1, heat.car1ET, -1);
            
            // Lane 2 (Right)
            this.renderCarOnStrip(ctx, renderX, renderY, renderW, renderH, heat.car2, heat.driver2, heat.car2ET, 1);
        }

        // 6. Render Christmas Tree (Overlay)
        const isPreHeat = this.bracketState.state === RaceState.PRE_HEAT;
        const isJustStarted = this.bracketState.state === RaceState.RACING && this.bracketState.heatState && this.bracketState.heatState.heatRaceTime < 1.0;
        
        if (isPreHeat || isJustStarted) {
            // Position tree in the center of the panel, slightly down from the top
            this.renderChristmasTree(ctx, x + width / 2, y + 100, this.bracketState.startLightState);
        }
    }

    renderCarOnStrip(ctx, displayX, displayY, displayWidth, displayHeight, carController, driver, et, laneDirection) {
        if (!carController) return;
        
        const track = this.bracketState.track;
        if (!track) return;

        // Use the actual DRAG_DISTANCE from the simulation state, default to 1200
        const dragDistance = this.bracketState.DRAG_DISTANCE || 1200;
        
        // Calculate progress (0-1)
        let progress = carController.currentWaypoint / dragDistance;
        progress = Math.max(0, Math.min(1, progress));
        
        // Get track position at this progress
        const trackPos = track.getPositionAtProgress(progress);
        
        // Convert to screen coordinates using the Centered Render Rect
        const screenPos = track.trackToScreen(trackPos.x, trackPos.y, displayX, displayY, displayWidth, displayHeight);
        
        // Calculate visual lane offset
        const scale = displayWidth / track.visualBounds.width;
        const laneOffset = 15 * scale * laneDirection; 

        const carX = screenPos.screenX + laneOffset;
        const carY = screenPos.screenY;

        // 1. Draw Car Body (Circle)
        const teamColor = driver.teamColor || '#00ffff';
        ctx.fillStyle = teamColor;
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = teamColor;
        
        ctx.beginPath();
        ctx.arc(carX, carY, 8, 0, Math.PI * 2); 
        ctx.fill();
        
        ctx.shadowBlur = 0; // Reset glow

        // 2. Driver Initial/Number
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Use the Seed Number if available, otherwise first letter
        const label = driver.seed ? `${driver.seed}` : (driver.name ? driver.name.substring(0, 1).toUpperCase() : '#');
        ctx.fillText(label, carX, carY);
        ctx.textBaseline = 'alphabetic'; // Reset

        // 3. Name Label (Below car) removed as requested to simplify, or keep if needed?
        // User said: "simplify the display on the drawn cars to just that number"
        // So we comment out the name label below car
        /*
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(driver.name, carX, carY + 20);
        */

        // 4. ET Display (if finished)
        if (et) {
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 5;
            ctx.fillText(`${et.toFixed(3)}s`, carX, carY - 20);
            ctx.shadowBlur = 0;
        }
    }

    renderChristmasTree(ctx, x, y, lightState) {
        // Only render if in PRE_HEAT or just started
        // We want it to persist for a moment on Green
        
        // Tree Box
        ctx.fillStyle = '#111111'; // Solid background color
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