/**
 * Vector Utility Functions (Duplicated from trackGenerator.js or to be imported)
 * NOTE: For now, duplicating basic geometry helpers to keep this module self-contained.
 */
const V = {
    /** @param {{x: number, y: number}} v1 @param {{x: number, y: number}} v2 @returns {number} */
    dist: (v1, v2) => Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2),
    /** @param {{x: number, y: number}} v1 @param {{x: number, y: number}} v2 @returns {{x: number, y: number}} */
    add: (v1, v2) => ({ x: v1.x + v2.x, y: v1.y + v2.y }),
    /** @param {{x: number, y: number}} v1 @param {{x: number, y: number}} v2 @returns {{x: number, y: number}} */
    sub: (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y }),
    /** @param {{x: number, y: number}} v @param {number} s @returns {{x: number, y: number}} */
    scale: (v, s) => ({ x: v.x * s, y: v.y * s }),
    /** @param {{x: number, y: number}} v @returns {{x: number, y: number}} */
    normalize: (v) => {
        const len = Math.sqrt(v.x * v.x + v.y * v.y);
        return len > 0 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 };
    },
    /** @param {{x: number, y: number}} v1 @param {{x: number, y: number}} v2 @returns {number} */
    dot: (v1, v2) => v1.x * v2.x + v1.y * v2.y,
    /** @param {{x: number, y: number}} v @returns {{x: number, y: number}} */
    perp: (v) => ({ x: -v.y, y: v.x }), // Perpendicular vector (rotated 90 deg counter-clockwise)
};

/**
 * Helper to find the index at a specific distance before/after a point
 * @param {Array<Object>} centerline - The track centerline waypoints.
 * @param {number} startIndex - Starting index.
 * @param {number} distance - Distance to travel (+forward, -backward).
 * @param {number} direction - 1 for forward, -1 for backward.
 * @returns {number} The index closest to the target distance.
 */
function findIndexAtDistance(centerline, startIndex, distance, direction) {
    const N = centerline.length;
    const getIndex = (index) => (index + N) % N;
    
    let currentDist = 0;
    let index = startIndex;
    const step = direction > 0 ? 1 : -1;
    
    while (currentDist < Math.abs(distance)) {
        const nextIndex = getIndex(index + step);
        if (nextIndex === startIndex) break;
        
        const segmentDist = V.dist(centerline[index], centerline[nextIndex]);
        
        if (currentDist + segmentDist > Math.abs(distance)) {
            // We've overshot, return the current index (before the segment)
            // or the next one if it's closer to the target distance.
            const distFromCurrent = Math.abs(distance) - currentDist;
            const distFromNext = Math.abs(distance) - (currentDist + segmentDist);
            
            // If the next point is closer or we're almost at the distance
            if (Math.abs(distFromNext) < distFromCurrent) {
                index = nextIndex;
            }
            break;
        }

        currentDist += segmentDist;
        index = nextIndex;
    }
    return index;
}


/**
 * Hermite interpolation between two points with tangents (for S-curves)
 * @param {{x: number, y: number}} p0 - Start point
 * @param {{x: number, y: number}} p1 - End point
 * @param {{x: number, y: number}} t0 - Start tangent (scaled velocity vector)
 * @param {{x: number, y: number}} t1 - End tangent (scaled velocity vector)
 * @param {number} t - Interpolation factor (0 to 1)
 * @returns {{x: number, y: number}} Interpolated point
 */
function hermiteInterpolate(p0, p1, t0, t1, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;
    return {
        x: h00 * p0.x + h10 * t0.x + h01 * p1.x + h11 * t1.x,
        y: h00 * p0.y + h10 * t0.y + h01 * p1.y + h11 * t1.y
    };
}

/**
 * Finds the longest straight segment on the track centerline.
 * @param {Array<Object>} centerline - The track centerline waypoints.
 * @param {number} minLength - Minimum length of straight to consider.
 * @param {number} curvatureThreshold - Max absolute curvature to be considered 'straight'.
 * @returns {{startIndex: number, endIndex: number, length: number} | null} - The longest straight segment found.
 */
