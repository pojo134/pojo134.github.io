import Track from '../models/track.js';

/**
 * REDLINE ROULETTE - PROCEDURAL GENERATION SYSTEMS
 *
 * This file contains all procedural generation logic for drivers, tracks,
 * odds calculation, and season structure.
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a random integer between min and max (inclusive)
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random float between min and max
 */
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random element from an array
 */
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates a normally distributed random number using Box-Muller transform
 * Used for more realistic stat distributions
 */
function randomNormal(mean, stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
}

/**
 * Clamps a value between min and max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// ============================================================================
// DRIVER GENERATOR CLASS
// ============================================================================

class DriverGenerator {
    constructor() {
        // Name generation data
        this.firstNames = [
            "Alex", "Jordan", "Casey", "Morgan", "Taylor",
            "Jamie", "Riley", "Quinn", "Cameron", "Avery",
            "Skyler", "Dakota", "River", "Sage", "Phoenix",
            "Remi", "Charlie", "Blake", "Drew", "Ash",
            "Kai", "Logan", "Sam", "Max", "Reese",
            "Nico", "Jules", "Ellis", "Hayden", "Lennox",
            "Marco", "Dante", "Zeke", "Cruz", "Jax",
            "Ryder", "Colt", "Blaze", "Ace", "Duke"
        ];

        this.lastNames = [
            "Anderson", "Martinez", "Johnson", "Garcia", "Lee",
            "Williams", "Brown", "Davis", "Miller", "Wilson",
            "Moore", "Taylor", "Jackson", "White", "Harris",
            "Martin", "Thompson", "Young", "King", "Wright",
            "Lopez", "Hill", "Scott", "Green", "Adams",
            "Baker", "Nelson", "Carter", "Mitchell", "Perez",
            "Roberts", "Turner", "Phillips", "Campbell", "Parker",
            "Evans", "Edwards", "Collins", "Stewart", "Sanchez",
            "Morris", "Rogers", "Reed", "Cook", "Morgan",
            "Bell", "Murphy", "Bailey", "Rivera", "Cooper",
            "Richardson", "Cox", "Howard", "Ward", "Torres",
            "Peterson", "Gray", "Ramirez", "James", "Watson"
        ];

        // Hidden traits with gameplay effects
        this.hiddenTraits = [
            {
                name: "Rain Master",
                description: "+25% cornering in rain",
                rarity: 0.15
            },
            {
                name: "Choker",
                description: "-15% all stats when leading",
                rarity: 0.10
            },
            {
                name: "Closer",
                description: "+20% stamina in final laps",
                rarity: 0.15
            },
            {
                name: "Vendetta",
                description: "Targets specific rival aggressively",
                rarity: 0.12
            },
            {
                name: "Ice Cold",
                description: "Immune to pressure/contacts",
                rarity: 0.08
            },
            {
                name: "Hot Head",
                description: "+30% aggression after contact",
                rarity: 0.12
            },
            {
                name: "Draft King",
                description: "+15% speed when drafting",
                rarity: 0.10
            },
            {
                name: "Lone Wolf",
                description: "+10% all stats when alone",
                rarity: 0.10
            },
            {
                name: "Night Owl",
                description: "+20% awareness in night races",
                rarity: 0.12
            },
            {
                name: "Qualifying Hero",
                description: "+25% stats in qualifying only",
                rarity: 0.10
            },
            {
                name: "Comeback Kid",
                description: "+15% all stats when in bottom half",
                rarity: 0.12
            },
            {
                name: "Conservationist",
                description: "+20% reliability, -10% aggression",
                rarity: 0.15
            }
        ];

        // Team colors for drafting mechanics
        this.teamColors = [
            "#FF0000", // Red
            "#0000FF", // Blue
            "#00FF00", // Green
            "#FFFF00", // Yellow
            "#FF00FF", // Magenta
            "#00FFFF", // Cyan
            "#FF8800", // Orange
            "#8800FF", // Purple
            "#FFFFFF", // White
            "#808080"  // Gray
        ];

        this.usedNames = new Set();
    }

    /**
     * Generates a unique driver name
     */
    generateName() {
        let name;
        let attempts = 0;

        do {
            const first = randomChoice(this.firstNames);
            const last = randomChoice(this.lastNames);
            name = `${first} ${last}`;
            attempts++;

            // Prevent infinite loop if we run out of names
            if (attempts > 100) {
                name = `Driver ${randomInt(1000, 9999)}`;
                break;
            }
        } while (this.usedNames.has(name));

        this.usedNames.add(name);
        return name;
    }

    /**
     * Assigns hidden traits based on rarity
     */
    assignHiddenTraits() {
        const traits = [];

        // 70% chance to have at least one trait
        if (Math.random() < 0.70) {
            // Most drivers get 1 trait
            const availableTraits = [...this.hiddenTraits];
            const trait = this.selectTraitByRarity(availableTraits);
            if (trait) traits.push(trait);

            // 20% chance for a second trait
            if (Math.random() < 0.20) {
                const secondTrait = this.selectTraitByRarity(
                    availableTraits.filter(t => t !== trait)
                );
                if (secondTrait) traits.push(secondTrait);
            }
        }

        return traits;
    }

    /**
     * Selects a trait based on rarity weights
     */
    selectTraitByRarity(traits) {
        if (traits.length === 0) return null;

        const roll = Math.random();
        let cumulative = 0;

        for (const trait of traits) {
            cumulative += trait.rarity;
            if (roll <= cumulative) {
                return trait;
            }
        }

        return traits[traits.length - 1];
    }

    /**
     * Generates balanced driver stats
     * Uses normal distribution centered at different means based on tier
     */
    generateStats(tier = "balanced") {
        let baseMean, stdDev;

        // Different stat distributions for variety
        switch (tier) {
            case "elite":
                baseMean = 75;
                stdDev = 10;
                break;
            case "average":
                baseMean = 50;
                stdDev = 12;
                break;
            case "rookie":
                baseMean = 35;
                stdDev = 10;
                break;
            case "balanced":
            default:
                baseMean = 60;
                stdDev = 15;
                break;
        }

        // Generate base stats with normal distribution
        const topSpeed = clamp(Math.round(randomNormal(baseMean, stdDev)), 1, 100);
        const cornering = clamp(Math.round(randomNormal(baseMean, stdDev)), 1, 100);
        const aggression = clamp(Math.round(randomNormal(baseMean, stdDev)), 1, 100);
        const reliability = clamp(Math.round(randomNormal(baseMean, stdDev)), 1, 100);
        const stamina = clamp(Math.round(randomNormal(baseMean, stdDev)), 1, 100);

        // Balance adjustment: ensure no driver is perfect or terrible across all stats
        const total = topSpeed + cornering + aggression + reliability + stamina;
        const average = total / 5;

        // If average is too high or low, adjust
        let adjustmentFactor = 1.0;
        if (average > 85) {
            adjustmentFactor = 0.9; // Nerf overpowered drivers
        } else if (average < 25) {
            adjustmentFactor = 1.15; // Buff underpowered drivers
        }

        return {
            topSpeed: clamp(Math.round(topSpeed * adjustmentFactor), 1, 100),
            cornering: clamp(Math.round(cornering * adjustmentFactor), 1, 100),
            aggression: clamp(Math.round(aggression * adjustmentFactor), 1, 100),
            reliability: clamp(Math.round(reliability * adjustmentFactor), 1, 100),
            stamina: clamp(Math.round(stamina * adjustmentFactor), 1, 100)
        };
    }

    /**
     * Generates a complete driver
     */
    generateDriver(tier = "balanced", teamIndex = null) {
        const name = this.generateName();
        const stats = this.generateStats(tier);
        const traits = this.assignHiddenTraits();

        // Assign team color (for drafting mechanics)
        const teamColor = teamIndex !== null
            ? this.teamColors[teamIndex % this.teamColors.length]
            : randomChoice(this.teamColors);

        return {
            name,
            stats,
            traits,
            teamColor,
            overall: Math.round((stats.topSpeed + stats.cornering + stats.aggression +
                               stats.reliability + stats.stamina) / 5)
        };
    }

    /**
     * Generates a balanced field of drivers
     * Ensures competitive racing by mixing tiers
     */
    generateField(fieldSize = 20, leagueTier = 1) {
        this.usedNames.clear();
        const field = [];

        // Distribution of driver tiers for balanced racing
        // Higher leagues have more elite drivers
        let eliteCount, averageCount, rookieCount;

        switch (leagueTier) {
            case 1: // Tier 1 (Karts, Dirt)
                eliteCount = Math.floor(fieldSize * 0.15);
                averageCount = Math.floor(fieldSize * 0.60);
                rookieCount = fieldSize - eliteCount - averageCount;
                break;
            case 2: // Tier 2 (Legends, Stock)
                eliteCount = Math.floor(fieldSize * 0.25);
                averageCount = Math.floor(fieldSize * 0.55);
                rookieCount = fieldSize - eliteCount - averageCount;
                break;
            case 3: // Tier 3 (GT3, Open Wheel)
                eliteCount = Math.floor(fieldSize * 0.35);
                averageCount = Math.floor(fieldSize * 0.50);
                rookieCount = fieldSize - eliteCount - averageCount;
                break;
            case 4: // Tier 4 (Le Mans)
                eliteCount = Math.floor(fieldSize * 0.45);
                averageCount = Math.floor(fieldSize * 0.45);
                rookieCount = fieldSize - eliteCount - averageCount;
                break;
            default:
                eliteCount = Math.floor(fieldSize * 0.20);
                averageCount = Math.floor(fieldSize * 0.60);
                rookieCount = fieldSize - eliteCount - averageCount;
        }

        // Assign teams for drafting (typically 2-4 drivers per team)
        const teamsPerField = Math.ceil(fieldSize / 3);

        // Generate elite drivers
        for (let i = 0; i < eliteCount; i++) {
            const teamIndex = i % teamsPerField;
            field.push(this.generateDriver("elite", teamIndex));
        }

        // Generate average drivers
        for (let i = 0; i < averageCount; i++) {
            const teamIndex = i % teamsPerField;
            field.push(this.generateDriver("average", teamIndex));
        }

        // Generate rookie drivers
        for (let i = 0; i < rookieCount; i++) {
            const teamIndex = i % teamsPerField;
            field.push(this.generateDriver("rookie", teamIndex));
        }

        // Shuffle the field
        for (let i = field.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [field[i], field[j]] = [field[j], field[i]];
        }

        // Assign starting positions
        field.forEach((driver, index) => {
            driver.startingPosition = index + 1;
        });

        return field;
    }

    /**
     * Resets the name tracker (for new seasons)
     */
    reset() {
        this.usedNames.clear();
    }
}

