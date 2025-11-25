/**
 * @fileoverview Core procedural track generation module.
 * Implements vector math, Lloyd's relaxation, Convex Hull, Midpoint Displacement,
 * and Catmull-Rom Splines to create a closed-loop race track geometry.
 */

/**
 * @typedef {object} Vec2
 * @property {number} x
 * @property {number} y
 */

// --- Seeded Random Generator ---

/**
 * Creates a seeded random number generator function for reproducibility.
 * @param {number} seed - The initial seed value.
 * @returns {function(): number} - A function that returns a pseudo-random number between 0 (inclusive) and 1 (exclusive).
 */
function seededRandom(seed) {
    // The seed is updated on each call to maintain state
    let s = seed;
    return function() {
        // LCG formula from the requirements: X_n+1 = (a * X_n + c) mod m
        // We use a bitwise AND to simulate the modulo and ensure it stays within a 31-bit range.
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff; // Scale to [0, 1)
    };
}


// --- 1. Utility Functions (Vector math) ---

/**
 * Creates a 2D vector object.
 * @param {number} x - The x-component.
 * @param {number} y - The y-component.
 * @returns {Vec2}
 */
function vec2(x, y) {
    return { x: x, y: y };
}

/**
 * Vector addition: a + b
 * @param {Vec2} a
 * @param {Vec2} b
 * @returns {Vec2}
 */
function vecAdd(a, b) {
    return vec2(a.x + b.x, a.y + b.y);
}

/**
 * Vector subtraction: a - b
 * @param {Vec2} a
 * @param {Vec2} b
 * @returns {Vec2}
 */
function vecSub(a, b) {
    return vec2(a.x - b.x, a.y - b.y);
}

/**
 * Scalar multiplication: v * s
 * @param {Vec2} v
 * @param {number} s - Scalar value.
 * @returns {Vec2}
 */
function vecScale(v, s) {
    return vec2(v.x * s, v.y * s);
}

/**
 * Vector magnitude (length).
 * @param {Vec2} v
 * @returns {number}
 */
