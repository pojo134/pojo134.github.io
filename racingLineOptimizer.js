/**
 * @fileoverview Implements the K1999 Racing Line Optimization and Forward-Backward Velocity Profiler.
 * 
 * Vector utilities are duplicated here from trackGenerator.js for self-containment.
 */

// --- Constants ---
const G_ACCEL = 9.81; // Acceleration due to gravity (m/s^2)

const defaultOptions = {
    iterations: 100,
    elasticity: 0.15, // Epsilon (ε)
    carWidth: 2.0,
    margin: 0.5 // Safety margin for track clipping
};

const defaultVehicleParams = {
    mass: 800,           // kg
    maxPower: 300000,    // Watts (300kW)
    maxBrakeDecel: 40,   // m/s² (about 4G)
    maxAccel: 15,        // m/s² (about 1.5G, cap for F_engine)
    frictionCoef: 1.4,   // Racing tires coefficient
    dragCoef: 0.35,      // Air drag coefficient (Cd)
    frontalArea: 1.5,    // m² (A)
    airDensity: 1.225,   // kg/m³ (ρ)
    maxSpeed: 90         // m/s (about 324 km/h)
};

// --- Vector Math Utilities (Copied from trackGenerator.js) ---

/** @typedef {object} Vec2
 * @property {number} x
 * @property {number} y
 */

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
 * Distance between two points.
 * @param {Vec2} a
 * @param {Vec2} b
 * @returns {number}
 */
function vecDistance(a, b) {
    return vecLength(vecSub(a, b));
}

/**
 * Get perpendicular vector (rotate 90° counter-clockwise: (-y, x)).
 * We'll use (y, -x) as the standard perpendicular for consistency with normals.
 * @param {Vec2} v
 * @returns {Vec2}
 */
function vecPerpendicular(v) {
    // (-y, x) is 90 deg counter-clockwise. TrackGenerator used (y, -x) for outward normal.
    // Let's stick to (y, -x) for the vector-based normal projection logic below.
    return vec2(v.y, -v.x);
}

/**
 * Midpoint between two vectors.
 * @param {Vec2} a
 * @param {Vec2} b
 * @returns {Vec2}
 */
function vecMidpoint(a, b) {
    return vec2((a.x + b.x) / 2, (a.y + b.y) / 2);
}

// --- 1. K1999 Helper Functions ---

/**
 * Projects a point onto the track normal line from the centerline point,
 * and clips it to the track boundaries based on the half-width.
 * This is an internal step of the K1999 algorithm's boundary condition.
 * 
 * NOTE: The input `point` is the potential new racing line point R[i]_new.
 * @param {Vec2} point - The point to be projected and clipped.
 * @param {object} centerlinePoint - The corresponding centerline point with {x, y, normal}
 * @param {number} halfWidth - The half-width of the track at this point.
 * @param {number} carMargin - The safety margin to maintain from the border.
 * @returns {Vec2} The clipped and projected point.
 */
function projectToTrackNormal(point, centerlinePoint, halfWidth, carMargin) {
    const CP = vec2(centerlinePoint.x, centerlinePoint.y); // Centerline Point (C)
    const N = centerlinePoint.normal; // Normal vector (N)

    // Vector from Centerline Point to the new racing line point (V = P - C)
    const V = vecSub(point, CP); 
    
    // Project V onto N to find the scalar distance along the normal (d_n = V . N)
    // This distance represents how far the point is from the centerline along the normal.
    const distanceAlongNormal = V.x * N.x + V.y * N.y; 

    // Calculate maximum allowed distance from centerline
    const maxDist = halfWidth - carMargin;

    // Clip the distance
    const clippedDistance = Math.min(Math.max(distanceAlongNormal, -maxDist), maxDist);

    // The vector correction is clippedDistance * N
    const correctionVector = vecScale(N, clippedDistance);

    // The clipped point is C + correctionVector
    return vecAdd(CP, correctionVector);
}

/**
 * Clips a point to the track boundaries using the K1999 method's core logic.
 * This function essentially determines the effective half-width and calls projectToTrackNormal.
 * 
 * NOTE: The provided left/right borders are assumed to be points *on* the border.
 * The distance between the border points and the centerline point C determines the half-width.
 * @param {Vec2} point - The point to clip.
 * @param {number} centerlineIdx - Index of the corresponding centerline point.
 * @param {Array} centerline - Array of centerline points.
 * @param {Array} leftBorder - Array of left border points.
 * @param {Array} rightBorder - Array of right border points.
 * @param {number} margin - Car width / 2 or specified margin.
 * @returns {Vec2} The clipped point.
 */
