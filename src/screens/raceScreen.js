class RaceScreen {
    constructor() {
        this.raceTime = 0;
        this.eventQueue = []; // Queue for incoming events
        this.currentEvent = null; // Currently displayed event
        this.currentEventTimer = 0; // Time remaining for current event
        this.currentAnalystId = null; // ID of the current commentator
        this.tickerScrollX = 0;
        this.processedEvents = new Set(); // Track unique event objects to prevent duplicates

        // Burner Phone UI state
        this.phoneExpanded = false;
        this.selectedContact = null;
        this.selectedDriver = null;
        this.hoveredContact = null;
        this.hoveredDriver = null;
        this.contactNotification = null;
        this.notificationTimer = 0;
        this.hoveredElement = null; // New property to track hovered UI elements
    }

    reset() {
        this.raceTime = 0;
        this.eventQueue = [];
        this.currentEvent = null;
        this.currentEventTimer = 0;
        this.currentAnalystId = null;
        this.processedEvents = new Set();
        this.contactNotification = null;
        this.notificationTimer = 0;
        this.phoneExpanded = false;
        this.selectedContact = null;
        this.selectedDriver = null;
    }

    update(deltaTime, gameState) {
        this.raceTime += deltaTime;
        this.tickerScrollX -= deltaTime * 0.05;

        // Update notification timer
        if (this.contactNotification) {
            this.notificationTimer += deltaTime;
            if (this.notificationTimer > 3000) { // 3 seconds
                this.contactNotification = null;
                this.notificationTimer = 0;
            }
        }

        // Update Event Timer
        if (this.currentEventTimer > 0) {
            this.currentEventTimer -= deltaTime * 1000; // Convert to ms
        }

        // Process Event Queue
        if (this.currentEventTimer <= 0) {
            if (this.eventQueue.length > 0) {
                // Get next event
                const nextEvent = this.eventQueue.shift();
                this.currentEvent = nextEvent;
                
                // Dynamic timer: If queue is backed up (> 3 events), show faster
                this.currentEventTimer = this.eventQueue.length > 3 ? 1500 : 2500;
                
                // Assign a random analyst
                const analysts = ['a1m', 'a2f', 'a3f', 'a4m', 'a5m', 'a6f', 'a7m', 'a8m'];
                const randomId = analysts[Math.floor(Math.random() * analysts.length)];
                this.currentAnalystId = `analyst_${randomId}`;
            }
        }

        // Get race events from simulator if available
        if (gameState?.race?.simulation) {
            const raceState = gameState.race.simulation.getRaceState();
            if (raceState.events && raceState.events.length > 0) {
                 raceState.events.forEach(event => {
                    // Strict Deduplication: Check if we've already processed this specific event object
                    if (this.processedEvents.has(event)) {
                        return;
                    }
                    this.processedEvents.add(event);

                    let shouldAddEvent = false;

                    // Filter based on EventType (using string literals to match constants.js)
                    switch (event.type) {
                        case 'PIT_STOP':
                        case 'CRASH':
                        case 'MECHANICAL_FAILURE':
                        case 'YELLOW_FLAG':
                        case 'CAUTION_END':
                        case 'CONTACT_USED':
                        case 'RACE_START':
                            shouldAddEvent = true;
                            break;
                        
                        case 'OVERTAKE':
                            // Only top 5
                            if (event.newPosition && event.newPosition <= 5) {
                                shouldAddEvent = true;
                            }
                            break;
                            
                        case 'RACE_FINISH':
                            // Only top 3 finishes (to avoid spam at end)
                            if (event.position && event.position <= 3) {
                                shouldAddEvent = true;
                            }
                            break;

                        case 'LAP_COMPLETE':
                            // Only for the leader
                            const raceLeader = raceState.leaderboard && raceState.leaderboard.length > 0 ? raceState.leaderboard[0] : null;
                            if (raceLeader && raceLeader.driver && raceLeader.driver.name === event.driver) {
                                shouldAddEvent = true;
                            }
                            break;
                    }

                    // Add to Queue with Prioritization
                    if (shouldAddEvent) {
                        // If it's a race finish or crash, prioritize it (unshift)
                        if (event.type === 'RACE_FINISH' || event.type === 'CRASH') {
                            // Insert at the beginning of the queue to show next
                            this.eventQueue.unshift(event.message);
                            // If queue is getting long, cut the current timer short to show this ASAP
                            if (this.currentEventTimer > 1000) {
                                this.currentEventTimer = 1000;
                            }
                        } else {
                            this.eventQueue.push(event.message);
                        }
                    }
                });
            }
        }
    }

    render(ctx, gameState, assetManager) {
        // Use actual canvas dimensions instead of hardcoded values
        const CANVAS_WIDTH = ctx.canvas.width;
        const CANVAS_HEIGHT = ctx.canvas.height;
        const PADDING = 10;
        const SIDE_PANEL_WIDTH = 240;
        const INFO_BAR_HEIGHT = 40;
        const RIGHT_PANEL_X = CANVAS_WIDTH - SIDE_PANEL_WIDTH; // Aligned to the right edge

        // Clear the entire canvas / Draw Background
        let bgDrawn = false;
        if (assetManager) {
            const bg = assetManager.getImage('racescreen-bg');
            if (bg) {
                ctx.drawImage(bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                bgDrawn = true;
            }
        }

        if (!bgDrawn) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
        // Removed the green border around the entire canvas as requested.
        
        // Render main race info (Track name, Lap counter)
        this.renderRaceInfo(ctx, gameState, 0, 0, CANVAS_WIDTH, INFO_BAR_HEIGHT);

        // Render Skip Race Button
        this.renderSkipRaceButton(ctx, gameState, CANVAS_WIDTH - 260, 5, 100, 25);

        // Leaderboard / Standings
        const LEADERBOARD_HEIGHT = 280;
        const LEADERBOARD_Y = INFO_BAR_HEIGHT;
        this.renderLeaderboard(ctx, gameState, RIGHT_PANEL_X, LEADERBOARD_Y, SIDE_PANEL_WIDTH, LEADERBOARD_HEIGHT);


        // Burner Phone
        const BURNER_PHONE_Y = LEADERBOARD_Y + LEADERBOARD_HEIGHT + PADDING;
        const BURNER_PHONE_HEIGHT = 180;
        this.renderBurnerPhone(ctx, gameState, RIGHT_PANEL_X, BURNER_PHONE_Y, SIDE_PANEL_WIDTH, BURNER_PHONE_HEIGHT);

        // Bottom: Live Commentary (formerly Event ticker)
        const EVENT_TICKER_Y = BURNER_PHONE_Y + BURNER_PHONE_HEIGHT + PADDING;
        const EVENT_TICKER_HEIGHT = CANVAS_HEIGHT - EVENT_TICKER_Y - PADDING;
        const EVENT_TICKER_WIDTH = CANVAS_WIDTH - PADDING; // Starts at PADDING=10, ends at 1024 (flush)
        
        // Pass assetManager to renderEventTicker
        this.renderEventTicker(ctx, gameState, PADDING, EVENT_TICKER_Y, EVENT_TICKER_WIDTH, EVENT_TICKER_HEIGHT, assetManager);

        // Top Left: Race Track View (Remaining space)
        const TRACK_VIEW_X = PADDING;
        const TRACK_VIEW_Y = INFO_BAR_HEIGHT;
        const TRACK_VIEW_WIDTH = RIGHT_PANEL_X - PADDING; // Fills space up to PADDING away from the right panels
        const TRACK_VIEW_HEIGHT = EVENT_TICKER_Y - INFO_BAR_HEIGHT - PADDING;
        this.renderTrackView(ctx, gameState, TRACK_VIEW_X, TRACK_VIEW_Y, TRACK_VIEW_WIDTH, TRACK_VIEW_HEIGHT, assetManager);
    }

    renderSkipRaceButton(ctx, gameState, x, y, width, height) {
        // Only render if race is still ongoing
        if (gameState?.race?.isRaceOver || gameState?.race?.simulation?.state === 'FINISHED') {
            return;
        }

        const isHovered = this.hoveredElement === 'skipRaceButton';

        ctx.fillStyle = isHovered ? '#ff0066' : '#cc0055';
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SKIP RACE', x + width / 2, y + height / 2);
    }

    renderContactNotification(ctx, x, y) {
        const notification = this.contactNotification;
        const width = 400;
        const height = 60;
        const notifX = x - width / 2;

        // Fade effect based on timer
        const fadeTime = 500; // 500ms fade in/out
        let alpha = 1.0;

        if (this.notificationTimer < fadeTime) {
            alpha = this.notificationTimer / fadeTime;
        } else if (this.notificationTimer > 2500) {
            alpha = (3000 - this.notificationTimer) / fadeTime;
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(notifX, y, width, height);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(notifX, y, width, height);

        // Title
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'center';
        ctx.fillText(`CONTACT USED: ${notification.type}`, x, y + 22);

        // Message
        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(notification.message.substring(0, 60), x, y + 42);

        ctx.restore();
    }

    renderRaceInfo(ctx, gameState, x, y, width, height) {
        ctx.fillStyle = '#1a0a1a';
        ctx.fillRect(x, y, width, height);

        const trackName = gameState?.currentTrack?.name || 'MONACO NIGHTS';
        
        const raceState = gameState?.race?.simulation?.getRaceState?.() || { currentLap: 1, totalLaps: 20 };
        const lap = raceState.currentLap;
        const totalLaps = raceState.totalLaps;

        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = '#ff0066';
        ctx.textAlign = 'left';
        ctx.fillText(trackName, 20, 27);

        // Draw Bet Info
        if (gameState?.race?.currentBet) {
            const bet = gameState.race.currentBet;
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = '#ffff00';
            ctx.textAlign = 'center';
            ctx.fillText(`BET: ${bet.driverName} ($${bet.amount})`, width / 2, 27);
        }

        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = '#00ffff';
        ctx.textAlign = 'right';
        ctx.fillText(`LAP ${lap}/${totalLaps}`, width - 20, 27);
    }

    renderTrackView(ctx, gameState, x, y, width, height, assetManager) {
        // Get track object
        const track = gameState?.race?.track;
        if (!track) {
            this.renderFallbackTrack(ctx, x, y, width, height);
            return;
        }

        // Track container - fill entire area
        let grassDrawn = false;
        if (assetManager) {
            const grassImg = assetManager.getImage('grass_tile');
            if (grassImg) {
                const pattern = ctx.createPattern(grassImg, 'repeat');
                ctx.fillStyle = pattern;
                ctx.fillRect(x, y, width, height);
                grassDrawn = true;
            }
        }

        if (!grassDrawn) {
            ctx.fillStyle = '#1a2a1a'; // Changed background color
            ctx.fillRect(x, y, width, height);
        }

        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Track drawing area (maximize space - only 8px padding each side, 8px top for title, 6px bottom for lap)
        const trackDisplayX = x + 8;
        const trackDisplayY = y + 8; // Adjusted Y for removed text
        const trackDisplayWidth = width - 16;
        const trackDisplayHeight = height - 16; // Adjusted height for removed text

        // Draw track using waypoints
        if (track.waypoints && track.waypoints.length > 1) {
            this.drawTrackPath(ctx, track, trackDisplayX, trackDisplayY, trackDisplayWidth, trackDisplayHeight);
        }

        // Draw cars on track
        const raceState = gameState?.race?.simulation?.getRaceState?.() || { currentLap: 1, totalLaps: 20, leaderboard: [] };
        const standings = raceState.leaderboard;
        const tier = gameState?.player?.tier || 1;
        this.drawCarsOnTrack(ctx, standings, track, trackDisplayX, trackDisplayY, trackDisplayWidth, trackDisplayHeight, assetManager, tier);

    }

    /**
     * Draw the track path using waypoints
     */
    drawTrackPath(ctx, track, x, y, width, height) {
        // Use the new full track rendering method with normal line width (1.0x)
        track.renderFullTrack(ctx, x, y, width, height);
    }

    /**
     * Draw cars as colored dots or sprites on the track
     */
    drawCarsOnTrack(ctx, standings, track, x, y, width, height, assetManager, tier = 1) {
        if (!standings || !track) return;

        const bounds = track.visualBounds;
        const scaleX = width / bounds.width;
        const scaleY = height / bounds.height;

        // Get car sprite based on tier
        let carSprite = null;
        if (assetManager) {
            const spriteMap = {
                1: 'kart_prod',
                2: 'dirt_prod',
                3: 'gt_prod',
                4: 'lm_prod',
                5: 'stock_prod',
                6: 'open_prod'
            };
            const spriteName = spriteMap[tier] || 'prod_car';
            carSprite = assetManager.getImage(spriteName);
            
            // Fallback to default prod_car if specific tier sprite isn't found
            if (!carSprite) {
                carSprite = assetManager.getImage('prod_car');
            }
        }

        standings.forEach((entry, position) => {
            // Calculate progress around track
            // Each car has currentWaypoint and waypointProgress
            const currentWaypoint = entry.currentWaypoint || 0;
            const waypointProgress = entry.waypointProgress || 0;
            
            // Total progress (0-1 for current lap)
            const segmentProgress = (currentWaypoint + waypointProgress) / track.waypoints.length;

            // Get position on track
            let pos;
            let rotation = 0;

            // Check if car is in the pits or DNF
            if ((entry.status === 'PIT_STOP' || entry.status === 'PIT_ENTRY' || entry.status === 'PIT_EXIT' ||
                 entry.status === 'DNF_CRASH' || entry.status === 'DNF_MECHANICAL') && entry.x !== undefined && entry.y !== undefined) {
                // Use the car's actual x, y coordinates from the race simulation
                pos = { x: entry.x, y: entry.y };
                // For rotation, use track direction as fallback since we don't have velocity vector here reliably
                rotation = track.getDirectionAtProgress(segmentProgress);
            } else {
                pos = track.getPositionAtProgress(segmentProgress);
                rotation = track.getDirectionAtProgress(segmentProgress);
            }

            // Convert to screen coordinates
            const screenX = x + (pos.x - bounds.minX) * scaleX;
            const screenY = y + (pos.y - bounds.minY) * scaleY;

            // Draw car dot or sprite with team color
            const teamColor = entry.driver?.teamColor || entry.teamColor || '#00ffff';

            if (carSprite) {
                const carWidth = 16; // Scale down to similar size as previous dots (approx 16px width)
                const aspectRatio = carSprite.width > 0 ? carSprite.height / carSprite.width : 0.5;
                const carHeight = carWidth * aspectRatio;

                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(rotation);
                
                // Draw car sprite centered
                ctx.drawImage(carSprite, -carWidth / 2, -carHeight / 2, carWidth, carHeight);

                // Apply color overlay using multiply blend mode (tints the white car)
                ctx.globalCompositeOperation = 'multiply';
                ctx.fillStyle = teamColor;
                ctx.fillRect(-carWidth / 2, -carHeight / 2, carWidth, carHeight);
                
                ctx.restore();

                // Position number above car (upright)
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.font = 'bold 10px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.strokeText(String(position + 1), screenX, screenY - 6);
                ctx.fillText(String(position + 1), screenX, screenY - 6);

            } else {
                // Fallback: Draw dot
                ctx.fillStyle = teamColor;
                ctx.beginPath();
                ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
                ctx.fill();

                // Position number inside
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 9px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(position + 1), screenX, screenY);
            }

            // Status indicator (if crashed or DNF)
            if (entry.status && entry.status !== 'RACING' && entry.status !== 'FINISHED' && 
                !entry.status.includes('PIT')) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(screenX, screenY, 9, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
    }

    getEventColor(message) {
        if (message.includes('crash') || message.includes('incident') || message.includes('out of race')) {
            return '#ff3333'; // Red for crashes/incidents
        } else if (message.includes('finish') || message.includes('FINISHED')) {
            return '#33ff33'; // Green for race finishes
        } else if (message.includes('pit') || message.includes('pits')) {
            return '#ffff33'; // Yellow for pit stops
        } else if (message.includes('overtake') || message.includes('overtakes')) {
            return '#33ffff'; // Cyan for overtakes
        } else if (message.includes('caution') || message.includes('safety car') || message.includes('yellow flag')) {
            return '#ff9933'; // Orange for caution/safety car/yellow flag
        }
        return '#ffffff'; // White for general events
    }

    /**
     * Fallback track display
     */
    renderFallbackTrack(ctx, x, y, width, height) {
        // Simple oval
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'left';
        ctx.fillText('TRACK', x + 10, y + 18);

        // Draw simple oval
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radiusX = (width - 40) / 2;
        const radiusY = (height - 80) / 2;

        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Start/finish
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - radiusX - 5, centerY - 8);
        ctx.lineTo(centerX - radiusX - 5, centerY + 8);
        ctx.stroke();
    }

    renderLeaderboard(ctx, gameState, x, y, width, height) {
        // Leaderboard container
        ctx.fillStyle = 'rgba(26, 26, 26, 0.85)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = this.selectedContact ? '#ff0066' : '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Title
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillStyle = this.selectedContact ? '#ff0066' : '#ffff00';
        ctx.textAlign = 'left';
        ctx.fillText(this.selectedContact ? 'TARGET' : 'STANDINGS', x + 8, y + 16);

        // Show instruction if contact selected
        if (this.selectedContact) {
            ctx.font = '8px "Courier New", monospace';
            ctx.fillStyle = '#00ff00';
            ctx.fillText(`[${this.selectedContact}]`, x + 8, y + 26);
        }

        // Driver standings
        const raceState = gameState?.race?.simulation?.getRaceState?.() || { currentLap: 1, totalLaps: 20, leaderboard: [] };
        const drivers = raceState.leaderboard;
        
        // Handle empty standings (all cars crashed/DNF'd)
        if (!drivers || drivers.length === 0) {
            ctx.font = '11px "Courier New", monospace';
            ctx.fillStyle = '#ff6666';
            ctx.textAlign = 'center';
            ctx.fillText('NO FINISHERS', x + width / 2, y + height / 2 - 10);
            ctx.font = '9px "Courier New", monospace';
            ctx.fillStyle = '#aaaaaa';
            ctx.fillText('(Race ended early)', x + width / 2, y + height / 2 + 10);
            return;
        }

        const rowHeight = 24; // Changed from 28 to 24 to fit 10 drivers
        const startY = y + (this.selectedContact ? 42 : 32); // Adjusted down by 10px to clear title
        const maxRows = 10; // Fixed to show top 10 drivers

        drivers.slice(0, maxRows).forEach((driver, index) => {
            const rowY = startY + index * rowHeight;
            
            const driverName = driver.driver?.name || driver.name || 'UNKNOWN';
            const teamColor = driver.driver?.teamColor || driver.teamColor || '#ffffff';
            
            // Ensure gap and gapToAhead are always strings, even if simulation isn't fully ready
            let gapToLeader = driver.gap !== undefined ? driver.gap : (index === 0 ? 'LEADER' : 'N/A');
            let gapToAhead = driver.gapToAhead !== undefined ? driver.gapToAhead : (index === 0 ? 'LEADER' : 'N/A');

            if (index === 0) {
                gapToAhead = '-';
            }

            const isHovered = this.hoveredDriver === driverName;
            const isTargetable = this.selectedContact !== null;

            // Highlight row if hovering with contact selected
            if (isHovered && isTargetable) {
                ctx.fillStyle = 'rgba(255, 0, 102, 0.2)';
                ctx.fillRect(x + 2, rowY - 14 + (28-rowHeight)/2, width - 4, rowHeight - 2); // Adjust y position
            }

            // Position number
            ctx.font = 'bold 11px "Courier New", monospace';
            ctx.fillStyle = index === 0 ? '#ffff00' : '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(`${index + 1}.`, x + 5, rowY + (28-rowHeight)/2); // Adjusted X and Y to compensate for removed strip and new rowHeight

            // Driver name (shortened)
            ctx.font = '10px "Courier New", monospace';
            ctx.fillStyle = isHovered && isTargetable ? '#ff0066' : teamColor;
            ctx.fillText(driverName.substring(0, 10), x + 35, rowY + (28-rowHeight)/2); // Adjusted X and Y

            // Gap to Ahead (right aligned)
            ctx.font = '9px "Courier New", monospace';
            ctx.fillStyle = '#bbbbbb'; // Brighter
            ctx.textAlign = 'right';
            ctx.fillText(gapToAhead, x + width - 70, rowY + (28-rowHeight)/2); // Adjusted Y

            // Gap to Leader (right aligned)
            ctx.font = '9px "Courier New", monospace';
            ctx.fillStyle = '#999999'; // Brighter
            ctx.textAlign = 'right';
            ctx.fillText(gapToLeader, x + width - 5, rowY + (28-rowHeight)/2); // Adjusted Y
        });
    }

    renderEventTicker(ctx, gameState, x, y, width, height, assetManager) {
        // Ticker container
        ctx.fillStyle = 'rgba(26, 26, 26, 0.85)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Title (Live Commentary)
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'left';
        ctx.fillText('LIVE COMMENTARY', x + 10, y + 15);

        // --- COMMENTATOR IMAGE (RIGHT SIDE) ---
        // Make it square, padding from top/bottom/right
        const imagePadding = 6;
        // Calculate max possible size based on height
        const maxImgSize = height - (imagePadding * 2);
        const imgSize = maxImgSize; // Square
        const imgX = x + width - imgSize - imagePadding;
        const imgY = y + imagePadding;

        // Draw image background/border
        ctx.fillStyle = '#000000';
        ctx.fillRect(imgX, imgY, imgSize, imgSize);
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.strokeRect(imgX, imgY, imgSize, imgSize);

        // Draw Analyst Image
        if (assetManager && this.currentAnalystId) {
            const analystImg = assetManager.getImage(this.currentAnalystId);
            if (analystImg) {
                ctx.drawImage(analystImg, imgX, imgY, imgSize, imgSize);
            } else {
                 // Fallback text if image missing
                 ctx.font = '10px monospace';
                 ctx.fillStyle = '#333';
                 ctx.textAlign = 'center';
                 ctx.fillText("NO IMG", imgX + imgSize/2, imgY + imgSize/2);
            }
        }

        // --- COMMENTARY TEXT (CENTERED in remaining space) ---
        const textX = x + 10; // Left padding
        const textWidth = width - imgSize - imagePadding - 20; // Available width minus image
        const textCenterY = y + (height / 2);

        if (this.currentEvent) {
            const message = this.currentEvent;
            const color = this.getEventColor(message.toLowerCase());
            
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Simple word wrap
            const words = message.split(' ');
            let line = '';
            const lines = [];

            // Calculate approx char width or use measureText if precise
            // Using simple wrap for now
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > textWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);

            // Draw lines centered vertically
            const lineHeight = 20;
            const totalTextHeight = lines.length * lineHeight;
            let startY = textCenterY - (totalTextHeight / 2) + (lineHeight / 2);
            
            // Add a slight visual background for the text for better readability?
            // Maybe not needed if background is dark enough.

            lines.forEach((l, i) => {
                 ctx.fillText(l, textX + (textWidth / 2), startY + (i * lineHeight));
            });

        } else {
            // Idle Text
            ctx.font = 'italic 14px "Courier New", monospace';
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("Waiting for updates...", textX + (textWidth / 2), textCenterY);
        }
    }

    renderBurnerPhone(ctx, gameState, x, y, width, height) {
        // Check if Rolodex upgrade is owned
        const hasRolodex = gameState?.player?.upgrades?.includes('rolodex') || false;

        // Phone container
        ctx.fillStyle = 'rgba(26, 26, 26, 0.85)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = hasRolodex ? '#ff0066' : '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Title
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.fillStyle = hasRolodex ? '#ff0066' : '#666666';
        ctx.textAlign = 'left';
        ctx.fillText('BURNER', x + 8, y + 14);

        if (!hasRolodex) {
            // Locked state
            ctx.font = '9px "Courier New", monospace';
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'center';
            ctx.fillText('LOCKED', x + width / 2, y + height / 2);
            return;
        }

        // Get burner phone status from race simulation
        const phoneStatus = gameState?.race?.simulation?.burnerPhone?.getStatus();
        if (!phoneStatus) {
            ctx.font = '9px "Courier New", monospace';
            ctx.fillStyle = '#aaaaaa';
            ctx.textAlign = 'left';
            ctx.fillText('No signal', x + 8, y + 35);
            return;
        }

        // Battery display (compact)
        const batteryY = y + 25;
        ctx.font = '8px "Courier New", monospace';
        ctx.fillStyle = '#888888';
        ctx.textAlign = 'left';
        ctx.fillText('BAT:', x + 8, batteryY);

        // Battery bars (small)
        const barWidth = 8;
        const barHeight = 6;
        for (let i = 0; i < 3; i++) {
            const barX = x + 32 + i * (barWidth + 1);
            const filled = i < phoneStatus.battery;
            ctx.fillStyle = filled ? '#00ff00' : '#333333';
            ctx.fillRect(barX, batteryY - 5, barWidth, barHeight);
        }

        // Heat display
        const heatY = batteryY + 12;
        ctx.font = '8px "Courier New", monospace';
        ctx.fillStyle = '#888888';
        ctx.textAlign = 'left';
        ctx.fillText('HEAT:', x + 8, heatY);

        // Heat bar
        const heatBarWidth = width - 35;
        const heatBarX = x + 32;
        const heatBarHeight = 4;
        const heatPercent = phoneStatus.heat / phoneStatus.maxHeat;

        ctx.fillStyle = '#333333';
        ctx.fillRect(heatBarX, heatY - 3, heatBarWidth, heatBarHeight);

        const heatFillWidth = heatBarWidth * heatPercent;
        if (heatFillWidth > 0) {
            const heatColor = this.getHeatColor(heatPercent);
            ctx.fillStyle = heatColor;
            ctx.fillRect(heatBarX, heatY - 3, heatFillWidth, heatBarHeight);
        }

        // Active contacts list (compact)
        const contactsY = heatY + 10;
        ctx.font = '8px "Courier New", monospace';
        const contacts = ['Spotter', 'Marshal', 'Heckler', 'Engineer'];
        
        contacts.forEach((contact, idx) => {
            const canUse = phoneStatus && idx < 4;
            const contactY = contactsY + idx * 10;
            
            ctx.fillStyle = this.selectedContact === contact ? '#ff0066' : (canUse ? '#00ff00' : '#444444');
            ctx.textAlign = 'left';
            ctx.fillText(`${idx + 1}.${contact.substring(0, 4)}`, x + 8, contactY);
        });
    }

    getHeatColor(heatPercent) {
        if (heatPercent < 0.5) {
            // Green to yellow
            const r = Math.floor(255 * (heatPercent * 2));
            return `rgb(${r}, 255, 0)`;
        } else {
            // Yellow to red
            const g = Math.floor(255 * (1 - (heatPercent - 0.5) * 2));
            return `rgb(255, ${g}, 0)`;
        }
    }

    renderContactTooltip(ctx, contact, x, y) {
        const tooltipWidth = 140;
        const tooltipHeight = 40;

        // Tooltip background
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, tooltipWidth, tooltipHeight);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, tooltipWidth, tooltipHeight);

        // Tooltip text
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(contact.type, x + 5, y + 12);

        ctx.font = '9px "Courier New", monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(contact.desc, x + 5, y + 25);

        ctx.fillStyle = '#ffff00';
        ctx.fillText(`Cost: ${contact.cost} Battery`, x + 5, y + 35);
    }

    handleClick(x, y, gameState) {
        // Check if Rolodex is unlocked
        const hasRolodex = gameState?.player?.upgrades?.includes('rolodex') || false;

        // --- COMMON LAYOUT CONSTANTS ---
        const CANVAS_WIDTH = 1280; // Updated to standard 1280 resolution
        const INFO_BAR_HEIGHT = 40;
        const SIDE_PANEL_WIDTH = 240;
        const PADDING = 10;
        const RIGHT_PANEL_X = CANVAS_WIDTH - SIDE_PANEL_WIDTH;
        const LEADERBOARD_HEIGHT = 280;
        const BURNER_PHONE_Y = INFO_BAR_HEIGHT + LEADERBOARD_HEIGHT + PADDING;
        const BURNER_PHONE_HEIGHT = 180;

        const SKIP_BUTTON_WIDTH = 100;
        const SKIP_BUTTON_HEIGHT = 25;
        const SKIP_BUTTON_X = CANVAS_WIDTH - 260; // Moved left
        const SKIP_BUTTON_Y = 5; // 5px from top edge
        // --- END COMMON LAYOUT CONSTANTS ---

        // Check for Skip Race button click
        if (!gameState?.race?.isRaceOver && !gameState?.race?.simulation?.isRaceOver && // Add original condition back
            x >= SKIP_BUTTON_X && x <= SKIP_BUTTON_X + SKIP_BUTTON_WIDTH &&
            y >= SKIP_BUTTON_Y && y <= SKIP_BUTTON_Y + SKIP_BUTTON_HEIGHT) {
            this.handleSkipRace(gameState);
            return { action: 'skipRace' }; // Indicate that race was skipped
        }

        if (!hasRolodex) return null;

        // Burner phone bounds (new layout)
        const phoneX = RIGHT_PANEL_X;
        const phoneY = BURNER_PHONE_Y;
        const phoneWidth = SIDE_PANEL_WIDTH;
        const phoneHeight = BURNER_PHONE_HEIGHT;

        // Check if click is in burner phone area
        if (x >= phoneX && x <= phoneX + phoneWidth && y >= phoneY && y <= phoneY + phoneHeight) {
            const contactsY = phoneY + 35;
            const contacts = ['Spotter', 'Marshal', 'Heckler', 'Engineer'];

            // Check if clicking on a contact button
            contacts.forEach((contact, index) => {
                const contactY = contactsY + index * 20;
                if (y >= contactY && y <= contactY + 18) {
                    if (gameState?.race?.simulation?.burnerPhone?.canUseContact(contact) || false) {
                        // Select this contact
                        this.selectedContact = contact;
                    }
                }
            });
        }

                    // Check if clicking on leaderboard to select driver (when contact is selected)
                    if (this.selectedContact) {
                        const leaderboardX = RIGHT_PANEL_X;
                        const leaderboardY = INFO_BAR_HEIGHT;
                        const leaderboardWidth = SIDE_PANEL_WIDTH;
                        const leaderboardHeight = LEADERBOARD_HEIGHT;
        
                        if (x >= leaderboardX && x <= leaderboardX + leaderboardWidth &&
                            y >= leaderboardY && y <= leaderboardY + leaderboardHeight) {
        
                            const drivers = gameState?.race?.raceStandings || [];                const rowHeight = 28;
                const startY = leaderboardY + 32;

                drivers.forEach((driver, index) => {
                    const rowY = startY + index * rowHeight;
                    if (y >= rowY - 14 && y <= rowY + 14) {
                        // Use contact on this driver
                        const driverName = driver.driver?.name || driver.name || 'UNKNOWN';
                        return this.useContactOnDriver(driverName, gameState);
                    }
                });
            }
        }

        return null;
    }

    handleMouseMove(x, y, gameState) {
        // Reset hover states
        this.hoveredContact = null;
        this.hoveredDriver = null;
        this.hoveredElement = null; // Reset hovered element at the start of each move event

        // Check if Rolodex is unlocked
        const hasRolodex = gameState?.player?.upgrades?.includes('rolodex') || false;

        // --- COMMON LAYOUT CONSTANTS ---
        const CANVAS_WIDTH = 1280; // Updated to standard 1280 resolution
        const INFO_BAR_HEIGHT = 40;
        const SIDE_PANEL_WIDTH = 240;
        const PADDING = 10;
        const RIGHT_PANEL_X = CANVAS_WIDTH - SIDE_PANEL_WIDTH;
        const LEADERBOARD_HEIGHT = 280;
        const BURNER_PHONE_Y = INFO_BAR_HEIGHT + LEADERBOARD_HEIGHT + PADDING;
        const BURNER_PHONE_HEIGHT = 180;

        const SKIP_BUTTON_WIDTH = 100;
        const SKIP_BUTTON_HEIGHT = 25;
        const SKIP_BUTTON_X = CANVAS_WIDTH - 260; // Moved left
        const SKIP_BUTTON_Y = 5; // 5px from top edge
        // --- END COMMON LAYOUT CONSTANTS ---

        // Check hover on Skip Race button
        if (!gameState?.race?.isRaceOver && !gameState?.race?.simulation?.isRaceOver && // Add original condition back
            x >= SKIP_BUTTON_X && x <= SKIP_BUTTON_X + SKIP_BUTTON_WIDTH &&
            y >= SKIP_BUTTON_Y && y <= SKIP_BUTTON_Y + SKIP_BUTTON_HEIGHT) {
            this.hoveredElement = 'skipRaceButton';
            return; // No need to check other elements if button is hovered
        }
        
        if (!hasRolodex) return;

        // Burner phone bounds (new layout)
        const phoneX = RIGHT_PANEL_X;
        const phoneY = BURNER_PHONE_Y;
        const phoneWidth = SIDE_PANEL_WIDTH;
        const phoneHeight = BURNER_PHONE_HEIGHT;

        // Check hover on contacts
        if (x >= phoneX && x <= phoneX + phoneWidth && y >= phoneY && y <= phoneY + phoneHeight) {
            const contactsY = phoneY + 35;
            const contacts = ['Spotter', 'Marshal', 'Heckler', 'Engineer'];

            contacts.forEach((contact, index) => {
                const contactY = contactsY + index * 20;
                if (y >= contactY && y <= contactY + 18) {
                    this.hoveredContact = contact;
                }
            });
        }

        // Check hover on drivers (when contact selected)
        if (this.selectedContact) {
            const leaderboardX = RIGHT_PANEL_X;
            const leaderboardY = INFO_BAR_HEIGHT;
            const leaderboardWidth = SIDE_PANEL_WIDTH;
            const leaderboardHeight = LEADERBOARD_HEIGHT;

            if (x >= leaderboardX && x <= leaderboardX + leaderboardWidth &&
                y >= leaderboardY && y <= leaderboardY + leaderboardHeight) {

                const drivers = gameState?.race?.raceStandings || [];
                const rowHeight = 28;
                const startY = leaderboardY + 32;

                drivers.forEach((driver, index) => {
                    const rowY = startY + index * rowHeight;
                    if (y >= rowY - 14 && y <= rowY + 14) {
                        const driverName = driver.driver?.name || driver.name || 'UNKNOWN';
                        this.hoveredDriver = driverName;
                    }
                });
            }
        }
    }

    useContactOnDriver(driverName, gameState) {
        if (!this.selectedContact || !gameState?.race?.simulation) {
            return null;
        }

        // Use the burner phone contact
        const result = gameState.race.simulation.useBurnerPhone(this.selectedContact, driverName);

        if (result.success) {
            // Show notification
            this.contactNotification = {
                type: this.selectedContact,
                target: driverName,
                message: result.effect
            };
            this.notificationTimer = 0;

            // Clear selection
            this.selectedContact = null;

            return { action: 'contactUsed', result };
        }

        return null;
    }

        generateDummyPositions(count) {

            return Array.from({ length: count }, (_, i) => ({

                angle: (i / count) * Math.PI * 2 + Math.random() * 0.3

            }));

        }

    

        handleSkipRace(gameState) {

            if (gameState?.race?.simulation) {

                gameState.race.simulation.forceFinishRace();

                // Assuming race simulation will update its state to finished,

                // which in turn will be picked up by the main game loop to switch screens.

                // If not, we might need a direct call here.

                gameState.ui.currentScreen = 'resultsScreen';

            }

        }

    }

    

    export default RaceScreen;