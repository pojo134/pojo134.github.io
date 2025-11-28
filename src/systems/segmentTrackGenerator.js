/**
 * Core Segment System for Track Generation
 * This file replaces the previous over-engineered approach with a simple,
 * segment-based track generator.
 */

import Track from '../models/track.js';

// --- Constants and Math Helpers ---

const SEGMENT_STRAIGHT = 'straight';
const SEGMENT_TURN_LEFT = 'turn_left';
const SEGMENT_TURN_RIGHT = 'turn_right';

/**
 * Converts degrees to radians.
 * @param {number} degrees - Angle in degrees.
 * @returns {number} Angle in radians.
 */
function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees.
 * @param {number} radians - Angle in radians.
 * @returns {number} Angle in degrees.
 */
function radToDeg(radians) {
    return radians * (180 / Math.PI);
}


// --- Segment Generation Functions ---

/**
 * Generate points along a straight segment
 * @param {Object} start - Starting point {x, y, direction} (direction in radians)
 * @param {number} length - Length of straight
 * @param {number} pointSpacing - Distance between points (default 5)
 * @returns {Object} {points: [{x, y}], end: {x, y, direction}, segmentLength: number}
 */
function generateStraight(start, length, pointSpacing = 5) {
    const points = [];
    const numPoints = Math.floor(length / pointSpacing);
    const cosDir = Math.cos(start.direction);
    const sinDir = Math.sin(start.direction);

    for (let i = 0; i <= numPoints; i++) {
        const currentLength = i * pointSpacing;
        const x = start.x + currentLength * cosDir;
        const y = start.y + currentLength * sinDir;
        points.push({ x, y });
    }

    // Add final point if length is not perfectly divisible by pointSpacing
    if (length % pointSpacing !== 0) {
        const x = start.x + length * cosDir;
        const y = start.y + length * sinDir;
        points.push({ x, y });
    }

    const end = {
        x: points[points.length - 1].x,
        y: points[points.length - 1].y,
        direction: start.direction // Direction is unchanged
    };

    // Remove the starting point to avoid duplication with previous segment's end point
    return { points: points.slice(1), end, segmentLength: length };
}

/**
 * Generate points along a turn segment
 * @param {Object} start - Starting point {x, y, direction}
 * @param {number} radius - Turn radius
 * @param {number} angleDegrees - Turn angle in degrees (positive = left, negative = right)
 * @param {number} pointSpacing - Arc length between points
 * @returns {Object} {points: [{x, y}], end: {x, y, direction}, segmentLength: number}
 */
function generateTurn(start, radius, angleDegrees, pointSpacing = 5) {
    const points = [];
    const angleRadians = degToRad(angleDegrees);
    const absAngleRadians = Math.abs(angleRadians);
    const directionSign = Math.sign(angleDegrees); // 1 for left, -1 for right

    // Perpendicular vector for center calculation
    // Left turn (direction + 90 degrees/PI/2)
    // Right turn (direction - 90 degrees/PI/2)
    const perpAngle = start.direction + directionSign * (Math.PI / 2);

    // Center point of the circle
    const centerX = start.x + radius * Math.cos(perpAngle);
    const centerY = start.y + radius * Math.sin(perpAngle);

    // Angle of the starting point relative to the center (initial angle)
    const initialAngle = Math.atan2(start.y - centerY, start.x - centerX);

    // Arc length of the segment
    const segmentLength = absAngleRadians * radius;
    const numPoints = Math.ceil(segmentLength / pointSpacing);

    // Angle step for each point
    const angleStep = angleRadians / numPoints;

    for (let i = 0; i <= numPoints; i++) {
        const currentAngle = initialAngle + i * angleStep;

        // Calculate point on the circle
        const x = centerX + radius * Math.cos(currentAngle);
        const y = centerY + radius * Math.sin(currentAngle);
        points.push({ x, y });
    }

    const finalAngle = initialAngle + angleRadians;
    const finalDirection = start.direction + angleRadians;

    const end = {
        // Recalculate end position in case the loop didn't hit the exact end point
        x: centerX + radius * Math.cos(finalAngle),
        y: centerY + radius * Math.sin(finalAngle),
        direction: finalDirection
    };

    // Replace the last point with the precise end point calculated above
    points[points.length - 1] = { x: end.x, y: end.y };

    // Remove the starting point, as it will be duplicated by the previous segment's end point
    return { points: points.slice(1), end, segmentLength };
}

// --- Track Assembly and Border Functions ---

/**
 * Assemble a track from a list of segments
 * @param {Array} segments - Array of segment definitions
 * @param {Object} startPosition - {x, y, direction} (direction in radians)
 * @returns {Object} {centerline: [{x, y}], totalLength: number}
 */