function clipToTrackBounds(point, centerlineIdx, centerline, leftBorder, rightBorder, margin) {
    const CP = centerline[centerlineIdx];

    // Determine the actual half-width at this point from track boundaries
    const dLeft = vecDistance(CP, leftBorder[centerlineIdx]);
    const dRight = vecDistance(CP, rightBorder[centerlineIdx]);
    
    // We must use the minimum half-width (dLeft or dRight) to calculate the maximum allowed distance,
    // which simplifies the boundary check to a single scalar clip on the normal projection.
    // However, the paper implies clipping to the nearest boundary.
    // Let's use the explicit normal projection:
    // The half-width of the track is the distance from the centerline to *either* boundary.
    // Since the centerline points already have a 'normal' vector which points outwards
    // and the left/right points are offset along it, we can calculate two half-widths:
    // d_left: distance to the left (negative side of normal)
    // d_right: distance to the right (positive side of normal)

    // The normal N is usually calculated to point outward (e.g., to the right boundary).
    // A point P = C + d * N. If d is negative, it's on the left side.

    // dRight (positive distance along normal)
    const halfWidthRight = vecDistance(CP, rightBorder[centerlineIdx]);
    // dLeft (negative distance along normal)
    const halfWidthLeft = vecDistance(CP, leftBorder[centerlineIdx]); 
    // The width calculation is tricky because the normal direction matters.

    // A safer way is to clip to the closest distance from the centerline.
    // However, for K1999, we simply clip the normal component of the *new* point R[i]_new
    // relative to the centerline, based on the *smaller* half-width. 
    // This is a simplification but common in implementations.
    // Let's calculate the half-width as the min of the left/right distance from centerline.
    // NOTE: This assumes the centerline normal is properly oriented and the left/right borders
    // are roughly symmetric, which is true for trackGenerator.js's output.

    // Let's use the explicit border distance method:
    // Calculate how far the point is along the normal from the centerline.
    const V = vecSub(point, vec2(CP.x, CP.y));
    const distanceAlongNormal = V.x * CP.normal.x + V.y * CP.normal.y;

    // Check distance against both boundaries (car center + margin)
    // We need to know which border is 'left' and which is 'right' based on the normal.
    // The normal N in trackGenerator.js is usually perpendicular to the tangent T.
    // Let's assume CP.normal points towards the 'right' side boundary (positive distance).

    // Distance to LEFT boundary (negative normal direction)
    const distToLeft = vecDistance(vecAdd(vec2(CP.x, CP.y), vecScale(CP.normal, -dLeft)), point);
    const distToRight = vecDistance(vecAdd(vec2(CP.x, CP.y), vecScale(CP.normal, dRight)), point);

    // This is overly complex. The K1999 paper suggests a simple projection clip:
    const halfWidth = vecDistance(CP, rightBorder[centerlineIdx]); // Assume a constant track half-width for simplicity (or just take the average)
    
    // Let's find the true half-widths by projecting the border points onto the normal.
    const rightVec = vecSub(rightBorder[centerlineIdx], vec2(CP.x, CP.y));
    const rightDist = rightVec.x * CP.normal.x + rightVec.y * CP.normal.y; // Should be positive
    
    const leftVec = vecSub(leftBorder[centerlineIdx], vec2(CP.x, CP.y));
    const leftDist = leftVec.x * CP.normal.x + leftVec.y * CP.normal.y; // Should be negative

    const maxRight = rightDist - margin;
    const maxLeft = leftDist + margin; // maxLeft is a negative value

    // Project the new point R_new onto the normal
    const pointVec = vecSub(point, vec2(CP.x, CP.y));
    let newDist = pointVec.x * CP.normal.x + pointVec.y * CP.normal.y;

    // Clip
    newDist = Math.min(Math.max(newDist, maxLeft), maxRight);

    // Recalculate clipped point: C + newDist * N
    const clippedPoint = vecAdd(vec2(CP.x, CP.y), vecScale(CP.normal, newDist));
    
    return clippedPoint;
}

/**
 * Recalculates the curvature, tangent, normal, and distance for a newly optimized racing line.
 * This is crucial for the velocity profile calculation.
 * @param {Array} points - Array of optimized points (only x, y changed)
 * @returns {Array} Points with updated geometry data
 */