function findLongestStraight(centerline, minLength = 600, curvatureThreshold = 0.005) {
    let longestStraight = null;
    let currentStraight = null;
    const N = centerline.length;
    let trackLength = centerline[N - 1].distance;

    for (let i = 0; i < N; i++) {
        const waypoint = centerline[i];
        const isStraight = Math.abs(waypoint.curvature) < curvatureThreshold;

        if (isStraight) {
            // Start or continue a straight segment
            if (currentStraight === null) {
                currentStraight = { startIndex: i, length: 0 };
            }

            // Calculate length of current straight
            if (i > 0) {
                const prevWaypoint = centerline[(i - 1 + N) % N]; // Handle wrap-around
                const dist = V.dist(waypoint, prevWaypoint);
                currentStraight.length += dist;
            }
        } else {
            // End of a straight segment
            if (currentStraight !== null) {
                currentStraight.endIndex = (i - 1 + N) % N; // End at the waypoint just before the curve

                if (currentStraight.length >= minLength) {
                    if (longestStraight === null || currentStraight.length > longestStraight.length) {
                        longestStraight = currentStraight;
                    }
                }
                currentStraight = null;
            }
        }
    }

    // Handle case where the longest straight segment wraps around the start/finish line
    // If a straight is active at the end of the loop, it might continue from the start
    if (currentStraight !== null) {
        // Find the start of the straight segment that wraps around
        let wrapStartIndex = -1;
        let wrapLength = 0;

        // Search backward from the end of the centerline to the start of the current straight
        for (let i = N - 1; i >= 0; i--) {
            if (Math.abs(centerline[i].curvature) < curvatureThreshold) {
                wrapStartIndex = i;
                if (i < N - 1) {
                    wrapLength += V.dist(centerline[i], centerline[i + 1]);
                }
            } else {
                break;
            }
        }
        
        // Search forward from the beginning of the centerline to the end of the current straight
        for (let i = 0; i < N; i++) {
            if (Math.abs(centerline[i].curvature) < curvatureThreshold) {
                if (i > 0) {
                    wrapLength += V.dist(centerline[i], centerline[i - 1]);
                }
            } else {
                currentStraight.endIndex = (i - 1 + N) % N;
                break;
            }
        }

        // Final check on the wrap-around straight
        if (wrapStartIndex !== -1) {
            // Re-calculate the full length and indices for the wrap-around straight
            let startOfWrap = wrapStartIndex;
            let endOfWrap = currentStraight.endIndex;
            let combinedLength = 0;
            
            // From startOfWrap to N-1
            for (let i = startOfWrap; i < N; i++) {
                if (i > startOfWrap) {
                    combinedLength += V.dist(centerline[i], centerline[i - 1]);
                }
            }
            // From 0 to endOfWrap
            for (let i = 1; i <= endOfWrap; i++) {
                combinedLength += V.dist(centerline[i], centerline[i - 1]);
            }
            
            if (combinedLength >= minLength) {
                const combinedStraight = {
                    startIndex: startOfWrap, 
                    endIndex: endOfWrap, 
                    length: combinedLength
                };

                if (longestStraight === null || combinedStraight.length > longestStraight.length) {
                    longestStraight = combinedStraight;
                }
            }
        }
    }

    // Convert indices to actual positions
    if (longestStraight) {
        const startPoint = centerline[longestStraight.startIndex];
        const endPoint = centerline[longestStraight.endIndex];
        
        // This is a rough estimation of distance for the straight segment
        let startDistance = startPoint.distance;
        let endDistance = endPoint.distance;
        
        // Correct distance calculation for wrap-around case
        if (longestStraight.startIndex > longestStraight.endIndex) {
            endDistance += trackLength;
        }

        longestStraight.startDistance = startDistance;
        longestStraight.endDistance = endDistance;
    }


    return longestStraight;
}


// --- Main Feature Generation Functions (Placeholders) ---

/**
 * Generates pit lane parallel to the main track
 * @param {Object} trackData - Track data with centerline and borders
 * @param {Object} options - Pit lane configuration
 * @returns {Object} Pit lane data
 */
