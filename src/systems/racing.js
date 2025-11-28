/**
 * REDLINE ROULETTE - RACING PHYSICS SIMULATION ENGINE
 *
 * High-performance racing simulation with waypoint-based pathfinding,
 * realistic physics, collision detection, and dynamic race events.
 * Optimized for 24 cars at 60 FPS.
 */

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

import { RaceState, CarStatus, EventType, ContactType } from '../core/constants.js';

// Physics constants - Based on 2024/2025 motorsport research data
const PHYSICS_CONFIG = {
    BASE_SPEED: 120,              // Base speed units per second (tuned for ~60-90s lap times)
    MIN_SPEED: 40,                // Minimum speed (crashed/damaged/caution)
    MAX_SPEED: 200,               // Maximum achievable speed
    CORNERING_SLOWDOWN: 0.35,     // Speed reduction in corners (35% - F1 data shows high cornering speeds)
    DRAFTING_BOOST: 0.25,         // Increased from 0.20 to 0.25 to encourage closer racing
    DRAFTING_DISTANCE: 30,        // Distance threshold for drafting effect
    COLLISION_DISTANCE: 50,       // Distance for collision detection
    OVERTAKE_OFFSET: 25,          // How far cars move sideways to overtake
    STAMINA_DECAY_RATE: 0.012,    // Stamina loss per lap (slightly reduced - modern drivers more consistent)
    WEATHER_RAIN_PENALTY: 0.35,   // Rain reduces cornering by 35% (per WEC 2024 data)
    
    // DNF rates based on 2024 research: F1 ~1.8 DNF/race, NASCAR higher on contact tracks
    DNF_BASE_CHANCE: 0.000008,    // Base chance of DNF per update (~0.048% per lap at 60fps)
    AGGRESSION_CRASH_MULT: 0.4,   // High aggression increases crash chance (NASCAR data: 36% involvement rate for aggressive drivers)
    RELIABILITY_DNF_MULT: 0.6,    // Low reliability increases DNF chance
    
    // Pit Stop Constants - Based on series averages (F1: 2.4s, IndyCar: 7s, NASCAR: 10s)
    PIT_STOP_BASE_TIME: 8,        // Base time in seconds for a pit stop (mid-range between series)
    PIT_STOP_VARIANCE: 3,         // Random variance +/- seconds
    PIT_WINDOW_START: 0.3,        // Earliest pit window opens (30% into race)
    PIT_WINDOW_END: 0.85,         // Latest reasonable pit window (85% - avoid last lap pits)
    PIT_CHANCE_PER_LAP: 0.08,     // 8% chance per lap during pit window

    // Caution Constants - Based on NASCAR/IndyCar data (F1 uses VSC more, less bunching)
    CAUTION_MIN_DURATION: 20,     // Minimum caution duration in seconds (reduced from 30)
    CAUTION_MAX_DURATION: 45,     // Maximum caution duration in seconds (reduced from 60)
    CAUTION_SPEED_MULT: 0.35      // Cars run at 35% speed under caution
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two points
 */
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Linear interpolation
 */
function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Normalize angle to 0-2π range
 */
function normalizeAngle(angle) {
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    return angle;
}

/**
 * Calculate angle between two points
 */
function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Linearly interpolates between two angles, taking the shortest path around the circle.
 */
function lerpAngle(startAngle, endAngle, t) {
    let diff = endAngle - startAngle;
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return startAngle + diff * t;
}

// ============================================================================
// RACING PHYSICS CLASS

class RacingPhysics {
    constructor(track, raceSimulator) {
        this.track = track;
        this.raceSimulator = raceSimulator;
        this.waypoints = track.waypoints;
        this.weather = track.weather;
        this.raceInfo = {}; // Will be set by RaceSimulator at start

        // Pre-calculate curvatures for all waypoints (optimization)
        this.curvatures = this._precalculateCurvatures();

        // Collision grid for spatial partitioning (performance optimization)
        this.collisionGrid = new Map();
        this.gridCellSize = 50;
    }

    /**
     * Pre-calculate curvature at each waypoint
     * @private
     */
    _precalculateCurvatures() {
        const curvatures = [];
        const n = this.waypoints.length;

        for (let i = 0; i < n; i++) {
            const prev = this.waypoints[(i - 1 + n) % n];
            const curr = this.waypoints[i];
            const next = this.waypoints[(i + 1) % n];

            curvatures.push(this._calculateCurvature(prev, curr, next));
        }

        return curvatures;
    }

    /**
     * Get the optimal racing line position for a waypoint
     */
    getRacingLinePosition(waypointIndex, overtakeOffset = 0) {
        const waypoint = this.waypoints[waypointIndex];

        return {
            x: waypoint.x + overtakeOffset,
            y: waypoint.y,
            waypointIndex
        };
    }

    /**
     * Calculate base speed for a car based on driver stats and track conditions
     */
    calculateBaseSpeed(driver, isOnStraight = true) {
        const stats = driver.stats;

        // Weight top speed vs cornering based on track section
        const statValue = isOnStraight ?
            (stats.topSpeed * 0.7 + stats.cornering * 0.3) :
            (stats.cornering * 0.7 + stats.topSpeed * 0.3);

        // Map statValue (1-100) to a smaller multiplier range (e.g., 0.8 to 1.0)
        // This reduces the speed gap between high-stat and low-stat drivers.
        const statMultiplier = lerp(0.8, 1.0, (statValue - 1) / 99); // Map 1-100 to 0.8-1.0 range

        return PHYSICS_CONFIG.BASE_SPEED * statMultiplier;
    }

    /**
     * Calculate cornering speed reduction based on track curvature and driver skill
     */
    calculateCorneringSpeed(baseSpeed, waypointIndex, corneringStat, weatherMod = 1.0) {
        const curvature = this.curvatures[waypointIndex];

        // Sharp turns require more slowdown
        const curvatureThreshold = 0.2; // radians

        if (curvature < curvatureThreshold) {
            return baseSpeed; // Straight section
        }

        // Calculate slowdown based on curvature and driver skill
        const skillFactor = corneringStat / 100;
        const weatherFactor = this.weather.type === 'Rain'
            ? (1 - PHYSICS_CONFIG.WEATHER_RAIN_PENALTY) * weatherMod
            : 1.0;

        const slowdownFactor = 1 - (PHYSICS_CONFIG.CORNERING_SLOWDOWN * (1 - skillFactor) * weatherFactor);

        return baseSpeed * slowdownFactor;
    }

    /**
     * Check if a car is in drafting position behind another car
     */
    isDrafting(car, otherCar) {
        // Only stock cars can draft (based on game design)
        // Can be expanded to check car type from driver data

        const dist = distance(car.x, car.y, otherCar.x, otherCar.y);

        // Must be close and behind
        if (dist > PHYSICS_CONFIG.DRAFTING_DISTANCE) return false;

        // Check if car is behind otherCar (same direction)
        const angleToCar = angleBetween(car.x, car.y, otherCar.x, otherCar.y);
        const angleDiff = Math.abs(normalizeAngle(angleToCar - car.heading));

        // Within 45 degrees of directly behind
        return angleDiff < Math.PI / 4;
    }

    /**
     * Calculate drafting bonus
     */
    calculateDraftingBonus(car, allCars) {
        for (const otherCar of allCars) {
            if (otherCar.id === car.id) continue;
            if (otherCar.status !== CarStatus.RACING) continue;

            if (this.isDrafting(car, otherCar)) {
                // Check for Draft King trait
                const hasDraftKing = car.driver.traits.some(t => t.name === 'Draft King');
                return hasDraftKing ? 1.15 : 1.0; // +15% bonus for Draft King, base drafting handled separately
            }
        }

        return 1.0;
    }

    /**
     * Detect collisions between cars using spatial partitioning
     */
    detectCollisions(cars) {
        // Clear collision grid
        this.collisionGrid.clear();

        // Populate grid
        for (const car of cars) {
            if (car.status !== CarStatus.RACING) continue;

            const gridKey = this._getGridKey(car.x, car.y);
            if (!this.collisionGrid.has(gridKey)) {
                this.collisionGrid.set(gridKey, []);
            }
            this.collisionGrid.get(gridKey).push(car);
        }

        // Check collisions only within same grid cells
        const collisions = [];

        for (const [gridKey, carsInCell] of this.collisionGrid.entries()) {
            for (let i = 0; i < carsInCell.length; i++) {
                for (let j = i + 1; j < carsInCell.length; j++) {
                    const car1 = carsInCell[i];
                    const car2 = carsInCell[j];

                    const dist = distance(car1.x, car1.y, car2.x, car2.y);

                    if (dist < PHYSICS_CONFIG.COLLISION_DISTANCE) {
                        collisions.push({ car1, car2, distance: dist });
                    }
                }
            }
        }

        return collisions;
    }

    /**
     * Get grid key for spatial partitioning
     * @private
     */
    _getGridKey(x, y) {
        const gridX = Math.floor(x / this.gridCellSize);
        const gridY = Math.floor(y / this.gridCellSize);
        return `${gridX},${gridY}`;
    }

    /**
     * Calculate overtaking maneuver
     * Cars temporarily deviate from racing line to pass
     */
    calculateOvertakeOffset(car, carsAhead) {
        // Check if there's a slower car directly ahead
        const targetWaypoint = (car.currentWaypoint + 3) % this.waypoints.length;

        for (const otherCar of carsAhead) {
            if (otherCar.status !== CarStatus.RACING) continue;

            // Check if other car is on similar waypoint
            const waypointDiff = Math.abs(otherCar.currentWaypoint - car.currentWaypoint);

            if (waypointDiff < 5 && car.speed > otherCar.speed * 1.05) {
                // Attempt overtake - alternate left/right based on car ID
                return (car.id % 2 === 0)
                    ? PHYSICS_CONFIG.OVERTAKE_OFFSET
                    : -PHYSICS_CONFIG.OVERTAKE_OFFSET;
            }
        }

        return 0; // No overtake needed
    }

    /**
     * Calculate DNF/crash probability
     */
    calculateDNFChance(driver, aggressionFactor = 1.0, reliabilityMod = 1.0) {
        const baseChance = PHYSICS_CONFIG.DNF_BASE_CHANCE;

        // High aggression increases crash chance
        const aggressionMult = (driver.stats.aggression / 100) * PHYSICS_CONFIG.AGGRESSION_CRASH_MULT;

        // Low reliability increases mechanical failure chance
        const reliabilityMult = (1 - driver.stats.reliability / 100) * PHYSICS_CONFIG.RELIABILITY_DNF_MULT;

        const totalChance = baseChance * (1 + aggressionMult * aggressionFactor + reliabilityMult * reliabilityMod);

        return totalChance;
    }

    /**
     * Apply weather effects to car performance
     */
    applyWeatherEffects(driver) {
        let corneringMod = 1.0;
        let speedMod = 1.0;

        if (this.weather.type === 'Rain') {
            // Check for Rain Master trait
            const hasRainMaster = driver.traits.some(t => t.name === 'Rain Master');

            if (hasRainMaster) {
                corneringMod = 1.25; // +25% cornering in rain
            } else {
                corneringMod = 0.65; // -35% cornering in rain
            }
        }

        if (this.weather.type === 'Night') {
            // Check for Night Owl trait
            const hasNightOwl = driver.traits.some(t => t.name === 'Night Owl');

            if (hasNightOwl) {
                speedMod = 1.1; // +10% awareness/performance at night
            }
        }

        return { corneringMod, speedMod };
    }

    /**
     * Calculate track progress percentage (0-1) based on waypoint
     */
    calculateTrackProgress(waypointIndex, waypointProgress) {
        return (waypointIndex + waypointProgress) / this.waypoints.length;
    }

    /**
     * Calculate curvature at a waypoint (for cornering detection)
     * @private
     */
    _calculateCurvature(prev, current, next) {
        // angleBetween is a global utility function, so it's accessible here
        const angle1 = angleBetween(prev.x, prev.y, current.x, current.y);
        const angle2 = angleBetween(current.x, current.y, next.x, next.y);

        let angleDiff = Math.abs(angle2 - angle1);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

        return angleDiff;
    }
}

// ============================================================================
// CAR CONTROLLER CLASS
// ============================================================================

class CarController {
    constructor(id, driver, startingPosition, track, raceSimulator = null) {
        this.id = id;
        this.driver = driver;
        this.startingPosition = startingPosition;
        this.teamColor = driver.teamColor;
        this.raceSimulator = raceSimulator; // Reference to race simulator for event logging

        // Position and movement
        this.x = 0;
        this.y = 0;
        this.heading = 0; // Radians
        this.speed = 0;   // Units per second

        // Track progress
        this.currentWaypoint = 0;
        this.waypointProgress = 0; // 0-1 between current and next waypoint
        this.currentLap = 0;
        this.totalDistance = 0;
        this.hasCompletedFirstWaypoint = false; // Track if we've left the starting line
        this.justCrossedLine = false; // Prevent multiple lap increments per crossing

        // Status
        this.status = CarStatus.RACING;
        this.position = startingPosition;
        this.finishTime = null;
        this.dnfTime = null; // New: Time car DNF'd
        this.hasPitted = false;       // for pit stop logic
        this.pitTimeRemaining = 0;    // for pit stop timer
        this.raceInfo = {};           // Set by RaceSimulator at start
        this.distanceSinceEventCheck = 0; // New: Throttle event checks to roughly twice a lap

        // Performance modifiers
        this.currentStamina = 100;
        this.baseStats = { ...driver.stats };
        this.effectiveStats = { ...driver.stats };

        // Overtaking state
        this.overtakeOffset = 0;
        this.targetOffset = 0;

        // Effects and modifiers
        this.activeEffects = [];

        // Initialize position at starting grid
        this._initializeStartingPosition(startingPosition, track);
    }

    /**
     * Initialize car at starting grid position
     * @private
     */
    _initializeStartingPosition(position, track) {
        // Check if track has waypoints (Drag Race might not use them standardly)
        if (!track.waypoints || track.waypoints.length < 2) {
            this.x = 0;
            this.y = 0;
            this.currentWaypoint = 0;
            this.waypointProgress = 0;
            this.heading = 0;
            return;
        }

        // Start at waypoint 0, but spread out based on position
        const startWaypoint = track.waypoints[0];

        // Stagger starting positions
        this.x = startWaypoint.x;
        this.y = startWaypoint.y + (position - 1) * 20; // 20 units between cars
        this.currentWaypoint = 0;
        this.waypointProgress = 0;

        // Face the track direction
        const nextWaypoint = track.waypoints[1];
        this.heading = angleBetween(this.x, this.y, nextWaypoint.x, nextWaypoint.y);
    }

    /**
     * Update car state for a single physics tick
     */
    update(deltaTime, physics, allCars) {
        if (this.status === CarStatus.DNF_CRASH || this.status === CarStatus.DNF_MECHANICAL || this.status === CarStatus.FINISHED) {
            this.speed = 0;
            return;
        }

        if (this.status === CarStatus.PIT_STOP) {
            this._updatePitStop(deltaTime, physics);
            return;
        }

        // Apply caution slowdown if race is under caution
        if (physics.isCaution) {
            const cautionSpeed = PHYSICS_CONFIG.BASE_SPEED * PHYSICS_CONFIG.CAUTION_SPEED_MULT;
            this.speed = lerp(this.speed, cautionSpeed, 0.08);
            this._moveAlongTrack(deltaTime, physics);
            return; // No other major updates under caution
        }

        // Apply stamina degradation
        this._updateStamina();

        // Apply trait effects
        this._applyTraitEffects(allCars);

        // Apply active effects (contacts, etc.)
        this._applyActiveEffects(deltaTime);

        // Calculate effective speed
        const targetSpeed = this._calculateTargetSpeed(physics, allCars);

        // Smooth acceleration/deceleration
        const acceleration = 100; // units per second squared
        const speedDiff = targetSpeed - this.speed;
        const maxChange = acceleration * deltaTime;

        this.speed += clamp(speedDiff, -maxChange, maxChange);
        this.speed = clamp(this.speed, PHYSICS_CONFIG.MIN_SPEED, PHYSICS_CONFIG.MAX_SPEED);

        // Move along track
        this._moveAlongTrack(deltaTime, physics);
        
        if (this.status === CarStatus.PIT_STOP) {
            this._updatePitStop(deltaTime, physics);
            return;
        }
        
        // Spontaneous event checks (DNF and potential Pit Stop)
        // Moved here to ensure DNF is processed before movement calculations
        this._spontaneousEventCheck(physics);
        // If DNF was triggered in this frame, stop further processing
        if (this.status === CarStatus.DNF_CRASH || this.status === CarStatus.DNF_MECHANICAL) {
            this.speed = 0; // Ensure speed is immediately 0.
            // Also, record the DNF time here if it's not set already (for tests and leaderboards)
            if (this.dnfTime === null) { 
                this.dnfTime = this.raceSimulator.raceTime;
            }
            return;
        }
    }

    /**
     * Checks for spontaneous events (DNF, Pit Stop)
     * @private
     */
    _spontaneousEventCheck(physics) {
        // Track Distance since last check (reset on lap completion)
        const trackDistance = physics.track.totalDistance;

        // Reset check on lap complete and check for pit stops
        if (this.currentWaypoint === 0 && this.waypointProgress < 0.1 && this.distanceSinceEventCheck > trackDistance / 2) {
            this.distanceSinceEventCheck = 0;
            
            // Check for Pit Stop based on race progress and realistic pit windows
            const raceProgress = this.currentLap / this.raceInfo.totalLaps;
            const inPitWindow = raceProgress >= PHYSICS_CONFIG.PIT_WINDOW_START &&
                               raceProgress <= PHYSICS_CONFIG.PIT_WINDOW_END;
            
            // Research shows F1: 1.5-2 stops, IndyCar: 2-3 stops, NASCAR: 4-8 stops
            // Average to ~2 stops per race with probability-based triggering
            if (inPitWindow && !this.hasPitted && this.currentLap > 0 &&
                Math.random() < PHYSICS_CONFIG.PIT_CHANCE_PER_LAP) {
                
                this.status = CarStatus.PIT_STOP;
                // Apply Quick Pit trait bonus
                this.pitTimeRemaining = this.driver.traits.some(t => t.name === 'Quick Pit')
                    ? PHYSICS_CONFIG.PIT_STOP_BASE_TIME * 0.75 : PHYSICS_CONFIG.PIT_STOP_BASE_TIME;
                this.pitTimeRemaining += (Math.random() - 0.5) * PHYSICS_CONFIG.PIT_STOP_VARIANCE * 2;
                this.pitTimeRemaining = Math.max(4, this.pitTimeRemaining); // Min 4 seconds
                return;
            }
        }
        
        // DNF check is now a standalone call
        this._checkDNF(physics);
    }

    /**
     * Update car state when on pit road (slowed, waiting)
     * @private
     */
    _updatePitStop(deltaTime, physics) {
        // Pit lane speed limit (F1: ~80 km/h, NASCAR: ~55 mph)
        const pitSpeed = PHYSICS_CONFIG.BASE_SPEED * 0.4;
        this.speed = lerp(this.speed, pitSpeed, 0.15);

        this.pitTimeRemaining -= deltaTime;
        
        if (this.pitTimeRemaining <= 0) {
            this.status = CarStatus.RACING;
            this.hasPitted = true;
            // Exit at pit speed, will accelerate back to race speed
            this.speed = pitSpeed;
            // Note: RaceSimulator handles adding the event
        }
    }

    /**
     * Calculate target speed based on all factors
     * @private
     */
    _calculateTargetSpeed(physics, allCars) {
        // Get current track section characteristics
        const isOnStraight = physics.curvatures[this.currentWaypoint] < 0.2;

        // Base speed from driver stats
        let baseSpeed = physics.calculateBaseSpeed(this.driver, isOnStraight);

        // Apply weather effects
        const weatherEffects = physics.applyWeatherEffects(this.driver);
        baseSpeed *= weatherEffects.speedMod;

        // Apply cornering slowdown
        const corneringSpeed = physics.calculateCorneringSpeed(
            baseSpeed,
            this.currentWaypoint,
            this.effectiveStats.cornering,
            weatherEffects.corneringMod
        );

        // Apply drafting bonus
        const draftingBonus = physics.calculateDraftingBonus(this, allCars);
        const isDrafting = draftingBonus > 1.0 || this._isCarInDraftRange(allCars);

        let finalSpeed = corneringSpeed;
        if (isDrafting) {
            finalSpeed *= (1 + PHYSICS_CONFIG.DRAFTING_BOOST);
        }
        finalSpeed *= draftingBonus;

        // Apply stamina factor
        const staminaFactor = this.currentStamina / 100;
        finalSpeed *= (0.85 + 0.15 * staminaFactor); // 85-100% based on stamina

        return finalSpeed;
    }

    /**
     * Check if car is in draft range of another car
     * @private
     */
    _isCarInDraftRange(allCars) {
        for (const otherCar of allCars) {
            if (otherCar.id === this.id) continue;
            if (otherCar.status !== CarStatus.RACING) continue;

            const dist = distance(this.x, this.y, otherCar.x, otherCar.y);
            if (dist < PHYSICS_CONFIG.DRAFTING_DISTANCE) return true;
        }
        return false;
    }

    /**
     * Move car along track waypoints
     * @private
     */
    _moveAlongTrack(deltaTime, physics) {
        const distanceToMove = this.speed * deltaTime;
        let remainingDistance = distanceToMove;
    
        while (remainingDistance > 0 && this.status === CarStatus.RACING) {
            const currentWP = physics.waypoints[this.currentWaypoint];
            
            let nextWPIndex;
            let isLastSegment = false;

            if (physics.track.isLoop) {
                nextWPIndex = (this.currentWaypoint + 1) % physics.waypoints.length;
            } else {
                // For non-looping tracks, don't wrap around
                if (this.currentWaypoint === physics.waypoints.length - 1) {
                    isLastSegment = true;
                    nextWPIndex = this.currentWaypoint; // Stay on the last waypoint
                } else {
                    nextWPIndex = this.currentWaypoint + 1;
                }
            }
            
            const nextWP = physics.waypoints[nextWPIndex];
            
            // If on the last segment of a non-looping track, and we've reached the end
            if (isLastSegment && this.waypointProgress >= 1.0) {
                this.status = CarStatus.FINISHED; // Car has completed the track
                remainingDistance = 0; // Stop moving
                this.finishTime = this.raceSimulator.raceTime; // Record finish time
                if (this.raceSimulator) {
                    this.raceSimulator._addEvent(EventType.RACE_FINISH, {
                        message: `${this.driver.name} finishes the drag race.`,
                        driver: this.driver.name,
                        time: this.raceSimulator.raceTime
                    });
                }
                continue; // Skip to next iteration (which will exit)
            }

            const segmentLength = distance(currentWP.x, currentWP.y, nextWP.x, nextWP.y);
            // If segment length is 0, something is wrong with the track data, but we must avoid an infinite loop.
            // We'll break out and the car will just stop for this frame.
            if (segmentLength <= 0) {
                console.error(`[ERROR] Zero-length segment detected at waypoint ${this.currentWaypoint}. Halting car ${this.driver.name}.`);
                remainingDistance = 0; // Prevent infinite loop
                continue;
            }

            const distanceRemainingInSegment = segmentLength * (1 - this.waypointProgress);
    
            if (remainingDistance >= distanceRemainingInSegment) {
                // Move to the next waypoint
                remainingDistance -= distanceRemainingInSegment;
                this.totalDistance += distanceRemainingInSegment;
                this.distanceSinceEventCheck += distanceRemainingInSegment;
    
                this.currentWaypoint = nextWPIndex;
                this.waypointProgress = 0;
    
                // Update position to be exactly at the new waypoint
                this.x = nextWP.x;
                this.y = nextWP.y;
    
                if (physics.track.isLoop) {
                    if (this.currentWaypoint === 0 && this.hasCompletedFirstWaypoint && !this.justCrossedLine) {
                        this.currentLap++;
                        this.justCrossedLine = true;
                        if (this.raceSimulator) {
                            this.raceSimulator._addEvent(EventType.LAP_COMPLETE, {
                                message: `${this.driver.name} completes Lap ${this.currentLap}.`,
                                driver: this.driver.name,
                                lap: this.currentLap,
                                time: this.raceSimulator.raceTime
                            });
                        }
                    }
        
                    if (this.currentWaypoint > 0) {
                        this.hasCompletedFirstWaypoint = true;
                    }
        
                    if (this.currentWaypoint !== 0 && this.justCrossedLine) {
                        this.justCrossedLine = false;
                    }
                } else {
                    // For non-looping track, if we reached the end, consider it finished
                    if (isLastSegment) { // currentWaypoint is now the last one.
                        this.status = CarStatus.FINISHED;
                        this.finishTime = this.raceSimulator.raceTime;
                        if (this.raceSimulator) {
                            this.raceSimulator._addEvent(EventType.RACE_FINISH, {
                                message: `${this.driver.name} finishes the drag race.`,
                                driver: this.driver.name,
                                time: this.raceSimulator.raceTime
                            });
                        }
                        return; // Exit update as car is finished
                    }
                }
    
            } else {
                // Move partway along the current segment
                this.waypointProgress += remainingDistance / segmentLength;
                this.totalDistance += remainingDistance;
    
                // Update position via interpolation
                this.x = lerp(currentWP.x, nextWP.x, this.waypointProgress);
                this.y = lerp(currentWP.y, nextWP.y, this.waypointProgress);
    
                remainingDistance = 0;
            }
    
            // Smoothly update overtake offset
            this.overtakeOffset += (this.targetOffset - this.overtakeOffset) * 0.1;
            this.x += this.overtakeOffset * Math.cos(this.heading + Math.PI / 2);
            this.y += this.overtakeOffset * Math.sin(this.heading + Math.PI / 2);
    
            // Smoothly update heading towards the next segment's direction
            const targetHeading = angleBetween(currentWP.x, currentWP.y, nextWP.x, nextWP.y);
            this.heading = lerpAngle(this.heading, targetHeading, 0.1); // Adjust 0.1 for desired steering responsiveness
        }
    }

    /**
     * Update stamina degradation over laps
     * @private
     */
    _updateStamina() {
        const staminaStat = this.baseStats.stamina / 100;
        const degradationRate = PHYSICS_CONFIG.STAMINA_DECAY_RATE * (1 - staminaStat * 0.5);

        this.currentStamina -= degradationRate;
        this.currentStamina = Math.max(0, this.currentStamina);
    }

    /**
     * Apply special trait effects
     * @private
     */
    _applyTraitEffects(allCars) {
        // Reset to base stats
        this.effectiveStats = { ...this.baseStats };

        for (const trait of this.driver.traits) {
            switch (trait.name) {
                case 'Choker':
                    // -15% all stats when leading
                    if (this.position === 1) {
                        for (const stat in this.effectiveStats) {
                            this.effectiveStats[stat] *= 0.85;
                        }
                    }
                    break;

                case 'Closer':
                    // +20% stamina in final laps
                    if (this.currentLap >= this.raceInfo.totalLaps * 0.75) {
                        this.currentStamina = Math.min(100, this.currentStamina * 1.2);
                    }
                    break;

                case 'Lone Wolf':
                    // +10% all stats when alone
                    const isAlone = this._isCarAlone(allCars);
                    if (isAlone) {
                        for (const stat in this.effectiveStats) {
                            this.effectiveStats[stat] *= 1.1;
                        }
                    }
                    break;
                
                case 'Team Player':
                    // +5% all stats when near a teammate
                    const isNearTeammate = allCars.some(c => 
                        c.driver.teamName === this.driver.teamName && 
                        c.id !== this.id && 
                        distance(this.x, this.y, c.x, c.y) < 100 // 100 units is "near"
                    );
                    if (isNearTeammate) {
                        for (const stat in this.effectiveStats) {
                            this.effectiveStats[stat] *= 1.05;
                        }
                    }
                    break;

                case 'Comeback Kid':
                    // +15% all stats when in bottom half
                    if (this.position > allCars.length / 2) {
                        for (const stat in this.effectiveStats) {
                            this.effectiveStats[stat] *= 1.15;
                        }
                    }
                    break;

                case 'Hot Head':
                    // +30% aggression after contact
                    // (This would be triggered by contact events)
                    break;
            }
        }
    }

    /**
     * Check if car is isolated from other cars
     * @private
     */
    _isCarAlone(allCars) {
        const isolationDistance = 80;

        for (const otherCar of allCars) {
            if (otherCar.id === this.id) continue;
            if (otherCar.status !== CarStatus.RACING) continue;

            const dist = distance(this.x, this.y, otherCar.x, otherCar.y);
            if (dist < isolationDistance) return false;
        }

        return true;
    }

    /**
     * Apply active effects from contacts
     * @private
     */
    _applyActiveEffects(deltaTime) {
        // Update effect durations
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.duration -= deltaTime;

            // Apply effect based on type
            if (effect.type === 'heckler') {
                this.effectiveStats.cornering *= 0.8; // -20% cornering
            } else if (effect.type === 'engineer') {
                this.effectiveStats.topSpeed *= 1.15; // +15% speed
                this.effectiveStats.reliability *= 0.7; // -30% reliability
            } else if (effect.type === 'spotter') {
                // Handled in DNF calculation
            }

            return effect.duration > 0;
        });
    }

    /**
     * Check for DNF (crash or mechanical failure)
     * @private
     */
    _checkDNF(physics) {
        const spotterActive = this.activeEffects.some(e => e.type === 'spotter');
        const reliabilityMod = this.activeEffects.some(e => e.type === 'engineer') ? 1.5 : 1.0;
        const aggressionMod = spotterActive ? 0.5 : 1.0;

        const dnfChance = physics.calculateDNFChance(
            this.driver,
            aggressionMod,
            reliabilityMod
        );

        if (Math.random() < dnfChance) {
            // Determine DNF type based on stats
            const isCrash = Math.random() < (this.driver.stats.aggression / 100);
            this.status = isCrash ? CarStatus.DNF_CRASH : CarStatus.DNF_MECHANICAL;
            this.speed = 0;
            this.dnfTime = this.raceSimulator.raceTime; // Record DNF time
        }
    }

    /**
     * Apply contact effect to this car
     */
    applyContactEffect(effectType, duration = 10) {
        this.activeEffects.push({
            type: effectType,
            duration: duration
        });
    }

    /**
     * Finish the race
     */
    finish(raceTime) {
        this.status = CarStatus.FINISHED;
        this.finishTime = raceTime;
    }

    /**
     * Get car state for rendering
     */
    getState() {
        return {
            id: this.id,
            driver: this.driver,
            x: this.x,
            y: this.y,
            heading: this.heading,
            speed: this.speed,
            currentLap: this.currentLap,
            currentWaypoint: this.currentWaypoint,
            waypointProgress: this.waypointProgress,
            position: this.position,
            status: this.status,
            teamColor: this.teamColor,
            stamina: this.currentStamina,
            finishTime: this.finishTime,
            pitTimeRemaining: this.pitTimeRemaining,
            totalDistance: this.totalDistance // Add totalDistance for gap calculation
        };
    }
}