function vecLength(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Normalize vector to unit length.
 * @param {Vec2} v
 * @returns {Vec2} - Normalized vector.
 */
function vecNormalize(v) {
    const len = vecLength(v);
    if (len === 0) return vec2(0, 0);
    return vecScale(v, 1 / len);
}

/**
 * Dot product of two vectors.
 * @param {Vec2} a
 * @param {Vec2} b
 * @returns {number}
 */
function vecDot(a, b) {
    return a.x * b.x + a.y * b.y;
}

/**
 * 2D cross product (returns scalar magnitude of 3D cross product z-component).
 * (b.x * a.y) - (b.y * a.x) -> a x b
 * @param {Vec2} a
 * @param {Vec2} b
 * @returns {number}
 */
function vecCross2D(a, b) {
    return a.x * b.y - a.y * b.x;
}

/**
 * Get perpendicular vector (rotate 90° counter-clockwise: (-y, x)).
 * To get clockwise: (y, -x) which is used for outward normals in most cases.
 * We'll use (y, -x) as the standard perpendicular for consistency.
 * @param {Vec2} v
 * @returns {Vec2}
 */
function vecPerpendicular(v) {
    return vec2(v.y, -v.x);
}

/**
 * Distance between two points.
 * @param {Vec2} a
 * @param {Vec2} b
 * @returns {number}
 */
function vecDistance(a, b) {
    return vecLength(vecSub(a, b));
}


// --- 2. Lloyd's Algorithm (Voronoi Relaxation) ---

/**
 * @typedef {object} Bounds
 * @property {number} width
 * @property {number} height
 */

/**
 * Generates initial random points within defined bounds.
 * @param {number} count - Number of points to generate.
 * @param {Bounds} bounds - Generation area bounds {width, height}.
 * @param {function(): number} randFn - Seeded random function.
 * @returns {Vec2[]} - Array of random points.
 */
function generateRandomPoints(count, bounds, randFn) {
    const points = [];
    for (let i = 0; i < count; i++) {
        points.push(vec2(
            randFn() * bounds.width,
            randFn() * bounds.height
        ));
    }
    return points;
}

/**
 * Performs a simple Lloyd's relaxation approximation using nearest-neighbor centroid.
 * This function approximates the Voronoi cell's centroid by sampling a grid, which is
 * faster than a full Voronoi implementation for generative art/games.
 * @param {Vec2[]} points - Array of points to relax.
 * @param {Bounds} bounds - Generation area bounds {width, height}.
 * @param {number} iterations - Number of relaxation iterations (3-15).
 * @returns {Vec2[]} - Relaxed array of points.
 */
function lloydRelaxation(points, bounds, iterations) {
    let relaxedPoints = points;
    // Use a fixed, large number of test points for centroid approximation
    const gridSize = 100;
    const testPointsCount = gridSize * gridSize;

    for (let iter = 0; iter < iterations; iter++) {
        const pointAccumulators = new Array(relaxedPoints.length).fill(null).map(() => ({ x: 0, y: 0, count: 0 }));

        for (let i = 0; i < testPointsCount; i++) {
            // Sample test point on a uniform grid
            const tx = (i % gridSize) / gridSize * bounds.width;
            const ty = Math.floor(i / gridSize) / gridSize * bounds.height;
            const testPoint = vec2(tx, ty);

            let minDstSq = Infinity;
            let nearestIndex = -1;

            // Find the nearest control point (Voronoi region owner)
            for (let j = 0; j < relaxedPoints.length; j++) {
                const p = relaxedPoints[j];
                const dx = p.x - testPoint.x;
                const dy = p.y - testPoint.y;
                const dstSq = dx * dx + dy * dy;

                if (dstSq < minDstSq) {
                    minDstSq = dstSq;
                    nearestIndex = j;
                }
            }

            // Accumulate test point into the nearest control point's new centroid
            if (nearestIndex !== -1) {
                pointAccumulators[nearestIndex].x += testPoint.x;
                pointAccumulators[nearestIndex].y += testPoint.y;
                pointAccumulators[nearestIndex].count++;
            }
        }

        const newPoints = [];
        for (let j = 0; j < relaxedPoints.length; j++) {
            const acc = pointAccumulators[j];
            if (acc.count > 0) {
                // Calculate new centroid
                const newX = acc.x / acc.count;
                const newY = acc.y / acc.count;

                // Clamp to bounds to prevent points from escaping the area
                newPoints.push(vec2(
                    Math.max(0, Math.min(bounds.width, newX)),
                    Math.max(0, Math.min(bounds.height, newY))
                ));
            } else {
                // Keep the old position if no samples fell into its region
                newPoints.push(relaxedPoints[j]);
            }
        }

        relaxedPoints = newPoints;
    }

    return relaxedPoints;
}


// --- 3. Convex Hull (Monotone Chain Algorithm) ---

/**
 * Calculates the 2D cross product of vectors (b-a) and (c-a).
 * Used to determine the turn direction (right, left, or collinear).
 * @param {Vec2} a - First point.
 * @param {Vec2} b - Second point.
 * @param {Vec2} c - Third point.
 * @returns {number} - Positive for left turn (counter-clockwise), negative for right turn (clockwise), zero for collinear.
 */
function cross(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

/**
 * Computes the convex hull of a set of 2D points using the Monotone Chain algorithm.
 * O(n log n) complexity.
 * @param {Vec2[]} points - Array of points.
 * @returns {Vec2[]} - Array of points forming the convex hull (ordered counter-clockwise).
 */
function convexHull(points) {
    if (points.length <= 2) {
        return [...points];
    }

    // 1. Sort points primarily by x-coordinate, then by y-coordinate
    points.sort((a, b) => {
        if (a.x !== b.x) return a.x - b.x;
        return a.y - b.y;
    });

    const n = points.length;
    let upperHull = [];
    let lowerHull = [];

    // 2. Build Lower Hull
    for (let i = 0; i < n; i++) {
        // While adding the current point 'i' creates a non-left turn (<= 0) with the last two points, pop the last point.
        // This maintains the 'left turn' property for a convex shape.
        while (lowerHull.length >= 2 && cross(lowerHull[lowerHull.length - 2], lowerHull[lowerHull.length - 1], points[i]) <= 0) {
            lowerHull.pop();
        }
        lowerHull.push(points[i]);
    }

    // 3. Build Upper Hull (Iterate backwards)
    for (let i = n - 1; i >= 0; i--) {
        // Same logic: maintain the 'left turn' property.
        while (upperHull.length >= 2 && cross(upperHull[upperHull.length - 2], upperHull[upperHull.length - 1], points[i]) <= 0) {
            upperHull.pop();
        }
        upperHull.push(points[i]);
    }

    // 4. Concatenate and remove duplicates
    // The starting point and the ending point of the full hull construction are duplicates.
    // Lower Hull: [leftmost, ..., rightmost]
    // Upper Hull: [rightmost, ..., leftmost]
    // We remove the last point of both, as they are the first point of the other hull section.
    lowerHull.pop();
    upperHull.pop();

    return lowerHull.concat(upperHull);
}


// --- 4. Midpoint Displacement (Placeholder) ---

/**
 * Adds complexity to a polygon by subdividing edges and displacing midpoints along the normal.
 * @param {Vec2[]} polygon - Array of vertices forming a closed polygon.
 * @param {number} iterations - Number of displacement iterations (2-4).
 * @param {number} displacement - Initial magnitude of displacement.
 * @param {function(): number} randFn - Seeded random function.
 * @returns {Vec2[]} - New, more complex polygon.
 */
function midpointDisplacement(polygon, iterations, displacement, randFn) {
    // Implementation pending
    let vertices = polygon;
    let currentDisp = displacement;

    for (let iter = 0; iter < iterations; iter++) {
        const newVertices = [];
        const n = vertices.length;

        for (let i = 0; i < n; i++) {
            const p1 = vertices[i];
            const p2 = vertices[(i + 1) % n];

            // 1. Add current vertex
            newVertices.push(p1);

            // 2. Calculate midpoint
            const midpoint = vecScale(vecAdd(p1, p2), 0.5);

            // 3. Calculate edge vector and its normal
            const edgeVec = vecSub(p2, p1);
            const normal = vecNormalize(vecPerpendicular(edgeVec));

            // 4. Displace midpoint along normal
            const displacementMagnitude = currentDisp * (randFn() * 2 - 1); // Random displacement
            const displacedPoint = vecAdd(midpoint, vecScale(normal, displacementMagnitude));

            newVertices.push(displacedPoint);
        }

        vertices = newVertices;
        currentDisp *= 0.5; // Halve displacement for the next iteration (fractal-like behavior)
    }

    // Prevent self-intersection after all displacements
    vertices = pushApart(vertices, displacement * 0.1); // Use a small fraction of the initial displacement

    return vertices;
}

/**
 * Simple algorithm to slightly push apart vertices that are too close to each other
 * to prevent potential self-intersections after displacement.
 * @param {Vec2[]} vertices - Array of vertices.
 * @param {number} minDistance - Minimum distance allowed between non-adjacent vertices.
 * @returns {Vec2[]} - Adjusted array of vertices.
 */
function pushApart(vertices, minDistance) {
    // Simple, brute-force approximation:
    const n = vertices.length;
    const minDstSq = minDistance * minDistance;
    const adjustFactor = 0.5; // How much to move apart

    for (let iter = 0; iter < 5; iter++) { // A few iterations of pushing
        let moved = false;
        for (let i = 0; i < n; i++) {
            for (let j = i + 2; j < n; j++) {
                // Check non-adjacent vertices (and wrap around check)
                if (j === n - 1 && i === 0) continue; // Skip last-to-first segment comparison (adjacent)

                const p1 = vertices[i];
                const p2 = vertices[j];

                const distSq = (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);

                if (distSq < minDstSq) {
                    const center = vecScale(vecAdd(p1, p2), 0.5);
                    const awayVector = vecNormalize(vecSub(p1, p2));

                    // Push p1 away from p2's center
                    vertices[i] = vecAdd(p1, vecScale(awayVector, adjustFactor * minDistance));
                    // Push p2 away from p1's center (opposite direction)
                    vertices[j] = vecSub(p2, vecScale(awayVector, adjustFactor * minDistance));
                    moved = true;
                }
            }
        }
        if (!moved) break;
    }
    return vertices;
}


// --- 5. Catmull-Rom Spline Interpolation (Placeholder) ---

/**
 * Calculates a point on a Catmull-Rom spline segment.
 * Uses the standard matrix formulation with alpha=0.5 (Centripetal Catmull-Rom).
 * @param {Vec2} p0 - Control point 0 (previous).
 * @param {Vec2} p1 - Control point 1 (start of segment).
 * @param {Vec2} p2 - Control point 2 (end of segment).
 * @param {Vec2} p3 - Control point 3 (next).
 * @param {number} t - Parameter from 0 to 1 along the segment.
 * @returns {Vec2} - The interpolated point.
 */
function catmullRomPoint(p0, p1, p2, p3, t) {
    // Formula: Q(t) = 0.5 * ( (2*P1) + (-P0 + P2)t + (2*P0 - 5*P1 + 4*P2 - P3)t^2 + (-P0 + 3*P1 - 3*P2 + P3)t^3 )
    const t2 = t * t;
    const t3 = t2 * t;

    // Coefficients for the x-component
    const cx = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    );

    // Coefficients for the y-component
    const cy = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    );

    return vec2(cx, cy);
}