function assembleTrack(segments, startPosition) {
    let currentPosition = {
        x: startPosition.x,
        y: startPosition.y,
        direction: startPosition.direction || 0
    };
    const centerline = [{ x: currentPosition.x, y: currentPosition.y }];
    let totalLength = 0;

    for (const segment of segments) {
        let result;
        if (segment.type === SEGMENT_STRAIGHT) {
            result = generateStraight(currentPosition, segment.length);
        } else if (segment.type === SEGMENT_TURN_LEFT || segment.type === SEGMENT_TURN_RIGHT) {
            // Angle is positive for left, negative for right. 
            // In the segment definition, 'angle' is always positive degrees.
            let angleDegrees = segment.angle;
            if (segment.type === SEGMENT_TURN_RIGHT) {
                angleDegrees *= -1;
            }
            result = generateTurn(currentPosition, segment.radius, angleDegrees);
        } else {
            console.warn(`Unknown segment type: ${segment.type}`);
            continue;
        }

        centerline.push(...result.points);
        currentPosition = result.end;
        totalLength += result.segmentLength;
    }

    return { centerline, totalLength };
}

/**
 * Generate left and right track borders from centerline
 * Uses vertex normals (average of incoming/outgoing vectors) for smooth joins.
 * @param {Array} centerline - Array of {x, y} points
 * @param {number} trackWidth - Total track width
 * @returns {Object} {leftBorder: [{x,y}], rightBorder: [{x,y}]}
 */
function generateBorders(centerline, trackWidth) {
    const halfWidth = trackWidth / 2;
    const leftBorder = [];
    const rightBorder = [];
    const points = centerline;
    const len = points.length;

    // Check if track is looped (start matches end)
    // Use a small epsilon for float comparison (increased from 0.1 to 2.0 for tolerance)
    const isLooped = len > 1 &&
        Math.abs(points[0].x - points[len - 1].x) < 2.0 &&
        Math.abs(points[0].y - points[len - 1].y) < 2.0;

    for (let i = 0; i < len; i++) {
        // Determine indices for previous and next points
        let prevIdx, nextIdx;

        if (i === 0) {
            // If looped, use the second-to-last point (since last point == first point)
            // If not looped, just project the first segment backward (use i)
            prevIdx = isLooped ? len - 2 : 0;
            nextIdx = i + 1;
        } else if (i === len - 1) {
            prevIdx = i - 1;
            // If looped, use the second point
            nextIdx = isLooped ? 1 : len - 1;
        } else {
            prevIdx = i - 1;
            nextIdx = i + 1;
        }

        // Get points
        const p = points[i];
        const prevP = points[prevIdx];
        const nextP = points[nextIdx];

        // Calculate vectors
        // If at ends and not looped, duplicate the neighbor to project straight
        const v1x = (i === 0 && !isLooped) ? (points[1].x - p.x) : (p.x - prevP.x);
        const v1y = (i === 0 && !isLooped) ? (points[1].y - p.y) : (p.y - prevP.y);

        const v2x = (i === len - 1 && !isLooped) ? (p.x - points[len - 2].x) : (nextP.x - p.x);
        const v2y = (i === len - 1 && !isLooped) ? (p.y - points[len - 2].y) : (nextP.y - p.y);

        // Normalize vectors
        const len1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1; // Avoid div/0
        const len2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;

        const n1x = v1x / len1;
        const n1y = v1y / len1;

        const n2x = v2x / len2;
        const n2y = v2y / len2;

        // Average vector (Tangent)
        let tx = n1x + n2x;
        let ty = n1y + n2y;

        // Normalize tangent
        const tLen = Math.sqrt(tx * tx + ty * ty);
        if (tLen < 0.001) {
            // Vectors cancel out (180 deg turn), fallback to one
            tx = n1x;
            ty = n1y;
        } else {
            tx /= tLen;
            ty /= tLen;
        }

        // Normal vector (Rotate tangent -90 degrees: x,y -> y,-x)
        // Check coordinate system: Canvas Y is Down.
        // Right turn (Clockwise): Tangent rotates right. Normal points "Left" (Outside).
        // If moving East (1,0), Normal should be North (0,-1)?
        // If Tangent=(1,0). Rotate -90 -> (0, -1)? No, that's -90.
        // Let's verify with simple straight.
        // Tangent (1,0). Normal (-0, 1) = (0,1) -> Down.
        // Left Border is "Left" of curve.
        // If I walk East, Left is North (Up, Y-).
        // So Normal should be (0, -1).
        // So x -> y, y -> -x gives (0, -1). Correct.
        const nx = ty;
        const ny = -tx;

        // Miter adjustment (optional, keeps width constant on corners)
        // const dot = n1x * nx + n1y * ny;
        // const miterLen = halfWidth / (dot || 1);
        // For now, simple constant width is safer for "small gaps"
        const miterLen = halfWidth;

        leftBorder.push({
            x: p.x + nx * miterLen,
            y: p.y + ny * miterLen
        });

        rightBorder.push({
            x: p.x - nx * miterLen,
            y: p.y - ny * miterLen
        });
    }

    return { leftBorder, rightBorder };
}

// --- Predefined Track Templates ---

const TEMPLATE_OVAL = [
    { type: SEGMENT_STRAIGHT, length: 300 },
    { type: SEGMENT_TURN_LEFT, radius: 100, angle: 180 },
    { type: SEGMENT_STRAIGHT, length: 300 },
    { type: SEGMENT_TURN_LEFT, radius: 100, angle: 180 }
];