// ============================================================================
// BURNER PHONE SYSTEM CLASS
// ============================================================================

export class BurnerPhoneSystem {
    constructor() {
        this.maxBattery = 10;
        this.currentBattery = this.maxBattery;
        this.heat = 0;
        this.maxHeat = 100;
        this.heatDecayRate = 2; // Heat per second decay

        // Contact costs and heat generation
        this.contacts = {
            [ContactType.SPOTTER]: { cost: 2, heat: 15, duration: 10 },
            [ContactType.MARSHAL]: { cost: 3, heat: 30, duration: 10 },
            [ContactType.HECKLER]: { cost: 2, heat: 20, duration: 15 },
            [ContactType.ENGINEER]: { cost: 3, heat: 25, duration: 20 }
        };

        this.usedContacts = [];
    }

    /**
     * Reset battery and heat for new race
     */
    resetForRace() {
        this.currentBattery = this.maxBattery;
        this.heat = 0;
        this.usedContacts = [];
    }

    /**
     * Check if contact can be used
     */
    canUseContact(contactType) {
        // Heat penalty: disable contacts if heat > 100
        if (this.heat >= this.maxHeat) return false;

        const contact = this.contacts[contactType];
        if (!contact) return false;

        return this.currentBattery >= contact.cost;
    }

