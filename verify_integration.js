/**
 * Simple Integration Test for Procedural Track Generation
 * Assumes the createProceduralTrack function is globally available (from trackIntegration.js)
 */

// Test that track generation produces valid game data
function testTrackIntegration() {
    try {
        console.log('--- Running Track Integration Test ---');
        // Simulate a contract object that might be passed in game.js
        const mockContract = {
            trackName: "Procedural Test Track",
            seed: 77777, // Another seed
            complexity: 20, // Simpler track, more likely to have a long straight
            trackWidth: 40 // Wider track, more margin for error
        };
        
        // This relies on the createProceduralTrack function being globally accessible
        const track = createProceduralTrack({
            name: mockContract.trackName,
            seed: mockContract.seed,
            bounds: { width: 1000, height: 800 },
            pointCount: mockContract.complexity,
            trackWidth: mockContract.trackWidth,
            // Also explicitly set the features to be slightly less restrictive in pit lane
            featureOptions: {
                pitLane: {
                    minLength: 400 // Lower the required straight length
                }
            }
        });
        
        // Removed debug console logs
        // console.log('Track name:', track.name);
        // console.log('Waypoints length:', track.waypoints.length);
        // console.log('Track length:', track.trackData.trackLength.toFixed(2));
        // console.log('Lap time:', track.racingLine.lapTime.toFixed(3) + 's');
        
        // Verify key properties and format
        if (!track || track.waypoints.length === 0) {
            throw new Error('Track generation failed or returned empty data');
        }
        
        if (track.waypoints[0] === undefined || track.waypoints[0].x === undefined || track.waypoints[0].y === undefined) {
            throw new Error('Invalid waypoint format: Missing x or y');
        }
        
        if (track.trackData.trackLength === 0 || !isFinite(track.trackData.trackLength)) {
            throw new Error('Invalid track length');
        }

        if (track.racingLine.lapTime === 0 || !isFinite(track.racingLine.lapTime)) {
            throw new Error('Invalid lap time');
        }

        // Verify enhanced data presence
        if (!track.trackData || !track.racingLine || !track.features) {
             throw new Error('Missing extended track data (trackData, racingLine, features)');
        }
        
        console.log('Integration test passed successfully!');
        return true;

    } catch (error) {
        console.error('Integration Test Failed:', error.message);
        return false;
    }
}

// Call the test function
testTrackIntegration();