function generatePitLane(trackData, options) {
    const centerline = trackData.centerline;
    const trackLength = centerline[centerline.length - 1].distance;
    const N = centerline.length;

    const defaultOptions = {
        offset: 25,           // Distance from main track (meters)
        width: 12,            // Pit lane width
        stallLength: 8,       // Length per pit stall
        stallCount: 20,       // Number of pit stalls
        entryBlendLength: 100, // Entry S-curve blend length
        exitBlendLength: 80,    // Exit S-curve blend length
        safetyLineWidth: 0.5    // Width of the safety line marker
    };

    const opts = { ...defaultOptions, ...options };

    // 1. Find Pit Straight: Curvature near 0 (radius > 200m)
    const pitStraight = findLongestStraight(centerline);
    
    if (!pitStraight) {
        console.warn("Could not find a suitable straight segment for the pit lane.");
        // Return a fully-formed empty pit lane object for graceful degradation
        return {
            entryIndex: undefined,
            exitIndex: undefined,
            centerline: [],
            leftBorder: [],
            rightBorder: [],
            entryBlend: [],
            exitBlend: [],
            stalls: [],
            safetyLine: [],
            length: 0
        };
    }
    
    // --- Index Helper for Wrap-Around ---
    const getIndex = (index) => (index + N) % N;
    // NOTE: Using the globally defined findIndexAtDistance(centerline, startIndex, distance, direction)
    
    // 2. Define Entry/Exit Points
    // Pit entry starts opts.entryBlendLength before the straight
    // The entry curve starts on the main track opts.entryBlendLength * 0.75m before the straight
    const entryLookbackDist = opts.entryBlendLength * 0.75;
    const pitEntryEndIndex = pitStraight.startIndex; // Point on the main track where safety line begins
    const pitEntryIndex = findIndexAtDistance(centerline, pitEntryEndIndex, -entryLookbackDist, -1);
    
    // Pit exit ends opts.exitBlendLength after the straight
    // The exit curve ends on the main track opts.exitBlendLength * 0.75m after the straight
    const exitLookAheadDist = opts.exitBlendLength * 0.75;
    const pitExitStartIndex = pitStraight.endIndex; // Point on the main track where safety line ends
    const pitExitIndex = findIndexAtDistance(centerline, pitExitStartIndex, exitLookAheadDist, 1);
    
    // The main straight for pit generation is between entry and exit points on the track
    
    // 3. Generate Parallel Path (Pit Lane Centerline & Borders)
    let pitCenterline = [];
    let pitLeftBorder = [];
    let pitRightBorder = [];
    let pitLaneLength = 0;

    let currentIndex = pitEntryIndex;
    let mainTrackStraightStartIndex = pitStraight.startIndex;
    let mainTrackStraightEndIndex = pitStraight.endIndex;
    
    // Iterate from pitEntryIndex to pitExitIndex (handling wrap-around)
    // We only offset the segment of the main track that runs parallel to the pit lane
    const offsetSegment = [];
    
    let i = pitStraight.startIndex;
    let numSegments = 0;
    do {
        offsetSegment.push(centerline[i]);
        i = getIndex(i + 1);
        numSegments++;
        if (numSegments > N) break; // safety break
    } while (i !== getIndex(pitStraight.endIndex + 1));


    // This is a simplified approach, assuming the track segment for the pit straight is the best
    // The pit lane will run parallel to the segment of the track determined by `pitStraight`
    
    // We'll approximate the pit lane as a parallel line to the main track for the length of the straight
    const straightSegmentStart = centerline[pitStraight.startIndex];
    const straightSegmentEnd = centerline[pitStraight.endIndex];
    
    // Pit lane direction (tangent of the main track straight)
    const straightDirection = V.normalize(V.sub(straightSegmentEnd, straightSegmentStart));
    const pitOffsetVector = V.scale(V.perp(straightDirection), opts.offset); // Offset 90 degrees left (assumed outside of the track)

    // Pit lane straight path endpoints
    const pitStraightStartPoint = V.add(straightSegmentStart, pitOffsetVector);
    const pitStraightEndPoint = V.add(straightSegmentEnd, pitOffsetVector);
    const pitStraightLength = V.dist(pitStraightStartPoint, pitStraightEndPoint);

    // Sample the pit straight to create the centerline
    const numPitStraightSamples = Math.ceil(pitStraightLength / (trackLength / N)); // Use same point density as main track
    for (let i = 0; i <= numPitStraightSamples; i++) {
        const t = i / numPitStraightSamples;
        const x = pitStraightStartPoint.x + straightDirection.x * t * pitStraightLength;
        const y = pitStraightStartPoint.y + straightDirection.y * t * pitStraightLength;
        
        const currentDistance = i > 0 ? V.dist({x, y}, pitCenterline[pitCenterline.length - 1]) : 0;
        pitLaneLength += currentDistance;
        
        pitCenterline.push({
            x, y,
            direction: straightDirection,
            distance: pitLaneLength
        });
    }


    // 4. Create Entry Blend
    // Start of S-curve: On main track at pitEntryIndex
    const mainTrackEntryStart = centerline[pitEntryIndex];
    // End of S-curve: On pit lane straight (a short distance in)
    // We use the first point of the newly created pitCenterline
    const pitLaneEntryEnd = pitCenterline[0];

    // Tangents: Perpendicular to the safety line on the main track, and parallel to the pit lane.
    // The direction vector of the main track at entry start
    let mainTrackEntryDir = mainTrackEntryStart.direction;
    if (!mainTrackEntryDir) {
        // Fallback: calculate tangent from next segment
        const nextIdx = getIndex(pitEntryIndex + 1);
        const nextPoint = centerline[nextIdx];
        if (nextPoint) { // Safety check to ensure next point is available
            mainTrackEntryDir = V.normalize(V.sub(nextPoint, mainTrackEntryStart));
        } else {
            // Default to a simple vector if next point is somehow missing (e.g., track is too short)
            mainTrackEntryDir = { x: 1, y: 0 };
        }
    }
    // The main track perpendicular (where cars begin to turn off)
    const entryTangentStart = V.scale(V.perp(mainTrackEntryDir), opts.entryBlendLength * 0.5);
    // The pit lane direction (straight direction)
    const entryTangentEnd = V.scale(straightDirection, opts.entryBlendLength * 0.5);
    
    const entryBlend = generateHermiteBlend(mainTrackEntryStart, pitLaneEntryEnd, entryTangentStart, entryTangentEnd, 20);
    

    // 5. Create Exit Blend
    // Start of S-curve: On pit lane straight (at the end)
    const pitLaneExitStart = pitCenterline[pitCenterline.length - 1];
    // End of S-curve: On main track at pitExitIndex
    const mainTrackExitEnd = centerline[pitExitIndex];

    // Tangents: Parallel to the pit lane, and perpendicular to the safety line on the main track.
    // The pit lane direction (straight direction)
    const exitTangentStart = V.scale(straightDirection, opts.exitBlendLength * 0.5);
    // The direction vector of the main track at exit end
    let mainTrackExitDir = mainTrackExitEnd.direction;
    if (!mainTrackExitDir) {
        // Fallback: calculate tangent from next segment
        const nextIdx = getIndex(pitExitIndex + 1);
        const nextPoint = centerline[nextIdx];
        if (nextPoint) { // Safety check to ensure next point is available
            mainTrackExitDir = V.normalize(V.sub(nextPoint, mainTrackExitEnd));
        } else {
            // Default to a simple vector if next point is somehow missing (e.g., track is too short)
            mainTrackExitDir = { x: 1, y: 0 };
        }
    }
    // The main track perpendicular (where cars re-join the track)
    const exitTangentEnd = V.scale(V.perp(mainTrackExitDir), opts.exitBlendLength * 0.5);
    
    const exitBlend = generateHermiteBlend(pitLaneExitStart, mainTrackExitEnd, exitTangentStart, exitTangentEnd, 20);


    // 6. Generate Pit Stalls
    const stalls = generatePitStalls(pitCenterline, opts.stallLength, opts.stallCount);
    
    // --- Final Pit Lane Geometry (Borders & Safety Line) ---
    
    // The pit lane left border (closest to the track) is the safety line
    const safetyLine = pitCenterline.map(p => {
        const perp = V.perp(p.direction);
        return V.add(p, V.scale(perp, opts.width / 2 - opts.safetyLineWidth / 2));
    });

    // Pit lane right border (outer edge)
    pitRightBorder = pitCenterline.map(p => {
        const perp = V.perp(p.direction);
        return V.add(p, V.scale(perp, opts.width / 2));
    });
    
    // Pit lane left border (closer to the track, inside the safety line)
    pitLeftBorder = pitCenterline.map(p => {
        const perp = V.perp(p.direction);
        return V.add(p, V.scale(perp, -opts.width / 2)); // Pit lane width is a total, so half width offset
    });

    return {
        entryIndex: pitEntryIndex,
        exitIndex: pitExitIndex,
        entryPoint: mainTrackEntryStart,
        exitPoint: mainTrackExitEnd,
        centerline: pitCenterline,
        leftBorder: pitLeftBorder,
        rightBorder: pitRightBorder,
        entryBlend: entryBlend,
        exitBlend: exitBlend,
        stalls: stalls,
        safetyLine: safetyLine,
        length: pitLaneLength
    };
}