    /**
     * Use a contact on a target car
     */
    useContact(contactType, targetCar, allCars, raceTime, raceSimulator) {
        if (!this.canUseContact(contactType)) {
            return { success: false, reason: 'Insufficient battery or heat too high' };
        }

        const contact = this.contacts[contactType];

        // Deduct battery
        this.currentBattery -= contact.cost;

        // Add heat
        this.heat += contact.heat;
        this.heat = Math.min(this.heat, this.maxHeat);

        // Apply effect based on contact type
        let effect = null;

        switch (contactType) {
            case ContactType.SPOTTER:
                // Reduce crash chance for target
                targetCar.applyContactEffect('spotter', contact.duration);
                effect = `Spotter protecting ${targetCar.driver.name} from crashes`;
                break;

            case ContactType.MARSHAL:
                // Yellow flag - deploy caution directly from the simulator
                raceSimulator._deployCaution();
                effect = `Yellow flag deployed - all cars slowed`;
                break;

            case ContactType.HECKLER:
                // Reduce target's cornering stat temporarily
                targetCar.applyContactEffect('heckler', contact.duration);
                effect = `Heckler disrupting ${targetCar.driver.name}'s cornering`;
                break;

            case ContactType.ENGINEER:
                // Boost speed but reduce reliability
                targetCar.applyContactEffect('engineer', contact.duration);
                effect = `Engineer boosting ${targetCar.driver.name}'s speed (risky!)`;
                break;
        }

        // Record usage
        this.usedContacts.push({
            type: contactType,
            target: targetCar.driver.name,
            time: raceTime,
            effect: effect
        });

        return {
            success: true,
            effect: effect,
            remainingBattery: this.currentBattery,
            currentHeat: this.heat
        };
    }