function recalculateGeometry(points) {
    if (points.length < 3) return points;
    const N = points.length;

    // 1. Recalculate distance
    let totalDistance = 0;
    for (let i = 1; i < N; i++) {
        const d = vecDistance(points[i], points[i - 1]);
        points[i].distance = totalDistance += d;
    }
    points[0].distance = 0;

    // 2. Recalculate tangent and normal
    for (let i = 0; i < N; i++) {
        const P_prev = points[(i - 1 + N) % N];
        const P_next = points[(i + 1) % N];

        // Tangent is the vector P_next - P_prev
        const T_raw = vecSub(P_next, P_prev);
        points[i].tangent = vecNormalize(T_raw);
        // Normal is perpendicular to tangent
        points[i].normal = vecPerpendicular(points[i].tangent);
    }
    
    // 3. Recalculate curvature (Finite Differences method for curvature on a discrete path)
    // Curvature (k) = 2 * ( (p2-p1) x (p3-p1) ) / |p2-p1|*|p3-p1|*|p3-p2|
    // A simpler approximation: k = |dT/ds| / |dr/ds| (where s is arc length)
    // Here we use a common discrete approximation for curvature:
    // k ≈ 2 * (x'(t)y''(t) - x''(t)y'(t)) / (x'(t)^2 + y'(t)^2)^(3/2)
    // A much simpler finite difference approximation is:
    // k ≈ | (x_next - 2*x_i + x_prev) / Δs^2 | / |d|
    // Let's use the simplest one based on tangent change: k ≈ |angle_change| / |segment_length|
    for (let i = 0; i < N; i++) {
        const P_prev = points[(i - 1 + N) % N];
        const P_curr = points[i];
        const P_next = points[(i + 1) % N];

        const T1 = vecNormalize(vecSub(P_curr, P_prev));
        const T2 = vecNormalize(vecSub(P_next, P_curr));
        const T_mid = vecNormalize(vecAdd(T1, T2));

        // Curvature approximated by the change in tangent direction.
        // k ≈ vecLength(T2 - T1) / distance
        const dT = vecSub(T2, T1);
        const dT_len = vecLength(dT);
        const distance = vecDistance(P_prev, P_next) / 2;
        
        // Safety check for distance
        points[i].curvature = (distance > 0.001) ? (dT_len / distance) : 0;
        points[i].radius = (points[i].curvature > 0.001) ? (1 / points[i].curvature) : Infinity;
    }

    return points;
}

// --- 1. K1999 Algorithm (Elastic Band Optimization) ---

/**
 * Optimizes the racing line using the K1999 elastic band method
 * @param {Array} centerline - Array of centerline points with {x, y, normal, tangent}
 * @param {Array} leftBorder - Array of left border points
 * @param {Array} rightBorder - Array of right border points
 * @param {Object} options - {iterations, elasticity, carWidth}
 * @returns {Array} Optimized racing line points
 */
function optimizeRacingLine(centerline, leftBorder, rightBorder, options) {
    const opts = Object.assign({}, defaultOptions, options);
    const N = centerline.length;
    
    // 1. Initialize racing line R to centerline coordinates. 
    // Clone to keep original geometric data (tangent, normal, curvature) as a starting point.
    // We only modify x/y initially.
    let R = centerline.map(p => ({ 
        ...p, 
        x: p.x, 
        y: p.y,
        velocity: 0, 
        lateralG: 0, 
        longitudinalG: 0,
        isApex: false,
        isBrakingZone: false
    }));

    // Half of the car width is the absolute minimum margin, but we use the option's margin for safety.
    const margin = Math.max(opts.carWidth / 2, opts.margin);
    
    for (let k = 0; k < opts.iterations; k++) {
        let R_new = [];
        for (let i = 0; i < N; i++) {
            const P_curr = R[i];
            const P_prev = R[(i - 1 + N) % N];
            const P_next = R[(i + 1) % N];
            const C_curr = centerline[i]; // Corresponding centerline point (needed for normal)

            // Calculate the "pull" towards the chord between neighbors: P_prev and P_next
            const midpoint = vecMidpoint(P_prev, P_next);
            
            // 2. Update: R[i]_new = (1 - ε) * R[i] + ε * midpoint(R[i-1], R[i+1])
            // P_curr: The point R[i] = (1 - ε) * R[i]
            // midpoint: The midpoint(R[i-1], R[i+1]) = ε * midpoint
            
            const term1 = vecScale(vec2(P_curr.x, P_curr.y), (1 - opts.elasticity));
            const term2 = vecScale(midpoint, opts.elasticity);
            let R_temp = vecAdd(term1, term2);

            // 3. Clip to track boundaries (ensure point stays within left/right borders)
            R_temp = clipToTrackBounds(R_temp, i, centerline, leftBorder, rightBorder, margin);
            
            // Apply new coordinates to the object
            R_new.push(Object.assign({}, P_curr, { x: R_temp.x, y: R_temp.y }));
        }
        R = R_new; // Update R for the next iteration
    }

    // 4. Recalculate curvature, tangent, and distance for final line
    R = recalculateGeometry(R);
    return R;
}