import { Vec2, getSplinePoint, pointToSegmentDistance, intersect, checkCollision } from '../utils/utils.js';

// ============================================================================
// TRACK GENERATOR CLASS
// ============================================================================

class TrackGenerator {
    constructor() {
        this.trackTypes = [
            "Circuit",
            "Oval",
            "Tri-Oval",
            "Drag Strip"
        ];

        // Define track types available per league tier
        // These now refer to generic track styles (Circuit, Oval, Tri-Oval)
        this.tierTrackTypes = {
            1: ["Circuit", "Oval"], // Tier 1: Go-Karts (mostly circuits, some simple ovals)
            2: ["Circuit", "Oval", "Tri-Oval"], // Tier 2: Basic Ovals, Road Courses, Tri-Ovals
            3: ["Circuit", "Oval", "Tri-Oval"], // Tier 3: Advanced Ovals, Technical Road Courses, Street Circuits (all covered by Circuit/Oval/Tri-Oval now)
            4: ["Circuit", "Oval", "Tri-Oval"] // Tier 4: High-speed, high-skill tracks
        };
        // "Drag Strip" will be handled separately as a special event, not a general track type.

        this.weatherConditions = [
            { type: "Clear", probability: 0.60, gripModifier: 1.0 },
            { type: "Rain", probability: 0.25, gripModifier: 0.65 },
            { type: "Night", probability: 0.15, gripModifier: 1.0 }
        ];

        this.raceTypes = [
            { name: "Sprint Race", baseLaps: 10, pitRequired: false, driverCount: 12 },
            { name: "Endurance Event", baseLaps: 50, pitRequired: true, pitWindow: 0.5, driverCount: 20 },
            { name: "Feature Race", baseLaps: 25, pitRequired: false, driverCount: 16 }
        ];

        this.raceModifiers = [
            { name: "Rain Only", effect: { weather: "Rain" }, probability: 0.05 },
            { name: "Night Only", effect: { weather: "Night" }, probability: 0.05 },
            { name: "Mandatory Pit", effect: { pitRequired: true, pitWindow: 0.5 }, probability: 0.15 },
            { name: "Elimination", effect: { elimination: true }, probability: 0.01 }
        ];

        // League-specific track generation parameters
        this.leagueSettings = {
            'Go-Kart': {
                complexity: { min: 20, max: 40 },
                windiness: { min: 0.70, max: 0.80 },
                straightLength: { min: 75, max: 86 },
                trackStyle: 'circuit'
            },
            'GT': { // Represents typical "Road Course" for GT cars
                complexity: { min: 40, max: 50 },
                windiness: { min: 0.80, max: 0.90 },
                straightLength: { min: 65, max: 75 },
                trackStyle: 'circuit'
            },
            'LM': { // Represents "Le Mans" style endurance courses
                complexity: { min: 45, max: 50 },
                windiness: { min: 1.00, max: 1.10 },
                straightLength: { min: 60, max: 60 },
                trackStyle: 'circuit'
            },
            'Open Wheel': { // Could be circuits or ovals/tri-ovals
                complexity: { min: 55, max: 60 },
                windiness: { min: 1.10, max: 1.30 },
                straightLength: { min: 70, max: 70 },
                trackStyle: 'circuit', // Default, but with ovalChance
                ovalChance: 0.05 // 5% chance to be an oval or tri-oval
            },
            'Stock Car': { // Primarily ovals and tri-ovals
                trackStyle: 'oval', // Default, but with variation
                ovalVariation: true // Allows for oval or tri-oval selection within generateTrackForLeague
            },
            'Tri-Oval': { // Explicit Tri-Oval category
                complexity: { min: 45, max: 55 },
                windiness: { min: 0.7, max: 0.9 },
                straightLength: { min: 50, max: 70 },
                trackStyle: 'tri-oval'
            }
        };
    }