/**
 * Divides the track into three sectors for timing
 * @param {Object} trackData - Track data with centerline
 * @param {Object} options - Optional sector configuration
 * @returns {Object} Sector boundaries
 */
function generateSectors(trackData, options = {}) {
    const centerline = trackData.centerline;
    const trackLength = centerline[centerline.length - 1].distance;
    const N = centerline.length;
    
    // Default options for sector division
    const defaultOptions = {
        sectorDivision: [1/3, 2/3, 1], // Distances as fractions of total length
        miniSectorLength: 150         // Target length for mini-sectors (100-200m)
    };
    
    const opts = { ...defaultOptions, ...options };

    // --- Primary Sector Division ---
    const sectorDistances = opts.sectorDivision.map(frac => frac * trackLength);
    const sectors = [];
    
    let currentStartIndex = 0;
    let currentStartDistance = 0;
    
    for (let i = 0; i < 3; i++) {
        const endDistance = sectorDistances[i];
        
        // Find the index closest to the endDistance
        let endIndex = currentStartIndex;
        let minDiff = Infinity;
        for (let j = currentStartIndex; j < N; j++) {
            const currentDiff = Math.abs(centerline[j].distance - endDistance);
            if (currentDiff < minDiff) {
                minDiff = currentDiff;
                endIndex = j;
            } else if (currentDiff > minDiff && centerline[j].distance > endDistance) {
                // We've passed the closest point
                break;
            }
        }
        
        // Ensure wrap around for Sector 3's end index (back to index 0 or N-1)
        if (i === 2) {
            endIndex = N - 1;
        }

        sectors.push({
            id: i + 1,
            startIndex: currentStartIndex,
            endIndex: endIndex,
            startDistance: currentStartDistance,
            endDistance: i === 2 ? trackLength : centerline[endIndex].distance
        });
        
        currentStartIndex = endIndex;
        currentStartDistance = i === 2 ? trackLength : centerline[endIndex].distance;

        // Small adjustment for the next sector start to not exactly repeat the end index
        if (i < 2 && currentStartIndex < N - 1) {
             currentStartIndex += 1;
        }
    }
    
    // --- Mini-Sector Division ---
    const miniSectors = [];
    let miniSectorId = 0;
    let miniStartDistance = 0;
    let miniStartIndex = 0;

    while (miniStartDistance < trackLength) {
        let miniEndDistance = Math.min(miniStartDistance + opts.miniSectorLength, trackLength);
        
        let miniEndIndex = miniStartIndex;
        let minDiff = Infinity;

        // Find the end index
        for (let j = miniStartIndex; j < N; j++) {
            const currentDiff = Math.abs(centerline[j].distance - miniEndDistance);
            if (currentDiff < minDiff) {
                minDiff = currentDiff;
                miniEndIndex = j;
            } else if (currentDiff > minDiff && centerline[j].distance > miniEndDistance) {
                break;
            }
        }

        // If it's the last segment, the end index is the end of the track
        if (miniEndDistance === trackLength) {
            miniEndIndex = N - 1;
        }
        
        const actualEndDistance = centerline[miniEndIndex].distance;

        miniSectors.push({
            id: miniSectorId,
            startIndex: miniStartIndex,
            endIndex: miniEndIndex,
            length: actualEndDistance - miniStartDistance,
            startDistance: miniStartDistance,
            endDistance: actualEndDistance
        });

        if (actualEndDistance === trackLength) {
            break;
        }
        
        miniSectorId++;
        miniStartIndex = miniEndIndex;
        miniStartDistance = actualEndDistance;
    }
    
    // Final check for the last mini-sector to ensure it reaches the end
    if (miniSectors.length > 0 && miniSectors[miniSectors.length - 1].endDistance < trackLength) {
        const lastMini = miniSectors[miniSectors.length - 1];
        lastMini.endIndex = N - 1;
        lastMini.endDistance = trackLength;
        lastMini.length = lastMini.endDistance - lastMini.startDistance;
    }


    return { sectors, miniSectors };
}

