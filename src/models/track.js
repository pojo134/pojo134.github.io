import { assembleTrack, generateBorders, degToRad } from '../systems/segmentTrackGenerator.js';

/**
 * REDLINE ROULETTE - TRACK SYSTEM
 *
 * Unified Track class that maintains track data across all screens.
 * Stores layout, waypoints, distance, and name for consistent visualization.
 */

class Track {
    constructor(type, name, waypoints, characteristics, weather, trackWidth, isLoop, pitLaneData = null, surface = 'asphalt') {
        this.type = type; // e.g., 'Circuit', 'Oval', 'Drag Strip'
        this.name = name;
        this.waypoints = waypoints || [];
        this.characteristics = characteristics || {};
        this.weather = weather || {};
        this.trackWidth = trackWidth || 30;
        this.isLoop = isLoop;
        this.pitLane = pitLaneData;
        this.surface = surface;

        // These properties are not used by the simple procedural track generation
        // but might be by the segmentTrackGenerator. We'll keep them as null/default for now.
        this.segmentTemplates = null;
        this.startLine = null;
        this.leftBorder = [];
        this.rightBorder = [];
        this.intersections = [];
        
        // Calculate totalDistance and visualBounds based on the provided waypoints
        this.totalDistance = this.calculateTotalDistance();
        this.lapDistance = this.totalDistance;
        this.visualBounds = this.calculateVisualizationBounds();
    }


    generateTrack() {
        if (this.waypoints && this.waypoints.length > 0) {
            // Waypoints were provided in constructor, no need to re-generate centerline and borders
            // However, we should still ensure totalDistance and visualBounds are correct
            this.totalDistance = this.calculateTotalDistance();
            this.lapDistance = this.totalDistance;
            this.visualBounds = this.calculateVisualizationBounds();
            return;
        }

        if (!this.segmentTemplates || this.segmentTemplates.length === 0) {
            console.warn("No segment templates provided to generate track.");
            return;
        }

        const startPosition = {
            x: this.startLine.x,
            y: this.startLine.y,
            direction: degToRad(this.startLine.directionDegrees || 0)
        };

        const { centerline, totalLength } = assembleTrack(this.segmentTemplates, startPosition);
        this.waypoints = centerline;
        this.totalDistance = totalLength;
        this.lapDistance = totalLength; // Assuming one lap is the total length for now
        this.visualBounds = this.calculateVisualizationBounds(); // Re-calculate bounds after waypoints are set
        
        // Generate borders now that waypoints are set, if not already provided
        if (this.leftBorder.length === 0 && this.rightBorder.length === 0) {
            const { leftBorder, rightBorder } = generateBorders(this.waypoints, this.trackWidth);
            this.leftBorder = leftBorder;
            this.rightBorder = rightBorder;
        }
    }

    /**
     * Generate pit lane coordinates and stalls
     */
    /*
    generatePitLane() {
        // This method is deprecated as pitLane data is now passed in the constructor.
        // The actual pit lane generation logic is expected to be handled externally
        // (e.g., in segmentTrackGenerator.js) before the Track object is created.
        return null; 
    }
    */

    /**
     * Add a segment to the track. This will require regenerating the track.
     * @param {object} segment - The segment object to add.
     */
    addSegment(segment) {
        this.segmentTemplates.push(segment);
        this.generateTrack(); // Regenerate track with new segment
    }

    /**
     * Returns the total length of the track.
     * @returns {number} The total track length.
     */
    getTrackLength() {
        return this.totalDistance;
    }

    /**
     * Returns the starting line coordinates.
     * @returns {object} The starting line {x, y, directionDegrees}.
     */
    getStartLine() {
        return this.startLine;
    }

    /**
     * Returns a specific waypoint by index.
     * @param {number} index - The index of the waypoint.
     * @returns {object} The waypoint {x, y}.
     */
    getWaypoint(index) {
        if (this.waypoints && index >= 0 && index < this.waypoints.length) {
            return this.waypoints[index];
        }
        return null;
    }

    /**
     * Returns the direction at a specific waypoint by index.
     * @param {number} index - The index of the waypoint.
     * @returns {number} The direction in radians.
     */
    getWaypointDirection(index) {
        if (this.waypoints && this.waypoints.length >= 2) {
            const current = this.waypoints[index % this.waypoints.length];
            const next = this.waypoints[(index + 1) % this.waypoints.length];
            return Math.atan2(next.y - current.y, next.x - current.x);
        }
        return 0; // Default direction if not enough waypoints
    }