    /**
     * Advanced procedural track generation with collision detection and smoothing
     * @param {string} trackStyle - 'circuit', 'oval', or 'tri-oval'
     * @param {number} complexity - Target number of control points
     * @param {number} windiness - Chaos/displacement factor (0.0-2.0)
     * @param {number} minSegmentLen - Minimum segment length before subdivision
     * @param {number} trackWidth - Width of the track for collision detection
     * @param {number} width - Canvas width (default 800)
     * @param {number} height - Canvas height (default 600)
     * @returns {Array} Array of waypoint objects with x, y coordinates
     */
    _generateBaseProceduralTrack(trackStyle, complexity, windiness, minSegmentLen, trackWidth, width = 800, height = 600) {
        const center = new Vec2(width / 2, height / 2);
        let pts = [];

        // --- 1. Initial Geometry ---
        if (trackStyle === 'circuit') {
            const initialPoints = 15;
            const radius = Math.min(width, height) * 0.35;
            for (let i = 0; i < initialPoints; i++) {
                const angle = (i / initialPoints) * Math.PI * 2;
                pts.push(new Vec2(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius));
            }
        } else if (trackStyle === 'oval') {
            const rx = width * 0.35; const ry = height * 0.22;
            // Right Arc
            for(let i=0; i<4; i++) {
                const angle = -Math.PI/2 + (i/4)*Math.PI;
                pts.push(new Vec2(center.x + rx + Math.cos(angle)*ry, center.y + Math.sin(angle)*ry));
            }
            // Bottom
            pts.push(new Vec2(center.x + rx, center.y + ry));
            pts.push(new Vec2(center.x, center.y + ry));
            pts.push(new Vec2(center.x - rx, center.y + ry));
            // Left Arc
            for(let i=0; i<4; i++) {
                const angle = Math.PI/2 + (i/4)*Math.PI;
                pts.push(new Vec2(center.x - rx + Math.cos(angle)*ry, center.y + Math.sin(angle)*ry));
            }
            // Top
            pts.push(new Vec2(center.x - rx, center.y - ry));
            pts.push(new Vec2(center.x, center.y - ry));
            pts.push(new Vec2(center.x + rx, center.y - ry));

        } else if (trackStyle === 'tri-oval') {
            const turnRadius = height * 0.25;
            const straightOffset = width * 0.3;
            const triOvalDepth = height * 0.15;
            
            // 1. Backstretch (Top) - Left to Right
            // Start Turn 2 exit / Turn 3 entry
            pts.push(new Vec2(center.x - straightOffset, center.y - turnRadius));
            // Add midpoint for stability
            pts.push(new Vec2(center.x, center.y - turnRadius));
            pts.push(new Vec2(center.x + straightOffset, center.y - turnRadius));

            // 2. Turns 3 & 4 (Right) - Arc from -90 (Top) to 90 (Bottom)
            const rightTurnCenter = new Vec2(center.x + straightOffset, center.y);
            for (let i = 1; i <= 8; i++) {
                const angle = -Math.PI / 2 + (i / 8) * Math.PI; // -PI/2 to PI/2
                pts.push(new Vec2(
                    rightTurnCenter.x + Math.cos(angle) * turnRadius,
                    rightTurnCenter.y + Math.sin(angle) * turnRadius
                ));
            }

            // 3. Frontstretch (Tri-Oval) - Right to Left with V-shape
            // Start Turn 4 exit
            const startFront = new Vec2(center.x + straightOffset, center.y + turnRadius);
            const apex = new Vec2(center.x, center.y + turnRadius + triOvalDepth);
            const endFront = new Vec2(center.x - straightOffset, center.y + turnRadius);

            // Segment 1: Turn 4 to Apex
            // Add intermediate points for smoother V
            pts.push(startFront.add(apex.sub(startFront).mul(0.33)));
            pts.push(startFront.add(apex.sub(startFront).mul(0.66)));
            pts.push(apex);

            // Segment 2: Apex to Turn 1
            pts.push(apex.add(endFront.sub(apex).mul(0.33)));
            pts.push(apex.add(endFront.sub(apex).mul(0.66)));
            pts.push(endFront);

            // 4. Turns 1 & 2 (Left) - Arc from 90 (Bottom) to 270 (Top)
            const leftTurnCenter = new Vec2(center.x - straightOffset, center.y);
            for (let i = 1; i <= 8; i++) { // Start at 1 to avoid duplicate of endFront
                const angle = Math.PI / 2 + (i / 8) * Math.PI; // PI/2 to 3PI/2
                pts.push(new Vec2(
                    leftTurnCenter.x + Math.cos(angle) * turnRadius,
                    leftTurnCenter.y + Math.sin(angle) * turnRadius
                ));
            }
        }


        // --- 2. Iterative Subdivision ---
        const targetPoints = complexity;
        let iterations = 0;
        const maxIterations = 500;

        while (pts.length < targetPoints && iterations < maxIterations) {
            iterations++;

            let candidates = [];
            for (let i = 0; i < pts.length; i++) {
                const p1 = pts[i];
                const p2 = pts[(i + 1) % pts.length];
                if (p1.dist(p2) > minSegmentLen) candidates.push(i);
            }

            if (candidates.length === 0) break;

            const idx = candidates[Math.floor(Math.random() * candidates.length)];
            const p1 = pts[idx];
            const p2 = pts[(idx + 1) % pts.length];

            const mid = p1.add(p2).mul(0.5);
            const vec = p2.sub(p1);
            const normal = vec.perp().norm();

            const displacementRange = vec.len() * windiness;
            const offset = (Math.random() - 0.5) * 2 * displacementRange;

            const newPoint = mid.add(normal.mul(offset));

            // Margin Check
            if (newPoint.x < 60 || newPoint.x > width - 60 || newPoint.y < 60 || newPoint.y > height - 60) continue;

            const newPts = [...pts];
            newPts.splice(idx + 1, 0, newPoint);

            // Updated Check: Includes buffer width
            if (!checkCollision(newPts, trackWidth)) {
                pts = newPts;
            }
        }

        // --- 3. Relaxation Pass (Physics) ---
        const relaxPasses = trackStyle === 'circuit' ? 12 : 5;

        for (let r = 0; r < relaxPasses; r++) {
            const newPts = [...pts];
            for (let i = 0; i < pts.length; i++) {
                const prev = pts[(i - 1 + pts.length) % pts.length];
                const curr = pts[i];
                const next = pts[(i + 1) % pts.length];

                // Elasticity (Smoothing)
                const center = prev.add(next).mul(0.5);
                const vecToCenter = center.sub(curr);
                const smoothFactor = trackStyle === 'circuit' ? 0.25 : 0.1;
                newPts[i] = curr.add(vecToCenter.mul(smoothFactor));

                // Repulsion Field (Anti-Overlap)
                for (let j = 0; j < pts.length; j++) {
                    // Don't repel from self or immediate neighbors
                    if (i === j || (i + 1) % pts.length === j || (i - 1 + pts.length) % pts.length === j) continue;

                    let c = pts[j];
                    let d = pts[(j + 1) % pts.length];

                    // Check distance to other segments
                    const dist = pointToSegmentDistance(newPts[i], c, d);
                    const repelThreshold = trackWidth * 2.0; // Strong buffer

                    if (dist < repelThreshold) {
                        // Push away perpendicular to the offending segment
                        // Find closest point on segment to push away from
                        const l2 = (d.x - c.x) ** 2 + (d.y - c.y) ** 2;
                        let t = ((newPts[i].x - c.x) * (d.x - c.x) + (newPts[i].y - c.y) * (d.y - c.y)) / l2;
                        t = Math.max(0, Math.min(1, t));
                        const closest = new Vec2(c.x + t * (d.x - c.x), c.y + t * (d.y - c.y));

                        const pushDir = newPts[i].sub(closest).norm();
                        // Stronger push if closer
                        const force = (repelThreshold - dist) * 0.8;
                        newPts[i] = newPts[i].add(pushDir.mul(force));
                    }
                }
            }
            pts = newPts;
        }

        // --- 4. Generate Spline Waypoints ---
        let waypoints = [];
        for (let i = 0; i < pts.length; i++) {
            const p0 = pts[(i - 1 + pts.length) % pts.length];
            const p1 = pts[i];
            const p2 = pts[(i + 1) % pts.length];
            const p3 = pts[(i + 2) % pts.length];
            const steps = 20; // Number of interpolated points per segment
            for (let t = 0; t < steps; t++) {
                const splinePoint = getSplinePoint(p0, p1, p2, p3, t / steps);
                const newWp = { x: Math.round(splinePoint.x), y: Math.round(splinePoint.y) };
                
                // Filter out duplicates or extremely close points
                if (waypoints.length > 0) {
                    const lastWp = waypoints[waypoints.length - 1];
                    const dist = Math.sqrt((newWp.x - lastWp.x) ** 2 + (newWp.y - lastWp.y) ** 2);
                    if (dist < 2) continue; // Skip if closer than 2 units
                }
                
                waypoints.push(newWp);
            }
        }

        // Ensure loop closure is clean (check last point vs first point)
        if (waypoints.length > 1) {
            const firstWp = waypoints[0];
            const lastWp = waypoints[waypoints.length - 1];
            const dist = Math.sqrt((firstWp.x - lastWp.x) ** 2 + (firstWp.y - lastWp.y) ** 2);
            if (dist < 2) {
                waypoints.pop(); // Remove last point if it duplicates start
            }
        }

        return waypoints;
    }