/**
 * Identifies and creates DRS (Drag Reduction System) zones
 * @param {Object} trackData - Track data with centerline and curvature
 * @param {Object} options - DRS configuration
 * @returns {Array} DRS zones
 */
function generateDRSZones(trackData, options = {}) {
    const centerline = trackData.centerline;
    const trackLength = centerline[centerline.length - 1].distance;
    const N = centerline.length;
    
    const defaultOptions = {
        minStraightLength: 600,    // Minimum length for DRS zone (meters)
        minActivationLength: 400,  // Minimum activation length after detection
        detectionOffset: 100,      // Detection point distance before zone
        activationDelay: 50,       // Meters after corner exit to activate
        curvatureThreshold: 0.005  // Max absolute curvature for a straight
    };

    const opts = { ...defaultOptions, ...options };

    const drsZones = [];
    let drsZoneId = 0;
    let totalDRSLength = 0;
    
    // Helper to get index with wrap-around
    const getIndex = (index) => (index + N) % N;
    
    // Helper to find the index at a specific distance before/after a point
    const findIndexAtDistance = (startIndex, distance, direction) => {
        let currentDist = 0;
        let index = startIndex;
        const step = direction > 0 ? 1 : -1;
        
        while (currentDist < Math.abs(distance)) {
            const nextIndex = getIndex(index + step);
            if (nextIndex === startIndex) break;
            
            const segmentDist = V.dist(centerline[index], centerline[nextIndex]);
            currentDist += segmentDist;
            
            index = nextIndex;
        }
        return index;
    };
    
    // Algorithm: Find all straight segments
    let straightSegments = [];
    let currentStraight = null;
    
    for (let i = 0; i < N; i++) {
        const waypoint = centerline[i];
        const isStraight = Math.abs(waypoint.curvature) < opts.curvatureThreshold;

        if (isStraight) {
            if (currentStraight === null) {
                currentStraight = {
                    startIndex: i,
                    startDistance: waypoint.distance,
                    endIndex: -1,
                    endDistance: 0,
                    length: 0
                };
            }
            // Update length based on distance from previous point
            if (i > 0 || (i === 0 && currentStraight.startIndex === 0)) {
                const prevIndex = getIndex(i - 1);
                currentStraight.length += V.dist(waypoint, centerline[prevIndex]);
            } else if (i === 0 && currentStraight.startIndex !== 0) {
                 // The wrap-around case is too complex to handle with this linear scan.
                 // We will rely on finding the segments that start and end within the 0 to N-1 range for simplicity
                 // and assume the track generator ensures a straight start/finish is properly indexed.
            }
        } else {
            if (currentStraight !== null) {
                currentStraight.endIndex = getIndex(i - 1);
                currentStraight.endDistance = centerline[currentStraight.endIndex].distance;
                
                if (currentStraight.length >= opts.minStraightLength) {
                    straightSegments.push(currentStraight);
                }
                currentStraight = null;
            }
        }
    }
    
    // Finalize the last straight segment if the track ends with one
    if (currentStraight !== null && currentStraight.startIndex === 0) {
        // This is a straight that wraps around
        // It's covered by the `findLongestStraight` logic. For DRS, we look for distinct segments.
        // If the track ends with a straight, its length is calculated up to the end (N-1)
        currentStraight.endIndex = N - 1;
        currentStraight.endDistance = centerline[N - 1].distance;
        if (currentStraight.length >= opts.minStraightLength) {
            // Need to handle the length calculation more accurately here if it wraps
            // For now, only include non-wrapping straights
        }
        currentStraight = null;
    }
    
    // --- Determine Detection/Activation/Deactivation Points ---
    
    for (const segment of straightSegments) {
        // 1. Deactivation Point: End of straight (before next corner entry)
        const deactivationIndex = segment.endIndex;
        const deactivationPoint = centerline[deactivationIndex];
        
        // 2. Activation Point: opts.activationDelay (50m) after corner exit onto straight
        // Start of straight is segment.startIndex
        let activationStartIndex = segment.startIndex;
        let activationIndex = findIndexAtDistance(activationStartIndex, opts.activationDelay, 1);
        const activationPoint = centerline[activationIndex];
        
        // Ensure the zone is long enough to be useful
        const drsZoneLength = activationPoint.distance > deactivationPoint.distance
            ? trackLength - activationPoint.distance + deactivationPoint.distance
            : deactivationPoint.distance - activationPoint.distance;

        if (drsZoneLength < opts.minActivationLength) {
            continue; // Skip short zones
        }

        // 3. Detection Point: opts.detectionOffset (100m) before the zone
        // For simplicity, we'll place it relative to the activation point
        // Detection point should be before the corner leading onto the straight
        
        // Let's simplify and place detection relative to the activation point
        const rawDetectionIndex = activationIndex;
        const detectionIndex = findIndexAtDistance(rawDetectionIndex, -opts.detectionOffset, -1);
        const detectionPoint = centerline[detectionIndex];
        
        drsZones.push({
            id: drsZoneId++,
            detectionIndex,
            detectionPoint: { x: detectionPoint.x, y: detectionPoint.y },
            activationIndex,
            activationPoint: { x: activationPoint.x, y: activationPoint.y },
            deactivationIndex,
            deactivationPoint: { x: deactivationPoint.x, y: deactivationPoint.y },
            length: drsZoneLength // Simple distance, not curved length
        });
        
        totalDRSLength += drsZoneLength;
    }

    return { zones: drsZones, totalDRSLength };
}