    /**
     * Returns the length of a specific segment between two waypoints.
     * @param {number} index - The starting index of the segment.
     * @returns {number} The length of the segment.
     */
    getSegmentLength(index) {
        if (this.waypoints && this.waypoints.length >= 2) {
            const current = this.waypoints[index % this.waypoints.length];
            const next = this.waypoints[(index + 1) % this.waypoints.length];
            const dx = next.x - current.x;
            const dy = next.y - current.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
        return 0;
    }

    /**
     * Render the track on a canvas. This will call renderFullTrack.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
     * @param {number} displayX - X position of the display area.
     * @param {number} displayY - Y position of the display area.
     * @param {number} displayWidth - Width of the display area.
     * @param {number} displayHeight - Height of the display area.
     */
    render(ctx, displayX, displayY, displayWidth, displayHeight) {
        this.renderFullTrack(ctx, displayX, displayY, displayWidth, displayHeight);
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

        // Take trackWidth into account for horizontal bounds, assuming centerline points
        // The track extends +/- half trackWidth from the centerline.
        const effectiveMinX = minX - this.trackWidth / 2;
        const effectiveMaxX = maxX + this.trackWidth / 2;
        
        // Calculate width/height of the actual track content
        const contentWidth = effectiveMaxX - effectiveMinX;
        const contentHeight = maxY - minY;

        // Apply padding to these content bounds
        // Padding should be relative to the larger dimension to ensure sufficient space
        const padding = Math.max(contentWidth, contentHeight) * 0.1;

        return {
            minX: effectiveMinX - padding,
            minY: minY - padding, // Apply padding to Y bounds
            maxX: effectiveMaxX + padding,
            maxY: maxY + padding, // Apply padding to Y bounds
            width: contentWidth + padding * 2,
            height: contentHeight + padding * 2
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

        // For non-looping tracks (like drag strip), clamp progress to 0-1
        // Otherwise, progress > 1 might wrap around unexpectedly
        if (!this.isLoop) {
            progress = Math.max(0, Math.min(1, progress));
        } else {
            // Normalize progress to 0-1 range for loops
            progress = ((progress % 1) + 1) % 1;
        }

        // Total waypoint segments
        const segments = this.waypoints.length;
        
        // For non-looping tracks, we have length-1 segments.
        // The last point is at index length-1.
        // If progress is 1, we want exactly the last point.
        const effectiveSegments = this.isLoop ? segments : segments - 1;
        
        const segmentProgress = progress * effectiveSegments;
        let currentSegment = Math.floor(segmentProgress);
        
        // Handle the exact end case for non-looping tracks
        if (!this.isLoop && currentSegment >= effectiveSegments) {
            currentSegment = effectiveSegments - 1;
            // Force progress in segment to 1.0 to reach the end point
            // segmentProgress was 'effectiveSegments' (e.g. 40). 
            // currentSegment becomes 39.
            // progressInSegment should be 1.0.
        }
        
        const progressInSegment = (progress === 1 && !this.isLoop) ? 1.0 : (segmentProgress - currentSegment);

        const currentWaypoint = this.waypoints[currentSegment];
        
        // Determine next waypoint
        let nextWaypoint;
        if (this.isLoop) {
            nextWaypoint = this.waypoints[(currentSegment + 1) % segments];
        } else {
            // For non-loop, next is just +1, unless we are at the very last segment
            if (currentSegment < segments - 1) {
                nextWaypoint = this.waypoints[currentSegment + 1];
            } else {
                // Should not happen with the clamping logic above, but safe fallback
                nextWaypoint = currentWaypoint;
            }
        }

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

    clone() {
        const clonedTrack = new Track(
            this.type,
            this.name,
            JSON.parse(JSON.stringify(this.waypoints)),
            JSON.parse(JSON.stringify(this.characteristics)),
            JSON.parse(JSON.stringify(this.weather)),
            this.trackWidth,
            this.isLoop,
            JSON.parse(JSON.stringify(this.pitLane)),
            this.surface
        );
        clonedTrack.segmentTemplates = JSON.parse(JSON.stringify(this.segmentTemplates));
        clonedTrack.startLine = JSON.parse(JSON.stringify(this.startLine));
        clonedTrack.leftBorder = JSON.parse(JSON.stringify(this.leftBorder));
        clonedTrack.rightBorder = JSON.parse(JSON.stringify(this.rightBorder));
        clonedTrack.intersections = JSON.parse(JSON.stringify(this.intersections));

        return clonedTrack;
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
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // If it's a loop track, close the path to connect the end to the beginning
        if (this.isLoop) {
            ctx.closePath();
        }
    }

    /**
     * Render full track with all details for race screen
     * Includes gravel, kerbs, tarmac, centerline, and start/finish line
     * @param {number} lineWidthMultiplier - Optional multiplier for line widths (default 1.0)
     */
    renderFullTrack(ctx, displayX, displayY, displayWidth, displayHeight, lineWidthMultiplier = 1.0) {
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
        const scaledTrackWidth = this.trackWidth * scale * lineWidthMultiplier;

        // 1. Gravel (outer buffer) - Draw FIRST so it doesn't cover pit lane (if pit lane is on top)
        // OR draw it first so pit lane covers it.
        drawPath();
        ctx.lineWidth = scaledTrackWidth + 12 * scale * lineWidthMultiplier;
        ctx.strokeStyle = "#5a3a2a";
        ctx.stroke();

        // 0. Pit Lane (Draw AFTER gravel, BEFORE track tarmac)
        // Pit lane extends from track centerline outward
        if (this.pitLane) {
            const pl = this.pitLane;

            // Use entry/exit points (which are on the track centerline)
            const entry = pl.entryMainTrackPoints && pl.entryMainTrackPoints[0] ? pl.entryMainTrackPoints[0] : pl.p1;
            const exit = pl.exitMainTrackPoints && pl.exitMainTrackPoints[0] ? pl.exitMainTrackPoints[0] : pl.p2;

            const s1 = this.trackToScreen(entry.x, entry.y, displayX, displayY, displayWidth, displayHeight);
            const s2 = this.trackToScreen(exit.x, exit.y, displayX, displayY, displayWidth, displayHeight);

            // Calculate direction vector for the pit lane
            const dx = s2.screenX - s1.screenX;
            const dy = s2.screenY - s1.screenY;
            const len = Math.sqrt(dx * dx + dy * dy);

            // Normal vector (perpendicular, pointing left - same as generator)
            const nx = -dy / len;
            const ny = dx / len;

            // Calculate offset for the outer edge of pit lane
            const offsetDistance = pl.width * scale * lineWidthMultiplier;

            // Draw pit lane as a filled polygon from centerline to outer edge
            ctx.fillStyle = "#666666"; // Slightly lighter grey
            ctx.beginPath();
            ctx.moveTo(s1.screenX, s1.screenY); // Start at centerline entry
            ctx.lineTo(s2.screenX, s2.screenY); // Go to centerline exit
            ctx.lineTo(s2.screenX + nx * offsetDistance, s2.screenY + ny * offsetDistance); // Outer edge exit
            ctx.lineTo(s1.screenX + nx * offsetDistance, s1.screenY + ny * offsetDistance); // Outer edge entry
            ctx.closePath();
            ctx.fill();
        }

        // 2. Kerbs (red/white stripes)
        drawPath();
        ctx.lineWidth = scaledTrackWidth + 4 * scale * lineWidthMultiplier;
        ctx.setLineDash([15 * scale * lineWidthMultiplier, 15 * scale * lineWidthMultiplier]);
        ctx.strokeStyle = "#cc0000";
        ctx.stroke();
        ctx.lineDashOffset = 15 * scale * lineWidthMultiplier;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;

        // 3. Tarmac (track surface)
        drawPath();
        ctx.lineWidth = scaledTrackWidth;
        if (this.surface === 'dirt') {
            ctx.strokeStyle = "#5d4037"; // Dirt brown
        } else {
            ctx.strokeStyle = "#333"; // Asphalt
        }
        ctx.stroke();

        // 4. Centerline (Only for asphalt)
        if (this.surface !== 'dirt') {
            drawPath();
            ctx.lineWidth = 1 * lineWidthMultiplier;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.stroke();
        }

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