    /**
     * Update heat decay over time
     */
    update(deltaTime) {
        this.heat -= this.heatDecayRate * deltaTime;
        this.heat = Math.max(0, this.heat);
    }

    /**
     * Get current phone status
     */
    getStatus() {
        return {
            battery: this.currentBattery,
            maxBattery: this.maxBattery,
            heat: this.heat,
            maxHeat: this.maxHeat,
            contactsDisabled: this.heat >= this.maxHeat,
            usedContacts: this.usedContacts
        };
    }
}

// ============================================================================
// RACE SIMULATOR CLASS
// ============================================================================

class RaceSimulator {
    constructor(drivers, track, totalLaps = 10) {
        this.drivers = drivers;
        this.track = track;
        this.totalLaps = totalLaps;

        // Race state
        this.state = RaceState.PRE_RACE;
        this.raceTime = 0;
        this.updateRate = 1 / 60; // 60 updates per second
        this.accumulatedTime = 0;
        this.isCaution = false;
        this.cautionTimer = 0;

        // Initialize systems
        this.physics = new RacingPhysics(track, this);
        this.burnerPhone = new BurnerPhoneSystem();

        // Initialize cars with reference to this simulator
        this.cars = drivers.map((driver, index) =>
            new CarController(index, driver, driver.startingPosition || (index + 1), track, this)
        );

        // Race events log
        this.events = [];

        // Leaderboard
        this.leaderboard = [];
        this.finishedCars = [];
        this.simulationSpeedMultiplier = 1.0;

        // Performance tracking
        this.lastOvertakes = new Map(); // Prevent spam of overtake events
    }

