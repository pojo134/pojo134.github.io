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

    renderTrackStartExtension(ctx, track, x, y, width, height, panelBottomY) {
        if (!track.waypoints || track.waypoints.length === 0) return;

        // Calculate scale matching renderFullTrack logic
        const bounds = track.visualBounds;
        const scaleX = width / bounds.width;
        const scaleY = height / bounds.height;
        const scale = Math.min(scaleX, scaleY);
        const scaledTrackWidth = track.trackWidth * scale;

        // Get start point (waypoint 0)
        const w0 = track.waypoints[0];
        const screen0 = track.trackToScreen(w0.x, w0.y, x, y, width, height);

        const topY = screen0.screenY;
        const bottomY = panelBottomY; // Extend to bottom of panel
        const centerX = screen0.screenX;

        const topWidth = scaledTrackWidth;
        const bottomWidth = scaledTrackWidth * 5.0; // Widen significantly to create the perspective effect

        ctx.save();

        // Gravel/Dirt base
        const gravelPaddingTop = 12 * scale;
        const gravelPaddingBottom = 40 * scale;
        
        ctx.beginPath();
        ctx.moveTo(centerX - topWidth / 2 - gravelPaddingTop, topY);
        ctx.lineTo(centerX + topWidth / 2 + gravelPaddingTop, topY);
        ctx.lineTo(centerX + bottomWidth / 2 + gravelPaddingBottom, bottomY);
        ctx.lineTo(centerX - bottomWidth / 2 - gravelPaddingBottom, bottomY);
        ctx.fillStyle = "#5a3a2a";
        ctx.fill();

        // Asphalt
        ctx.beginPath();
        ctx.moveTo(centerX - topWidth / 2, topY);
        ctx.lineTo(centerX + topWidth / 2, topY);
        ctx.lineTo(centerX + bottomWidth / 2, bottomY);
        ctx.lineTo(centerX - bottomWidth / 2, bottomY);
        ctx.fillStyle = "#333";
        ctx.fill();

        // Side Lines (White)
        ctx.beginPath();
        ctx.moveTo(centerX - topWidth / 2, topY);
        ctx.lineTo(centerX - bottomWidth / 2, bottomY);
        ctx.moveTo(centerX + topWidth / 2, topY);
        ctx.lineTo(centerX + bottomWidth / 2, bottomY);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    renderTrackEndExtension(ctx, track, x, y, width, height, panelTopY) {
        if (!track.waypoints || track.waypoints.length === 0) return;

        // Calculate scale matching renderFullTrack logic
        const bounds = track.visualBounds;
        const scaleX = width / bounds.width;
        const scaleY = height / bounds.height;
        const scale = Math.min(scaleX, scaleY);
        const scaledTrackWidth = track.trackWidth * scale;

        // Get end point (last waypoint)
        const wLast = track.waypoints[track.waypoints.length - 1];
        const screenLast = track.trackToScreen(wLast.x, wLast.y, x, y, width, height);

        const bottomY = screenLast.screenY; // Finish line (top of generated track)
        const topY = panelTopY; // Extend to top of panel
        const centerX = screenLast.screenX;

        // Use a uniform width for the entire extension
        const uniformExtensionWidth = scaledTrackWidth; 

        ctx.save();

        // Gravel/Dirt on sides
        const gravelPadding = 40 * scale; // Keep this consistent with start extension's general padding style

        ctx.fillStyle = "#5a3a2a";
        // Left Gravel
        ctx.fillRect(centerX - uniformExtensionWidth / 2 - gravelPadding, topY, gravelPadding, bottomY - topY);
        // Right Gravel
        ctx.fillRect(centerX + uniformExtensionWidth / 2, topY, gravelPadding, bottomY - topY);

        // Asphalt
        ctx.fillStyle = "#333";
        ctx.fillRect(centerX - uniformExtensionWidth / 2, topY, uniformExtensionWidth, bottomY - topY);

        // Side Lines (White)
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Left line
        ctx.moveTo(centerX - uniformExtensionWidth / 2, bottomY);
        ctx.lineTo(centerX - uniformExtensionWidth / 2, topY);
        // Right line
        ctx.moveTo(centerX + uniformExtensionWidth / 2, bottomY);
        ctx.lineTo(centerX + uniformExtensionWidth / 2, topY);
        ctx.stroke();

        // checkered line at bottomY
        const checkerHeight = 5 * scale;
        const numCheckers = 10;
        const checkerWidth = uniformExtensionWidth / numCheckers;

        for (let i = 0; i < numCheckers; i++) {
            const checkerX = centerX - uniformExtensionWidth / 2 + (i * checkerWidth);
            ctx.fillStyle = (i % 2 === 0) ? '#FFFFFF' : '#000000'; // Alternating white and black
            ctx.fillRect(checkerX, bottomY - checkerHeight, checkerWidth, checkerHeight);
        }

        ctx.restore();
    }

    renderTrackEndExtension(ctx, track, x, y, width, height, panelTopY) {
        if (!track.waypoints || track.waypoints.length === 0) return;

        // Calculate scale matching renderFullTrack logic
        const bounds = track.visualBounds;
        const scaleX = width / bounds.width;
        const scaleY = height / bounds.height;
        const scale = Math.min(scaleX, scaleY);
        const scaledTrackWidth = track.trackWidth * scale;

        // Get end point (last waypoint)
        const wLast = track.waypoints[track.waypoints.length - 1];
        const screenLast = track.trackToScreen(wLast.x, wLast.y, x, y, width, height);

        const bottomY = screenLast.screenY; // Finish line (top of generated track)
        const topY = panelTopY; // Extend to top of panel
        const centerX = screenLast.screenX;

        // Use a uniform width for the entire extension
        const uniformExtensionWidth = scaledTrackWidth; 

        ctx.save();

        // Gravel/Dirt on sides
        const gravelPadding = 40 * scale; // Keep this consistent with start extension's general padding style

        ctx.fillStyle = "#5a3a2a";
        // Left Gravel
        ctx.fillRect(centerX - uniformExtensionWidth / 2 - gravelPadding, topY, gravelPadding, bottomY - topY);
        // Right Gravel
        ctx.fillRect(centerX + uniformExtensionWidth / 2, topY, gravelPadding, bottomY - topY);

        // Asphalt
        ctx.fillStyle = "#333";
        ctx.fillRect(centerX - uniformExtensionWidth / 2, topY, uniformExtensionWidth, bottomY - topY);

        // Side Lines (White)
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Left line
        ctx.moveTo(centerX - uniformExtensionWidth / 2, bottomY);
        ctx.lineTo(centerX - uniformExtensionWidth / 2, topY);
        // Right line
        ctx.moveTo(centerX + uniformExtensionWidth / 2, bottomY);
        ctx.lineTo(centerX + uniformExtensionWidth / 2, topY);
        ctx.stroke();

        // checkered line at bottomY
        const checkerHeight = 5 * scale;
        const numCheckers = 10;
        const checkerWidth = uniformExtensionWidth / numCheckers;

        for (let i = 0; i < numCheckers; i++) {
            const checkerX = centerX - uniformExtensionWidth / 2 + (i * checkerWidth);
            ctx.fillStyle = (i % 2 === 0) ? '#FFFFFF' : '#000000'; // Alternating white and black
            ctx.fillRect(checkerX, bottomY - checkerHeight, checkerWidth, checkerHeight);
        }

        ctx.restore();
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

        // Render Extensions AFTER (so they draw on top of the track ends to clean up lines)
        this.renderTrackStartExtension(ctx, track, renderX, renderY, renderW, renderH, y + height);
        this.renderTrackEndExtension(ctx, track, renderX, renderY, renderW, renderH, y);

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

        // Render ET Slip Data
        if (this.bracketState.heatState) {
            const heat = this.bracketState.heatState;
            this._renderDriverETSlip(ctx, heat, 1, x, y, width, height); // Driver 1 (left lane)
            this._renderDriverETSlip(ctx, heat, 2, x, y, width, height); // Driver 2 (right lane)
        }
    }

    renderCarOnStrip(ctx, displayX, displayY, displayWidth, displayHeight, carController, driver, et, laneDirection) {
        if (!carController) return;
        
        const track = this.bracketState.track;
        if (!track) return;

        const dragDistance = this.bracketState.DRAG_DISTANCE || 1200;
        
        // visualDistance now comes directly from the simulator's carController.currentWaypoint
        const visualDistance = carController.currentWaypoint;
        
        let screenPos;
        
        if (visualDistance <= dragDistance) {
            // Use track.getPositionAtProgress for positions within the defined track length
            // We need to calculate progress correctly for getPositionAtProgress
            const progressRatio = visualDistance / dragDistance;
            const trackPos = track.getPositionAtProgress(progressRatio);
            screenPos = track.trackToScreen(trackPos.x, trackPos.y, displayX, displayY, displayWidth, displayHeight);
        } else {
            // Extrapolate screen position linearly past the finish line
            const wLast = track.waypoints[track.waypoints.length - 1];
            const screenLast = track.trackToScreen(wLast.x, wLast.y, displayX, displayY, displayWidth, displayHeight);
            
            const scale = displayWidth / track.visualBounds.width; // Assuming scale is consistent
            
            const pixelOffset = (visualDistance - dragDistance) * scale;
            
            // Apply offset (UP means decreasing Y on canvas)
            screenPos = {
                screenX: screenLast.screenX,
                screenY: screenLast.screenY - pixelOffset
            };
        }
        
        // Calculate visual lane offset
        const scale = displayWidth / track.visualBounds.width;
        const laneOffset = 15 * scale * laneDirection; 

        const carX = screenPos.screenX + laneOffset;
        const carY = screenPos.screenY;

        // Stop drawing cars once they are significantly off-screen at the top
        // Add a buffer so they fully disappear
        if (carY < displayY - 50) { 
            return;
        }

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


    }

    _renderDriverETSlip(ctx, heatState, driverNum, panelX, panelY, panelWidth, panelHeight) {
        const driver = heatState[`driver${driverNum}`];
        const rt = heatState[`reactionTime${driverNum}`];
        const ft60 = heatState[`car${driverNum}_60ftTime`];
        const ft330 = heatState[`car${driverNum}_330ftTime`];
        const ft660 = heatState[`car${driverNum}_660ftTime`];
        const ft660mph = heatState[`car${driverNum}_660ftMPH`];
        const ft1000 = heatState[`car${driverNum}_1000ftTime`]; // New: 1000ft time
        const et = heatState[`car${driverNum}ET`];
        const etmph = heatState[`car${driverNum}_ET_MPH`];
        
        const isLeftLane = driverNum === 1;
        // Reverted to left/right alignment
        const textX = isLeftLane ? panelX + 10 : panelX + panelWidth - 10;
        const align = isLeftLane ? 'left' : 'right';
        
        ctx.textAlign = align;
        ctx.shadowBlur = 0; // Reset shadow if any

        // Calculate total height of the text block to vertically center it
        // Driver Name: 22px + 30px spacing + 6 lines of 16px (20px lineHeight) + 2 lines of 18px (20px lineHeight)
        const nameHeight = 22;
        const nameSpacing = 30;
        const regularLineHeight = 20; // for 16px font
        const finalLineHeight = 20; // for 18px font (bold)
        const numRegularLines = 6; // RT, 60FT, 330FT, 1/8, 1/8 Speed, 1000FT
        const numFinalLines = 2; // 1/4 ET, MPH

        const totalTextHeight = nameHeight + nameSpacing + (numRegularLines * regularLineHeight) + (numFinalLines * finalLineHeight);
        let currentY = panelY + (panelHeight / 2) - (totalTextHeight / 2); // Vertically centered

        // Driver Name at the very top of the centered block
        ctx.fillStyle = driver.teamColor || this.colors.text;
        ctx.font = 'bold 22px "Courier New", monospace'; // Increased by 2px
        ctx.fillText(driver.name.toUpperCase(), textX, currentY);
        currentY += nameSpacing; // Space after name

        ctx.fillStyle = this.colors.text;
        ctx.font = '16px "Courier New", monospace'; // Increased by 2px
        const lineHeight = regularLineHeight; // Adjusted for new font size

        // Display ET data points if available
        // Reaction Time (RT)
        if (rt && heatState.heatRaceTime >= rt) { // Only show RT once race starts
            ctx.fillText(`R/T: ${rt.toFixed(3)}`, textX, currentY);
        } else {
             ctx.fillText(`R/T: ---`, textX, currentY);
        }
        currentY += lineHeight;

        // 60ft
        if (ft60) {
            ctx.fillText(`60': ${ft60.toFixed(3)}`, textX, currentY);
        } else {
             ctx.fillText(`60': ---`, textX, currentY);
        }
        currentY += lineHeight;

        // 330ft
        if (ft330) {
            ctx.fillText(`330': ${ft330.toFixed(3)}`, textX, currentY);
        } else {
             ctx.fillText(`330': ---`, textX, currentY);
        }
        currentY += lineHeight;

        // 1/8 Mile (660ft) ET & MPH
        if (ft660) {
            ctx.fillText(`1/8: ${ft660.toFixed(3)}`, textX, currentY);
        } else {
             ctx.fillText(`1/8: ---`, textX, currentY);
        }
        currentY += lineHeight;
        if (ft660mph) {
            ctx.fillText(`MPH: ${ft660mph.toFixed(1)}`, textX, currentY); // Simplified display
        } else {
             ctx.fillText(`MPH: ---`, textX, currentY);
        }
        currentY += lineHeight;

        // 1000ft
        if (ft1000) {
            ctx.fillText(`1000': ${ft1000.toFixed(3)}`, textX, currentY);
        } else {
            ctx.fillText(`1000': ---`, textX, currentY);
        }
        currentY += lineHeight;


        // Final ET & MPH (only if race is finished)
        if (et && heatState.heatFinished) {
            ctx.fillStyle = this.colors.textHighlight;
            ctx.font = 'bold 18px "Courier New", monospace'; // Increased by 2px
            ctx.fillText(`1/4 ET: ${et.toFixed(3)}`, textX, currentY);
            currentY += finalLineHeight;
            ctx.fillText(`MPH: ${etmph ? etmph.toFixed(1) : '---'}`, textX, currentY);
        } else {
            ctx.fillStyle = this.colors.text;
            ctx.font = '16px "Courier New", monospace'; // Increased by 2px
            ctx.fillText(`1/4 ET: ---`, textX, currentY);
            currentY += finalLineHeight;
            ctx.fillText(`MPH: ---`, textX, currentY);
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