// --- 3. Acceleration Model with Drag ---

/**
 * Calculate available acceleration considering engine power and drag
 * @param {number} velocity - Current velocity in m/s
 * @param {Object} params - Vehicle parameters
 * @returns {number} Available acceleration in m/s²
 */
function calculateAcceleration(velocity, params) {
    if (velocity < 0.1) { // Cap for v=0 to prevent division by zero, use maxAccel
        return params.maxAccel;
    }

    // Air Density (ρ), Drag Coef (Cd), Frontal Area (A)
    const rho = params.airDensity;
    const Cd = params.dragCoef;
    const A = params.frontalArea;
    const mass = params.mass;
    const maxPower = params.maxPower;
    const maxAccel = params.maxAccel;

    // F_drag = 0.5 * ρ * Cd * A * v²
    const F_drag = 0.5 * rho * Cd * A * velocity * velocity;

    // F_engine = min(P_max / v, m * a_max)
    const F_power_limited = maxPower / velocity;
    const F_traction_limited = mass * maxAccel;
    const F_engine = Math.min(F_power_limited, F_traction_limited);

    // a = (F_engine - F_drag) / m
    const acceleration = (F_engine - F_drag) / mass;

    // Cap at maxAccel from traction limit
    return Math.min(acceleration, maxAccel);
}

// --- 2. Forward-Backward Velocity Profiler ---

/**
 * Calculates the optimal velocity profile for the racing line
 * @param {Array} racingLine - Optimized racing line with curvature data
 * @param {Object} vehicleParams - Vehicle physics parameters
 * @returns {Array} Racing line with velocity data added
 */