    /**
     * Start the race
     */
    start() {
        this.state = RaceState.RACING;
        this.raceTime = 0;
        this.burnerPhone.resetForRace();
        
        // Set race info for all cars (needed for trait effects)
        this.cars.forEach(car => car.raceInfo = { totalLaps: this.totalLaps });
        this.physics.raceInfo = { totalLaps: this.totalLaps };

        this._addEvent(EventType.RACE_START, {
            message: 'Race started!',
            time: 0
        });
    }

    /**
     * Force the race to finish immediately.
     */
    forceFinishRace() {
        if (this.state === RaceState.FINISHED || this.state === RaceState.PRE_RACE) {
            return; // Only force finish if currently racing
        }

        // Fast-forward all cars to their natural conclusion
        for (const car of this.cars) {
            if (car.status === CarStatus.RACING || car.status === CarStatus.PIT_STOP) {
                // If a car is still racing, mark it as finished at current time
                car.status = CarStatus.FINISHED;
                car.finishTime = this.raceTime;
                // Add to finishedCars immediately if not already there
                if (!this.finishedCars.includes(car)) {
                    this.finishedCars.push(car);
                }
            }
        }
        
        // Ensure all remaining events are processed and positions are final
        this._updatePositions();
        this._checkRaceCompletion(); // This will formally set state to FINISHED

        this._addEvent(EventType.RACE_FINISH, {
            message: 'Race skipped and results finalized.',
            time: this.raceTime
        });
    }

    /**
     * Update race simulation (call this every frame)
     */
    update(scaledDeltaTime) {
        if (this.state !== RaceState.RACING) return;

        // Calculate simulation speed multiplier based on finished cars
        const finishedCarCount = this.finishedCars.length;
        let speedMultiplier = 1.0;
        if (finishedCarCount >= 5) {
            speedMultiplier = 5.0;
        } else if (finishedCarCount === 4) {
            speedMultiplier = 3.0;
        } else if (finishedCarCount === 3) {
            speedMultiplier = 2.0;
        } else if (finishedCarCount === 2) {
            speedMultiplier = 1.5;
        } else if (finishedCarCount === 1) {
            speedMultiplier = 1.2;
        }
        this.simulationSpeedMultiplier = speedMultiplier;

        // Fixed timestep for deterministic physics
        this.accumulatedTime += scaledDeltaTime * this.simulationSpeedMultiplier;


        while (this.accumulatedTime >= this.updateRate) {
            this._physicsUpdate(this.updateRate);
            this.accumulatedTime -= this.updateRate;
        }

        // Update burner phone heat decay (real time decay regardless of sim speed)
        // We assume the caller (Game.js) passes scaledDeltaTime.
        // BurnerPhone decay should be based on real time, but in this setup, the best approximation is to pass the scaled time.
        this.burnerPhone.update(scaledDeltaTime);

        // Handle caution timer
        this._updateCaution(scaledDeltaTime);
    }

    /**
     * Fixed timestep physics update
     * @private
     */
    _physicsUpdate(deltaTime) {
        this.raceTime += deltaTime;

        // Update all cars
        for (const car of this.cars) {
            const oldStatus = car.status;
            car.update(deltaTime, this.physics, this.cars);

            // Handle new race events triggered in car.update
            if (car.status === CarStatus.PIT_STOP && oldStatus !== CarStatus.PIT_STOP) {
                this._addEvent(EventType.PIT_STOP, {
                    message: `${car.driver.name} pits for service.`,
                    driver: car.driver.name,
                    time: this.raceTime
                });
            } else if (car.status === CarStatus.DNF_CRASH && oldStatus !== CarStatus.DNF_CRASH) {
                this._addEvent(EventType.CRASH, {
                    message: `${car.driver.name} crashes out!`,
                    driver: car.driver.name,
                    position: car.position,
                    time: this.raceTime
                });
                this._deployCaution();
            } else if (car.status === CarStatus.DNF_MECHANICAL && oldStatus !== CarStatus.DNF_MECHANICAL) {
                this._addEvent(EventType.MECHANICAL_FAILURE, {
                    message: `${car.driver.name} suffers mechanical failure and is out!`,
                    driver: car.driver.name,
                    position: car.position,
                    time: this.raceTime
                });
                this._deployCaution();
            } else if (car.status === CarStatus.RACING && oldStatus === CarStatus.PIT_STOP) {
                // Pit exit event
                this._addEvent(EventType.PIT_STOP, {
                    message: `${car.driver.name} exits the pits.`,
                    driver: car.driver.name,
                    time: this.raceTime
                });
            }
        }

        // NO COLLISION DETECTION - All events are pure probability-based simulation
        // Collisions happening on a 2D display don't reflect actual race positions
        // Events are generated probabilistically during car update instead
        
        // (Collision detection code removed - it was causing false positives)

        // Update positions and leaderboard
        this._updatePositions();

        // Check for race completion
        this._checkRaceCompletion();
    }

