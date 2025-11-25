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

// ============================================================================
// TRACK GENERATOR CLASS
// ============================================================================

class TrackGenerator {
    constructor() {
        this.trackTypes = [
            "Go-Kart Track", // New track type
            "Oval",
            "Road Course",
            "Dirt Oval",
            "Street Circuit",
            "Tri-Oval",
            "Road Course (Technical)",
            "Short Oval",
            "Superspeedway"
        ];

        // Define track types available per league tier
        this.tierTrackTypes = {
            1: ["Go-Kart Track", "Short Oval"], // Tier 1: Go-Karts
            2: ["Short Oval", "Dirt Oval", "Road Course", "Oval"], // Tier 2: Basic Ovals, Dirt, Road Courses
            3: ["Oval", "Tri-Oval", "Road Course (Technical)", "Street Circuit", "Superspeedway"], // Tier 3: Advanced Ovals, Technical Road Courses, Street Circuits
            4: ["Superspeedway", "Road Course (Technical)", "Street Circuit", "Tri-Oval"] // Tier 4: High-speed, high-skill tracks
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
    }

    /**
     * Generates an oval track
     * Scaled 10x larger for realistic lap times (60-90 seconds at 120 units/sec)
     */
    generateOval(width = 8000, height = 6000, complexity = "simple") {
        const waypoints = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const radiusX = width * 0.4;
        const radiusY = height * 0.4;

        // Number of waypoints depends on complexity (more points for larger track)
        const numPoints = complexity === "simple" ? 48 : 96;

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radiusX;
            const y = centerY + Math.sin(angle) * radiusY;

            waypoints.push({ x: Math.round(x), y: Math.round(y) });
        }

        return waypoints;
    }

    /**
     * Generates a tri-oval track (like Daytona)
     * Scaled 10x larger for realistic lap times
     */
    generateTriOval(width = 8000, height = 6000) {
        const waypoints = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const radiusX = width * 0.4;
        const radiusY = height * 0.4;

        const numPoints = 72;

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            let x = centerX + Math.cos(angle) * radiusX;
            let y = centerY + Math.sin(angle) * radiusY;

            // Add kink on the backstretch
            if (angle > Math.PI * 0.8 && angle < Math.PI * 1.2) {
                y -= height * 0.08;
            }

            waypoints.push({ x: Math.round(x), y: Math.round(y) });
        }

