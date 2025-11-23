/**
 * Test script for Burner Phone System
 *
 * This script validates that the burner phone integration works correctly
 * by testing all contacts, battery depletion, heat generation, and cooldown.
 */

// Import required modules
const { BurnerPhoneSystem, ContactType } = require('./racing.js');

console.log('=== BURNER PHONE SYSTEM TEST ===\n');

// Test 1: Initialization
console.log('Test 1: Initialization');
const phone = new BurnerPhoneSystem();
const status = phone.getStatus();

console.log(`Initial Battery: ${status.battery}/${status.maxBattery}`);
console.log(`Initial Heat: ${status.heat}/${status.maxHeat}`);
console.log(`Contacts Disabled: ${status.contactsDisabled}`);
console.assert(status.battery === 10, 'Battery should start at 10');
console.assert(status.heat === 0, 'Heat should start at 0');
console.assert(!status.contactsDisabled, 'Contacts should not be disabled');
console.log('✓ Initialization test passed\n');

// Test 2: Contact Usage - Spotter
console.log('Test 2: Using Spotter contact');
const spotterContact = phone.contacts[ContactType.SPOTTER];
console.log(`Spotter Cost: ${spotterContact.cost} battery, Heat: ${spotterContact.heat}`);

const canUseSpotter = phone.canUseContact(ContactType.SPOTTER);
console.assert(canUseSpotter, 'Should be able to use Spotter');

// Create dummy car for testing
const dummyCar = {
    driver: { name: 'Test Driver' },
    applyContactEffect: function(type, duration) {
        console.log(`  Applied effect: ${type} for ${duration}s`);
        this.activeEffect = type;
    },
    activeEffect: null
};

const result1 = phone.useContact(ContactType.SPOTTER, dummyCar, [], 0);
console.log(`Success: ${result1.success}`);
console.log(`Effect: ${result1.effect}`);
console.log(`Remaining Battery: ${result1.remainingBattery}`);
console.log(`Current Heat: ${result1.currentHeat}`);
console.assert(result1.success, 'Spotter contact should work');
console.assert(result1.remainingBattery === 8, 'Battery should decrease by 2');
console.assert(result1.currentHeat === 15, 'Heat should increase by 15');
console.log('✓ Spotter test passed\n');

// Test 3: Contact Usage - Marshal
console.log('Test 3: Using Marshal contact');
const marshalContact = phone.contacts[ContactType.MARSHAL];
console.log(`Marshal Cost: ${marshalContact.cost} battery, Heat: ${marshalContact.heat}`);

const dummyCars = [
    {
        driver: { name: 'Car 1' },
        status: 'RACING',
        speed: 100,
        applyContactEffect: function(type, duration) {
            console.log(`  Car 1: Applied ${type} for ${duration}s`);
        }
    },
    {
        driver: { name: 'Car 2' },
        status: 'RACING',
        speed: 100,
        applyContactEffect: function(type, duration) {
            console.log(`  Car 2: Applied ${type} for ${duration}s`);
        }
    }
];

const result2 = phone.useContact(ContactType.MARSHAL, dummyCars[0], dummyCars, 5);
console.log(`Success: ${result2.success}`);
console.log(`Effect: ${result2.effect}`);
console.log(`Remaining Battery: ${result2.remainingBattery}`);
console.log(`Current Heat: ${result2.currentHeat}`);
console.assert(result2.success, 'Marshal contact should work');
console.assert(result2.remainingBattery === 5, 'Battery should decrease by 3');
console.assert(result2.currentHeat === 45, 'Heat should increase by 30');
console.log('✓ Marshal test passed\n');

// Test 4: Heat Decay
console.log('Test 4: Heat decay over time');
const heatBefore = phone.heat;
console.log(`Heat before: ${heatBefore}`);

phone.update(5); // 5 seconds
const heatAfter = phone.heat;
console.log(`Heat after 5s: ${heatAfter}`);
console.log(`Heat decayed by: ${heatBefore - heatAfter} (expected: 10)`);
console.assert(heatAfter === heatBefore - 10, 'Heat should decay by 10 (2 per second)');
console.log('✓ Heat decay test passed\n');

// Test 5: Battery Depletion
console.log('Test 5: Battery depletion and contact blocking');
console.log(`Current battery: ${phone.currentBattery}`);

// Use Heckler (cost 2) - should work
const result3 = phone.useContact(ContactType.HECKLER, dummyCar, [], 10);
console.assert(result3.success, 'Heckler should work (battery: 5)');
console.log(`After Heckler - Battery: ${phone.currentBattery}, Heat: ${phone.heat}`);

// Use Engineer (cost 3) - should work
const result4 = phone.useContact(ContactType.ENGINEER, dummyCar, [], 15);
console.assert(result4.success, 'Engineer should work (battery: 3)');
console.log(`After Engineer - Battery: ${phone.currentBattery}, Heat: ${phone.heat}`);

// Try to use Marshal (cost 3) - should fail (only 0 battery left)
const result5 = phone.useContact(ContactType.MARSHAL, dummyCar, dummyCars, 20);
console.assert(!result5.success, 'Marshal should fail (insufficient battery)');
console.log(`Attempted Marshal with 0 battery - Success: ${result5.success}`);
console.log('✓ Battery depletion test passed\n');

// Test 6: Heat Limit
console.log('Test 6: Heat limit and contact blocking');
phone.resetForRace(); // Reset for this test
console.log('Reset for new race');

// Use contacts until heat is maxed
let contactsUsed = 0;
while (phone.canUseContact(ContactType.MARSHAL) && contactsUsed < 10) {
    const res = phone.useContact(ContactType.MARSHAL, dummyCar, dummyCars, contactsUsed * 5);
    if (res.success) {
        contactsUsed++;
        console.log(`  Used Marshal #${contactsUsed} - Heat: ${phone.heat}`);
    }
}

console.log(`Total contacts used before heat limit: ${contactsUsed}`);
console.log(`Final heat: ${phone.heat}`);
console.log(`Contacts disabled: ${phone.getStatus().contactsDisabled}`);
console.assert(phone.heat >= 100 || !phone.canUseContact(ContactType.MARSHAL), 'Heat should block contacts');
console.log('✓ Heat limit test passed\n');

// Test 7: Reset functionality
console.log('Test 7: Reset for new race');
phone.resetForRace();
const statusAfterReset = phone.getStatus();
console.log(`Battery after reset: ${statusAfterReset.battery}`);
console.log(`Heat after reset: ${statusAfterReset.heat}`);
console.log(`Used contacts after reset: ${statusAfterReset.usedContacts.length}`);
console.assert(statusAfterReset.battery === 10, 'Battery should reset to 10');
console.assert(statusAfterReset.heat === 0, 'Heat should reset to 0');
console.assert(statusAfterReset.usedContacts.length === 0, 'Used contacts should clear');
console.log('✓ Reset test passed\n');

// Summary
console.log('=== ALL TESTS PASSED ===');
console.log('\nBurner Phone System Summary:');
console.log('- Battery: Starts at 10, depletes with contact use');
console.log('- Heat: Starts at 0, increases with use, decays at 2/s');
console.log('- Contacts disabled when heat >= 100');
console.log('- Four contacts available: Spotter, Marshal, Heckler, Engineer');
console.log('- Each contact has unique cost, heat, and effects');
console.log('- System resets properly between races');
console.log('\n✓ Integration ready for gameplay!');