    /**
     * Update car positions based on track progress
     * @private
     */
    _updatePositions() {
        // Step 1: Sort all cars based on their status and progress.
        // This sorting logic prioritizes FINISHED > DNF > RACING/PIT_STOP.
        const sortedCars = [...this.cars].sort((a, b) => {
            const isAFinished = a.status === CarStatus.FINISHED;
            const isBFinished = b.status === CarStatus.FINISHED;
            const isADNF = a.status === CarStatus.DNF_CRASH || a.status === CarStatus.DNF_MECHANICAL;
            const isBDNF = b.status === CarStatus.DNF_CRASH || b.status === CarStatus.DNF_MECHANICAL;

            // FINISHED cars come first, sorted by finishTime
            if (isAFinished && !isBFinished) return -1;
            if (!isAFinished && isBFinished) return 1;
            if (isAFinished && isBFinished) {
                return a.finishTime - b.finishTime;
            }

            // DNF cars come after FINISHED cars, but before RACING/PIT_STOP cars
            if (isADNF && !isBDNF) return -1;
            if (!isADNF && isBDNF) return 1;
            if (isADNF && isBDNF) {
                // Both are DNF, sort by dnfTime (earlier DNF means lower position among DNFs)
                if (a.dnfTime !== b.dnfTime) return a.dnfTime - b.dnfTime;
                // If dnfTime is the same, car that traveled further gets higher position
                return b.totalDistance - a.totalDistance;
            }

            // RACING cars come before PIT_STOP cars (if same progress)
            if (a.status === CarStatus.PIT_STOP && b.status === CarStatus.RACING) return 1;
            if (a.status === CarStatus.RACING && b.status === CarStatus.PIT_STOP) return -1;
            
            // For RACING or PIT_STOP cars, sort by lap, then waypoint, then progress
            if (a.currentLap !== b.currentLap) {
                return b.currentLap - a.currentLap;
            }
            if (a.currentWaypoint !== b.currentWaypoint) {
                return b.currentWaypoint - a.currentWaypoint;
            }
            return b.waypointProgress - a.waypointProgress;
        });

        // Step 2: Assign positions and detect overtakes for active cars.
        // For FINISHED and DNF cars, their position is set once and remains immutable.
        for (let i = 0; i < sortedCars.length; i++) {
            const car = sortedCars[i];
            const oldPosition = car.position;
            const newPosition = i + 1;

            if (car.status === CarStatus.RACING || car.status === CarStatus.PIT_STOP) {
                // Only update position and check for overtakes for active cars
                if (oldPosition !== newPosition) {
                    const lastOvertakeTime = this.lastOvertakes.get(car.id) || 0;
                    if (this.raceTime - lastOvertakeTime > 1.0 && !this.isCaution) {
                        if (newPosition < oldPosition) {
                            this._addEvent(EventType.OVERTAKE, {
                                message: `${car.driver.name} moves up to P${newPosition}!`,
                                driver: car.driver.name,
                                oldPosition,
                                newPosition,
                                time: this.raceTime
                            });
                        }
                        this.lastOvertakes.set(car.id, this.raceTime);
                    }
                }
                car.position = newPosition; // Update position for active cars
            } else if ((car.status === CarStatus.DNF_CRASH || car.status === CarStatus.DNF_MECHANICAL) && car.position === oldPosition) {
                // For DNF cars, set their final position if it hasn't been locked yet.
                // This ensures DNF cars get a stable final position on the leaderboard.
                car.position = newPosition;
            }
            // For CarStatus.FINISHED cars, their position is set in _checkRaceCompletion and should be stable.
            // We explicitly do not overwrite it here.
        }

        // Step 3: Build the leaderboard with gap information based on the final sorted order.
        const carStatesWithGaps = [];
        let leaderCarState = null;

        for (let i = 0; i < sortedCars.length; i++) {
            const car = sortedCars[i];
            const carState = car.getState();
            carState.gap = '';
            carState.gapToAhead = '';

            if (i === 0) {
                carState.gap = 'LEADER';
                carState.gapToAhead = 'LEADER';
                leaderCarState = carState;
            } else {
                // Calculate gap to leader
                let gapToLeaderSeconds = 0;
                if (leaderCarState.status === CarStatus.FINISHED) {
                    if (carState.status === CarStatus.FINISHED) {
                        gapToLeaderSeconds = carState.finishTime - leaderCarState.finishTime;
                    } else if (carState.status === CarStatus.DNF_CRASH || carState.status === CarStatus.DNF_MECHANICAL) {
                        // DNF car behind a finished leader - large, indeterminate gap.
                        gapToLeaderSeconds = 9999; 
                    } else { // carState is RACING or PIT_STOP
                        const distanceRemainingForCar = leaderCarState.totalDistance - carState.totalDistance;
                        const effectiveSpeedCar = Math.max(carState.speed, 0.1);
                        gapToLeaderSeconds = leaderCarState.finishTime - this.raceTime + (distanceRemainingForCar / effectiveSpeedCar);
                    }
                } else { // Leader is not finished (RACING or PIT_STOP or DNF but somehow still first)
                    if (leaderCarState.status === CarStatus.DNF_CRASH || leaderCarState.status === CarStatus.DNF_MECHANICAL) {
                         // Leader is DNF, gap calculations are less meaningful for active cars
                         gapToLeaderSeconds = 9999;
                    } else { // Leader is RACING or PIT_STOP
                        const distanceGap = leaderCarState.totalDistance - carState.totalDistance;
                        const effectiveSpeedCar = Math.max(carState.speed, 0.1);
                        gapToLeaderSeconds = distanceGap / effectiveSpeedCar;
                    }
                }

                if (gapToLeaderSeconds > 0) {
                    carState.gap = `+${gapToLeaderSeconds.toFixed(1)}s`;
                } else if (gapToLeaderSeconds < 0) {
                    carState.gap = `-${Math.abs(gapToLeaderSeconds).toFixed(1)}s`;
                } else {
                    carState.gap = '0.0s';
                }

                // Calculate gap to car immediately ahead
                const carAhead = sortedCars[i - 1];
                let gapToCarAheadSeconds = 0;

                if (car.status === CarStatus.FINISHED && carAhead.status === CarStatus.FINISHED) {
                    gapToCarAheadSeconds = car.finishTime - carAhead.finishTime;
                } else if (carAhead.status === CarStatus.FINISHED) {
                    if (car.status === CarStatus.DNF_CRASH || car.status === CarStatus.DNF_MECHANICAL) {
                        gapToCarAheadSeconds = 9999; // DNF car behind finished car
                    } else { // car is RACING or PIT_STOP
                        const distanceToCover = carAhead.totalDistance - car.totalDistance;
                        const effectiveSpeedCar = Math.max(car.speed, 0.1);
                        gapToCarAheadSeconds = (this.raceTime - carAhead.finishTime) + (distanceToCover / effectiveSpeedCar);
                    }
                } else if (car.status === CarStatus.DNF_CRASH || car.status === CarStatus.DNF_MECHANICAL) {
                    if (carAhead.status === CarStatus.DNF_CRASH || carAhead.status === CarStatus.DNF_MECHANICAL) {
                        gapToCarAheadSeconds = car.dnfTime - carAhead.dnfTime;
                    } else { // carAhead is RACING or PIT_STOP
                        gapToCarAheadSeconds = 9999; // DNF car behind active car
                    }
                }
                else { // Both car and carAhead are RACING or PIT_STOP
                    const distanceDiff = carAhead.totalDistance - car.totalDistance;
                    const effectiveSpeedCar = Math.max(car.speed, 0.1);
                    gapToCarAheadSeconds = distanceDiff / effectiveSpeedCar;
                }

                if (gapToCarAheadSeconds > 0) {
                    carState.gapToAhead = `+${gapToCarAheadSeconds.toFixed(1)}s`;
                } else if (gapToCarAheadSeconds < 0) {
                    carState.gapToAhead = `-${Math.abs(gapToCarAheadSeconds).toFixed(1)}s`;
                } else {
                    carState.gapToAhead = '0.0s';
                }
            }
            carStatesWithGaps.push(carState);
        }
        this.leaderboard = carStatesWithGaps;
    }

    /**
     * Handle collision between two cars
     * @private
     */
    _handleCollision(collision) {
        // This method is no longer called as collision detection was removed.
        // DNF/Crashes are now handled probabilistically in CarController._checkDNF and handled in _physicsUpdate.
    }

    /**
     * Deploy a caution flag
     * @private
     */
    _deployCaution() {
        if (this.isCaution || this.state !== RaceState.RACING) return;
        
        this.isCaution = true;
        this.cautionTimer = PHYSICS_CONFIG.CAUTION_MIN_DURATION + 
                            Math.random() * (PHYSICS_CONFIG.CAUTION_MAX_DURATION - PHYSICS_CONFIG.CAUTION_MIN_DURATION);

        this._addEvent(EventType.YELLOW_FLAG, {
            message: 'Caution! Safety Car deployed.',
            time: this.raceTime
        });
    }

    /**
     * Update caution timer and state
     * @private
     */
    _updateCaution(deltaTime) {
        if (!this.isCaution) return;

        this.cautionTimer -= deltaTime;

        if (this.cautionTimer <= 0) {
            this.isCaution = false;
            this._addEvent(EventType.CAUTION_END, {
                message: 'Green flag! Caution period ends.',
                time: this.raceTime
            });
            // Give all racing cars a small speed boost to accelerate after caution
            this.cars.forEach(car => {
                if (car.status === CarStatus.RACING) {
                    car.speed = PHYSICS_CONFIG.BASE_SPEED;
                }
            });
        }
    }

    /**
     * Check if race is complete
     * @private
     */
    _checkRaceCompletion() {
        const finishingCarsThisFrame = [];

        for (const car of this.cars) {
            if (car.status === CarStatus.RACING && car.currentLap >= this.totalLaps) {
                // Set status and provisional finish time immediately
                car.status = CarStatus.FINISHED;
                car.finishTime = this.raceTime; // Current race time

                // Store car with its state at the moment of finishing for precise time calculation
                finishingCarsThisFrame.push({
                    car: car,
                    raceTimeAtFinish: this.raceTime,
                    waypointProgressAtFinish: car.waypointProgress,
                    speedAtFinish: car.speed
                });
            }
        }

        // If there are cars that finished this frame, process them
        if (finishingCarsThisFrame.length > 0) {
            // Calculate precise finish time for each car
            for (const item of finishingCarsThisFrame) {
                const { car, raceTimeAtFinish, waypointProgressAtFinish, speedAtFinish } = item;
                
                // Ensure speed is not zero or too small to avoid division errors
                const effectiveSpeed = Math.max(speedAtFinish, 0.01); 
                
                // Calculate precise finish time as per instruction: raceTime - ((1 - waypointProgress) / speed)
                // This formula aims to backtrack the finish time based on how far past the line the car is.
                item.preciseFinishTime = raceTimeAtFinish - ((1 - waypointProgressAtFinish) / effectiveSpeed);
            }

            // Sort by precise finish time in ascending order (lower time means finished earlier)
            finishingCarsThisFrame.sort((a, b) => a.preciseFinishTime - b.preciseFinishTime);

            // Assign positions and add to finishedCars in the sorted order
            for (const item of finishingCarsThisFrame) {
                const car = item.car;
                const position = this.finishedCars.length + 1; // Global race position

                this.finishedCars.push(car);
                car.position = position; // Update car's final position
                car.finishTime = item.preciseFinishTime; // Update car's finishTime with the precise value

                this._addEvent(EventType.RACE_FINISH, {
                    message: `${car.driver.name} finishes in P${position}!`,
                    driver: car.driver.name,
                    position: position,
                    time: item.preciseFinishTime // Use the precise finishTime for event log
                });
            }
        }

        // Check if race is over (all cars finished or DNF'd)
        const activeCars = this.cars.filter(c =>
            c.status === CarStatus.RACING || c.status === CarStatus.PIT_STOP
        ).length;

        if (activeCars === 0) {
            this.state = RaceState.FINISHED;
        }
    }