const TEMPLATE_CIRCUIT_1 = [
    { type: SEGMENT_STRAIGHT, length: 200 },
    { type: SEGMENT_TURN_RIGHT, radius: 80, angle: 90 },
    { type: SEGMENT_STRAIGHT, length: 150 },
    { type: SEGMENT_TURN_LEFT, radius: 60, angle: 45 },
    { type: SEGMENT_STRAIGHT, length: 100 },
    { type: SEGMENT_TURN_LEFT, radius: 60, angle: 45 },
    { type: SEGMENT_STRAIGHT, length: 150 },
    { type: SEGMENT_TURN_RIGHT, radius: 80, angle: 90 },
    { type: SEGMENT_STRAIGHT, length: 200 },
    { type: SEGMENT_TURN_RIGHT, radius: 100, angle: 90 },
    { type: SEGMENT_STRAIGHT, length: 100 },
    { type: SEGMENT_TURN_RIGHT, radius: 100, angle: 180 }
];

// Monza-inspired high-speed circuit with chicanes
const TEMPLATE_MONZA = [
    { type: SEGMENT_STRAIGHT, length: 400 },
    { type: SEGMENT_TURN_RIGHT, radius: 50, angle: 90 },
    { type: SEGMENT_TURN_LEFT, radius: 50, angle: 90 },
    { type: SEGMENT_STRAIGHT, length: 200 },
    { type: SEGMENT_TURN_RIGHT, radius: 120, angle: 110 },
    { type: SEGMENT_STRAIGHT, length: 150 },
    { type: SEGMENT_TURN_RIGHT, radius: 40, angle: 130 },
    { type: SEGMENT_TURN_LEFT, radius: 40, angle: 60 },
    { type: SEGMENT_STRAIGHT, length: 300 },
    { type: SEGMENT_TURN_RIGHT, radius: 80, angle: 90 },
    { type: SEGMENT_TURN_RIGHT, radius: 150, angle: 90 }
];

// Monaco-inspired tight street circuit
const TEMPLATE_MONACO = [
    { type: SEGMENT_STRAIGHT, length: 200 },
    { type: SEGMENT_TURN_RIGHT, radius: 40, angle: 90 },
    { type: SEGMENT_STRAIGHT, length: 250 },
    { type: SEGMENT_TURN_LEFT, radius: 30, angle: 120 },
    { type: SEGMENT_TURN_RIGHT, radius: 25, angle: 90 },
    { type: SEGMENT_STRAIGHT, length: 100 },
    { type: SEGMENT_TURN_RIGHT, radius: 20, angle: 55 },
    { type: SEGMENT_STRAIGHT, length: 200 },
    { type: SEGMENT_TURN_LEFT, radius: 50, angle: 45 },
    { type: SEGMENT_STRAIGHT, length: 180 },
    { type: SEGMENT_TURN_LEFT, radius: 40, angle: 90 },
    { type: SEGMENT_TURN_RIGHT, radius: 40, angle: 90 },
    { type: SEGMENT_STRAIGHT, length: 100 },
    { type: SEGMENT_TURN_RIGHT, radius: 35, angle: 100 },
    { type: SEGMENT_TURN_LEFT, radius: 60, angle: 80 },
    { type: SEGMENT_TURN_RIGHT, radius: 30, angle: 90 },
    { type: SEGMENT_STRAIGHT, length: 150 },
    { type: SEGMENT_TURN_RIGHT, radius: 60, angle: 90 },
    { type: SEGMENT_TURN_RIGHT, radius: 30, angle: 90 }
];

// Simple GP layout
const TEMPLATE_SIMPLE_GP = [
    { type: SEGMENT_STRAIGHT, length: 350 },
    { type: SEGMENT_TURN_RIGHT, radius: 60, angle: 90 },
    { type: SEGMENT_STRAIGHT, length: 200 },
    { type: SEGMENT_TURN_RIGHT, radius: 80, angle: 90 },
    { type: SEGMENT_STRAIGHT, length: 250 },
    { type: SEGMENT_TURN_LEFT, radius: 50, angle: 60 },
    { type: SEGMENT_TURN_RIGHT, radius: 50, angle: 60 },
    { type: SEGMENT_STRAIGHT, length: 150 },
    { type: SEGMENT_TURN_RIGHT, radius: 100, angle: 90 },
    { type: SEGMENT_STRAIGHT, length: 300 },
    { type: SEGMENT_TURN_RIGHT, radius: 70, angle: 90 }
];

// --- Procedural Generation ---

/**
 * Creates a seeded random number generator.
 * @param {number} seed - The initial seed.
 * @returns {function(): number} A function that returns a random number between 0 and 1.
 */
function seededRandom(seed) {
    let state = seed;
    return function() {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
    };
}

/**
 * Checks if two line segments intersect.
 * @param {Object} p1 - Start of line 1 {x, y}
 * @param {Object} p2 - End of line 1 {x, y}
 * @param {Object} p3 - Start of line 2 {x, y}
 * @param {Object} p4 - End of line 2 {x, y}
 * @returns {boolean} True if intersecting
 */