    /**
     * Generates a track for a specific league with appropriate parameters
     * @param {string} leagueName - Name of the league
     * @param {number} width - Final track width (default 8000)
     * @param {number} height - Final track height (default 6000)
     * @returns {Track} Track object with waypoints scaled to final dimensions
     */
    generateTrackForLeague(leagueName, width = 8000, height = 6000, weatherOverride = null) {
        const settings = this.leagueSettings[leagueName];
        if (!settings) {
            console.warn(`Unknown league: ${leagueName}. Using default circuit.`);
            // Fallback to a default circuit if settings are not found
            const defaultBaseWaypoints = this._generateBaseProceduralTrack('circuit', 30, 1.0, 70, 30, 800, 600);
            const defaultScaledWaypoints = defaultBaseWaypoints
                .map(wp => ({ x: Math.round(wp.x * (width / 800)), y: Math.round(wp.y * (height / 600)) }));
            const defaultCharacteristics = this.calculateCharacteristics(defaultScaledWaypoints);
            const defaultTrackName = this.generateTrackName('Circuit');
            const finalWeather = weatherOverride || this.generateWeather(); // Use override if provided

            return new Track(
                'Circuit', // type
                defaultTrackName, // name
                defaultScaledWaypoints, // waypoints
                defaultCharacteristics, // characteristics
                finalWeather, // weather
                trackWidth, // trackWidth
                true // isLoop
            );
        }

        let complexity, windiness, straightLength, trackStyle;
        const trackWidth = 30; // Consistent track width for now

        // Determine track style and parameters based on league settings
        trackStyle = settings.trackStyle || 'circuit'; // Default to circuit if not specified

        if (leagueName === 'Open Wheel' && settings.ovalChance && Math.random() < settings.ovalChance) {
            trackStyle = randomChoice(['oval', 'tri-oval']); // 5% chance for oval or tri-oval
        } else if (leagueName === 'Stock Car') {
            if (settings.ovalVariation) {
                trackStyle = randomChoice(['oval', 'tri-oval', 'oval', 'oval']); // Weighted towards oval
            }
        }
        
        // Set parameters based on determined trackStyle or explicit league settings
        if (trackStyle === 'circuit') {
            complexity = randomInt(settings.complexity.min, settings.complexity.max);
            windiness = randomFloat(settings.windiness.min, settings.windiness.max);
            straightLength = randomInt(settings.straightLength.min, settings.straightLength.max);
        } else if (trackStyle === 'oval') {
            // Force clean oval parameters for Stock Car/Ovals
            complexity = randomInt(12, 16); // Low complexity for clean oval
            windiness = 0.0; // Zero chaos for clean oval
            straightLength = randomInt(100, 150); 
        } else if (trackStyle === 'tri-oval') {
            // Parameters for tri-oval, directly from settings
            complexity = randomInt(25, 35); // Reduced complexity for cleaner shape
            windiness = 0.0; // Zero chaos to preserve the triangle shape
            straightLength = randomInt(50, 70); // From tri-oval preset
        }


        // Generate base waypoints at 800x600 resolution
        const baseWaypoints = this._generateBaseProceduralTrack(
            trackStyle,
            complexity,
            windiness,
            straightLength,
            trackWidth,
            800,
            600
        );

        // Scale waypoints to the target dimensions
        const scaleX = width / 800;
        const scaleY = height / 600;
        const scaledWaypoints = baseWaypoints.map(wp => ({
            x: Math.round(wp.x * scaleX),
            y: Math.round(wp.y * scaleY)
        }));

        // Determine the actual track type name for the Track object
        let actualTrackTypeName = 'Circuit'; // Default
        if (trackStyle === 'oval') {
            actualTrackTypeName = 'Oval';
        } else if (trackStyle === 'tri-oval') {
            actualTrackTypeName = 'Tri-Oval';
        } else if (leagueName === 'Go-Kart') {
            actualTrackTypeName = 'Go-Kart Track';
        } else if (leagueName === 'Tri-Oval') { // If the league name itself is Tri-Oval
            actualTrackTypeName = 'Tri-Oval';
        }

        const trackName = this.generateTrackName(actualTrackTypeName);
        const characteristics = this.calculateCharacteristics(scaledWaypoints);
        const finalWeather = weatherOverride || this.generateWeather(); // Use override if provided

        return new Track(
            actualTrackTypeName, // type
            trackName, // name
            scaledWaypoints, // waypoints
            characteristics, // characteristics
            finalWeather, // weather
            trackWidth, // trackWidth
            true // isLoop
        );
    }

    /**
     * Generates a simple drag strip track (straight line)
     */
    generateDragStripTrack(width = 8000, height = 6000, weatherOverride = null) {
        const waypoints = [];
        // Define the effective length of a 1/4 mile in game units
        // Based on physics engine speeds, 1000-1200 units is roughly 10-12s at top speed
        const DRAG_STRIP_LENGTH = 1200; 

        const startX = (width - DRAG_STRIP_LENGTH) / 2;
        const endX = startX + DRAG_STRIP_LENGTH;
        const yCenter = height / 2;
        
        const numPoints = 20; // Enough points for smooth rendering/physics

        // Generate points for the straight line
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            waypoints.push({
                x: Math.round(startX + (endX - startX) * t),
                y: Math.round(yCenter)
            });
        }
        
