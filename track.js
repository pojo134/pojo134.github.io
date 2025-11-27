/**
 * REDLINE ROULETTE - TRACK SYSTEM
 *
 * Unified Track class that maintains track data across all screens.
 * Stores layout, waypoints, distance, and name for consistent visualization.
 */

class Track {
    constructor(type, name, waypoints, characteristics = {}, weather = {}, trackWidth = 30) {
        this.type = type;
        this.name = name;
        this.waypoints = waypoints || [];
        this.characteristics = characteristics;
        this.weather = weather;
        this.trackWidth = trackWidth; // Store track width as a property

        // Calculate derived properties
        this.totalDistance = this.calculateTotalDistance();
        this.lapDistance = this.totalDistance;

        // Track visualization properties
        this.visualBounds = this.calculateVisualizationBounds();
    }

    /**
     * Calculate total distance of the track based on waypoints
     */
    calculateTotalDistance() {
        if (!this.waypoints || this.waypoints.length < 2) return 0;
        
        let distance = 0;
        for (let i = 0; i < this.waypoints.length; i++) {
            const current = this.waypoints[i];
            const next = this.waypoints[(i + 1) % this.waypoints.length];
            
            const dx = next.x - current.x;
            const dy = next.y - current.y;
            distance += Math.sqrt(dx * dx + dy * dy);
        }
        
        return distance;
    }