function calculateVelocityProfile(racingLine, vehicleParams) {
    const params = Object.assign({}, defaultVehicleParams, vehicleParams);
    const N = racingLine.length;
    const g = G_ACCEL;
    const maxBrakeDecel = params.maxBrakeDecel;
    
    // --- Phase 1 - Cornering Limit ---
    let V_limit = new Array(N).fill(0);
    const frictionLimit = params.frictionCoef * g;
    const maxSpeedSq = params.maxSpeed * params.maxSpeed;

    for (let i = 0; i < N; i++) {
        const k = racingLine[i].curvature;
        const radius = racingLine[i].radius;
        // Lateral G (G_lat) = v^2 * k 
        
        // V_limit[i] = sqrt(frictionCoef * g * R[i]) = sqrt(frictionLimit / k)
        let vLimitSq;
        if (!isFinite(k) || k <= 0.001) { // Check for NaN/Infinity/very small curvature
            vLimitSq = Infinity;
        } else {
            vLimitSq = frictionLimit / k;
        }
        
        // Max velocity is also capped by the vehicle's max speed
        vLimitSq = Math.min(vLimitSq, maxSpeedSq);
        V_limit[i] = Math.sqrt(vLimitSq);
    }
    
    // --- Phase 2 - Backward Pass (Braking) ---
    let V_bwd = V_limit.slice(); // Initialize V_bwd to V_limit
    V_bwd[N - 1] = 0; // Start/End point velocity is 0 (or V_limit[0] for closed loop, but V_bwd[0] will be correct)

    // For a closed loop, the last point's speed must be coupled with the first point's speed.
    // For now, we'll assume a loop where V[N-1] is just before V[0].
    // Let's set a low initial speed for the end of the lap before the wrap-around check.
    V_bwd[N - 1] = V_limit[N - 1]; 

    // The required max deceleration is maxBrakeDecel.
    const a_brake = -maxBrakeDecel; // Braking deceleration is a negative number

    // Wrap-around initial condition: The speed at the last point N-1 must allow acceleration to V_limit[0]
    // over the last segment length.
    // V_next^2 = V_current^2 + 2*a*Δd  => V_current^2 = V_next^2 - 2*a*Δd
    // V_bwd[N-1]^2 = V_limit[0]^2 - 2 * a_accel_available * Δd_last_segment
    // This is complex, let's simplify by running the backward pass twice to converge,
    // assuming V_bwd[0] must equal V_fwd[N-1] at the end.

    for (let j = 0; j < 2; j++) { // Run twice for better convergence on closed-loop
        for (let i = N - 2; i >= 0; i--) {
            const P_curr = racingLine[i];
            const P_next = racingLine[(i + 1) % N];
            const deltaD = vecDistance(P_curr, P_next);

            let v_next = V_bwd[(i + 1) % N];
            if (i === N - 2 && j === 1) v_next = V_bwd[0]; // Special case for last segment in second pass

            // V_bwd[i] = min(V_limit[i], sqrt(V_bwd[i+1]² + 2 * a_brake * Δd))
            // a_brake is negative. We are calculating the maximum velocity V_i that allows braking to V_i+1.
            const vNextSq = v_next * v_next;
            const term = vNextSq - 2 * a_brake * deltaD; // V_i^2 = V_i+1^2 - 2*a_brake*Δd (where a_brake is negative)
            
            // To be precise: a_brake is deceleration (positive value). 
            // V_i^2 = V_i+1^2 + 2 * (-a_brake) * Δd => V_i = sqrt(V_i+1^2 - 2 * a_brake * Δd)
            const v_brake_limit_sq = vNextSq + 2 * maxBrakeDecel * deltaD; // Max braking to stop at v_next. No, that's wrong.
            
            // Correct formula: V_i = sqrt(V_i+1^2 + 2 * a_brake * Δd) where a_brake is negative.
            // V_i^2 = V_{i+1}^2 + 2 * a_brake * \Delta d
            // Since a_brake = -40, the term is negative, meaning V_i must be smaller than V_{i+1}.
            const v_brake_limit_i = Math.sqrt(Math.max(0, vNextSq + 2 * a_brake * deltaD));
            
            V_bwd[i] = Math.min(V_limit[i], v_brake_limit_i);
        }
        
        // After the first pass, set the end condition based on the newly calculated start speed
        if (j === 0) {
             V_bwd[N - 1] = V_bwd[0]; 
        }
    }

    // --- Phase 3 - Forward Pass (Acceleration) ---
    let V_fwd = new Array(N);
    V_fwd[0] = V_bwd[0]; // Starting velocity is the speed the backward pass dictates
    
    // The final velocity profile is min(V_bwd, V_fwd). V_bwd already acts as a cap here.
    for (let i = 1; i < N; i++) {
        const P_curr = racingLine[i];
        const P_prev = racingLine[i - 1];
        const deltaD = vecDistance(P_curr, P_prev);

        // a_available = calculateAcceleration(V_fwd[i-1], vehicleParams)
        const a_available = calculateAcceleration(V_fwd[i-1], params);

        // V_fwd[i] = min(V_bwd[i], sqrt(V_fwd[i-1]² + 2 * a_available * Δd))
        const vPrevSq = V_fwd[i - 1] * V_fwd[i - 1];
        const v_accel_limit_i = Math.sqrt(Math.max(0, vPrevSq + 2 * a_available * deltaD));

        V_fwd[i] = Math.min(V_bwd[i], v_accel_limit_i);
    }
    
    // Check final closure: V_fwd[N-1] should be V_bwd[N-1] (or V_bwd[0])
    // If not, more iterations (j < 2) in the backward pass would be needed.

    // Apply final velocity and calculate dynamics
    const finalPoints = racingLine.map((p, i) => {
        p.velocity = V_fwd[i];
        return p;
    });

    // --- Dynamics & Zone Calculation ---
    for (let i = 0; i < N; i++) {
        const P_curr = finalPoints[i];
        const P_next = finalPoints[(i + 1) % N];
        const P_prev = finalPoints[(i - 1 + N) % N];

        const V_curr = P_curr.velocity;
        const V_next = P_next.velocity;
        const V_prev = P_prev.velocity;

        // Lateral G: a_lat = v^2 / R = v^2 * k
        const a_lat = V_curr * V_curr * P_curr.curvature;
        P_curr.lateralG = a_lat / g;

        // Longitudinal G: a_lon = (v_next^2 - v_prev^2) / (2 * Δd_total)
        const d_prev = vecDistance(P_prev, P_curr);
        const d_next = vecDistance(P_curr, P_next);
        
        // Use central difference over two segments for a smoother acceleration estimate
        const V_diff_sq = V_next * V_next - V_prev * V_prev;
        const a_lon = V_diff_sq / (2 * (d_prev + d_next) / 2); // (v2^2 - v1^2) / (2*d) => d = (d_prev+d_next)/2 is a simplification
        P_curr.longitudinalG = a_lon / g;

        // Apex identification: local minimum speed
        if (i > 0 && i < N - 1) { // Avoid end points for now
            if (V_curr < V_prev && V_curr < V_next) {
                P_curr.isApex = true;
            }
        }
        
        // Braking Zone: longitudinal deceleration exceeds threshold (e.g., -0.5G)
        if (P_curr.longitudinalG < -0.5) {
            P_curr.isBrakingZone = true;
        }
    }

    return finalPoints;
}