        const trackWidth = 20; // Narrower for a drag strip

        const trackName = this.generateTrackName('Drag Strip');
        const characteristics = this.calculateCharacteristics(waypoints, false);
        const finalWeather = weatherOverride || this.generateWeather(); // Use override if provided
        const trackType = 'Drag Strip';

        return new Track(
            trackType, // type
            trackName, // name
            waypoints, // waypoints
            characteristics, // characteristics
            finalWeather, // weather
            trackWidth, // trackWidth
            false // isLoop
        );
    }

    /**
     * Smooths waypoints using simple averaging
     * (Kept as it might be useful for post-processing specific track types)
     */
    smoothWaypoints(waypoints, passes = 2) {
        let smoothed = [...waypoints];

        for (let pass = 0; pass < passes; pass++) {
            const temp = [];

            for (let i = 0; i < smoothed.length; i++) {
                const prev = smoothed[(i - 1 + smoothed.length) % smoothed.length];
                const curr = smoothed[i];
                const next = smoothed[(i + 1) % smoothed.length];

                temp.push({
                    x: Math.round((prev.x + curr.x + next.x) / 3),
                    y: Math.round((prev.y + curr.y + next.y) / 3)
                });
            }

            smoothed = temp;
        }

        return smoothed;
    }




    /**
     * Calculates track characteristics from waypoints
     */
    calculateCharacteristics(waypoints, isLoop = true) {
        let totalDistance = 0;
        let straightLength = 0;
        let turnCount = 0;
        let maxStraightLength = 0;
        let currentStraightLength = 0;

        const angleThreshold = 30; // degrees. Increased to reduce overcounting of turns in smooth tracks.

        // If not looping, stop early so we don't check angle at the very end relative to start
        // We need i, i+1, i+2. 
        // If loop: i goes 0 to length-1. indices wrap.
        // If not loop: i goes 0 to length-3. (i+2 must be <= length-1)
        const limit = isLoop ? waypoints.length : waypoints.length - 2;

        for (let i = 0; i < limit; i++) {
            const curr = waypoints[i];
            const next = waypoints[(i + 1) % waypoints.length];
            // For non-loop, modulo technically doesn't matter if we limit i, but purely for correctness:
            // If not loop, we shouldn't modulo, but we ensure i < length-2 so i+2 is valid.
            
            const nextNextIndex = (i + 2) % waypoints.length;
            const nextNext = waypoints[nextNextIndex];

            // Calculate distance
            const dx = next.x - curr.x;
            const dy = next.y - curr.y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy);
            totalDistance += segmentLength;

            // Calculate angle change
            const angle1 = Math.atan2(next.y - curr.y, next.x - curr.x);
            const angle2 = Math.atan2(nextNext.y - next.y, nextNext.x - next.x);
            let angleDiff = Math.abs(angle2 - angle1) * (180 / Math.PI);

            // Normalize angle
            if (angleDiff > 180) angleDiff = 360 - angleDiff;

            if (angleDiff > angleThreshold) {
                turnCount++;
                maxStraightLength = Math.max(maxStraightLength, currentStraightLength);
                currentStraightLength = 0;
            } else {
                straightLength += segmentLength;
                currentStraightLength += segmentLength;
            }
        }
        
        // For non-looping, add the last two segments distance to total (loop above missed them or calculation logic needs adjustment)
        // Actually, the loop above calculates distance for segment (curr->next).
        // If !isLoop, we iterate to length-2.
        // The segment (length-2 -> length-1) is missed for distance calculation?
        // Yes. We need to add distance for remaining segments if !isLoop.
        if (!isLoop && waypoints.length >= 2) {
             // Add distance for the very last segment which wasn't the "curr" in the loop
             // The loop runs for i up to length-3.
             // So waypoints[length-3] -> waypoints[length-2] is calculated.
             // We need waypoints[length-2] -> waypoints[length-1].
             const secondLast = waypoints[waypoints.length - 2];
             const last = waypoints[waypoints.length - 1];
             const dx = last.x - secondLast.x;
             const dy = last.y - secondLast.y;
             totalDistance += Math.sqrt(dx * dx + dy * dy);
             
             // Add to straight length as well since it's the end of a drag strip
             straightLength += Math.sqrt(dx * dx + dy * dy);
             currentStraightLength += Math.sqrt(dx * dx + dy * dy);
        }
        
        // Finalize straight length
        maxStraightLength = Math.max(maxStraightLength, currentStraightLength);

        // Technical difficulty based on turn density and complexity
        const turnDensity = turnCount / (totalDistance / 100);
        let technicalDifficulty;

        if (turnDensity > 0.15) {
            technicalDifficulty = "High";
        } else if (turnDensity > 0.08) {
            technicalDifficulty = "Medium";
        } else {
            technicalDifficulty = "Low";
        }

        return {
            totalDistance: Math.round(totalDistance),
            turnCount,
            straightLength: Math.round(straightLength),
            maxStraightLength: Math.round(maxStraightLength),
            straightPercentage: Math.round((straightLength / totalDistance) * 100),
            technicalDifficulty,
            turnDensity: turnDensity.toFixed(3)
        };
    }

    /**
     * Generates weather conditions based on probability
     */
    generateWeather() {
        const roll = Math.random();
        let cumulative = 0;

        for (const condition of this.weatherConditions) {
            cumulative += condition.probability;
            if (roll <= cumulative) {
                return {
                    type: condition.type,
                    gripModifier: condition.gripModifier
                };
            }
        }

        return this.weatherConditions[0]; // Default to clear
    }

    /**
     * Generates a complete race setting (Track, Laps, Rules)
     */
    generateRaceSettings(raceType = null, trackType = null, width = 800, height = 600, leagueTier = 1) { // Added leagueTier parameter
        let selectedRaceType = raceType ? this.raceTypes.find(t => t.name === raceType) : randomChoice(this.raceTypes);
        let settings = { ...selectedRaceType }; // Clone base settings
        
        // Apply a random modifier
        if (Math.random() < 0.25) { // 25% chance of a modifier
            const modifier = randomChoice(this.raceModifiers);
            settings.name = `${settings.name} (${modifier.name})`;
            settings = { ...settings, ...modifier.effect };
        }

        // Generate Track
        const track = this.generateTrack(trackType, width, height, settings, leagueTier); // Pass leagueTier to generateTrack

        // Finalize settings
        settings.totalLaps = settings.baseLaps * (track.totalDistance / 10000); // Laps scale with track length
        settings.totalLaps = Math.max(5, Math.round(settings.totalLaps)); // Min 5 laps
        settings.track = track;

        return settings;
    }

    /**
     * Generates a complete track
     */
    generateTrack(trackType = null, width = 8000, height = 6000, raceSettings = {}, leagueTier = 1) { // Added leagueTier parameter
        // Determine initial weather
        let finalWeather = this.generateWeather();

        // Override weather if a race modifier demands it
        if (raceSettings.weather === "Rain") {
            finalWeather = { type: "Rain", gripModifier: 0.65 };
        } else if (raceSettings.weather === "Night") {
            finalWeather = { type: "Night", gripModifier: 1.0 };
        }

        // If a trackType is specifically requested, we use it to derive the league name.
        // Otherwise, we use the leagueTier to generate an appropriate track type.
        let leagueName;
        if (trackType) {
            // Map the trackType to a known league name or derive it
            if (trackType.includes("Go-Kart")) leagueName = 'Go-Kart';
            else if (trackType.includes("GT")) leagueName = 'GT';
            else if (trackType.includes("LM")) leagueName = 'LM';
            else if (trackType.includes("Open Wheel")) leagueName = 'Open Wheel';
            else if (trackType.includes("Stock Car") || trackType.includes("Oval") || trackType.includes("Tri-Oval")) leagueName = 'Stock Car';
            else leagueName = 'Go-Kart'; // Default to Go-Kart for other unspecified circuit types for now
        } else {
            // If no trackType is specified, determine it based on leagueTier
            trackType = this.generateTrackType(leagueTier);
             if (trackType.includes("Go-Kart")) leagueName = 'Go-Kart';
            else if (trackType.includes("Oval") || trackType.includes("Tri-Oval")) leagueName = 'Stock Car';
            else leagueName = 'GT'; // Default for road courses if not go-kart or oval
        }

        if (trackType === "Drag Race") {
            return this.generateDragStripTrack(width, height, finalWeather);
        }
        
        return this.generateTrackForLeague(leagueName, width, height, finalWeather);
    }

    /**
     * Generates a track name
     */
    generateTrackName(trackType) {
        const namePrefixes = [
            "Iron", "Shadow", "Silver", "Gold", "Crystal", "Thunder", "Storm", "Red", "Blue",
            "Black", "White", "Green", "Emerald", "Ruby", "Sapphire", "Mystic", "Ancient", "Neo",
            "Solar", "Lunar", "Crimson", "Azure", "Midnight", "Frost", "Ember", "Hollow", "Silent",
            "Roaring", "Savage", "Wild", "Noble", "Royal", "Grand", "Lost", "Dark", "Bright",
            "Ghost", "Spirit", "Broken", "Jagged", "High", "Low", "Deep", "Shallow",
            "Wide", "Narrow", "Long", "Short", "Great", "Little", "North", "South", "East", "West",
            "Upper", "Lower", "New", "Old", "Cyber", "Steam", "Steel", "Copper", "Bronze", "Platinum",
            "Titanium", "Obsidian", "Granite", "Marble", "Limestone", "Sandstone", "Clay", "Mud",
            "Dirt", "Dust", "Ash", "Smoke", "Mist", "Fog", "Cloud", "Rain", "Wind", "Snow", "Ice",
            "Echo", "Whisper", "Vivid", "Rapid", "Turbo", "Nitro", "Apex", "Zenith", "Vertex",
            "Alpha", "Omega", "Delta", "Sigma", "Prime", "Core", "Flux", "Pulse", "Wave", "Tide"
        ];

        const locationNouns = [
            "Valley", "Hills", "Mountain", "Ridge", "Peak", "Canyon", "Gorge", "Mesa", "Plateau",
            "Plains", "Fields", "Meadows", "Forest", "Woods", "Grove", "Pines", "Oaks", "Creek",
            "River", "Lake", "Shore", "Coast", "Bay", "Harbor", "City", "Town", "Village",
            "Fortress", "Tower", "Dome", "Arena", "Pass", "Bridge", "Tunnel", "Highway", "Freeway",
            "Springs", "Falls", "Run", "Crossing", "Point", "View", "Vista", "Heights", "Depths",
            "Flats", "Lands", "Zone", "Sector", "Base", "Station", "Outpost", "Park", "Garden",
            "Plaza", "Square", "Desolation", "Wilderness", "Frontier", "Horizon", "Summit", "Apex",
            "Zenith", "Nadir", "Meridian", "Equator", "Pole", "Axis", "Vortex", "Nexus", "Matrix",
            "Grid", "Net", "Web", "Chain", "Link", "Knot", "Loop", "Coil", "Spiral", "Helix"
        ];

        const trackSuffixes = [
            "Speedway", "Raceway", "International", "Motor Speedway",
            "Circuit", "Park", "Arena", "Ring", "Autodrome",
            "Course", "Track", "Roads", "Motordrome", "Drive"
        ];

        // Generate base name: Prefix + Noun (e.g. "Iron Valley")
        let baseName = `${randomChoice(namePrefixes)} ${randomChoice(locationNouns)}`;
        
        // Combine with track suffix
        let fullName = `${baseName} ${randomChoice(trackSuffixes)}`;

        // Specific overrides for flavor based on track type
        if (trackType === 'Oval' || trackType === 'Tri-Oval') {
            // Ovals often have "Speedway" or "Superspeedway"
            const ovalSuffixes = ["Speedway", "Superspeedway", "Oval", "Motor Speedway"];
            fullName = `${baseName} ${randomChoice(ovalSuffixes)}`;
        } else if (trackType === 'Drag Strip') {
             fullName = `${baseName} Dragway`;
        } else if (trackType === 'Go-Kart Track') {
             fullName = `${baseName} Karting Circuit`;
        }

        return fullName;
    }

    /**
     * Generates a random track type appropriate for the given league tier.
     * @param {number} leagueTier - The current league tier.
     * @returns {string} - A randomly chosen track type string.
     */
    generateTrackType(leagueTier) {
        const allowedTrackStyles = this.tierTrackTypes[leagueTier];
        if (!allowedTrackStyles || allowedTrackStyles.length === 0) {
            console.warn(`No track styles defined for Tier ${leagueTier}. Falling back to all types.`);
            return randomChoice(this.trackTypes);
        }
        return randomChoice(allowedTrackStyles);
    }
}