/**
 * Generates a smooth, closed curve from a set of control points using Catmull-Rom spline interpolation.
 * @param {Vec2[]} controlPoints - Array of control points forming a closed loop.
 * @param {number} samplesPerSegment - Number of points to sample per segment (e.g., 20 for 0.05m sampling).
 * @returns {Vec2[]} - Array of sampled points on the spline (centerline).
 */
function generateSpline(controlPoints, samplesPerSegment) {
    const centerline = [];
    const n = controlPoints.length;

    for (let i = 0; i < n; i++) {
        // Handle closed loop: indices wrap around
        const p0 = controlPoints[(i - 1 + n) % n];
        const p1 = controlPoints[i];
        const p2 = controlPoints[(i + 1) % n];
        const p3 = controlPoints[(i + 2) % n];

        for (let j = 0; j < samplesPerSegment; j++) {
            const t = j / samplesPerSegment;
            centerline.push(catmullRomPoint(p0, p1, p2, p3, t));
        }
    }
    return centerline;
}


// --- 6. Track Border Generation (Placeholder) ---

/**
 * Calculates the normal vector at each point of a waypoint array.
 * @param {{x: number, y: number}[]} waypoints - Array of points.
 * @returns {{x: number, y: number, tangent: Vec2, normal: Vec2}[]} - Waypoints with tangent/normal added.
 */