    /**
     * Add event to race log
     * @private
     */
    _addEvent(type, data) {
        this.events.push({
            type,
            ...data,
            timestamp: this.raceTime
        });

        // Keep only last 50 events for performance
        if (this.events.length > 50) {
            this.events.shift();
        }
    }

    /**
     * Use a burner phone contact
     */
    useBurnerPhone(contactType, targetDriverName) {
        const targetCar = this.cars.find(c => c.driver.name === targetDriverName);

        if (!targetCar) {
            return { success: false, reason: 'Driver not found' };
        }

        const result = this.burnerPhone.useContact(
            contactType,
            targetCar,
            this.cars,
            this.raceTime,
            this
        );

        if (result.success) {
            this._addEvent(EventType.CONTACT_USED, {
                message: result.effect,
                contactType,
                target: targetDriverName,
                time: this.raceTime
            });
        }

        return result;
    }

    /**
     * Get current race state for rendering
     */
    getRaceState() {
        return {
            state: this.state,
            raceTime: this.raceTime,
            currentLap: Math.max(...this.cars.map(c => c.currentLap), 0),
            totalLaps: this.totalLaps,
            leaderboard: this.leaderboard,
            events: this.events.slice(-10), // Last 10 events
            burnerPhone: this.burnerPhone.getStatus(),
            carsRacing: this.cars.filter(c => c.status === CarStatus.RACING).length,
            carsFinished: this.finishedCars.length,
            carsDNF: this.cars.filter(c =>
                c.status === CarStatus.DNF_CRASH || c.status === CarStatus.DNF_MECHANICAL
            ).length
        };
    }

    /**
     * Get final race results
     */
    getResults() {
        if (this.state !== RaceState.FINISHED) {
            return null;
        }

        return {
            finalStandings: this.leaderboard,
            winner: this.leaderboard[0],
            totalTime: this.raceTime,
            totalEvents: this.events.length,
            dnfCount: this.cars.filter(c =>
                c.status === CarStatus.DNF_CRASH || c.status === CarStatus.DNF_MECHANICAL
            ).length
        };
    }

    /**
     * Get cars for rendering (interpolated positions)
     */
    getCarsForRender(interpolationFactor = 1.0) {
        return this.cars.map(car => {
            const state = car.getState();

            // Add interpolation for smoother visuals
            // (Can be enhanced with velocity-based prediction)

            return state;
        });
    }
}

// ============================================================================
// DRAG RACE SIMULATOR CLASS
// ============================================================================
class DragRaceSimulator {
    constructor(drivers, track, leagueTier = 1) {
        this.drivers = drivers; // All drivers in the bracket (e.g., 8)
        this.track = track;     // The drag strip track
        this.leagueTier = leagueTier;

        this.state = RaceState.PRE_RACE;
        this.raceTime = 0; // Total time spent in DragRaceSimulator
        this.updateRate = 1 / 60; // 60 updates per second
        this.accumulatedTime = 0;

        this.currentRound = 0;
        this.currentHeatIndex = 0; // Index of the heat within the current round
        this.bracket = []; // Stores driver matchups for each round
        this.roundWinners = [];
        this.champion = null;

        // Current heat simulation state
        this.heatState = null; // { driver1, driver2, car1, car2, carPositions: [{x,y}, {x,y}], heatWinner, heatFinished, heatRaceTime }
        this.heatSimulationDuration = 3.0; // Simulated duration of a single heat (e.g., 3 seconds for 1/4 mile)
        this.heatSimulationTimer = 0;

        // Drag Tree / Start Light state
        this.startLightState = 'OFF'; // 'OFF', 'YELLOW1', 'YELLOW2', 'YELLOW3', 'GREEN', 'RED'
        this.startLightTimer = 0;
        this.DRAG_TREE_DELAY_YELLOW = 0.6; // Time each yellow light stays on
        this.DRAG_TREE_DELAY_GREEN = 0.5; // Time green light shows before cars move

        // Track positions for a drag strip for car movement
        // Assuming a normalized track segment for linear progress
        this.DRAG_DISTANCE = 1200; // Units, e.g., meters. Increased to make the track feel longer.

        // Physics for each car in the heat (simplified CarController)
        this._carPhysics = new Map(); // Map to hold CarController instances for the current heat

        this._initializeBracket();
    }

    _initializeBracket() {
        // For an 8-car bracket (drivers array assumed to be 8)
        // Round 1: 4 heats, 4 winners
        // Round 2 (Semi-Finals): 2 heats, 2 winners
        // Round 3 (Finals): 1 heat, 1 winner

        // Shuffle drivers for fair matchups
        const shuffledDrivers = [...this.drivers].sort(() => 0.5 - Math.random());

        // Initial seeding for Round 1 heats (e.g., 8 drivers -> 4 heats)
        // Each element in `bracket` array represents a round's matchups
        // `bracket[0]` = drivers for Round 1
        // `bracket[1]` = drivers for Round 2 (winners of Round 1)
        // `bracket[2]` = drivers for Round 3 (winners of Round 2)
        // `bracket[3]` = champion (winner of Round 3)
        this.bracket = [
            shuffledDrivers, // Round 1 participants
            [],              // Round 2 participants
            [],              // Round 3 participants
            []               // Champion
        ];
    }

    start() {
        this.state = RaceState.PRE_HEAT; // Start in pre-heat state to allow setup
        this.raceTime = 0;
        this.currentRound = 1; // Start with Round 1
        this.currentHeatIndex = 0; // Start with the first heat of Round 1
        this._carPhysics.clear(); // Clear any previous car physics instances

        this._setupNextHeat(); // Prepare the first heat

        console.log(`Drag Race started! Round ${this.currentRound}`);
    }

    _setupNextHeat() {
        if (this.champion) {
            this.state = RaceState.FINISHED;
            return;
        }

        const driversInRound = this.bracket[this.currentRound - 1];

        // If no more drivers in this round, advance round or finish race
        if (!driversInRound || driversInRound.length === 0 || this.currentHeatIndex * 2 >= driversInRound.length) {
            this._advanceRound();
            if (this.champion) return; // If advancing round resulted in a champion
            
            // If new round was set up and has drivers, then setup its first heat
            if (this.bracket[this.currentRound - 1] && this.bracket[this.currentRound - 1].length > 0) {
                 return this._setupNextHeat(); // Setup heat for the new round
            } else {
                // If there are no more rounds or drivers left, it means the bracket is finished
                this.state = RaceState.FINISHED;
                return;
            }
        }

        // Get the two drivers for the current heat
        const driver1 = driversInRound[this.currentHeatIndex * 2];
        const driver2 = driversInRound[this.currentHeatIndex * 2 + 1];

        // Handle bye (should not happen in 8-car bracket unless logic error)
        if (!driver1 || !driver2) {
            // This is a bye, advance driver1 automatically if only one exists
            if (driver1) {
                this.roundWinners.push(driver1);
                console.log(`Heat: ${driver1.name} has a bye and advances.`);
            }
            this.currentHeatIndex++;
            return this._setupNextHeat(); // Setup next heat
        }

        // Create simplified CarController instances for these two drivers
        const car1 = new CarController(driver1.id, driver1, 0, this.track); 
        const car2 = new CarController(driver2.id, driver2, 1, this.track); 

        this._carPhysics.set(car1.id, car1);
        this._carPhysics.set(car2.id, car2);

        // Calculate target ET based on stats (8-10s range)
        // Stats usually range 50-95. We map ~50->10s and ~100->8s.
        // Use topSpeed and aggression (proxy for acceleration/launch)
        const stats1 = (driver1.stats.topSpeed + driver1.stats.aggression) / 2;
        const stats2 = (driver2.stats.topSpeed + driver2.stats.aggression) / 2;
        
        // Map: 12.0 - (stat / 100 * 4.0). 
        // 50 => 12 - 2 = 10.0s
        // 100 => 12 - 4 = 8.0s
        const baseET1 = 12.0 - (Math.max(50, Math.min(100, stats1)) / 100) * 4.0;
        const baseET2 = 12.0 - (Math.max(50, Math.min(100, stats2)) / 100) * 4.0;

        // Add variance (+/- 0.25s) for close racing
        const et1 = baseET1 + (Math.random() * 0.5 - 0.25);
        const et2 = baseET2 + (Math.random() * 0.5 - 0.25);

        // The actual duration of the animation will be heatSimulationDuration
        // We'll use these theoretical times to determine the actual winner when simulation finishes
        this.heatState = {
            driver1: driver1,
            driver2: driver2,
            car1: car1, // CarController instances for animation
            car2: car2,
            carPositions: [{ x: 0, y: 0 }, { x: 0, y: 0 }], // Normalized progress 0-1
            actualFinishTime1: et1,
            actualFinishTime2: et2,
            heatWinner: null,
            heatFinished: false,
            heatRaceTime: 0,
            animationProgress: 0, // 0-1 progress of the visual animation
            car1Started: false,
            car2Started: false,
            reactionTime1: Math.random() * 0.15 + 0.05, // 0.05s to 0.20s reaction
            reactionTime2: Math.random() * 0.15 + 0.05,
            falseStart1: false,
            falseStart2: false
        };
        this.heatSimulationTimer = 0;
        this.startLightState = 'OFF';
        this.startLightTimer = 0;
        this.state = RaceState.PRE_HEAT;

        console.log(`Setting up Round ${this.currentRound}, Heat ${this.currentHeatIndex + 1}: ${driver1.name} (ET:${et1.toFixed(3)}) vs ${driver2.name} (ET:${et2.toFixed(3)})`);
    }