        return waypoints;
    }

    /**
     * Generates a road course with multiple turns
     * Scaled 10x larger for realistic lap times
     */
    generateRoadCourse(width = 8000, height = 6000, technicalDifficulty = "medium") {
        const waypoints = [];
        const turnCount = technicalDifficulty === "high" ? randomInt(12, 18) : randomInt(6, 10);

        // Start point
        let x = width * 0.1;
        let y = height * 0.5;
        waypoints.push({ x: Math.round(x), y: Math.round(y) });

        // Generate turns
        const margin = 1000;
        const segmentLength = technicalDifficulty === "high" ? 800 : 1200;

        for (let i = 0; i < turnCount; i++) {
            // Alternate between left and right turns with some randomness
            const turnDirection = (i % 2 === 0) ? 1 : -1;
            const turnIntensity = randomFloat(0.5, 1.5);

            // Create turn apex
            x += segmentLength * Math.cos(i * Math.PI / 4);
            y += segmentLength * Math.sin(i * Math.PI / 4) * turnDirection * turnIntensity;

            // Keep within bounds
            x = clamp(x, margin, width - margin);
            y = clamp(y, margin, height - margin);

            waypoints.push({ x: Math.round(x), y: Math.round(y) });
        }

        // Close the loop back to start
        waypoints.push({ x: Math.round(width * 0.1), y: Math.round(height * 0.5) });

        // Smooth the track
        return this.smoothWaypoints(waypoints);
    }

    /**
     * Generates a street circuit (tight, 90-degree turns)
     * Scaled 10x larger for realistic lap times
     */
    generateStreetCircuit(width = 8000, height = 6000) {
        const waypoints = [];
        const gridSize = 1000; // Not used currently, but kept for context

        // Create a street-like grid pattern
        const points = [
            { x: width * 0.2, y: height * 0.2 },
            { x: width * 0.8, y: height * 0.2 },
            { x: width * 0.8, y: height * 0.4 },
            { x: width * 0.3, y: height * 0.4 },
            { x: width * 0.3, y: height * 0.8 },
            { x: width * 0.8, y: height * 0.8 },
            { x: width * 0.8, y: height * 0.6 },
            { x: width * 0.2, y: height * 0.6 },
            { x: width * 0.2, y: height * 0.2 }
        ];

        // Add waypoints between corners for smoother navigation
        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            const steps = 3;

            for (let j = 0; j <= steps; j++) {
                const t = j / steps;
                waypoints.push({
                    x: Math.round(start.x + (end.x - start.x) * t),
                    y: Math.round(start.y + (end.y - start.y) * t)
                });
            }
        }

        // Apply smoothing to the generated waypoints
        return this.smoothWaypoints(waypoints);
    }

    /**
     * Generates a go-kart track (smaller, tighter, more technical)
     */
    generateGoKartTrack(width = 8000, height = 6000) {
        // This will be a miniature road course, very technical
        return this.generateRoadCourse(width * 0.5, height * 0.5, "high");
    }

    /**
     * Generates a simple drag strip track (long straight, turn, long straight)
     */
    generateDragStripTrack(width = 8000, height = 6000) { // Keep proportions reasonable
        const waypoints = [];
        const centerX = width / 2;
        const centerY = height / 2;

        // Make it a very elongated oval
        const halfWidth = width * 0.45; // Long straight sections
        const halfHeight = height * 0.05; // Very narrow turns

        const numPoints = 60; // For a smooth oval
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * halfWidth;
            const y = centerY + Math.sin(angle) * halfHeight;
            waypoints.push({ x: Math.round(x), y: Math.round(y) });
        }

        return this.smoothWaypoints(waypoints, 3); // Apply smoothing
    }

    /**
     * Smooths waypoints using simple averaging
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
    calculateCharacteristics(waypoints) {
        let totalDistance = 0;
        let straightLength = 0;
        let turnCount = 0;
        let maxStraightLength = 0;
        let currentStraightLength = 0;

        const angleThreshold = 15; // degrees

        for (let i = 0; i < waypoints.length; i++) {
            const curr = waypoints[i];
            const next = waypoints[(i + 1) % waypoints.length];
            const nextNext = waypoints[(i + 2) % waypoints.length];

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
    generateTrack(trackType = null, width = 800, height = 600, raceSettings = {}, leagueTier = 1) { // Added leagueTier parameter
        // Get allowed track types for the current league tier
        const allowedTrackTypes = this.tierTrackTypes[leagueTier] || this.trackTypes; // Fallback to all if tier not found

        // Random track type if not specified
        if (!trackType) {
            trackType = randomChoice(allowedTrackTypes);
        } else {
            // If a specific track type is requested, ensure it's allowed for the current tier
            if (!allowedTrackTypes.includes(trackType)) {
                console.warn(`Requested track type "${trackType}" not allowed for Tier ${leagueTier}. Choosing a random allowed track.`);
                trackType = randomChoice(allowedTrackTypes);
            }
        }

        let waypoints;

        // Generate waypoints based on track type
        const finalWidth = Math.max(200, width);
        const finalHeight = Math.max(200, height);

        if (trackType === "Drag Race") { // Handle Drag Race track type
            waypoints = this.generateDragStripTrack(finalWidth, finalHeight);
        } else if (trackType === "Go-Kart Track") { // Handle new Go-Kart Track type
            waypoints = this.generateGoKartTrack(finalWidth, finalHeight);
        } else if (trackType.includes("Oval") && !trackType.includes("Dirt")) {
            if (trackType === "Short Oval") {
                waypoints = this.generateOval(finalWidth * 0.8, finalHeight * 0.8, "simple");
            } else if (trackType === "Superspeedway") {
                waypoints = this.generateOval(finalWidth, finalHeight, "simple");
            } else if (trackType === "Tri-Oval") {
                waypoints = this.generateTriOval(finalWidth, finalHeight);
            } else {
                waypoints = this.generateOval(finalWidth, finalHeight, "simple");
            }
        } else if (trackType === "Dirt Oval") {
            waypoints = this.generateOval(finalWidth * 0.85, finalHeight * 0.85, "simple");
        } else if (trackType === "Street Circuit") {
            waypoints = this.generateStreetCircuit(finalWidth, finalHeight);
        } else if (trackType.includes("Technical")) {
            waypoints = this.generateRoadCourse(finalWidth, finalHeight, "high");
        } else {
            waypoints = this.generateRoadCourse(finalWidth, finalHeight, "medium");
        }

        const characteristics = this.calculateCharacteristics(waypoints);
        
        // Override weather if a race modifier demands it
        const weather = raceSettings.weather === "Rain" ? { type: "Rain", gripModifier: 0.65 } :
                        raceSettings.weather === "Night" ? { type: "Night", gripModifier: 1.0 } :
                        this.generateWeather();

        const trackName = this.generateTrackName(trackType);

        // Return a Track object instead of plain object
        return new Track(trackType, trackName, waypoints, characteristics, weather);
    }

    /**
     * Generates a track name
     */
    generateTrackName(trackType) {
        const locations = [
            "Riverside", "Mountain View", "Silver Creek", "Thunder Valley",
            "Sunset", "Coastal", "Pine Ridge", "Desert Mesa",
            "Harbor", "Metro", "Lakeside", "Badlands",
            "Crystal Lake", "Iron Mountain", "Golden Gate", "Maple Grove"
        ];

        const suffixes = [
            "Speedway", "Raceway", "International", "Motor Speedway",
            "Circuit", "Park", "Arena", "Oval"
        ];

        return `${randomChoice(locations)} ${randomChoice(suffixes)}`;
    }

    /**
     * Generates a random track type appropriate for the given league tier.
     * @param {number} leagueTier - The current league tier.
     * @returns {string} - A randomly chosen track type string.
     */
    generateTrackType(leagueTier) {
        const allowedTrackTypes = this.tierTrackTypes[leagueTier];
        if (!allowedTrackTypes || allowedTrackTypes.length === 0) {
            console.warn(`No track types defined for Tier ${leagueTier}. Falling back to all types.`);
            return randomChoice(this.trackTypes);
        }
        return randomChoice(allowedTrackTypes);
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