// ============================================================================
// ODDS CALCULATOR CLASS
// ============================================================================

class OddsCalculator {
    constructor() {
        this.minOdds = 1.01;
        this.maxOdds = 999.00;
    }

    /**
     * Calculates track suitability for a driver
     * Returns a multiplier (0.5 to 1.5)
     */
    calculateTrackSuitability(driver, track) {
        const characteristics = track.characteristics;
        const stats = driver.stats;
        const weather = track.weather;

        let suitability = 1.0;

        // Speed vs. Handling tracks
        if (characteristics.straightPercentage > 60) {
            // Speed-focused track
            suitability *= (stats.topSpeed / 100) * 1.3 + 0.2;
        } else {
            // Handling-focused track
            suitability *= (stats.cornering / 100) * 1.3 + 0.2;
        }

        // Technical difficulty
        if (characteristics.technicalDifficulty === "High") {
            suitability *= (stats.cornering / 100) * 0.5 + 0.5;
        } else if (characteristics.technicalDifficulty === "Low") {
            suitability *= (stats.topSpeed / 100) * 0.3 + 0.7;
        }

        // Weather effects
        if (weather.type === "Rain") {
            // Check for Rain Master trait
            const hasRainMaster = driver.traits.some(t => t.name === "Rain Master");
            if (hasRainMaster) {
                suitability *= 1.25;
            } else {
                // Rain favors cornering and reliability
                suitability *= ((stats.cornering + stats.reliability) / 200) * 0.5 + 0.75;
            }
        }

        if (weather.type === "Night") {
            // Check for Night Owl trait
            const hasNightOwl = driver.traits.some(t => t.name === "Night Owl");
            if (hasNightOwl) {
                suitability *= 1.20;
            }
        }

        // Clamp suitability
        return clamp(suitability, 0.5, 1.5);
    }