/**
 * Generates start/finish line and grid positions
 * @param {Object} trackData - Track data
 * @param {Object} options - Grid configuration
 * @returns {Object} Start/finish and grid data
 */
function generateStartGrid(trackData, options) {
    const centerline = trackData.centerline;
    const N = centerline.length;
    
    if (N < 2) {
        console.warn("Track is too short for start grid generation.");
        return { startLineIndex: 0, startLinePosition: { x: 0, y: 0 }, startLineDirection: { x: 0, y: 0 }, finishLineIndex: 0, gridPositions: [] };
    }

    const defaultOptions = {
        gridPositions: 20,        // Number of grid slots
        gridSpacing: 8,           // Distance between grid rows
        staggerOffset: 4,         // Lateral offset for staggered grid
        startLineIndex: 0         // Index on centerline for start/finish
    };

    const opts = { ...defaultOptions, ...options };
    
    // Start/Finish Line
    const startWaypoint = centerline[opts.startLineIndex];
    
    // Fallback for direction/tangent if missing
    let direction = startWaypoint.tangent;
    if (!direction) {
        // Calculate an approximate tangent from the next segment
        const nextWaypoint = centerline[(opts.startLineIndex + 1) % N];
        direction = V.normalize(V.sub(nextWaypoint, startWaypoint));
    }
    const startLineDirection = V.perp(direction); // Perpendicular to the track is the start line orientation
    
    // Grid Positions (Staggered 2x2)
    const gridPositions = [];
    
    for (let p = 1; p <= opts.gridPositions; p++) {
        const row = Math.ceil(p / 2);
        const side = p % 2 !== 0 ? 'left' : 'right'; // P1 is left, P2 is right, P3 is left, etc.
        
        // Distance back from the start line
        const distanceBack = row * opts.gridSpacing;
        
        // Lateral offset from the centerline
        const lateralOffset = side === 'left' ? opts.staggerOffset : -opts.staggerOffset;

        // Find the index on the track at distanceBack meters BEFORE the startLineIndex
        let currentIndex = opts.startLineIndex;
        let currentDist = 0;
        
        // Go backward from the start line
        while (currentDist < distanceBack) {
            const prevIndex = (currentIndex - 1 + N) % N;
            // The crash is likely here if N is too small or if centerline has a hole
            
            // Check for single segment track (should be caught by N < 2)
            if (currentIndex === prevIndex) {
                 break;
            }
            
            const segmentDist = V.dist(centerline[currentIndex], centerline[prevIndex]);
            
            if (currentDist + segmentDist > distanceBack) {
                // Interpolate a position between currentIndex and prevIndex
                const remainingDist = distanceBack - currentDist;
                const frac = remainingDist / segmentDist;
                
                // Position (P_interp = P_current + (P_prev - P_current) * frac)
                const interpX = centerline[currentIndex].x + (centerline[prevIndex].x - centerline[currentIndex].x) * frac;
                const interpY = centerline[currentIndex].y + (centerline[prevIndex].y - centerline[currentIndex].y) * frac;
                
                currentIndex = -1; // Flag to use interpolated position
                startWaypoint.position = { x: interpX, y: interpY };
                break;
            }
            
            currentDist += segmentDist;
            currentIndex = prevIndex;
        }

        // Base position (on centerline)
        const baseWaypoint = currentIndex === -1 ? startWaypoint : centerline[currentIndex];
        
        // Direction at the base position (for lateral offset)
        // Recalculate direction if baseWaypoint doesn't have it (original centerline points)
        let baseDirection = baseWaypoint.direction;
        if (!baseDirection) {
            // Recalculate tangent for the baseWaypoint based on neighbors
            const P_prev = centerline[(currentIndex - 1 + N) % N];
            const P_next = centerline[(currentIndex + 1) % N];
            baseDirection = V.normalize(V.sub(P_next, P_prev));
        }

        const offsetVector = V.scale(V.perp(baseDirection), lateralOffset);
        
        // Final grid position
        const position = V.add(baseWaypoint.position || baseWaypoint, offsetVector);
        
        gridPositions.push({
            position: p,
            x: position.x,
            y: position.y,
            row: row,
            side: side
        });
    }

    return {
        startLineIndex: opts.startLineIndex,
        startLinePosition: startWaypoint,
        startLineDirection: startLineDirection,
        finishLineIndex: opts.startLineIndex,
        gridPositions: gridPositions
    };
}