function calculateNormals(waypoints) {
    const n = waypoints.length;
    const waypointsWithNormals = [];

    for (let i = 0; i < n; i++) {
        const pPrev = waypoints[(i - 1 + n) % n];
        const pCurr = waypoints[i];
        const pNext = waypoints[(i + 1) % n];

        // Tangent calculation: vector from previous point to next point, normalized
        const tangentVec = vecSub(pNext, pPrev);
        const tangent = vecNormalize(tangentVec);

        // Normal calculation: perpendicular to the tangent (vecPerpendicular returns (y, -x) for clockwise)
        let normal = vecPerpendicular(tangent);

        // Validate Normal Vectors: Check for NaN
        if (isNaN(normal.x) || isNaN(normal.y)) {
            // Fallback: If normal is invalid, use the previous normal, or a default (0, -1) if it's the first point.
            if (waypointsWithNormals.length > 0) {
                normal = waypointsWithNormals[waypointsWithNormals.length - 1].normal;
            } else {
                normal = vec2(0, -1); // Default right-side normal
            }
        }

        waypointsWithNormals.push({
            x: pCurr.x,
            y: pCurr.y,
            tangent: tangent,
            normal: normal
        });
    }

    return waypointsWithNormals;
}

/**
 * Calculates the Menger curvature for each point, which is 1/R (radius of the osculating circle).
 * Curvature is used for artifact detection and track styling.
 * @param {object[]} waypoints - Array of waypoints including normal vectors.
 * @returns {object[]} - Waypoints with curvature added.
 */
function calculateCurvature(waypoints) {
    const n = waypoints.length;
    const waypointsWithCurvature = [];

    for (let i = 0; i < n; i++) {
        // Use a window of 3 points (P_i-1, P_i, P_i+1) for curvature calculation
        const pPrev = waypoints[(i - 1 + n) % n];
        const pCurr = waypoints[i];
        const pNext = waypoints[(i + 1) % n];

        // Vectors from P_curr: v1 = P_prev - P_curr, v2 = P_next - P_curr
        const v1 = vecSub(pPrev, pCurr);
        const v2 = vecSub(pNext, pCurr);

        // Curvature (Menger's): k = 2 * (area of triangle / (side1 * side2 * side3))
        // Area of triangle(P_prev, P_curr, P_next) using 2D cross product: 0.5 * |(P_curr - P_prev) x (P_next - P_prev)|
        // Or simpler: 0.5 * |v1 x v2| (using vector from P_curr)

        const crossProd = vecCross2D(v1, v2); // proportional to the area of the triangle
        const area = 0.5 * Math.abs(crossProd);

        const a = vecDistance(pPrev, pCurr); // side a (P_prev to P_curr)
        const b = vecDistance(pCurr, pNext); // side b (P_curr to P_next)
        const c = vecDistance(pPrev, pNext); // side c (P_prev to P_next)

        // The radius of the circumcircle (R) is (a*b*c) / (4*Area). Curvature (k) is 1/R.
        // k = (4 * Area) / (a * b * c)

        let k = 0;
        const MIN_VALUE = 0.0001; // Threshold for near-zero checks (segment length and area)

        // Validate Curvature: Check for degenerate triangle (area near zero) or near-zero segment lengths
        if (area < MIN_VALUE || a < MIN_VALUE || b < MIN_VALUE || c < MIN_VALUE) {
            k = 0; // Treat as straight line, no curvature
        } else {
            const product = a * b * c;
            k = (4 * area) / product;
        }

        waypointsWithCurvature.push({
            ...pCurr,
            curvature: k * Math.sign(crossProd) // Add sign for turning direction
        });
    }

    return waypointsWithCurvature;
}