    /**
     * Calculates raw win probability for each driver
     */
    calculateWinProbabilities(field, track, raceSettings) {
        const probabilities = [];

        for (const driver of field) {
            // Base strength from driver stats
            const baseStrength = (
                driver.stats.topSpeed * 0.25 +
                driver.stats.cornering * 0.25 +
                driver.stats.reliability * 0.20 +
                driver.stats.stamina * 0.15 +
                driver.stats.aggression * 0.15
            ) / 100;

            // Track suitability modifier
            const suitability = this.calculateTrackSuitability(driver, track);

            // Special trait bonuses and race rule effects
            let traitBonus = 1.0;
            for (const trait of driver.traits) {
                if (trait.name === "Qualifying Hero" && driver.startingPosition <= 3) {
                    traitBonus *= 1.15;
                }
                if (trait.name === "Ice Cold") {
                    traitBonus *= 1.08;
                }
            }
            
            // Race rule adjustments (e.g. Mandatory Pit favors high reliability/low aggression)
            if (raceSettings.pitRequired) {
                // Favor reliability and stamina over aggression
                traitBonus *= (driver.stats.reliability / 100) * 0.2 + 0.9;
                traitBonus *= 1 - (driver.stats.aggression / 100) * 0.1; // Penalty for high aggression
            }
            // Elimination race logic can be added here as well if needed

            const rawProbability = baseStrength * suitability * traitBonus;

            probabilities.push({
                driver: driver.name,
                driverData: driver,
                rawProbability
            });
        }

        // Normalize probabilities to sum to 1.0
        const totalProbability = probabilities.reduce((sum, p) => sum + p.rawProbability, 0);

        for (const prob of probabilities) {
            prob.winProbability = prob.rawProbability / totalProbability;
        }

        return probabilities;
    }

    /**
     * Converts probability to decimal odds
     * Formula: Odds = 1 / Probability
     * Includes bookmaker margin (vig/juice)
     */
    probabilityToOdds(probability, margin = 0.05) {
        // Add bookmaker margin
        const adjustedProbability = probability * (1 + margin);

        // Convert to odds
        let odds = 1 / adjustedProbability;

        // Clamp to realistic range
        odds = clamp(odds, this.minOdds, this.maxOdds);

        // Round to 2 decimal places
        return Math.round(odds * 100) / 100;
    }

    /**
     * Calculates win odds for all drivers
     */
    calculateWinOdds(field, track, raceSettings) {
        const probabilities = this.calculateWinProbabilities(field, track, raceSettings);
        const odds = [];

        for (const prob of probabilities) {
            odds.push({
                driver: prob.driver,
                driverData: prob.driverData,
                probability: prob.winProbability,
                odds: this.probabilityToOdds(prob.winProbability),
                impliedProbability: (1 / this.probabilityToOdds(prob.winProbability))
            });
        }

        // Sort by odds (lowest to highest = favorite to longshot)
        odds.sort((a, b) => a.odds - b.odds);

        return odds;
    }

    /**
     * Calculates Top 3 finish probabilities
     * Simplified model: multiply win probability by expansion factor
     */
    calculateTop3Odds(field, track) {
        const winOdds = this.calculateWinOdds(field, track);
        const top3Odds = [];

        for (const entry of winOdds) {
            // Top 3 probability is roughly 3x win probability (simplified)
            // but capped at realistic values
            const top3Probability = Math.min(entry.probability * 3.2, 0.85);

            top3Odds.push({
                driver: entry.driver,
                driverData: entry.driverData,
                probability: top3Probability,
                odds: this.probabilityToOdds(top3Probability, 0.08)
            });
        }

        top3Odds.sort((a, b) => a.odds - b.odds);
        return top3Odds;
    }

    /**
     * Calculates head-to-head odds between two drivers
     */
    calculateHeadToHeadOdds(driver1, driver2, track) {
        const field = [driver1, driver2];
        const probabilities = this.calculateWinProbabilities(field, track);

        const total = probabilities[0].rawProbability + probabilities[1].rawProbability;
        const prob1 = probabilities[0].rawProbability / total;
        const prob2 = probabilities[1].rawProbability / total;

        return {
            driver1: {
                name: driver1.name,
                probability: prob1,
                odds: this.probabilityToOdds(prob1, 0.03)
            },
            driver2: {
                name: driver2.name,
                probability: prob2,
                odds: this.probabilityToOdds(prob2, 0.03)
            }
        };
    }

    /**
     * Generates prop bet odds
     */
    generatePropBets(field, track) {
        const props = [];

        // "Will there be a DNF?" prop
        const avgReliability = field.reduce((sum, d) => sum + d.stats.reliability, 0) / field.length;
        const dnfProbability = clamp(1 - (avgReliability / 120), 0.3, 0.85);

        props.push({
            type: "DNF Occurs",
            description: "Will at least one car fail to finish?",
            yesOdds: this.probabilityToOdds(dnfProbability, 0.06),
            noOdds: this.probabilityToOdds(1 - dnfProbability, 0.06)
        });

        // "Winner from Top 5" prop
        const top5WinProb = 0.72; // Historical average
        props.push({
            type: "Winner from Top 5 Starters",
            description: "Will the winner start in the top 5 positions?",
            yesOdds: this.probabilityToOdds(top5WinProb, 0.05),
            noOdds: this.probabilityToOdds(1 - top5WinProb, 0.05)
        });

        // "Margin of Victory" (Over/Under)
        const technicalTrack = track.characteristics.technicalDifficulty === "High";
        const closeFinishProb = technicalTrack ? 0.55 : 0.40;

        props.push({
            type: "Close Finish",
            description: "Will the winning margin be less than 1 second?",
            yesOdds: this.probabilityToOdds(closeFinishProb, 0.05),
            noOdds: this.probabilityToOdds(1 - closeFinishProb, 0.05)
        });

        return props;
    }

    /**
     * Calculates parlay odds (multiple bets combined)
     * Parlay Odds = (Odds1) × (Odds2) × ... × (OddsN)
     */
    calculateParlayOdds(individualOdds) {
        return individualOdds.reduce((product, odds) => product * odds, 1);
    }
}

// ============================================================================
// SEASON GENERATOR CLASS
// ============================================================================

class SeasonGenerator {
    constructor(trackGenerator) { // Added trackGenerator parameter
        this.raceWeeks = 16; // Standard season length
        this.racesSinceLastDrag = 0; // Counter for drag race events
        this.trackGenerator = trackGenerator; // Store TrackGenerator instance

        this.contractTypes = {
            safe: {
                name: "Safe",
                description: "Small field, favorable conditions",
                fieldSize: 12,
                minPrizePool: 5000,
                maxPrizePool: 15000,
                riskLevel: 0.3
            },
            risky: {
                name: "Risky",
                description: "Large field, challenging conditions",
                fieldSize: 24,
                minPrizePool: 15000,
                maxPrizePool: 50000,
                riskLevel: 0.7
            },
            special: {
                name: "Special",
                description: "Unique gimmick or extreme conditions",
                fieldSize: 20,
                minPrizePool: 10000,
                maxPrizePool: 100000,
                riskLevel: 0.5
            }
        };

        this.specialGimmicks = [
            "Reverse Grid Start",
            "Double Prize Pool (Rain Mandatory)",
            "Night Race Only",
            "Elimination Race (Last place eliminated each lap)",
            "Team Relay (Draft partners matter)",
            "No Contacts Allowed (Phone disabled)",
            "All Rookies Field",
            "All Elite Field"
        ];
    }