/**
 * Generates all track features
 * @param {Object} trackData - Output from generateTrack()
 * @param {Object} options - Feature configuration
 * @returns {Object} Complete track with all features
 */
function generateTrackFeatures(trackData, options = {}) {
    const N = trackData.centerline.length;
    
    // Default options for feature generation
    const defaultOptions = {
        sectors: {},
        pitLane: {},
        drsZones: {},
        startGrid: {},
    };

    const opts = { ...defaultOptions, ...options };
    
    // Generate all features
    const sectors = generateSectors(trackData, opts.sectors);
    const pitLane = generatePitLane(trackData, opts.pitLane);
    const drsZones = generateDRSZones(trackData, opts.drsZones);
    const startGrid = generateStartGrid(trackData, opts.startGrid);

    // Initialize waypoint flags array
    const waypointFlags = new Array(N).fill(0);
    
    // Define Flags
    const FLAGS = {
        PIT_ENTRY: 1,
        PIT_EXIT: 2,
        DRS_DETECTION: 4,
        DRS_ACTIVE: 8,
        SECTOR_BOUNDARY: 16
    };
    
    // Apply Pit Lane Flags
    if (pitLane.entryIndex !== undefined) {
        waypointFlags[pitLane.entryIndex] |= FLAGS.PIT_ENTRY;
    }
    if (pitLane.exitIndex !== undefined) {
        waypointFlags[pitLane.exitIndex] |= FLAGS.PIT_EXIT;
    }
    
    // Apply DRS Zone Flags
    if (drsZones.zones) {
        for (const zone of drsZones.zones) {
            waypointFlags[zone.detectionIndex] |= FLAGS.DRS_DETECTION;
            
            // Apply DRS_ACTIVE flag from activation to deactivation point
            let i = zone.activationIndex;
            const deactivationIndex = zone.deactivationIndex;
            
            let count = 0;
            // Iterate from activation to deactivation, handling wrap-around
            while (i !== deactivationIndex) {
                waypointFlags[i] |= FLAGS.DRS_ACTIVE;
                i = (i + 1) % N;
                count++;
                if (count > N * 2) break; // Safety break for complex wrap-around
            }
        }
    }
    
    // Apply Sector Boundary Flags
    if (sectors.sectors) {
        for (let i = 0; i < sectors.sectors.length - 1; i++) {
            const sector = sectors.sectors[i];
            waypointFlags[sector.endIndex] |= FLAGS.SECTOR_BOUNDARY;
        }
    }
    
    // Apply start/finish line boundary
    if (startGrid.startLineIndex !== undefined) {
         waypointFlags[startGrid.startLineIndex] |= FLAGS.SECTOR_BOUNDARY;
    }


    // Combine results
    const combinedTrackData = {
        ...trackData,
        sectors,
        pitLane,
        drsZones,
        startGrid,
        waypointFlags
    };

    return combinedTrackData;
}

