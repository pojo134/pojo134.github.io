import BettingScreen from '../src/screens/bettingScreen.js';

console.log('Running BettingScreen Sort Tests...');

const screen = new BettingScreen();

// Mock Drivers
const drivers = [
    { name: 'Alice', skill: 80, form: 'HOT', odds: '2.0x', stats: { topSpeed: 80, cornering: 80, reliability: 80 }, qualifyingPosition: 3 },
    { name: 'Bob', skill: 90, form: 'AVG', odds: '1.5x', stats: { topSpeed: 90, cornering: 90, reliability: 90 }, qualifyingPosition: 1 },
    { name: 'Charlie', skill: 70, form: 'COLD', odds: '5.0x', stats: { topSpeed: 70, cornering: 70, reliability: 70 }, qualifyingPosition: 4 },
    { name: 'Dave', skill: 85, form: 'GOOD', odds: '3.0x', stats: { topSpeed: 85, cornering: 85, reliability: 85 }, qualifyingPosition: 2 }
];

// Mock GameState
const gameState = {
    race: {
        drivers: drivers,
        odds: drivers.map(d => ({ driver: d, odds: parseFloat(d.odds) }))
    }
};

let failed = 0;
let passed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`PASS: ${message}`);
        passed++;
    } else {
        console.error(`FAIL: ${message}`);
        failed++;
    }
}

// Test 0: Default Sort (Position Ascending)
const sortedByDefault = screen.sortDrivers(drivers, gameState);
assert(sortedByDefault[0].name === 'Bob', 'Default Sort (Pos Asc) - 1st is Bob (Pos 1)');
assert(sortedByDefault[1].name === 'Dave', 'Default Sort (Pos Asc) - 2nd is Dave (Pos 2)');

// Test 1: Sort by Skill Descending
// Expected: Bob (90), Dave (85), Alice (80), Charlie (70)
screen.currentSort = { column: 'skill', direction: 'desc' };
const sortedBySkill = screen.sortDrivers(drivers, gameState);
assert(sortedBySkill[0].name === 'Bob', 'Sort by Skill Desc - 1st is Bob');
assert(sortedBySkill[3].name === 'Charlie', 'Sort by Skill Desc - Last is Charlie');

// Test 2: Sort by Name Ascending
// Expected: Alice, Bob, Charlie, Dave
screen.currentSort = { column: 'name', direction: 'asc' };
const sortedByName = screen.sortDrivers(drivers, gameState);
assert(sortedByName[0].name === 'Alice', 'Sort by Name Asc - 1st is Alice');
assert(sortedByName[3].name === 'Dave', 'Sort by Name Asc - Last is Dave');

// Test 3: Sort by Odds Ascending (Lowest payout first = Best chance)
// Odds: Bob (1.5), Alice (2.0), Dave (3.0), Charlie (5.0)
screen.currentSort = { column: 'odds', direction: 'asc' };
const sortedByOdds = screen.sortDrivers(drivers, gameState);
assert(sortedByOdds[0].name === 'Bob', 'Sort by Odds Asc - 1st is Bob');
assert(sortedByOdds[3].name === 'Charlie', 'Sort by Odds Asc - Last is Charlie');

// Test 4: Sort by Form Descending (HOT > GOOD > AVG > COLD)
// Values: HOT(4), GOOD(3), AVG(2), COLD(1)
// Expected: Alice, Dave, Bob, Charlie
screen.currentSort = { column: 'form', direction: 'desc' };
const sortedByForm = screen.sortDrivers(drivers, gameState);
assert(sortedByForm[0].name === 'Alice', 'Sort by Form Desc - 1st is Alice');
assert(sortedByForm[1].name === 'Dave', 'Sort by Form Desc - 2nd is Dave');
assert(sortedByForm[3].name === 'Charlie', 'Sort by Form Desc - Last is Charlie');

// Test 5: Sort by Position Descending (Reverse grid)
screen.currentSort = { column: 'position', direction: 'desc' };
const sortedByPosDesc = screen.sortDrivers(drivers, gameState);
assert(sortedByPosDesc[0].name === 'Charlie', 'Sort by Position Desc - 1st is Charlie (Pos 4)');
assert(sortedByPosDesc[3].name === 'Bob', 'Sort by Position Desc - Last is Bob (Pos 1)');


// Test 6: Helper methods
assert(screen.getDriverRawSkill(drivers[0]) === 80, 'getDriverRawSkill returns correct number');
assert(screen.getFormValue('HOT') === 4, 'getFormValue returns correct value');
assert(screen.parseOdds('2.5x') === 2.5, 'parseOdds handles "x" suffix');

if (failed === 0) {
    console.log(`\nAll ${passed} tests passed!`);
    process.exit(0);
} else {
    console.error(`\n${failed} tests failed.`);
    process.exit(1);
}