    /**
     * Generates a race contract
     */
    generateContract(type, week, leagueTier) {
        const contractConfig = this.contractTypes[type];

        // Prize pool scales with league tier
        const tierMultiplier = 1 + (leagueTier - 1) * 0.5;
        const prizePool = randomInt(
            contractConfig.minPrizePool * tierMultiplier,
            contractConfig.maxPrizePool * tierMultiplier
        );

        // Payout structure (1st, 2nd, 3rd...)
        const payouts = this.generatePayoutStructure(prizePool, contractConfig.fieldSize);

        // Entry fee (usually a small percentage of potential winnings)
        const entryFee = type === "safe" ? 500 : type === "risky" ? 2000 : 1500;

        // Generate special gimmick for special contracts
        const gimmick = type === "special" ? randomChoice(this.specialGimmicks) : null;

        return {
            week,
            type: contractConfig.name,
            description: contractConfig.description,
            fieldSize: contractConfig.fieldSize,
            prizePool,
            entryFee,
            payouts,
            gimmick,
            riskLevel: contractConfig.riskLevel,
            trackType: this.trackGenerator.generateTrackType(leagueTier) // Dynamically generate track type
        };
    }

    /**
     * Generates a special drag race contract
     */
    generateDragRaceContract(week, leagueTier) {
        // Drag races have specific characteristics
        const basePrizePool = 25000 * leagueTier;
        const prizePool = randomInt(basePrizePool * 0.8, basePrizePool * 1.2);
        const entryFee = Math.round(prizePool * 0.1); // 10% of prize pool

        return {
            week,
            type: "Drag Race",
            description: "Head-to-head elimination drag race tournament!",
            fieldSize: 8, // Fixed 8-car bracket for drag races
            prizePool,
            entryFee,
            payouts: this.generatePayoutStructure(prizePool, 8), // Payouts for an 8-car bracket
            gimmick: "Bracket Elimination",
            riskLevel: 0.8, // High risk, high reward
            isDragRace: true // Flag to identify this as a drag race
        };
    }

    /**
     * Generates payout structure for a race
     * Typically top 50% of field gets paid, heavily weighted to top 3
     */
    generatePayoutStructure(prizePool, fieldSize) {
        const payingPositions = Math.ceil(fieldSize / 2);
        const payouts = [];

        // Distribution: 40% / 25% / 15% / 10% / remaining split
        const percentages = [0.40, 0.25, 0.15, 0.10];
        let remaining = prizePool;

        // Top 4
        for (let i = 0; i < Math.min(4, payingPositions); i++) {
            const amount = Math.floor(prizePool * percentages[i]);
            payouts.push(amount);
            remaining -= amount;
        }

        // Remaining positions split evenly
        if (payingPositions > 4) {
            const splitAmount = Math.floor(remaining / (payingPositions - 4));
            for (let i = 4; i < payingPositions; i++) {
                payouts.push(splitAmount);
            }
        }

        return payouts;
    }

    /**
     * Generates a full season calendar
     */
    generateSeason(leagueTier = 1) {
        const calendar = [];
        this.racesSinceLastDrag = 0; // Reset counter for a new season

        for (let week = 1; week <= this.raceWeeks; week++) {
            const contracts = [];
            let regularContractsGenerated = 0;

            // Generate 2 regular contract options
            contracts.push(this.generateContract("safe", week, leagueTier));
            regularContractsGenerated++;

            contracts.push(this.generateContract("risky", week, leagueTier));
            regularContractsGenerated++;

            // Decide whether to add a special contract or a drag race contract
            // A drag race occurs *instead of* the third regular contract
            if (this.racesSinceLastDrag >= 2 && regularContractsGenerated === 2) { // 2 regular races + 1 drag race = 3 events
                contracts.push(this.generateDragRaceContract(week, leagueTier));
                this.racesSinceLastDrag = 0; // Reset counter after drag race
            } else {
                contracts.push(this.generateContract("special", week, leagueTier));
                this.racesSinceLastDrag++; // Only increment for regular contracts
            }

            calendar.push({
                week,
                contracts,
                completed: false,
                selectedContract: null,
                result: null
            });
        }

        return calendar;
    }

    /**
     * Calculates profit target needed to advance to next league
     */
    calculateProfitTarget(leagueTier) {
        // License cost increases exponentially with tier
        const baseCost = 50000;
        const licenseCost = baseCost * Math.pow(2, leagueTier - 1);

        // Recommended bankroll (for buffer)
        const recommendedBankroll = licenseCost * 1.5;

        return {
            leagueTier,
            licenseCost,
            recommendedBankroll,
            minimumProfit: licenseCost,
            description: `Earn $${licenseCost.toLocaleString()} to purchase Tier ${leagueTier + 1} license`
        };
    }

    /**
     * Generates starting bankroll for a new season
     */
    generateStartingBankroll(leagueTier) {
        // Starting bankroll scales with tier
        const baseAmount = 10000;
        return baseAmount * leagueTier;
    }

    /**
     * Calculates season statistics
     */
    calculateSeasonStats(calendar) {
        const completed = calendar.filter(week => week.completed);

        let totalWinnings = 0;
        let totalSpent = 0;
        let racesWon = 0;
        let top3Finishes = 0;

        for (const week of completed) {
            if (week.result) {
                totalSpent += week.selectedContract.entryFee;

                if (week.result.finishPosition <= week.selectedContract.payouts.length) {
                    const payout = week.selectedContract.payouts[week.result.finishPosition - 1];
                    totalWinnings += payout;

                    if (week.result.finishPosition === 1) racesWon++;
                    if (week.result.finishPosition <= 3) top3Finishes++;
                }
            }
        }

        const netProfit = totalWinnings - totalSpent;
        const roi = totalSpent > 0 ? ((netProfit / totalSpent) * 100) : 0;

        return {
            racesCompleted: completed.length,
            racesWon,
            top3Finishes,
            totalWinnings,
            totalSpent,
            netProfit,
            roi: roi.toFixed(2)
        };
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    DriverGenerator,
    TrackGenerator,
    OddsCalculator,
    SeasonGenerator
};

// ============================================================================
// USAGE EXAMPLE / TESTING
// ============================================================================

/*
// Example usage:

const driverGen = new DriverGenerator();
const trackGen = new TrackGenerator();
const oddsCalc = new OddsCalculator();
const seasonGen = new SeasonGenerator();

// Generate a race
const field = driverGen.generateField(20, 2); // 20 drivers, Tier 2
const track = trackGen.generateTrack("Oval", 800, 600);
const trackName = trackGen.generateTrackName(track.type);

// Calculate odds
const winOdds = oddsCalc.calculateWinOdds(field, track);
const top3Odds = oddsCalc.calculateTop3Odds(field, track);
const propBets = oddsCalc.generatePropBets(field, track);

// Generate season
const season = seasonGen.generateSeason(2);
const profitTarget = seasonGen.calculateProfitTarget(2);

console.log("Race at", trackName);
console.log("Favorite:", winOdds[0].driver, "at", winOdds[0].odds);
console.log("Profit Target:", profitTarget);
*/