// --- 4. Lap Time Calculation ---

/**
 * Calculate total lap time from velocity profile
 * @param {Array} racingLine - Racing line with distance and velocity
 * @returns {number} Lap time in seconds
 */
function calculateLapTime(racingLine) {
    let lapTime = 0;
    const N = racingLine.length;
    
    for (let i = 0; i < N; i++) {
        const P_curr = racingLine[i];
        const P_next = racingLine[(i + 1) % N];

        const deltaD = vecDistance(P_curr, P_next);
        
        // Average velocity over the segment
        const avgV = (P_curr.velocity + P_next.velocity) / 2;

        if (avgV > 0.001) { // dt = Δd / avgV
            lapTime += deltaD / avgV;
        }
    }
    
    return lapTime;
}

// --- 5. Complete Racing Line Generation (Main Entry) ---

/**
 * Main entry point - generates complete racing line with velocity profile
 * @param {Object} trackData - Output from generateTrack()
 * @param {Object} vehicleParams - Vehicle physics parameters (optional)
 * @param {Object} options - Optimization options (optional)
 * @returns {Object} Complete racing line data
 */
function generateRacingLine(trackData, vehicleParams, options) {
    const opts = Object.assign({}, defaultOptions, options);
    const params = Object.assign({}, defaultVehicleParams, vehicleParams);

    // 1. Optimize Racing Line (K1999)
    let optimizedLine = optimizeRacingLine(
        trackData.centerline,
        trackData.leftBorder,
        trackData.rightBorder,
        opts
    );
    
    // 2. Calculate Velocity Profile (Forward-Backward Solver)
    let finalPoints = calculateVelocityProfile(optimizedLine, params);
    
    // 3. Calculate Lap Time and Statistics
    const lapTime = calculateLapTime(finalPoints);
    let maxSpeed = 0;
    let totalSpeed = 0;
    let apexes = [];
    
    for (let i = 0; i < finalPoints.length; i++) {
        const p = finalPoints[i];
        maxSpeed = Math.max(maxSpeed, p.velocity);
        totalSpeed += p.velocity;
        if (p.isApex) apexes.push(i);
    }
    
    const trackLength = finalPoints[finalPoints.length - 1].distance; // Last point holds total distance
    const avgSpeed = trackLength / lapTime;

    // 4. Identify Braking Zones (consolidate adjacent points)
    let brakingZones = [];
    let startIdx = -1;
    for (let i = 0; i < finalPoints.length; i++) {
        if (finalPoints[i].isBrakingZone && startIdx === -1) {
            startIdx = i;
        } else if (!finalPoints[i].isBrakingZone && startIdx !== -1) {
            brakingZones.push({ start: startIdx, end: i - 1 });
            startIdx = -1;
        }
    }
    // Handle wrap-around braking zone if loop closed
    if (startIdx !== -1) {
        // If the start is not 0, it wraps around. For simplicity, just close the zone.
        brakingZones.push({ start: startIdx, end: finalPoints.length - 1 });
    }

    return {
        points: finalPoints,
        lapTime: lapTime,
        maxSpeed: maxSpeed,
        avgSpeed: avgSpeed,
        apexes: apexes,
        brakingZones: brakingZones
    };
}

// Exported functions (adjust based on project's export needs, assuming global scope for now)
// You may need to add 'module.exports' or similar if this is a Node.js module.
// For a simple browser script, they can be accessed globally.
