/**
 * @fileoverview Integration module for procedural track generation with the main game.
 * Exposes a single function to generate a track object in the game's expected format.
 * 
 * Assumes the following global functions are available:
 * - generateTrack (from trackGenerator.js)
 * - generateRacingLine (from racingLineOptimizer.js)
 * - generateTrackFeatures (from trackFeatures.js)
 */

/**
 * Creates a complete procedural track object ready for the game's consumption.
 * @param {object} options - Generation options (seed, bounds, pointCount, etc.)
 * @returns {object} The complete track object in the game's format.
 */
function createProceduralTrack(options) {
    const defaultOptions = {
        seed: 12345,
        bounds: { width: 1000, height: 800 },
        pointCount: 20, // Reduced complexity for longer straights
        trackWidth: 40,  // Increased width for more optimization space
        samplesPerSegment: 20
    };
    const opts = { ...defaultOptions, ...options };
    
    // 1. Generate core track geometry
    const trackData = generateTrack(opts);
    
    // 2. Generate racing line and velocity profile
    const racingLine = generateRacingLine(trackData, defaultVehicleParams, opts.racingLineOptions || {});
    
    // 3. Generate track features (pit, drs, sectors, grid)
    const features = generateTrackFeatures(trackData, opts.featureOptions || {});
    
    // 4. Convert to game's expected format (waypoints, plus extended data)
    return {
        name: opts.name || `Track ${opts.seed}`,
        // Game-compatible waypoints (centerline from the optimized track, not the original geometry)
        waypoints: racingLine.points.map(pt => ({
            x: pt.x,
            y: pt.y,
            distance: pt.distance,
            velocity: pt.velocity,
            tangent: pt.tangent
        })),
        // Extended data for the enhanced system
        trackData: trackData,
        racingLine: racingLine,
        features: features
    };
}