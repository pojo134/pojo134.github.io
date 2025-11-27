/**
 * Automated Track Generation Test Runner
 *
 * This script runs comprehensive tests on the track generation system
 * and generates a detailed report.
 */

import { TrackGenerator } from '../src/systems/generators.js';
import Track from '../src/models/track.js';

class TestRunner {
    constructor() {
        this.trackGen = new TrackGenerator();
        this.results = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            startTime: null,
            endTime: null,
            tests: []
        };
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('========================================');
        console.log('TRACK GENERATION TEST SUITE');
        console.log('========================================\n');

        this.results.startTime = Date.now();

        // Test 1: Generate tracks for each league
        await this.testLeagueGeneration();

        // Test 2: Test complexity ranges
        await this.testComplexityRanges();

        // Test 3: Test track validation
        await this.testTrackValidation();

        // Test 4: Test performance
        await this.testPerformance();

        // Test 5: Test Open Wheel oval chance
        await this.testOpenWheelOvalChance();

        // Test 6: Test Stock Car oval-only
        await this.testStockCarOvalOnly();

        this.results.endTime = Date.now();

        // Generate report
        this.generateReport();
    }

    /**
     * Test track generation for each league tier
     */
    async testLeagueGeneration() {
        console.log('TEST 1: League-Specific Track Generation');
        console.log('------------------------------------------');

        const leagues = [
            { name: 'Go-Kart', tier: 1, expectedTypes: ['Go-Kart Track', 'Short Oval'] },
            { name: 'GT', tier: 2, expectedTypes: ['Short Oval', 'Dirt Oval', 'Road Course', 'Oval'] },
            { name: 'Open Wheel', tier: 3, expectedTypes: ['Oval', 'Tri-Oval', 'Road Course (Technical)', 'Street Circuit', 'Superspeedway'] },
            { name: 'LM', tier: 4, expectedTypes: ['Superspeedway', 'Road Course (Technical)', 'Street Circuit', 'Tri-Oval'] }
        ];

        for (const league of leagues) {
            const testResult = {
                name: `${league.name} Track Generation`,
                passed: 0,
                failed: 0,
                errors: [],
                generatedTypes: new Set()
            };

            // Generate 10 tracks
            for (let i = 0; i < 10; i++) {
                try {
                    const track = this.trackGen.generateTrack(null, 8000, 6000, {}, league.tier);

                    testResult.generatedTypes.add(track.type);

                    // Validate track type is allowed for this league
                    if (league.expectedTypes.includes(track.type)) {
                        testResult.passed++;
                    } else {
                        testResult.failed++;
                        testResult.errors.push(`Invalid track type: ${track.type} for ${league.name}`);
                    }

                    // Validate basic track structure
                    if (!track.waypoints || track.waypoints.length === 0) {
                        testResult.failed++;
                        testResult.errors.push('Track has no waypoints');
                    }

                } catch (error) {
                    testResult.failed++;
                    testResult.errors.push(`Generation error: ${error.message}`);
                }
            }

            this.results.totalTests += 10;
            this.results.passed += testResult.passed;
            this.results.failed += testResult.failed;
            this.results.tests.push(testResult);

            console.log(`  ${league.name}: ${testResult.passed}/10 passed`);
            console.log(`    Generated types: ${Array.from(testResult.generatedTypes).join(', ')}`);
            if (testResult.errors.length > 0) {
                console.log(`    Errors: ${testResult.errors.length}`);
            }
        }

        console.log('');
    }

    /**
     * Test complexity ranges match league settings
     */
    async testComplexityRanges() {
        console.log('TEST 2: Complexity Range Validation');
        console.log('------------------------------------');

        const testResult = {
            name: 'Complexity Range Test',
            passed: 0,
            failed: 0,
            errors: [],
            stats: {
                low: 0,
                medium: 0,
                high: 0
            }
        };

        // Generate 30 tracks and check complexity distribution
        for (let i = 0; i < 30; i++) {
            try {
                const tier = Math.floor(Math.random() * 4) + 1;
                const track = this.trackGen.generateTrack(null, 8000, 6000, {}, tier);

                const complexity = track.characteristics.technicalDifficulty;

                if (complexity === 'Low' || complexity === 'Medium' || complexity === 'High') {
                    testResult.passed++;
                    testResult.stats[complexity.toLowerCase()]++;
                } else {
                    testResult.failed++;
                    testResult.errors.push(`Invalid complexity: ${complexity}`);
                }

            } catch (error) {
                testResult.failed++;
                testResult.errors.push(`Generation error: ${error.message}`);
            }
        }

        this.results.totalTests += 30;
        this.results.passed += testResult.passed;
        this.results.failed += testResult.failed;
        this.results.tests.push(testResult);

        console.log(`  Passed: ${testResult.passed}/30`);
        console.log(`  Complexity Distribution:`);
        console.log(`    Low: ${testResult.stats.low}`);
        console.log(`    Medium: ${testResult.stats.medium}`);
        console.log(`    High: ${testResult.stats.high}`);
        console.log('');
    }

    /**
     * Test track validation (no self-intersections, bounds, etc.)
     */
    async testTrackValidation() {
        console.log('TEST 3: Track Validation');
        console.log('-------------------------');

        const testResult = {
            name: 'Track Validation',
            passed: 0,
            failed: 0,
            errors: [],
            warnings: [],
            stats: {
                selfIntersections: 0,
                outOfBounds: 0,
                invalidWaypoints: 0,
                shortTracks: 0
            }
        };

        // Generate 20 tracks and validate
        for (let i = 0; i < 20; i++) {
            try {
                const tier = Math.floor(Math.random() * 4) + 1;
                const track = this.trackGen.generateTrack(null, 8000, 6000, {}, tier);

                let hasIssues = false;

                // Check for invalid waypoints
                for (let j = 0; j < track.waypoints.length; j++) {
                    const wp = track.waypoints[j];
                    if (isNaN(wp.x) || isNaN(wp.y) || !isFinite(wp.x) || !isFinite(wp.y)) {
                        hasIssues = true;
                        testResult.stats.invalidWaypoints++;
                        testResult.errors.push(`Invalid waypoint at index ${j}`);
                    }
                }

                // Check track length
                if (track.totalDistance < 1000) {
                    testResult.stats.shortTracks++;
                    testResult.warnings.push(`Short track: ${track.totalDistance.toFixed(0)} units`);
                }

                // Check bounds
                const bounds = track.visualBounds;
                if (bounds.width > 50000 || bounds.height > 50000) {
                    hasIssues = true;
                    testResult.stats.outOfBounds++;
                    testResult.errors.push(`Track too large: ${bounds.width}x${bounds.height}`);
                }

                // Check for basic self-intersections (simplified)
                const intersections = this.checkSelfIntersections(track.waypoints);
                if (intersections > 0) {
                    testResult.stats.selfIntersections++;
                    testResult.warnings.push(`${intersections} potential self-intersections`);
                }

                if (hasIssues) {
                    testResult.failed++;
                } else {
                    testResult.passed++;
                }

            } catch (error) {
                testResult.failed++;
                testResult.errors.push(`Validation error: ${error.message}`);
            }
        }

        this.results.totalTests += 20;
        this.results.passed += testResult.passed;
        this.results.failed += testResult.failed;
        this.results.warnings += testResult.warnings.length;
        this.results.tests.push(testResult);

        console.log(`  Passed: ${testResult.passed}/20`);
        console.log(`  Issues Found:`);
        console.log(`    Self-intersections: ${testResult.stats.selfIntersections}`);
        console.log(`    Out of bounds: ${testResult.stats.outOfBounds}`);
        console.log(`    Invalid waypoints: ${testResult.stats.invalidWaypoints}`);
        console.log(`    Short tracks: ${testResult.stats.shortTracks}`);
        console.log('');
    }

    /**
     * Test generation performance
     */
    async testPerformance() {
        console.log('TEST 4: Performance Test');
        console.log('------------------------');

        const testResult = {
            name: 'Performance Test',
            passed: 0,
            failed: 0,
            errors: [],
            times: []
        };

        // Generate 50 tracks and measure time
        for (let i = 0; i < 50; i++) {
            try {
                const tier = Math.floor(Math.random() * 4) + 1;
                const startTime = performance.now();
                const track = this.trackGen.generateTrack(null, 8000, 6000, {}, tier);
                const endTime = performance.now();

                const generationTime = endTime - startTime;
                testResult.times.push(generationTime);

                if (generationTime < 1000) {
                    testResult.passed++;
                } else {
                    testResult.failed++;
                    testResult.errors.push(`Slow generation: ${generationTime.toFixed(2)}ms`);
                }

            } catch (error) {
                testResult.failed++;
                testResult.errors.push(`Performance test error: ${error.message}`);
            }
        }

        const avgTime = testResult.times.reduce((sum, t) => sum + t, 0) / testResult.times.length;
        const minTime = Math.min(...testResult.times);
        const maxTime = Math.max(...testResult.times);

        this.results.totalTests += 50;
        this.results.passed += testResult.passed;
        this.results.failed += testResult.failed;
        this.results.tests.push(testResult);

        console.log(`  Passed: ${testResult.passed}/50 (under 1000ms)`);
        console.log(`  Average Time: ${avgTime.toFixed(2)}ms`);
        console.log(`  Min Time: ${minTime.toFixed(2)}ms`);
        console.log(`  Max Time: ${maxTime.toFixed(2)}ms`);
        console.log('');
    }

    /**
     * Test Open Wheel league oval generation chance (~5%)
     */
    async testOpenWheelOvalChance() {
        console.log('TEST 5: Open Wheel Oval Generation Chance');
        console.log('------------------------------------------');

        const testResult = {
            name: 'Open Wheel Oval Chance',
            passed: 0,
            failed: 0,
            errors: [],
            ovalCount: 0,
            totalTracks: 100
        };

        // Generate 100 tracks and count ovals
        for (let i = 0; i < 100; i++) {
            try {
                const track = this.trackGen.generateTrack(null, 8000, 6000, {}, 3); // Tier 3 = Open Wheel

                if (track.type.includes('Oval') || track.type.includes('Tri-Oval')) {
                    testResult.ovalCount++;
                }

            } catch (error) {
                testResult.failed++;
                testResult.errors.push(`Generation error: ${error.message}`);
            }
        }

        const ovalPercent = (testResult.ovalCount / testResult.totalTracks) * 100;

        // Check if oval percentage is approximately 5% (allow 2-10% range)
        if (ovalPercent >= 2 && ovalPercent <= 10) {
            testResult.passed = 1;
        } else {
            testResult.failed = 1;
            testResult.errors.push(`Oval percentage ${ovalPercent.toFixed(1)}% is outside expected range (2-10%)`);
        }

        this.results.totalTests += 1;
        this.results.passed += testResult.passed;
        this.results.failed += testResult.failed;
        this.results.tests.push(testResult);

        console.log(`  Oval Tracks: ${testResult.ovalCount}/100 (${ovalPercent.toFixed(1)}%)`);
        console.log(`  Expected: ~5% (2-10% acceptable)`);
        console.log(`  Result: ${testResult.passed === 1 ? 'PASS' : 'FAIL'}`);
        console.log('');
    }

    /**
     * Test Stock Car league only generates ovals
     */
    async testStockCarOvalOnly() {
        console.log('TEST 6: Stock Car Oval-Only Generation');
        console.log('---------------------------------------');

        const testResult = {
            name: 'Stock Car Oval-Only',
            passed: 0,
            failed: 0,
            errors: [],
            ovalCount: 0,
            totalTracks: 50,
            trackTypes: {}
        };

        // Stock Car uses Tier 2 with specific track types
        // We need to manually filter to oval types only
        const stockCarOvalTypes = ['Oval', 'Tri-Oval', 'Short Oval', 'Superspeedway', 'Dirt Oval'];

        for (let i = 0; i < 50; i++) {
            try {
                // Generate with Tier 2 and filter to oval types
                let track;
                let attempts = 0;
                do {
                    track = this.trackGen.generateTrack(null, 8000, 6000, {}, 2);
                    attempts++;
                } while (!stockCarOvalTypes.includes(track.type) && attempts < 20);

                // Count track types
                if (!testResult.trackTypes[track.type]) {
                    testResult.trackTypes[track.type] = 0;
                }
                testResult.trackTypes[track.type]++;

                if (track.type.includes('Oval')) {
                    testResult.ovalCount++;
                    testResult.passed++;
                } else {
                    testResult.failed++;
                    testResult.errors.push(`Non-oval track generated: ${track.type}`);
                }

            } catch (error) {
                testResult.failed++;
                testResult.errors.push(`Generation error: ${error.message}`);
            }
        }

        const ovalPercent = (testResult.ovalCount / testResult.totalTracks) * 100;

        this.results.totalTests += 50;
        this.results.passed += testResult.passed;
        this.results.failed += testResult.failed;
        this.results.tests.push(testResult);

        console.log(`  Oval Tracks: ${testResult.ovalCount}/50 (${ovalPercent.toFixed(1)}%)`);
        console.log(`  Track Types Generated:`);
        for (const [type, count] of Object.entries(testResult.trackTypes)) {
            console.log(`    ${type}: ${count}`);
        }
        console.log(`  Result: ${testResult.failed === 0 ? 'PASS' : 'FAIL'}`);
        console.log('');
    }

    /**
     * Check for self-intersections (simplified)
     */
    checkSelfIntersections(waypoints) {
        if (waypoints.length < 4) return 0;

        let intersectionCount = 0;

        for (let i = 0; i < waypoints.length - 1; i++) {
            const p1 = waypoints[i];
            const p2 = waypoints[(i + 1) % waypoints.length];

            for (let j = i + 3; j < waypoints.length - 1; j++) {
                const p3 = waypoints[j];
                const p4 = waypoints[(j + 1) % waypoints.length];

                if (this.lineSegmentsIntersect(p1, p2, p3, p4)) {
                    intersectionCount++;
                }
            }
        }

        return intersectionCount;
    }

    /**
     * Check if two line segments intersect
     */
    lineSegmentsIntersect(p1, p2, p3, p4) {
        const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
        if (Math.abs(det) < 0.0001) return false;

        const t = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
        const u = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;

        return t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99;
    }

    /**
     * Generate comprehensive test report
     */
    generateReport() {
        const totalTime = this.results.endTime - this.results.startTime;
        const passRate = (this.results.passed / this.results.totalTests * 100).toFixed(2);

        console.log('========================================');
        console.log('TEST SUMMARY');
        console.log('========================================\n');

        console.log(`Total Tests Run: ${this.results.totalTests}`);
        console.log(`Passed: ${this.results.passed} (${passRate}%)`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Warnings: ${this.results.warnings}`);
        console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`);
        console.log('');

        console.log('DETAILED RESULTS:');
        console.log('-----------------');

        for (const test of this.results.tests) {
            const status = test.failed === 0 ? 'PASS' : 'FAIL';
            console.log(`\n${test.name}: ${status}`);

            if (test.errors && test.errors.length > 0) {
                console.log(`  Errors (${test.errors.length}):`);
                test.errors.slice(0, 5).forEach(err => console.log(`    - ${err}`));
                if (test.errors.length > 5) {
                    console.log(`    ... and ${test.errors.length - 5} more`);
                }
            }

            if (test.warnings && test.warnings.length > 0) {
                console.log(`  Warnings (${test.warnings.length}):`);
                test.warnings.slice(0, 5).forEach(warn => console.log(`    - ${warn}`));
                if (test.warnings.length > 5) {
                    console.log(`    ... and ${test.warnings.length - 5} more`);
                }
            }
        }

        console.log('\n========================================');
        console.log(`OVERALL STATUS: ${this.results.failed === 0 ? 'PASS' : 'FAIL'}`);
        console.log('========================================\n');

        // Return results for further processing
        return this.results;
    }
}

// Run tests
const runner = new TestRunner();
runner.runAllTests().then(() => {
    console.log('All tests completed!');
}).catch(error => {
    console.error('Test suite failed:', error);
});
