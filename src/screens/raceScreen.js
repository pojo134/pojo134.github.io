class RaceScreen {
    constructor() {
        this.raceTime = 0;
        this.eventLog = [];
        this.maxLogEntries = 10;
        this.tickerScrollX = 0;
        this.lastEventDisplayTime = 0; // Throttle for event ticker

        // Burner Phone UI state
        this.phoneExpanded = false;
        this.selectedContact = null;
        this.selectedDriver = null;
        this.hoveredContact = null;
        this.hoveredDriver = null;
        this.contactNotification = null;
        this.notificationTimer = 0;
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

        // Get race events from simulator if available
        // Throttle event display so ticker scrolls at readable pace
        if (gameState?.race?.simulation) {
            const raceState = gameState.race.simulation.getRaceState();
            if (raceState.events && raceState.events.length > 0) {
                // Only process events if enough time has passed (throttle to 2 events per second max)
                const timeSinceLastEvent = Date.now() - (this.lastEventDisplayTime || 0);
                if (timeSinceLastEvent > 500) { // 500ms between event displays
                    // Add new events to log
                    raceState.events.forEach(event => {
                        // Filter out LAP_COMPLETE events UNLESS it's for the race leader
                        const isLapCompleteEvent = event.message.includes('completes Lap');
                        let shouldAddEvent = true;

                        if (isLapCompleteEvent) {
                            const raceLeader = raceState.leaderboard && raceState.leaderboard.length > 0 ? raceState.leaderboard[0] : null;
                            const eventDriverName = event.driver ? event.driver.name : null;
                            
                            // Only add LAP_COMPLETE if the driver is the current race leader
                            if (raceLeader && eventDriverName && raceLeader.driver.name !== eventDriverName) {
                                shouldAddEvent = false;
                            }
                        }

                        if (shouldAddEvent && !this.eventLog.includes(event.message)) {
                            this.eventLog.unshift(event.message);
                            this.lastEventDisplayTime = Date.now();
                        }
                    });

                    // Keep log size manageable
                    if (this.eventLog.length > 50) {
                        this.eventLog = this.eventLog.slice(0, 50);
                    }
                }
            }
        }
    }

    render(ctx, gameState) {
        // Use actual canvas dimensions instead of hardcoded values
        const CANVAS_WIDTH = ctx.canvas.width;
        const CANVAS_HEIGHT = ctx.canvas.height;
        const PADDING = 10;
        const SIDE_PANEL_WIDTH = 240;
        const INFO_BAR_HEIGHT = 40;
        const RIGHT_PANEL_X = CANVAS_WIDTH - SIDE_PANEL_WIDTH; // Aligned to the right edge

        // Clear the entire canvas
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // Removed the green border around the entire canvas as requested.
        
        // Render main race info (Track name, Lap counter)
        this.renderRaceInfo(ctx, gameState, 0, 0, CANVAS_WIDTH, INFO_BAR_HEIGHT);

        // Leaderboard / Standings
        const LEADERBOARD_HEIGHT = 280;
        const LEADERBOARD_Y = INFO_BAR_HEIGHT;
        this.renderLeaderboard(ctx, gameState, RIGHT_PANEL_X, LEADERBOARD_Y, SIDE_PANEL_WIDTH, LEADERBOARD_HEIGHT);

        // Burner Phone
        const BURNER_PHONE_Y = LEADERBOARD_Y + LEADERBOARD_HEIGHT + PADDING;
        const BURNER_PHONE_HEIGHT = 180;
        this.renderBurnerPhone(ctx, gameState, RIGHT_PANEL_X, BURNER_PHONE_Y, SIDE_PANEL_WIDTH, BURNER_PHONE_HEIGHT);

        // Bottom: Event ticker (full width, flush right)
        const EVENT_TICKER_Y = BURNER_PHONE_Y + BURNER_PHONE_HEIGHT + PADDING;
        const EVENT_TICKER_HEIGHT = CANVAS_HEIGHT - EVENT_TICKER_Y - PADDING;
        const EVENT_TICKER_WIDTH = CANVAS_WIDTH - PADDING; // Starts at PADDING=10, ends at 1024 (flush)
        this.renderEventTicker(ctx, gameState, PADDING, EVENT_TICKER_Y, EVENT_TICKER_WIDTH, EVENT_TICKER_HEIGHT);

        // Top Left: Race Track View (Remaining space)
        const TRACK_VIEW_X = PADDING;
        const TRACK_VIEW_Y = INFO_BAR_HEIGHT;
        const TRACK_VIEW_WIDTH = RIGHT_PANEL_X - PADDING; // Fills space up to PADDING away from the right panels
        const TRACK_VIEW_HEIGHT = EVENT_TICKER_Y - INFO_BAR_HEIGHT - PADDING;
        this.renderTrackView(ctx, gameState, TRACK_VIEW_X, TRACK_VIEW_Y, TRACK_VIEW_WIDTH, TRACK_VIEW_HEIGHT);
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

        ctx.fillStyle = '#00ffff';
        ctx.textAlign = 'right';
        ctx.fillText(`LAP ${lap}/${totalLaps}`, width - 20, 27);
    }

    renderTrackView(ctx, gameState, x, y, width, height) {
        // Get track object
        const track = gameState?.race?.track;
        if (!track) {
            this.renderFallbackTrack(ctx, x, y, width, height);
            return;
        }

        // Track container - fill entire area
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Title area at top (compact)
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'left';
        ctx.fillText('TRACK', x + 8, y + 14);

        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(track.name, x + 8, y + 26);

        // Track drawing area (maximize space - only 8px padding each side, 8px top for title, 6px bottom for lap)
        const trackDisplayX = x + 8;
        const trackDisplayY = y + 30;
        const trackDisplayWidth = width - 16;
        const trackDisplayHeight = height - 45;

        // Draw track using waypoints
        if (track.waypoints && track.waypoints.length > 1) {
            this.drawTrackPath(ctx, track, trackDisplayX, trackDisplayY, trackDisplayWidth, trackDisplayHeight);
        }

        // Draw cars on track
        const raceState = gameState?.race?.simulation?.getRaceState?.() || { currentLap: 1, totalLaps: 20, leaderboard: [] };
        const standings = raceState.leaderboard;
        this.drawCarsOnTrack(ctx, standings, track, trackDisplayX, trackDisplayY, trackDisplayWidth, trackDisplayHeight);

    }

    /**
     * Draw the track path using waypoints
     */
    drawTrackPath(ctx, track, x, y, width, height) {
        // Use the new full track rendering method
        track.renderFullTrack(ctx, x, y, width, height, 30);
    }

    /**
     * Draw cars as colored dots on the track
     */
    drawCarsOnTrack(ctx, standings, track, x, y, width, height) {
        if (!standings || !track) return;

        const bounds = track.visualBounds;
        const scaleX = width / bounds.width;
        const scaleY = height / bounds.height;

        standings.forEach((entry, position) => {
            // Calculate progress around track
            // Each car has currentWaypoint and waypointProgress
            const currentWaypoint = entry.currentWaypoint || 0;
            const waypointProgress = entry.waypointProgress || 0;
            
            // Total progress (0-1 for current lap)
            const segmentProgress = (currentWaypoint + waypointProgress) / track.waypoints.length;

            // Get position on track
            let pos;
            
            // Check if car is in the pits
            // Note: CarStatus.PIT_STOP is 'PIT_STOP' (usually), checking string to be safe or we could import
            if ((entry.status === 'PIT_STOP' || entry.status === 'PIT_ENTRY' || entry.status === 'PIT_EXIT') && track.pitLane && track.pitLane.stalls) {
                // Use assigned pit stall
                // startingPosition is 1-based
                const stallIndex = Math.max(0, (entry.startingPosition || 1) - 1);
                const safeIndex = stallIndex % track.pitLane.stalls.length;
                pos = track.pitLane.stalls[safeIndex];
            } else {
                pos = track.getPositionAtProgress(segmentProgress);
            }

            // Convert to screen coordinates
            const screenX = x + (pos.x - bounds.minX) * scaleX;
            const screenY = y + (pos.y - bounds.minY) * scaleY;

            // Draw car dot with team color
            const teamColor = entry.driver?.teamColor || entry.teamColor || '#00ffff';
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

            // Status indicator (if crashed or DNF)
            if (entry.status && entry.status !== 'RACING' && entry.status !== 'FINISHED') {
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
        }
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
        ctx.fillStyle = '#1a1a1a';
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

        const rowHeight = 28;
        const startY = y + (this.selectedContact ? 42 : 32); // Adjusted down by 10px to clear title
        const maxRows = Math.floor((height - startY + y) / rowHeight);

        drivers.slice(0, maxRows).forEach((driver, index) => {
            const rowY = startY + index * rowHeight;
            
            const driverName = driver.driver?.name || driver.name || 'UNKNOWN';
            
            // Ensure gap and gapToAhead are always strings, even if simulation isn't fully ready
            const gapToLeader = driver.gap !== undefined ? driver.gap : (index === 0 ? 'LEADER' : 'N/A');
            const gapToAhead = driver.gapToAhead !== undefined ? driver.gapToAhead : (index === 0 ? 'LEADER' : 'N/A');

            const isHovered = this.hoveredDriver === driverName;
            const isTargetable = this.selectedContact !== null;

            // Highlight row if hovering with contact selected
            if (isHovered && isTargetable) {
                ctx.fillStyle = 'rgba(255, 0, 102, 0.2)';
                ctx.fillRect(x + 2, rowY - 14, width - 4, rowHeight - 2);
            }

            // Position number
            ctx.font = 'bold 11px "Courier New", monospace';
            ctx.fillStyle = index === 0 ? '#ffff00' : '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(`${index + 1}.`, x + 5, rowY);

            // Driver name (shortened)
            ctx.font = '10px "Courier New", monospace';
            ctx.fillStyle = isHovered && isTargetable ? '#ff0066' : '#aaaaaa';
            ctx.fillText(driverName.substring(0, 6), x + 35, rowY);

            // Gap to Ahead (right aligned)
            ctx.font = '9px "Courier New", monospace';
            ctx.fillStyle = '#999999'; // Slightly different color for distinction
            ctx.textAlign = 'right';
            ctx.fillText(gapToAhead, x + width - 70, rowY); // Adjusted position

            // Gap to Leader (right aligned)
            ctx.font = '9px "Courier New", monospace';
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'right';
            ctx.fillText(gapToLeader, x + width - 5, rowY);
        });
    }

    renderEventTicker(ctx, gameState, x, y, width, height) {
        // Ticker container
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Title
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'left';
        ctx.fillText('LIVE EVENTS', x + 10, y + 15);

        // Event log
        const events = this.eventLog.slice(0, this.maxLogEntries); // Keep only maxLogEntries events
        ctx.font = '11px "Courier New", monospace';

        events.forEach((event, index) => {
            const eventY = y + 35 + index * 14;
            ctx.fillStyle = this.getEventColor(event.toLowerCase()); // Apply color-coding
            ctx.fillText(`> ${event}`, x + 10, eventY);
        });
    }

    renderBurnerPhone(ctx, gameState, x, y, width, height) {
        // Check if Rolodex upgrade is owned
        const hasRolodex = gameState?.player?.upgrades?.includes('rolodex') || false;

        // Phone container
        ctx.fillStyle = '#1a1a1a';
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
        if (!hasRolodex) return null;

        // --- START NEW LAYOUT CONSTANTS ---
        const CANVAS_WIDTH = 1024;
        const INFO_BAR_HEIGHT = 40;
        const SIDE_PANEL_WIDTH = 240;
        const PADDING = 10;
        const RIGHT_PANEL_X = CANVAS_WIDTH - SIDE_PANEL_WIDTH;
        const LEADERBOARD_HEIGHT = 280;
        const BURNER_PHONE_Y = INFO_BAR_HEIGHT + LEADERBOARD_HEIGHT + PADDING;
        const BURNER_PHONE_HEIGHT = 180;
        // --- END NEW LAYOUT CONSTANTS ---

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

        // Check if Rolodex is unlocked
        const hasRolodex = gameState?.player?.upgrades?.includes('rolodex') || false;
        if (!hasRolodex) return;

        // --- START NEW LAYOUT CONSTANTS ---
        const CANVAS_WIDTH = 1024;
        const INFO_BAR_HEIGHT = 40;
        const SIDE_PANEL_WIDTH = 240;
        const PADDING = 10;
        const RIGHT_PANEL_X = CANVAS_WIDTH - SIDE_PANEL_WIDTH;
        const LEADERBOARD_HEIGHT = 280;
        const BURNER_PHONE_Y = INFO_BAR_HEIGHT + LEADERBOARD_HEIGHT + PADDING;
        const BURNER_PHONE_HEIGHT = 180;
        // --- END NEW LAYOUT CONSTANTS ---

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

}

export default RaceScreen;