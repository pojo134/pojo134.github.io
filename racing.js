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

const RaceState = Object.freeze({
    PRE_RACE: 'PRE_RACE',
    RACING: 'RACING',
    FINISHED: 'FINISHED'
});

const CarStatus = Object.freeze({
    RACING: 'RACING',
    DNF_CRASH: 'DNF_CRASH',
    DNF_MECHANICAL: 'DNF_MECHANICAL',
    FINISHED: 'FINISHED'
});

const EventType = Object.freeze({
    RACE_START: 'RACE_START',
    OVERTAKE: 'OVERTAKE',
    CRASH: 'CRASH',
    MECHANICAL_FAILURE: 'MECHANICAL_FAILURE',
    YELLOW_FLAG: 'YELLOW_FLAG',
    LAP_COMPLETE: 'LAP_COMPLETE',
    RACE_FINISH: 'RACE_FINISH',
    CONTACT_USED: 'CONTACT_USED'
});

const ContactType = Object.freeze({
    SPOTTER: 'Spotter',
    MARSHAL: 'Marshal',
    HECKLER: 'Heckler',
    ENGINEER: 'Engineer'
});

// Physics constants
const PHYSICS_CONFIG = {
    BASE_SPEED: 100,              // Base speed units per second
    MIN_SPEED: 20,                // Minimum speed (crashed/damaged)
    MAX_SPEED: 300,               // Maximum achievable speed
    CORNERING_SLOWDOWN: 0.4,      // Speed reduction in corners (40%)
    DRAFTING_BOOST: 0.20,         // 20% speed boost when drafting
    DRAFTING_DISTANCE: 30,        // Distance threshold for drafting effect
    COLLISION_DISTANCE: 15,       // Distance for collision detection
    OVERTAKE_OFFSET: 25,          // How far cars move sideways to overtake
    STAMINA_DECAY_RATE: 0.015,    // Stamina loss per lap
    WEATHER_RAIN_PENALTY: 0.35,   // Rain reduces cornering by 35%
    DNF_BASE_CHANCE: 0.002,       // Base chance of DNF per update (0.2%)
    AGGRESSION_CRASH_MULT: 0.8,   // High aggression increases crash chance
    RELIABILITY_DNF_MULT: 1.2     // Low reliability increases DNF chance
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
 * Calculate curvature at a waypoint (for cornering detection)
 */
function calculateCurvature(prev, current, next) {
    const angle1 = angleBetween(prev.x, prev.y, current.x, current.y);
    const angle2 = angleBetween(current.x, current.y, next.x, next.y);

    let angleDiff = Math.abs(angle2 - angle1);
    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

    return angleDiff;
}

// ============================================================================
// RACING PHYSICS CLASS
// ============================================================================

class RacingPhysics {
    constructor(track) {
        this.track = track;
        this.waypoints = track.waypoints;
        this.weather = track.weather;

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

            curvatures.push(calculateCurvature(prev, curr, next));
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
        let baseSpeed;
        if (isOnStraight) {
            baseSpeed = (stats.topSpeed * 0.7 + stats.cornering * 0.3) / 100;
        } else {
            baseSpeed = (stats.cornering * 0.7 + stats.topSpeed * 0.3) / 100;
        }

        return PHYSICS_CONFIG.BASE_SPEED * baseSpeed;
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
}

// ============================================================================
// CAR CONTROLLER CLASS
// ============================================================================

class CarController {
    constructor(id, driver, startingPosition, track) {
        this.id = id;
        this.driver = driver;
        this.startingPosition = startingPosition;
        this.teamColor = driver.teamColor;

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

        // Status
        this.status = CarStatus.RACING;
        this.position = startingPosition;
        this.finishTime = null;

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
        if (this.status !== CarStatus.RACING) return;

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

        // Check for DNF
        this._checkDNF(physics);
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
            const nextWPIndex = (this.currentWaypoint + 1) % physics.waypoints.length;
            const nextWP = physics.waypoints[nextWPIndex];

            // Add overtake offset
            const targetX = lerp(currentWP.x, nextWP.x, this.waypointProgress) + this.overtakeOffset;
            const targetY = lerp(currentWP.y, nextWP.y, this.waypointProgress);

            const distToNext = distance(this.x, this.y, targetX, targetY);

            if (remainingDistance >= distToNext) {
                // Move to next waypoint
                this.x = targetX;
                this.y = targetY;
                this.currentWaypoint = nextWPIndex;
                this.waypointProgress = 0;
                remainingDistance -= distToNext;
                this.totalDistance += distToNext;

                // Check lap completion
                if (this.currentWaypoint === 0) {
                    this.currentLap++;
                }
            } else {
                // Move partway to next waypoint
                const progress = remainingDistance / distToNext;
                this.x += (targetX - this.x) * progress;
                this.y += (targetY - this.y) * progress;
                this.waypointProgress += progress;
                this.totalDistance += remainingDistance;
                remainingDistance = 0;
            }

            // Update heading
            this.heading = angleBetween(this.x, this.y,
                physics.waypoints[(this.currentWaypoint + 1) % physics.waypoints.length].x,
                physics.waypoints[(this.currentWaypoint + 1) % physics.waypoints.length].y
            );
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
                    if (this.currentLap >= 8) { // Last 25% of race (assumes ~10 lap race)
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
            finishTime: this.finishTime
        };
    }
}

// ============================================================================
// BURNER PHONE SYSTEM CLASS
// ============================================================================

class BurnerPhoneSystem {
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
    useContact(contactType, targetCar, allCars, raceTime) {
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
                // Yellow flag - slow all cars for 10 seconds
                for (const car of allCars) {
                    if (car.status === CarStatus.RACING) {
                        car.applyContactEffect('yellow_flag', contact.duration);
                        car.speed *= 0.5; // Immediate slowdown
                    }
                }
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

        // Initialize systems
        this.physics = new RacingPhysics(track);
        this.burnerPhone = new BurnerPhoneSystem();

        // Initialize cars
        this.cars = drivers.map((driver, index) =>
            new CarController(index, driver, driver.startingPosition || (index + 1), track)
        );

        // Race events log
        this.events = [];

        // Leaderboard
        this.leaderboard = [];
        this.finishedCars = [];

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

        this._addEvent(EventType.RACE_START, {
            message: 'Race started!',
            time: 0
        });
    }

    /**
     * Update race simulation (call this every frame)
     */
    update(deltaTime) {
        if (this.state !== RaceState.RACING) return;

        // Fixed timestep for deterministic physics
        this.accumulatedTime += deltaTime;

        while (this.accumulatedTime >= this.updateRate) {
            this._physicsUpdate(this.updateRate);
            this.accumulatedTime -= this.updateRate;
        }

        // Update burner phone heat decay
        this.burnerPhone.update(deltaTime);
    }

    /**
     * Fixed timestep physics update
     * @private
     */
    _physicsUpdate(deltaTime) {
        this.raceTime += deltaTime;

        // Update all cars
        for (const car of this.cars) {
            car.update(deltaTime, this.physics, this.cars);
        }

        // Detect collisions
        const collisions = this.physics.detectCollisions(this.cars);
        for (const collision of collisions) {
            this._handleCollision(collision);
        }

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
        // Sort cars by lap and track progress
        const sortedCars = [...this.cars]
            .filter(car => car.status === CarStatus.RACING || car.status === CarStatus.FINISHED)
            .sort((a, b) => {
                // First by lap
                if (a.currentLap !== b.currentLap) {
                    return b.currentLap - a.currentLap;
                }

                // Then by waypoint
                if (a.currentWaypoint !== b.currentWaypoint) {
                    return b.currentWaypoint - a.currentWaypoint;
                }

                // Then by progress to next waypoint
                return b.waypointProgress - a.waypointProgress;
            });

        // Detect overtakes
        for (let i = 0; i < sortedCars.length; i++) {
            const car = sortedCars[i];
            const oldPosition = car.position;
            const newPosition = i + 1;

            if (oldPosition !== newPosition && car.status === CarStatus.RACING) {
                // Prevent overtake spam (only log if significant time has passed)
                const lastOvertakeTime = this.lastOvertakes.get(car.id) || 0;

                if (this.raceTime - lastOvertakeTime > 1.0) { // 1 second cooldown
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

            car.position = newPosition;
        }

        // Update leaderboard
        this.leaderboard = sortedCars.map(car => car.getState());
    }

    /**
     * Handle collision between two cars
     * @private
     */
    _handleCollision(collision) {
        const { car1, car2 } = collision;

        // Small chance of crash on collision
        const crashChance = 0.05; // 5% per collision

        if (Math.random() < crashChance) {
            // Randomly choose which car crashes (or both)
            const bothCrash = Math.random() < 0.3;

            if (bothCrash || Math.random() < 0.5) {
                car1.status = CarStatus.DNF_CRASH;
                this._addEvent(EventType.CRASH, {
                    message: `${car1.driver.name} crashes out!`,
                    driver: car1.driver.name,
                    position: car1.position,
                    time: this.raceTime
                });
            }

            if (bothCrash || car1.status !== CarStatus.DNF_CRASH) {
                car2.status = CarStatus.DNF_CRASH;
                this._addEvent(EventType.CRASH, {
                    message: `${car2.driver.name} crashes out!`,
                    driver: car2.driver.name,
                    position: car2.position,
                    time: this.raceTime
                });
            }
        } else {
            // Minor slowdown for both cars
            car1.speed *= 0.95;
            car2.speed *= 0.95;
        }
    }

    /**
     * Check if race is complete
     * @private
     */
    _checkRaceCompletion() {
        for (const car of this.cars) {
            if (car.status === CarStatus.RACING && car.currentLap >= this.totalLaps) {
                car.finish(this.raceTime);
                this.finishedCars.push(car);

                const position = this.finishedCars.length;

                this._addEvent(EventType.RACE_FINISH, {
                    message: `${car.driver.name} finishes in P${position}!`,
                    driver: car.driver.name,
                    position: position,
                    time: this.raceTime
                });

                // Check if race is over (all cars finished or DNF'd)
                const activeCars = this.cars.filter(c =>
                    c.status === CarStatus.RACING
                ).length;

                if (activeCars === 0) {
                    this.state = RaceState.FINISHED;
                }
            }
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
            this.raceTime
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
// EXPORTS
// ============================================================================

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RacingPhysics,
        RaceSimulator,
        CarController,
        BurnerPhoneSystem,
        RaceState,
        CarStatus,
        EventType,
        ContactType
    };
}