/**
 * Generates the left and right track borders by offsetting the centerline along its normals.
 * Implements a basic check to prevent swallowtail artifacts by bounding the offset.
 * @param {object[]} centerline - Sampled centerline with normal vectors, curvature, and distance.
 * @param {number} halfWidth - Half the desired track width.
 * @returns {{leftBorder: Vec2[], rightBorder: Vec2[]}} - Track borders.
 */
function generateTrackBorders(centerline, halfWidth) {
    const leftBorder = [];
    const rightBorder = [];

    for (const p of centerline) {
        // Curvature check for artifact prevention (Swallowtail artifact occurs when trackWidth > 2*R or curvature > 1/halfWidth)
        const maxCurvature = 1.0 / halfWidth;
        const boundedOffset = 1.0;

        // Scale the normal vector to the halfWidth. The scale factor is (1 / (1 + halfWidth * |curvature|))
        // This factor is a simplification to reduce offset in tight curves, effectively widening the radius.
        const offsetScale = Math.min(halfWidth, halfWidth / (1.0 + Math.abs(p.curvature) * halfWidth * boundedOffset));

        const offsetVec = vecScale(p.normal, offsetScale);

        // Left border: centerline + normal
        leftBorder.push(vecAdd(p, offsetVec));

        // Right border: centerline - normal (opposite direction)
        rightBorder.push(vecSub(p, offsetVec));
    }

    return { leftBorder, rightBorder };
}


// --- 7. Main Track Generation Function ---

/**
 * Main entry point for procedural track generation.
 * @param {object} options - Generation options.
 * @param {number} options.seed - Random seed for reproducibility.
 * @param {{width: number, height: number}} options.bounds - {width, height} of generation area.
 * @param {number} options.pointCount - Number of initial control points (20-30).
 * @param {number} options.lloydIterations - Iterations for relaxation (3-15).
 * @param {number} options.displacementIterations - Iterations for midpoint displacement (2-4).
 * @param {number} options.displacementMagnitude - How much to displace midpoints.
 * @param {number} options.trackWidth - Width of the track in meters.
 * @param {number} options.samplesPerSegment - Spline sampling resolution.
 * @returns {object} - The generated track data structure.
 */
function generateTrack(options) {
    const {
        seed,
        bounds,
        pointCount,
        lloydIterations,
        displacementIterations,
        displacementMagnitude,
        trackWidth,
        samplesPerSegment
    } = options;

    const randFn = seededRandom(seed);
    const halfWidth = trackWidth / 2.0;

    // 1. Generate initial random points and relax them
    let initialPoints = generateRandomPoints(pointCount, bounds, randFn);
    let relaxedPoints = lloydRelaxation(initialPoints, bounds, lloydIterations);

    // 2. Compute Convex Hull of the relaxed points
    let controlPoints = convexHull(relaxedPoints);

    // Validate Point Count: Must have at least 3 points for a polygon.
    if (controlPoints.length < 3) {
        throw new Error('Convex hull produced fewer than 3 points, preventing closed loop generation.');
    }

    // 3. Add complexity using Midpoint Displacement
    let displacedPolygon = midpointDisplacement(controlPoints, displacementIterations, displacementMagnitude, randFn);

    // 4. Generate smooth centerline using Catmull-Rom Spline
    let centerline = generateSpline(displacedPolygon, samplesPerSegment);

    // --- Post-processing Centerline ---
    // Add distance/min/max bounds/initial normals

    // 4a. Calculate length and bounding box
    let trackLength = 0;
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    centerline.forEach((p, i) => {
        if (i > 0) {
            trackLength += vecDistance(centerline[i - 1], p);
        }
        // Add distance, then clamp to 0 at the start of loop
        centerline[i].distance = trackLength;

        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    });

    centerline[0].distance = 0; // Fix first point distance for closed loop calculation

    // 5. Calculate normals and curvature
    centerline = calculateNormals(centerline);
    centerline = calculateCurvature(centerline);

    // 6. Generate Track Borders
    const { leftBorder, rightBorder } = generateTrackBorders(centerline, halfWidth);

    return {
        seed: seed,
        controlPoints: controlPoints, // The convex hull vertices
        centerline: centerline,
        leftBorder: leftBorder,
        rightBorder: rightBorder,
        trackLength: trackLength,
        bounds: { minX, minY, maxX, maxY }
    };
}


// --- Export Functions ---
// Functions are exposed globally for the test harness.