    /**
     * Calculate bounds for track visualization
     * Returns an object with min/max x,y coordinates
     */
    calculateVisualizationBounds() {
        if (!this.waypoints || this.waypoints.length === 0) {
            return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this.waypoints.forEach(wp => {
            minX = Math.min(minX, wp.x);
            minY = Math.min(minY, wp.y);
            maxX = Math.max(maxX, wp.x);
            maxY = Math.max(maxY, wp.y);
        });

        const width = maxX - minX || 100;
        const height = maxY - minY || 100;
        const padding = Math.max(width, height) * 0.1;

        return {
            minX: minX - padding,
            minY: minY - padding,
            maxX: maxX + padding,
            maxY: maxY + padding,
            width: width + padding * 2,
            height: height + padding * 2
        };
    }

    /**
     * Get the position along the track at a given progress (0-1 = one lap)
     * Returns {x, y} in track coordinates
     */
    getPositionAtProgress(progress) {
        if (!this.waypoints || this.waypoints.length === 0) {
            return { x: 0, y: 0 };
        }

        // Normalize progress to 0-1 range
        progress = ((progress % 1) + 1) % 1;

        // Total waypoint segments
        const segments = this.waypoints.length;
        const segmentProgress = progress * segments;
        const currentSegment = Math.floor(segmentProgress) % segments;
        const progressInSegment = segmentProgress - Math.floor(segmentProgress);

        const currentWaypoint = this.waypoints[currentSegment];
        const nextWaypoint = this.waypoints[(currentSegment + 1) % segments];

        // Linear interpolation between waypoints
        const x = currentWaypoint.x + (nextWaypoint.x - currentWaypoint.x) * progressInSegment;
        const y = currentWaypoint.y + (nextWaypoint.y - currentWaypoint.y) * progressInSegment;

        return { x, y };
    }

    /**
     * Get track direction at a given progress
     * Returns angle in radians (0 = right, PI/2 = down, PI = left, -PI/2 = up)
     */
    getDirectionAtProgress(progress) {
        if (!this.waypoints || this.waypoints.length < 2) {
            return 0;
        }

        progress = ((progress % 1) + 1) % 1;

        const segments = this.waypoints.length;
        const segmentProgress = progress * segments;
        const currentSegment = Math.floor(segmentProgress) % segments;

        const currentWaypoint = this.waypoints[currentSegment];
        const nextWaypoint = this.waypoints[(currentSegment + 1) % segments];

        const dx = nextWaypoint.x - currentWaypoint.x;
        const dy = nextWaypoint.y - currentWaypoint.y;

        return Math.atan2(dy, dx);
    }

    /**
     * Convert screen coordinates to track visualization
     * Takes display area and returns scaled position
     */
    screenToTrack(screenX, screenY, displayX, displayY, displayWidth, displayHeight) {
        const bounds = this.visualBounds;
        
        // Scale factors
        const scaleX = displayWidth / bounds.width;
        const scaleY = displayHeight / bounds.height;
        
        // Convert screen coords to track coords
        const trackX = (screenX - displayX) / scaleX + bounds.minX;
        const trackY = (screenY - displayY) / scaleY + bounds.minY;
        
        return { trackX, trackY };
    }

    /**
     * Convert track coordinates to screen for rendering
     * Returns {screenX, screenY}
     */
    trackToScreen(trackX, trackY, displayX, displayY, displayWidth, displayHeight) {
        const bounds = this.visualBounds;
        
        // Scale factors
        const scaleX = displayWidth / bounds.width;
        const scaleY = displayHeight / bounds.height;
        
        // Convert track coords to screen
        const screenX = displayX + (trackX - bounds.minX) * scaleX;
        const screenY = displayY + (trackY - bounds.minY) * scaleY;
        
        return { screenX, screenY };
    }

    /**
     * Get information about the track for UI display
     */
    getInfo() {
        return {
            type: this.type,
            name: this.name,
            totalDistance: this.totalDistance.toFixed(0),
            lapDistance: this.lapDistance.toFixed(0),
            waypointCount: this.waypoints.length,
            characteristics: this.characteristics,
            weather: this.weather
        };
    }

    /**
     * Render simple wire outline for betting desk / track selection
     * Just draws the centerline in white for a clean, simple preview
     */
    renderWireOutline(ctx, displayX, displayY, displayWidth, displayHeight) {
        if (!this.waypoints || this.waypoints.length < 2) return;

        const bounds = this.visualBounds;

        // Set line style
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        // Draw centerline
        ctx.beginPath();
        this.waypoints.forEach((wp, i) => {
            const screenPos = this.trackToScreen(wp.x, wp.y, displayX, displayY, displayWidth, displayHeight);
            if (i === 0) {
                ctx.moveTo(screenPos.screenX, screenPos.screenY);
            } else {
                ctx.lineTo(screenPos.screenX, screenPos.screenY);
            }
        });
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
    }

    /**
     * Render full track with all details for race screen
     * Includes gravel, kerbs, tarmac, centerline, and start/finish line
     */
    renderFullTrack(ctx, displayX, displayY, displayWidth, displayHeight) {
        if (!this.waypoints || this.waypoints.length < 2) return;

        const bounds = this.visualBounds;

        // Set line style
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        // Helper function to draw a path
        const drawPath = () => {
            ctx.beginPath();
            this.waypoints.forEach((wp, i) => {
                const screenPos = this.trackToScreen(wp.x, wp.y, displayX, displayY, displayWidth, displayHeight);
                if (i === 0) {
                    ctx.moveTo(screenPos.screenX, screenPos.screenY);
                } else {
                    ctx.lineTo(screenPos.screenX, screenPos.screenY);
                }
            });
            ctx.closePath();
        };

        // Scale trackWidth to screen coordinates
        const scaleX = displayWidth / bounds.width;
        const scaleY = displayHeight / bounds.height;
        const scale = Math.min(scaleX, scaleY);
        const scaledTrackWidth = this.trackWidth * scale;

        // 1. Gravel (outer buffer)
        drawPath();
        ctx.lineWidth = scaledTrackWidth + 12 * scale;
        ctx.strokeStyle = "#5a3a2a";
        ctx.stroke();

        // 2. Kerbs (red/white stripes)
        drawPath();
        ctx.lineWidth = scaledTrackWidth + 4 * scale;
        ctx.setLineDash([15 * scale, 15 * scale]);
        ctx.strokeStyle = "#cc0000";
        ctx.stroke();
        ctx.lineDashOffset = 15 * scale;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;

        // 3. Tarmac (track surface)
        drawPath();
        ctx.lineWidth = scaledTrackWidth;
        ctx.strokeStyle = "#333";
        ctx.stroke();

        // 4. Centerline
        drawPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.stroke();

        // 5. Start/Finish line
        if (this.waypoints.length > 1) {
            const w0 = this.waypoints[0];
            const w1 = this.waypoints[1];

            // Get screen positions
            const screen0 = this.trackToScreen(w0.x, w0.y, displayX, displayY, displayWidth, displayHeight);
            const screen1 = this.trackToScreen(w1.x, w1.y, displayX, displayY, displayWidth, displayHeight);

            // Calculate track direction vector
            const dx = screen1.screenX - screen0.screenX;
            const dy = screen1.screenY - screen0.screenY;
            const len = Math.sqrt(dx * dx + dy * dy);

            // Perpendicular vector (rotate 90 degrees)
            const perpX = (-dy / len) * (scaledTrackWidth / 2);
            const perpY = (dx / len) * (scaledTrackWidth / 2);

            // Draw start/finish line perpendicular to track
            ctx.beginPath();
            ctx.moveTo(screen0.screenX - perpX, screen0.screenY - perpY);
            ctx.lineTo(screen0.screenX + perpX, screen0.screenY + perpY);
            ctx.lineWidth = 4 * scale;
            ctx.strokeStyle = "white";
            ctx.stroke();
        }
    }
}

export default Track;
