/**
 * Core Segment System for Track Generation
 * This file replaces the previous over-engineered approach with a simple,
 * segment-based track generator.
 */

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

    return { points, end, segmentLength: length };
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
 * @param {Array} centerline - Array of {x, y} points
 * @param {number} trackWidth - Total track width
 * @returns {Object} {leftBorder: [{x,y}], rightBorder: [{x,y}]}
 */
function generateBorders(centerline, trackWidth) {
    const halfWidth = trackWidth / 2;
    const leftBorder = [];
    const rightBorder = [];

    // Helper to calculate direction from point i to point i+1
    const getDirection = (p1, p2) => Math.atan2(p2.y - p1.y, p2.x - p1.x);

    for (let i = 0; i < centerline.length; i++) {
        const p1 = centerline[i];
        const p2 = centerline[i + 1] || p1; // Use p1 if it's the last point

        // Use the direction of the segment *leading into* the point, 
        // or the *next* segment's direction if available.
        // For the last point, use the second to last segment's direction.
        const direction = (i < centerline.length - 1) ? getDirection(p1, p2) : getDirection(centerline[i - 1], p1);
        
        // Perpendicular directions
        // Left (dir + 90 deg) and Right (dir - 90 deg)
        const leftPerp = direction + Math.PI / 2;
        const rightPerp = direction - Math.PI / 2;

        // Calculate border points
        const leftX = p1.x + halfWidth * Math.cos(leftPerp);
        const leftY = p1.y + halfWidth * Math.sin(leftPerp);
        leftBorder.push({ x: leftX, y: leftY });

        const rightX = p1.x + halfWidth * Math.cos(rightPerp);
        const rightY = p1.y + halfWidth * Math.sin(rightPerp);
        rightBorder.push({ x: rightX, y: rightY });
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
 * Procedurally generate a track from random segments
 * @param {Object} options - {seed, numSegments, minStraight, maxStraight, minRadius, maxRadius, minAngle, maxAngle}
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
        maxAngle = 90
    } = options;

    const random = seededRandom(seed);
    const segments = [];
    let totalAngle = 0;

    for (let i = 0; i < numSegments; i++) {
        const segmentType = random() > 0.5 ? 'straight' : 'turn';

        if (segmentType === 'straight') {
            const length = minStraight + random() * (maxStraight - minStraight);
            segments.push({ type: SEGMENT_STRAIGHT, length });
        } else { // Turn
            const radius = minRadius + random() * (maxRadius - minRadius);
            const angle = minAngle + random() * (maxAngle - minAngle);
            const direction = random() > 0.5 ? SEGMENT_TURN_LEFT : SEGMENT_TURN_RIGHT;
            
            segments.push({ type: direction, radius, angle });

            if (direction === SEGMENT_TURN_LEFT) {
                totalAngle += angle;
            } else {
                totalAngle -= angle;
            }
        }
    }

    // Add a final straight to help align
    segments.push({ type: SEGMENT_STRAIGHT, length: 150 });

    // Add closing turn
    const closingAngle = 360 - (totalAngle % 360);
    const closingRadius = maxRadius * 1.2; // Ensure a larger radius to avoid overlap
    
    if (closingAngle > 0 && closingAngle < 360) {
         segments.push({ type: SEGMENT_TURN_RIGHT, radius: closingRadius, angle: closingAngle });
    } else if (closingAngle < 0) {
        segments.push({ type: SEGMENT_TURN_LEFT, radius: closingRadius, angle: -closingAngle });
    }
    // if closingAngle is 0 or 360, we are already closed.

    return segments;
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
    if (template === 'procedural') {
        segments = generateProceduralSegments(options.proceduralOptions || {});
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

    // 1. Assemble Centerline
    const { centerline, totalLength } = assembleTrack(segments, startPosition);

    // 2. Generate Borders
    const { leftBorder, rightBorder } = generateBorders(centerline, trackWidth);

    return {
        centerline,
        leftBorder,
        rightBorder,
        totalLength
    };
}

// Export functions for use in other files if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SEGMENT_STRAIGHT,
        SEGMENT_TURN_LEFT,
        SEGMENT_TURN_RIGHT,
        generateStraight,
        generateTurn,
        assembleTrack,
        generateBorders,
        generateSegmentTrack,
        degToRad,
        radToDeg
    };
}