// --- Helper functions for pit lane (To be implemented) ---

/**
 * Generates an S-curve blend using Hermite interpolation
 * @param {{x: number, y: number}} start - Start point on main track
 * @param {{x: number, y: number}} end - End point on pit lane
 * @param {{x: number, y: number}} startTangent - Tangent at start
 * @param {{x: number, y: number}} endTangent - Tangent at end
 * @param {number} samples - Number of points to generate
 * @returns {Array<{x: number, y: number}>} Array of points forming the S-curve
 */
function generateHermiteBlend(start, end, startTangent, endTangent, samples = 20) {
    const path = [];
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        path.push(hermiteInterpolate(start, end, startTangent, endTangent, t));
    }
    return path;
}

/**
 * Generates pit stall positions along the pit lane centerline.
 * @param {Array<Object>} pitCenterline - Centerline of the pit lane
 * @param {number} stallLength - Length per pit stall
 * @param {number} stallCount - Number of pit stalls
 * @returns {Array<{id: number, position: {x: number, y: number}, direction: {x: number, y: number}}>}
 */
function generatePitStalls(pitCenterline, stallLength, stallCount) {
    const stalls = [];
    let currentDistance = 0;
    const pitLaneLength = pitCenterline[pitCenterline.length - 1].distance;

    // Start stall placement after a small buffer (e.g., one stall length) for a safe travel area
    const startBuffer = stallLength * 1.5;
    
    // Calculate total required stall length
    const totalStallLength = stallLength * stallCount;

    // Find the closest point on the pitCenterline to startBuffer distance
    let startStallIndex = 0;
    for (let i = 0; i < pitCenterline.length; i++) {
        if (pitCenterline[i].distance >= startBuffer) {
            startStallIndex = i;
            break;
        }
    }
    
    // Ensure there's enough room for all stalls
    if (pitLaneLength < startBuffer + totalStallLength) {
        console.warn("Pit lane too short for requested number of stalls.");
        // We will continue with best effort, but this warning should be addressed in track generation.
    }

    // Place stalls from the determined starting index
    let currentStallDistance = startBuffer;
    for (let i = 0; i < stallCount; i++) {
        // Find the index closest to the current stall distance
        let stallIndex = -1;
        for (let j = startStallIndex; j < pitCenterline.length; j++) {
            if (pitCenterline[j].distance >= currentStallDistance) {
                stallIndex = j;
                break;
            }
        }
        
        if (stallIndex === -1) {
            // Reached end of pit lane, stop placing stalls
            break; 
        }

        const waypoint = pitCenterline[stallIndex];
        
        stalls.push({
            id: i,
            position: { x: waypoint.x, y: waypoint.y },
            // Direction is perpendicular to the track to represent the stall angle
            direction: V.normalize(V.perp(waypoint.direction)) 
        });

        currentStallDistance += stallLength;
    }

    return stalls;
}


// --- Exports ---
// Functions are exposed globally for the test harness.