    _advanceRound() {
        // If there are winners from the current round
        if (this.roundWinners.length > 0) {
            // Check if this was the final round (only one winner expected)
            const expectedWinnersForNextRound = Math.ceil(this.bracket[this.currentRound - 1].length / 2);

            if (this.roundWinners.length === 1 && this.currentRound === Math.ceil(Math.log2(this.drivers.length))) {
                // This means the final heat has been run, and we have a champion
                this.champion = this.roundWinners[0];
                this.state = RaceState.FINISHED;
                console.log(`Drag Race Finished! Champion: ${this.champion.name}`);
                return;
            } else if (this.roundWinners.length > 0) { // If there are winners, but not the champion yet
                this.bracket[this.currentRound] = [...this.roundWinners]; // Promote winners to next round
                this.roundWinners = []; // Clear current round winners
                this.currentRound++; // Advance to next round
                this.currentHeatIndex = 0; // Reset heat index for the new round
                console.log(`Advancing to Drag Race Round ${this.currentRound}`);
            }
        } else {
            // This case might happen if _advanceRound is called but no heats were run
            // or if the initial setup has fewer than 2 drivers for a heat.
            // In a perfectly balanced bracket, this path should not be frequently hit
            console.warn("DragRaceSimulator: _advanceRound called with no winners to promote.");
        }
    }

    _runHeat(driver1, driver2) {
        // Simplified drag race simulation: determine winner based on stats, primarily topSpeed and some randomness
        // We'll simulate a "race" over a fixed distance for a simplified win/loss.
        
        // Simulating 1/4 mile drag (approximate)
        const DRAG_DISTANCE = 400; // units (e.g., meters)

        // Calculate a "finish time" based on top speed and a bit of aggression/reliability for variance
        // Drivers have 'stats' property
        const time1 = DRAG_DISTANCE / (driver1.stats.topSpeed * (1 + driver1.stats.aggression/200) + (Math.random() * 20 - 10));
        const time2 = DRAG_DISTANCE / (driver2.stats.topSpeed * (1 + driver2.stats.aggression/200) + (Math.random() * 20 - 10));

        // The driver with the lower time wins
        return time1 < time2 ? driver1 : driver2;
    }

    update(deltaTime) {
        this.raceTime += deltaTime;
        this.accumulatedTime += deltaTime;

        if (this.state === RaceState.FINISHED) return;

        // Update Start Lights
        if (this.state === RaceState.PRE_HEAT) {
            this.startLightTimer += deltaTime;

            if (this.startLightState === 'OFF' && this.startLightTimer > 1.0) {
                this.startLightState = 'YELLOW1';
                this.startLightTimer = 0;
            } else if (this.startLightState === 'YELLOW1' && this.startLightTimer > this.DRAG_TREE_DELAY_YELLOW) {
                this.startLightState = 'YELLOW2';
                this.startLightTimer = 0;
            } else if (this.startLightState === 'YELLOW2' && this.startLightTimer > this.DRAG_TREE_DELAY_YELLOW) {
                this.startLightState = 'YELLOW3';
                this.startLightTimer = 0;
            } else if (this.startLightState === 'YELLOW3' && this.startLightTimer > this.DRAG_TREE_DELAY_YELLOW) {
                this.startLightState = 'GREEN';
                this.startLightTimer = 0;
                this.state = RaceState.RACING;
                // Set reaction times here if we want to be precise, but we simulated them in setup
            }
        }

        // Update Racing Logic
        if (this.state === RaceState.RACING && this.heatState) {
            this.heatState.heatRaceTime += deltaTime;

            // Update Car 1
            // Movement logic: x = 0.5 * a * t^2
            // We know TargetTime (ET). So x = D * (t / ET)^2
            // We account for reaction time: t_run = time - reaction
            if (!this.heatState.car1Finished) {
                const timeRun = Math.max(0, this.heatState.heatRaceTime - this.heatState.reactionTime1);
                if (timeRun > 0) {
                    // Quadratic acceleration curve
                    const progress = Math.pow(timeRun / this.heatState.actualFinishTime1, 2);
                    this.heatState.car1.currentWaypoint = Math.min(progress, 1.0) * this.DRAG_DISTANCE;
                    
                    if (progress >= 1.0) {
                        this.heatState.car1.currentWaypoint = this.DRAG_DISTANCE;
                        this.heatState.car1Finished = true;
                        this.heatState.car1ET = this.heatState.actualFinishTime1;
                    }
                }
            }

            // Update Car 2
            if (!this.heatState.car2Finished) {
                const timeRun = Math.max(0, this.heatState.heatRaceTime - this.heatState.reactionTime2);
                if (timeRun > 0) {
                    const progress = Math.pow(timeRun / this.heatState.actualFinishTime2, 2);
                    this.heatState.car2.currentWaypoint = Math.min(progress, 1.0) * this.DRAG_DISTANCE;
                    
                    if (progress >= 1.0) {
                        this.heatState.car2.currentWaypoint = this.DRAG_DISTANCE;
                        this.heatState.car2Finished = true;
                        this.heatState.car2ET = this.heatState.actualFinishTime2;
                    }
                }
            }

            // Check for Heat Finish
            if (this.heatState.car1Finished && this.heatState.car2Finished) {
                this.state = RaceState.HEAT_FINISHED;
                
                // Determine Winner based on Total Time (Reaction + ET)
                const totalTime1 = this.heatState.reactionTime1 + this.heatState.car1ET;
                const totalTime2 = this.heatState.reactionTime2 + this.heatState.car2ET;

                if (totalTime1 < totalTime2) {
                    this.heatState.heatWinner = this.heatState.driver1;
                    this.roundWinners.push(this.heatState.driver1);
                } else {
                    this.heatState.heatWinner = this.heatState.driver2;
                    this.roundWinners.push(this.heatState.driver2);
                }
                this.heatState.heatFinished = true;
                
                // Log result
                console.log(`Heat Finished! Winner: ${this.heatState.heatWinner.name}`);
                console.log(`  ${this.heatState.driver1.name}: ${totalTime1.toFixed(3)}s (R:${this.heatState.reactionTime1.toFixed(3)} + E:${this.heatState.car1ET.toFixed(3)})`);
                console.log(`  ${this.heatState.driver2.name}: ${totalTime2.toFixed(3)}s (R:${this.heatState.reactionTime2.toFixed(3)} + E:${this.heatState.car2ET.toFixed(3)})`);
            }
        }

        // Handle Heat Transition
        if (this.state === RaceState.HEAT_FINISHED) {
            this.heatSimulationTimer += deltaTime;
            if (this.heatSimulationTimer > 3.0) { // Wait 3 seconds before next heat
                this.currentHeatIndex++;
                this._setupNextHeat();
            }
        }
    }

    getRaceState() {
        return {
            state: this.state,
            currentRound: this.currentRound,
            bracket: this.bracket,
            roundWinners: this.roundWinners,
            champion: this.champion,
            heatState: this.heatState,
            startLightState: this.startLightState,
            DRAG_DISTANCE: this.DRAG_DISTANCE
        };
    }

    getResults() {
        if (this.state !== RaceState.FINISHED) {
            return null;
        }
        return {
            finalStandings: [this.champion], // For now, just the champion
            winner: this.champion,
            totalTime: this.raceTime, 
            totalEvents: 0,
            dnfCount: 0
        };
    }
}


export { RaceSimulator, DragRaceSimulator, RacingPhysics };