function doLinesIntersect(p1, p2, p3, p4) {
    const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
    if (det === 0) return false; // Parallel lines

    const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
    const gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;

    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

/**
 * Finds the intersection point of two line segments if they intersect.
 * @param {Object} p1 - Start of line 1 {x, y}
 * @param {Object} p2 - End of line 1 {x, y}
 * @param {Object} p3 - Start of line 2 {x, y}
 * @param {Object} p4 - End of line 2 {x, y}
 * @returns {Object|null} {x, y, t1, t2} where t1/t2 are parametric positions (0-1) along each segment, or null if no intersection
 */
function getLineIntersectionPoint(p1, p2, p3, p4) {
    const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
    if (Math.abs(det) < 0.0001) return null; // Parallel lines

    const t1 = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
    const t2 = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;

    // Check if intersection is within both segments (with small epsilon for endpoints)
    const epsilon = 0.01;
    if (t1 > epsilon && t1 < (1 - epsilon) && t2 > epsilon && t2 < (1 - epsilon)) {
        return {
            x: p1.x + t1 * (p2.x - p1.x),
            y: p1.y + t1 * (p2.y - p1.y),
            t1: t1,
            t2: t2
        };
    }

    return null;
}

/**
 * Detect all self-intersections in a track centerline.
 * Used for rendering bridges/tunnels at crossing points.
 * @param {Array} centerline - Array of {x, y} points
 * @returns {Array} Array of intersection objects: [{point: {x,y}, segment1Index, segment2Index, t1, t2}]
 */
function detectTrackIntersections(centerline) {
    const intersections = [];

    if (!centerline || centerline.length < 4) return intersections;

    // Check all pairs of segments for intersections
    for (let i = 0; i < centerline.length - 1; i++) {
        const p1 = centerline[i];
        const p2 = centerline[i + 1];

        // FIXED: Start checking from segments far enough away (changed from i+2 to i+3)
        // This avoids checking segments that are too close (within 3 segments)
        for (let j = i + 3; j < centerline.length - 1; j++) {
            const p3 = centerline[j];
            const p4 = centerline[j + 1];

            const intersection = getLineIntersectionPoint(p1, p2, p3, p4);

            if (intersection) {
                intersections.push({
                    point: { x: intersection.x, y: intersection.y },
                    segment1Index: i,
                    segment2Index: j,
                    t1: intersection.t1,
                    t2: intersection.t2
                });
            }
        }
    }

    return intersections;
}

/**
 * Procedurally generate a track from random segments, avoiding self-intersection.
 * @param {Object} options - {seed, numSegments, minStraight, maxStraight, minRadius, maxRadius, minAngle, maxAngle, allowIntersections}
 * @returns {Array} Array of segment definitions
 */
function generateProceduralSegments(options) {
    const {
        seed = 12345,
        numSegments = 15,
        minStraight = 100,
        maxStraight = 300,
        minRadius = 50,
        maxRadius = 150,
        minAngle = 30,
        maxAngle = 90,
        allowIntersections = false // Set to true to allow bridges/tunnels
    } = options;

    const random = seededRandom(seed);
    const segments = [];
    const history = []; // To store state for backtracking: { segment, endPos }
    
    let currentPos = { x: 0, y: 0, direction: 0 };
    let generatedCount = 0;
    const maxAttempts = 1000; // Total safety break
    let attempts = 0;

    // Add initial straight
    const startSeg = { type: SEGMENT_STRAIGHT, length: 150 };
    segments.push(startSeg);
    const startRes = generateStraight(currentPos, 150);
    history.push({ segment: startSeg, points: startRes.points, end: startRes.end });
    currentPos = startRes.end;

    while (generatedCount < numSegments && attempts < maxAttempts) {
        attempts++;
        
        // Try to generate a segment
        const segmentType = random() > 0.5 ? 'straight' : 'turn';
        let candidateSeg;
        let candidateRes;

        if (segmentType === 'straight') {
            const length = minStraight + random() * (maxStraight - minStraight);
            candidateSeg = { type: SEGMENT_STRAIGHT, length };
            candidateRes = generateStraight(currentPos, length);
        } else { // Turn
            const radius = minRadius + random() * (maxRadius - minRadius);
            const angle = minAngle + random() * (maxAngle - minAngle);
            const direction = random() > 0.5 ? SEGMENT_TURN_LEFT : SEGMENT_TURN_RIGHT;
            candidateSeg = { type: direction, radius, angle };
            
            // Adjust angle for turn direction in generation call
            let genAngle = angle;
            if (direction === SEGMENT_TURN_RIGHT) genAngle *= -1;
            candidateRes = generateTurn(currentPos, radius, genAngle);
        }

        // Check Intersection (skip if allowIntersections is true)
        // We check the new candidate segment against all previous segments
        const pStart = currentPos;
        const pEnd = candidateRes.end;
        let intersects = false;

        // Only check for intersections if they're not allowed
        if (!allowIntersections) {
            // Iterate through all previous segments in history (excluding the very last one, which is currentPos's origin)
            // Check against all history except the immediately preceding segment (connected by definition)
            for (let i = 0; i < history.length - 1; i++) {
                const hSegPoints = history[i].points; // Detailed points of historical segment

                // Iterate through sub-segments of the candidate's path
                for (let j = 0; j < candidateRes.points.length - 1; j++) {
                    const cp1 = candidateRes.points[j];
                    const cp2 = candidateRes.points[j+1];

                    // Iterate through sub-segments of the historical path
                    for (let k = 0; k < hSegPoints.length - 1; k++) {
                        const hp1 = hSegPoints[k];
                        const hp2 = hSegPoints[k+1];

                        // Exclude intersections at shared endpoints to allow connection
                        // Use epsilon for floating-point comparison
                        const epsilon = 0.001;
                        const arePointsEqual = (p1, p2) => {
                            return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon;
                        };

                        if (arePointsEqual(cp1, hp1) || arePointsEqual(cp1, hp2) ||
                            arePointsEqual(cp2, hp1) || arePointsEqual(cp2, hp2)) {
                            continue;
                        }

                        if (doLinesIntersect(cp1, cp2, hp1, hp2)) {
                            intersects = true;
                            console.log(`Intersection detected: Rejecting segment (attempt ${attempts})`);
                            break;
                        }
                    }
                    if (intersects) break;
                }
                if (intersects) break;
            }
        }

        if (!intersects || allowIntersections) {
            // Accept (either no intersection, or intersections are allowed)
            segments.push(candidateSeg);
            history.push({ segment: candidateSeg, points: candidateRes.points, end: candidateRes.end });
            currentPos = candidateRes.end;
            generatedCount++;

            if (!allowIntersections && intersects) {
                console.warn('WARNING: Segment accepted despite intersection (this should not happen!)');
            }
        } else {
            // Reject due to intersection
            // If we fail too many times, backtrack.
            if (attempts % 10 === 0 && segments.length > 1) {
                console.log(`Backtracking: removing segment (attempts: ${attempts}, segments: ${segments.length})`);
                segments.pop();
                history.pop();
                currentPos = history[history.length - 1].end;
                generatedCount--;
            }
        }
    }

    // Add a final straight to help align (with intersection checking if needed)
    if (!allowIntersections) {
        console.log(`Generated ${generatedCount} segments out of ${numSegments} requested in ${attempts} attempts`);
    }

    segments.push({ type: SEGMENT_STRAIGHT, length: 150 });

    return segments;
}

/**
 * Iteratively adjusts segment parameters (angles) to ensure the track loop closes mathematically.
 * Uses a Coordinate Descent approach with Shape Preservation Constraints.
 * @param {Array} segments - Original segment definitions
 * @param {Object} startPosition - {x, y, direction}
 * @returns {Array} Adjusted segment definitions (cloned)
 */
function relaxSegments(segments, startPosition) {
    const adjustedSegments = JSON.parse(JSON.stringify(segments));
    const targetX = startPosition.x;
    const targetY = startPosition.y;
    const targetDir = startPosition.direction;

    const iterations = 5000; // Increased iterations
    let currentCost = Infinity;

    // Cache original values for shape preservation cost
    const originals = segments.map(s => ({
        length: s.length || 0,
        angle: s.angle || 0
    }));

    // Coordinate Descent
    for (let k = 0; k < iterations; k++) {
        // Multi-stage Weights
        let wPos = 10.0;   // Increased from 1.0 (emphasize positional closure)
        let wAngle = 500.0; // Increased from 100.0
        let wShape = 0.5;   // Increased from 0.1 (prioritize shape more)
        
        if (k > iterations * 0.7) {
            // Phase 2: Refine Angle and Shape
            wAngle = 5000.0; // Increased from 500.0 (very strong angle alignment)
            wShape = 2.0;   // Increased from 1.0 (even stronger shape preservation)
        }

        // Calculate Cost with current weights
        const getCost = (segs) => {
            const result = assembleTrack(segs, startPosition);
            const endPoint = result.centerline[result.centerline.length - 1];
            const endDir = result.centerline.length > 1 
                ? Math.atan2(endPoint.y - result.centerline[result.centerline.length-2].y, endPoint.x - result.centerline[result.centerline.length-2].x)
                : startPosition.direction;

            const dx = endPoint.x - targetX;
            const dy = endPoint.y - targetY;
            const posError = Math.hypot(dx, dy);

            let angleError = endDir - targetDir;
            while (angleError <= -Math.PI) angleError += 2*Math.PI;
            while (angleError > Math.PI) angleError -= 2*Math.PI;
            angleError = Math.abs(angleError);

            let shapeError = 0;
            for (let i = 0; i < segs.length; i++) {
                if (segs[i].type === SEGMENT_STRAIGHT) {
                    shapeError += Math.pow(segs[i].length - originals[i].length, 2);
                } else {
                    shapeError += Math.pow(segs[i].angle - originals[i].angle, 2);
                }
            }
            
            return wPos * posError + wAngle * angleError + wShape * Math.sqrt(shapeError);
        };

        // Lazy update of current cost to match weights (optimization: only do this when weights change? No, just do it)
        currentCost = getCost(adjustedSegments);

        // Stop if strictly converged
        if (currentCost < 0.5) break; // Lowered convergence threshold


        for (let i = 0; i < adjustedSegments.length; i++) {
            const seg = adjustedSegments[i];
            
            let param = 'length';
            let baseStep = 5.0;
            let minVal = 10; // Lowered min length to allow more detail
            
            if (seg.type.includes('turn')) {
                param = 'angle';
                baseStep = 1.0; 
                minVal = 2; // Lowered min angle to allow sharper/smaller turns
            }

            // Adaptive Step
            const step = baseStep * (1 + currentCost / 1000);

            const originalValue = seg[param];

            const testValue = (val) => {
                if (val < minVal) return Infinity; 
                const prevVal = seg[param];
                seg[param] = val;
                const cost = getCost(adjustedSegments);
                seg[param] = prevVal; 
                return cost;
            };

            const costPlus = testValue(originalValue + step);
            const costMinus = testValue(originalValue - step);

            if (costPlus < currentCost && costPlus < costMinus) {
                seg[param] = originalValue + step;
                currentCost = costPlus;
            } else if (costMinus < currentCost && costMinus < costPlus) {
                seg[param] = originalValue - step;
                currentCost = costMinus;
            }
        }
    }
    
    return adjustedSegments;
}

// --- Main Generation Function ---

/**
 * Generate a complete track
 * @param {Object} options - {template: string, trackWidth: number, startX: number, startY: number, startDirectionDegrees: number}
 * @returns {Object} {centerline, leftBorder, rightBorder, totalLength}
 */
function generateSegmentTrack(options) {
    const {
        template,
        trackWidth = 20,
        startX = 100,
        startY = 100,
        startDirectionDegrees = 0
    } = options;

    let segments;
    let allowIntersections = false;

    if (template === 'procedural') {
        segments = generateProceduralSegments(options.proceduralOptions || {});
        // Store the allowIntersections setting from procedural options
        allowIntersections = options.proceduralOptions?.allowIntersections || false;
    } else {
        const templateName = template;
        if (templateName === 'oval') {
            segments = TEMPLATE_OVAL;
        } else if (templateName === 'circuit_1') {
            segments = TEMPLATE_CIRCUIT_1;
        } else if (templateName === 'monza') {
            segments = TEMPLATE_MONZA;
        } else if (templateName === 'monaco') {
            segments = TEMPLATE_MONACO;
        } else if (templateName === 'simplegp') {
            segments = TEMPLATE_SIMPLE_GP;
        }
    }

    if (!segments) {
        throw new Error(`Track template '${template}' not found.`);
    }

    const startPosition = {
        x: startX,
        y: startY,
        direction: degToRad(startDirectionDegrees)
    };

    const startLineForTrack = {
        x: startX,
        y: startY,
        directionDegrees: startDirectionDegrees
    };

    // 1. Relax Segments to Close Loop (if needed)
    // For procedural tracks without intersections allowed, skip relaxation to preserve non-intersecting property
    const isLoopTemplate = ['oval', 'circuit_1', 'monza', 'monaco', 'simplegp', 'procedural'].includes(template);
    const shouldRelax = isLoopTemplate && (template !== 'procedural' || allowIntersections);

    if (shouldRelax) {
        console.log('Relaxing segments to close loop...');
        segments = relaxSegments(segments, startPosition);
    } else if (template === 'procedural' && !allowIntersections) {
        console.log('Skipping relaxation for procedural track (preserving non-intersecting property)');
    }

    // 2. Assemble Centerline
    let { centerline, totalLength } = assembleTrack(segments, startPosition);

    // 3. Force closure with both position AND direction matching
    // Skip for procedural tracks without intersections to preserve non-intersecting property
    const shouldForceClosure = isLoopTemplate && (template !== 'procedural' || allowIntersections);

    if (shouldForceClosure && centerline.length > 10) {
        const firstPoint = centerline[0];
        const lastPoint = centerline[centerline.length - 1];
        const gapX = lastPoint.x - firstPoint.x;
        const gapY = lastPoint.y - firstPoint.y;
        const gapDistance = Math.sqrt(gapX * gapX + gapY * gapY);

        // Calculate direction at start (angle from point 0 to point 1)
        const startDir = Math.atan2(
            centerline[1].y - centerline[0].y,
            centerline[1].x - centerline[0].x
        );

        // Calculate direction at end (angle from second-to-last to last point)
        const endDir = Math.atan2(
            centerline[centerline.length - 1].y - centerline[centerline.length - 2].y,
            centerline[centerline.length - 1].x - centerline[centerline.length - 2].x
        );

        // Normalize angle difference to [-PI, PI]
        let directionError = endDir - startDir;
        while (directionError > Math.PI) directionError -= 2 * Math.PI;
        while (directionError < -Math.PI) directionError += 2 * Math.PI;
        const directionErrorDegrees = (directionError * 180) / Math.PI;

        console.log(`Track closure gap: ${gapDistance.toFixed(2)} units`);
        console.log(`Direction mismatch: ${directionErrorDegrees.toFixed(2)} degrees`);

        const POSITION_THRESHOLD = 1.0;
        const DIRECTION_THRESHOLD_DEG = 5.0;

        if (gapDistance > POSITION_THRESHOLD || Math.abs(directionErrorDegrees) > DIRECTION_THRESHOLD_DEG) {
            console.log(`Enforcing smooth closure (adjusting last 6 points)...`);

            // Smooth the last N points to create a seamless closure
            // We'll use a Hermite spline approach to blend the track smoothly
            const numPointsToAdjust = Math.min(6, Math.floor(centerline.length * 0.05));
            const startIdx = centerline.length - numPointsToAdjust;

            // The target is to reach firstPoint with direction matching startDir
            const targetX = firstPoint.x;
            const targetY = firstPoint.y;
            const targetDir = startDir;

            // Get the "anchor" point (the last point we won't modify)
            const anchorPoint = centerline[startIdx - 1];
            const anchorDir = Math.atan2(
                centerline[startIdx].y - anchorPoint.y,
                centerline[startIdx].x - anchorPoint.x
            );

            // Use a cubic Hermite spline to smoothly blend from anchor to target
            // This ensures smooth position AND direction
            for (let i = 0; i < numPointsToAdjust; i++) {
                const t = (i + 1) / numPointsToAdjust; // 0 to 1
                const tSq = t * t;
                const tCube = tSq * t;

                // Hermite basis functions
                const h00 = 2 * tCube - 3 * tSq + 1;  // Position at start
                const h10 = tCube - 2 * tSq + t;       // Tangent at start
                const h01 = -2 * tCube + 3 * tSq;      // Position at end
                const h11 = tCube - tSq;               // Tangent at end

                // Tangent magnitude (controls how "tight" the curve is)
                const tangentScale = 30.0;

                // Start tangent (from anchor point)
                const m0x = Math.cos(anchorDir) * tangentScale;
                const m0y = Math.sin(anchorDir) * tangentScale;

                // End tangent (into target point)
                const m1x = Math.cos(targetDir) * tangentScale;
                const m1y = Math.sin(targetDir) * tangentScale;

                // Hermite interpolation
                const newX = h00 * anchorPoint.x + h10 * m0x + h01 * targetX + h11 * m1x;
                const newY = h00 * anchorPoint.y + h10 * m0y + h01 * targetY + h11 * m1y;

                centerline[startIdx + i] = { x: newX, y: newY };
            }

            // Verify closure
            const newGapX = centerline[centerline.length - 1].x - firstPoint.x;
            const newGapY = centerline[centerline.length - 1].y - firstPoint.y;
            const newGap = Math.sqrt(newGapX * newGapX + newGapY * newGapY);

            const newEndDir = Math.atan2(
                centerline[centerline.length - 1].y - centerline[centerline.length - 2].y,
                centerline[centerline.length - 1].x - centerline[centerline.length - 2].x
            );
            let newDirError = newEndDir - startDir;
            while (newDirError > Math.PI) newDirError -= 2 * Math.PI;
            while (newDirError < -Math.PI) newDirError += 2 * Math.PI;
            const newDirErrorDeg = (newDirError * 180) / Math.PI;

            console.log(`After smooth closure:`);
            console.log(`  Position gap: ${newGap.toFixed(2)} units`);
            console.log(`  Direction error: ${newDirErrorDeg.toFixed(2)} degrees`);
        } else {
            console.log(`Closure within tolerance (position < ${POSITION_THRESHOLD}, direction < ${DIRECTION_THRESHOLD_DEG}°)`);
        }
    }

    // 3. Generate Borders
    const { leftBorder, rightBorder } = generateBorders(centerline, trackWidth);

    // 4. Detect track intersections for bridge/tunnel rendering
    const intersections = detectTrackIntersections(centerline);
    if (intersections.length > 0) {
        console.log(`Track has ${intersections.length} self-intersection(s) - will render as bridges/tunnels`);
    }

    // 5. Generate Pit Lane
    let pitLane = null;
    if (template === 'oval') {
        // Oval Pit Lane Configuration
        // On first straight (Indices 0-60 roughly)
        const pitLaneStartMainIdx = 5; 
        const pitLaneEndMainIdx = 55;
        const pitLaneOffsetDistance = 15;
        const pitLaneWidth = trackWidth * 0.75;

        if (centerline.length > pitLaneEndMainIdx) {
            pitLane = generateOvalPitLane(
                centerline,
                trackWidth,
                pitLaneStartMainIdx,
                pitLaneEndMainIdx,
                pitLaneOffsetDistance,
                pitLaneWidth
            );
        }
    }

    const trackInstance = new Track(
        options.type || 'Circuit', // type - assuming a default if not provided
        options.name || template, // name
        centerline, // waypoints
        options.characteristics || {}, // characteristics
        options.weather || {}, // weather
        trackWidth, // trackWidth
        shouldForceClosure, // isLoop
        pitLane // pitLaneData
    );

    // Assign other internal properties that are not part of the constructor
    trackInstance.segmentTemplates = segments;
    trackInstance.startLine = startLineForTrack;
    trackInstance.leftBorder = leftBorder;
    trackInstance.rightBorder = rightBorder;
    trackInstance.intersections = intersections;
    
    // No need to call trackInstance.generateTrack() as all data is provided at construction
    
    return trackInstance;
}

/**
 * Generates a pit lane for an oval track with smooth entry/exit merges.
 * Creates a parallel path to the main track.
 */
function generateOvalPitLane(mainCenterline, mainTrackWidth, pitLaneStartMainIdx, pitLaneEndMainIdx, pitLaneOffsetDistance, pitLaneWidth) {
    const taperLengthPoints = 10; 
    const parallelStartIdx = pitLaneStartMainIdx + taperLengthPoints;
    const parallelEndIdx = pitLaneEndMainIdx - taperLengthPoints;

    if (parallelStartIdx >= parallelEndIdx) {
        console.warn("Pit lane too short for tapered entry/exit");
        return null;
    }

    const pitCenterline = [];
    // Calculate total offset from main CENTER line
    // mainTrackWidth/2 is edge of track. + pitLaneOffsetDistance is gap. + pitLaneWidth/2 is center of pit lane.
    // This assumes we offset to the "left" (inside for CCW).
    const totalOffset = (mainTrackWidth / 2) + pitLaneOffsetDistance + (pitLaneWidth / 2);

    // --- Helper to Calculate Normal ---
    const getNormal = (p1, p2) => {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        // Rotate -90 degrees (x, y) -> (y, -x)
        return { x: dy / dist, y: -dx / dist };
    };

    // --- 1. Entry Taper (Main Track -> Parallel) ---
    for (let i = 0; i <= taperLengthPoints; i++) {
        const mainIdx = pitLaneStartMainIdx + i;
        const p = mainCenterline[mainIdx];
        const nextP = mainCenterline[mainIdx + 1] || p;
        
        const progress = i / taperLengthPoints;
        // Use SmoothStep for nicer curve? t * t * (3 - 2 * t)
        const t = progress;
        const smoothT = t * t * (3 - 2 * t);
        const currentOffset = totalOffset * smoothT;

        const normal = getNormal(p, nextP);
        pitCenterline.push({
            x: p.x + normal.x * currentOffset,
            y: p.y + normal.y * currentOffset
        });
    }

    // --- 2. Parallel Section ---
    for (let i = parallelStartIdx + 1; i < parallelEndIdx; i++) {
        const p = mainCenterline[i];
        const nextP = mainCenterline[i+1] || p;
        const normal = getNormal(p, nextP);
        
        pitCenterline.push({
            x: p.x + normal.x * totalOffset,
            y: p.y + normal.y * totalOffset
        });
    }

    // --- 3. Exit Taper (Parallel -> Main Track) ---
    for (let i = 0; i <= taperLengthPoints; i++) {
        const mainIdx = parallelEndIdx + i;
        const p = mainCenterline[mainIdx];
        const nextP = mainCenterline[mainIdx + 1] || p;

        const progress = i / taperLengthPoints;
        const t = 1 - progress; // Go from 1 to 0
        const smoothT = t * t * (3 - 2 * t);
        const currentOffset = totalOffset * smoothT;

        const normal = getNormal(p, nextP);
        pitCenterline.push({
            x: p.x + normal.x * currentOffset,
            y: p.y + normal.y * currentOffset
        });
    }

    const { leftBorder, rightBorder } = generateBorders(pitCenterline, pitLaneWidth);

    // Define p1 and p2 for the pit lane (start and end of the centerline)
    const p1 = pitCenterline[0];
    const p2 = pitCenterline[pitCenterline.length - 1];

    // Generate pit stalls
    const stalls = [];
    const numStalls = 6; // Example: 6 pit stalls
    const stallSpacing = Math.floor((parallelEndIdx - parallelStartIdx) / numStalls);
    const stallOffsetFromCenter = pitLaneWidth * 0.25; // Offset from pitCenterline for the car to park

    for (let i = 0; i < numStalls; i++) {
        const centerlineIdx = parallelStartIdx + i * stallSpacing;
        if (centerlineIdx < pitCenterline.length - 1) {
            const p = pitCenterline[centerlineIdx];
            const nextP = pitCenterline[centerlineIdx + 1];
            const normal = getNormal(p, nextP);

            stalls.push({
                x: p.x + normal.x * stallOffsetFromCenter,
                y: p.y + normal.y * stallOffsetFromCenter,
                direction: Math.atan2(nextP.y - p.y, nextP.x - p.x) // Direction along the pit lane
            });
        }
    }

    return {
        centerline: pitCenterline,
        leftBorder,
        rightBorder,
        entryMainTrackPoints: [mainCenterline[pitLaneStartMainIdx]],
        exitMainTrackPoints: [mainCenterline[pitLaneEndMainIdx + taperLengthPoints]],
        p1: p1,
        p2: p2,
        width: pitLaneWidth,
        stalls: stalls
    };
}

export {
    SEGMENT_STRAIGHT,
    SEGMENT_TURN_LEFT,
    SEGMENT_TURN_RIGHT,
    generateStraight,
    generateTurn,
    assembleTrack,
    generateBorders,
    generateSegmentTrack,
    generateOvalPitLane,
    detectTrackIntersections,
    degToRad,
    radToDeg
};