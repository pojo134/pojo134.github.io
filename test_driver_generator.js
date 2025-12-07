/**
 * Enhanced Driver Generator for Redline Roulette
 * Test Suite Implementation
 */

class EnhancedDriverGenerator {
    constructor() {
        this.maleFirstNames = [
            "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles",
            "Christopher", "Daniel", "Matthew", "Anthony", "Donald", "Mark", "Paul", "Steven", "Andrew", "Kenneth",
            "Axel", "Dash", "Hunter", "Ryder", "Jett", "Titan", "Spike", "Razor", "Turbo", "Drift"
        ];

        this.femaleFirstNames = [
            "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen",
            "Nancy", "Lisa", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle",
            "Roxy", "Raven", "Star", "Storm", "Vixen", "Kat", "Jinx", "Rebel", "Rogue", "Trinity"
        ];

        this.lastNames = [
            "Anderson", "Martinez", "Johnson", "Garcia", "Lee", "Williams", "Brown", "Davis", "Miller", "Wilson",
            "Speed", "Racer", "Driver", "Wheel", "Steer", "Brake", "Shift", "Gear", "Clutch", "Nitro"
        ];

        this.nicknames = [
            "The Rocket", "Iceman", "Maverick", "Goose", "Slider", "Hollywood", "Viper", "Jester", "Merlin", "Sundown",
            "Chaos", "Havoc", "Blitz", "Thunder", "Lightning", "Ghost", "Shadow", "Wraith", "Phantom", "Spectre"
        ];

        this.nationalities = [
            "Northern Region", "Southern Sector", "Western Province", "Eastern Zone", "Central District",
            "Highland Territory", "Lowland Expanse", "Coastal Confederacy", "Riverland Republic", "Mountain Domain",
            "Lake Federation", "Desert Coalition", "Forest Realm", "Prairie Union", "Oceanic Alliance",
            "Urban Sprawl", "Old Colony", "New Frontier", "Sunny Republic", "Shadow Dominion"
        ];

        this.hometowns = [
            "North City", "South Bay", "West End", "East Port", "Central City",
            "Highland Park", "Lowland Valley", "Coastal Town", "River Side", "Mountain View",
            "Lake City", "Desert Springs", "Forest Hill", "Valley Forge", "Ocean Point",
            "Capital City", "Old Town", "New Hope", "Sunny Vale", "Shadow Creek",
            "Twin Peaks", "Golden Sands", "Silver Creek", "Iron Ridge", "Copper Canyon"
        ];

        this.teamNames = [
            "Redline Racing", "Apex Autosport", "Velocity Vipers", "Turbo Titans", "Drift Demons",
            "Gearbox Gladiators", "Piston Pirates", "Nitro Knights", "Speed Syndicate", "Asphalt Assassins"
        ];
        
        // Team colors for consistent mapping
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

        this.luckyCharms = [
            "Rabbit's Foot", "Four Leaf Clover", "Lucky Coin", "Horseshoe", "Dice", "Crystal", "Old Glove",
            "Grandpa's Watch", "Special Socks", "Miniature Car", "Religious Icon", "Poker Chip"
        ];

        this.rituals = [
            "Eats a banana", "Listens to heavy metal", "Meditates", "Calls Mom", "Left boot first",
            "Taps roof 3 times", "Visualizes the lap", "Drinks espresso", "Stretches specifically", "Prays"
        ];

        this.phobias = [
            "Spiders", "Heights", "Clowns", "Darkness", "Snakes", "Flying", "Needles", "Public Speaking",
            "Losing", "Silence", "Birds", "Failure"
        ];

        this.allergies = [
            "Peanuts", "Shellfish", "Dairy", "Gluten", "Pollen", "Cats", "Dogs", "None", "Dust", "Soy",
            "Latex", "Bad Driving"
        ];

        this.spiritAnimals = [
            "Lion", "Tiger", "Eagle", "Wolf", "Bear", "Shark", "Cheetah", "Falcon", "Panther", "Hawk",
            "Honey Badger", "Fox", "Owl", "Bull"
        ];

        this.zodiacs = [
            "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
        ];

        this.karaokeSongs = [
            "Bohemian Rhapsody", "Don't Stop Believin'", "I Will Survive", "Sweet Caroline", "Wonderwall",
            "Dancing Queen", "Livin' on a Prayer", "Mr. Brightside", "Total Eclipse of the Heart", "Born to Run"
        ];

        this.veggies = [
            "Broccoli", "Brussels Sprouts", "Spinach", "Kale", "Cauliflower", "Asparagus", "Beets", "Eggplant",
            "Okra", "Lima Beans"
        ];

        this.coffeeOrders = [
            "Black", "Latte", "Cappuccino", "Espresso", "Cold Brew", "Flat White", "Macchiato", "Americano",
            "Mocha", "Tea instead", "Energy Drink", "Water"
        ];

        this.petSpecies = ["Dog", "Cat", "Hamster", "Parrot", "Iguana", "Snake", "Goldfish", "Rabbit", "Turtle", "Ferret"];
        this.petNames = ["Sparky", "Mittens", "Rex", "Luna", "Buddy", "Bella", "Charlie", "Max", "Lucy", "Daisy", "Turbo", "Nitro"];

        this.superstitions = [
            "Never wear green", "Avoid number 13", "Enter car from left", "Don't shave on race day",
            "Hold breath in tunnels", "Salute magpies", "Touch wood", "Lucky underwear"
        ];



        this.catchphrases = [
            "Eat my dust!", "Checkered flag or bust!", "Too fast for you!", "See ya later!", "I feel the need... for speed!",
            "Rubbin' is racin'", "Shake and bake!", "Full send!", "Pedal to the metal!", "Smooth operator."
        ];

        this.celebrations = [
            "Backflip", "Shoey", "Donuts", "Fist pump", "Crowd surf", "Tears of joy", "Kneel",
            "Climb fence", "Point to sky", "Doughnuts"
        ];

        this.preferredWeather = ["Sunny", "Overcast", "Rain", "Stormy", "Hot", "Cold", "Windy", "Foggy"];
        this.bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
        this.shoeSizes = [7, 8, 9, 10, 11, 12, 13, 14];
        
        this.hairlines = ["Luscious", "Receding", "Bald", "Buzz Cut", "Man Bun", "Mullet", "Mohawk", "Ponytail", "Artificial"];
        this.yearbookSuperlatives = ["Most Likely to Speed", "Class Clown", "Best Hair", "Most Athletic", "Biggest Flirt", "Teacher's Pet", "Most Likely to Succeed"];
        this.pizzaToppings = ["Pepperoni", "Cheese", "Pineapple", "Mushrooms", "Sausage", "Olives", "Anchovies", "Jalapenos"];
        this.dinosaurs = ["T-Rex", "Velociraptor", "Triceratops", "Stegosaurus", "Brachiosaurus", "Pterodactyl", "Spinosaurus"];
        this.tools = ["10mm Socket", "Hammer", "Duct Tape", "Wrench", "Screwdriver", "Pliers", "Drill", "Zip Ties"];
        this.hotSauces = ["Mild", "Medium", "Hot", "Extra Hot", "Inferno", "Ghost Pepper", "None"];
        this.sockStyles = ["Ankle", "Knee-high", "Mismatched", "No-show", "Argyle", "Striped", "Plain White"];
        this.emojis = ["😎", "🏎️", "🔥", "😂", "🤔", "👀", "🏁", "🏆", "🤡", "🚀"];
        this.cheeses = ["Cheddar", "Mozzarella", "Brie", "Gouda", "Swiss", "Blue", "American", "Parmesan"];
        this.podcastGenres = ["True Crime", "Comedy", "History", "Tech", "Sports", "Politics", "Self-Help", "Fiction"];
        this.tShirtSizes = ["XS", "S", "M", "L", "XL", "XXL"];
        this.catsDogs = ["Cats", "Dogs", "Both", "Neither"];
        this.tpOrientation = ["Over", "Under", "Don't Care", "Wipes"];
        this.fruitRobot = ["Fruit", "Robot", "Cyborg Fruit", "Android"];
        this.visions = ["20/20", "Needs Glasses", "Contacts", "Lasik", "Eagle Eye"];
        this.handedness = ["Right", "Left", "Ambidextrous"];
    }

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomFloat(min, max, decimals = 2) {
        const val = Math.random() * (max - min) + min;
        return parseFloat(val.toFixed(decimals));
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    randomColor() {
        return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    }

    generateFanBaseName(firstName, lastName, nickname) {
        const suffixes = ["Squad", "Army", "Nation", "Crew", "Clan", "Club", "Pack", "Gang", "Force", "Legion", "Maniacs", "Fanatics"];
        const rhymingSuffixes = ["Runners", "Raiders", "Racers", "Rockets", "Rebels", "Riders"];
        
        // Strategy 1: Use Nickname if available (30% chance)
        if (nickname && Math.random() < 0.3) {
            return `The ${nickname}s`;
        }

        // Strategy 2: Alliteration (First Letter Match) (40% chance)
        if (Math.random() < 0.4) {
            const nameToUse = Math.random() < 0.5 ? firstName : lastName;
            const firstLetter = nameToUse.charAt(0).toUpperCase();
            
            // Simple hardcoded alliterations
            const alliterations = {
                'A': ["Army", "Allies", "Avengers", "Agents", "Aces"],
                'B': ["Brigade", "Bandits", "Battalion", "Boys", "Beasts"],
                'C': ["Crew", "Cult", "Clan", "Champions", "Crushers"],
                'D': ["Demons", "Defenders", "Dynasty", "Disciples", "Dragons"],
                'E': ["Empire", "Elite", "Enforcers", "Eagles"],
                'F': ["Fanatics", "Force", "Fleet", "Fighters", "Fans"],
                'G': ["Gang", "Group", "Guardians", "Gladiators", "Giants"],
                'H': ["Heroes", "Hunters", "Horde", "Hooligans", "Hawks"],
                'I': ["Invaders", "Idols", "Icons", "Infantry"],
                'J': ["Jets", "Jockeys", "Jugganauts", "Jokers"],
                'K': ["Kings", "Knights", "Killers", "Kingdom"],
                'L': ["Legion", "Legends", "Lovers", "Lions", "Lunatics"],
                'M': ["Maniacs", "Masters", "Mob", "Machines", "Monsters"],
                'N': ["Nation", "Ninjas", "Nomads", "Navigators"],
                'O': ["Outlaws", "Operators", "Oracles", "Order"],
                'P': ["Pack", "Posse", "Patriots", "Pirates", "Phantoms"],
                'R': ["Rebels", "Raiders", "Rangers", "Racers", "Royals"],
                'S': ["Squad", "Storm", "Soldiers", "Survivors", "Saints"],
                'T': ["Team", "Titans", "Troop", "Tribe", "Thunder"],
                'V': ["Vanguard", "Vikings", "Vipers", "Veterans"],
                'W': ["Warriors", "Wolves", "Winners", "Wizards"],
                'Z': ["Zone", "Zealots", "Zombies"]
            };

            if (alliterations[firstLetter]) {
                const suffix = this.randomChoice(alliterations[firstLetter]);
                return `${nameToUse}'s ${suffix}`;
            }
        }

        // Strategy 3: Possessive Suffix (30% chance)
        const name = Math.random() < 0.5 ? firstName : lastName;
        const suffix = this.randomChoice(suffixes);
        return `${name}'s ${suffix}`;
    }

    generateDriver(id) {
        const isMale = Math.random() < 0.5;
        const firstName = isMale ? this.randomChoice(this.maleFirstNames) : this.randomChoice(this.femaleFirstNames);
        const lastName = this.randomChoice(this.lastNames);
        const nickname = Math.random() < 0.4 ? this.randomChoice(this.nicknames) : "";

        const nationality = this.randomChoice(this.nationalities);
        const hometown = this.randomChoice(this.hometowns);
        const teamColor = this.randomChoice(this.teamColors); // Assign a team color

        // Map team color to team name
        const teamNameMap = {
            "#FF0000": "Red Jaguars",
            "#0000FF": "Blue Barracudas",
            "#00FF00": "Green Monkeys",
            "#FFFF00": "Yellow Yetis",
            "#FF00FF": "Pink Flamingos",
            "#00FFFF": "Cyan Cobras",
            "#FF8800": "Orange Iguanas",
            "#8800FF": "Purple Parrots",
            "#FFFFFF": "White Wolves",
            "#808080": "Silver Snakes"
        };
        const teamName = teamNameMap[teamColor] || "Unknown Team";

        // Basic Info
        const driver = {
            id: id,
            // Performance Stats (1-12)
            topSpeed: this.randomFloat(50, 100),
            acceleration: this.randomFloat(50, 100),
            braking: this.randomFloat(50, 100),
            cornering: this.randomFloat(50, 100),
            overtaking: this.randomFloat(50, 100),
            defending: this.randomFloat(50, 100),
            consistency: this.randomFloat(50, 100),
            focus: this.randomFloat(50, 100),
            aggression: this.randomFloat(50, 100),
            wetSkill: this.randomFloat(50, 100),
            tireManagement: this.randomFloat(50, 100),
            fuelEfficiency: this.randomFloat(50, 100),
            
            // Physical/Mental (13-20)
            reactionTime: this.randomFloat(150, 300, 0), // ms
            recovery: this.randomFloat(50, 100),
            composure: this.randomFloat(50, 100),
            adaptability: this.randomFloat(50, 100),
            mechanicRapport: this.randomFloat(50, 100),
            drafting: this.randomFloat(50, 100),
            nightVision: this.randomFloat(50, 100),
            stamina: this.randomFloat(50, 100),

            // Personal Info (21-31)
            firstName: firstName,
            lastName: lastName,
            nickname: nickname,
            age: this.randomInt(18, 45),
            nationality: nationality, // Use generated generic nationality
            hometown: hometown,     // Use generated generic hometown
            height: this.randomInt(60, 80), // inches
            weight: this.randomInt(100, 220), // lbs
            handedness: this.randomChoice(this.handedness),
            vision: this.randomChoice(this.visions),
            gender: isMale ? "Male" : "Female",

            // Career Info (32-35)
            yearsPro: this.randomInt(0, 20),
            carNumber: this.randomInt(1, 99),
            teamName: teamName, // Use mapped team name
            teamColor: teamColor, // Include team color


            // Personality/Trivia (36-50)
            luckyCharm: this.randomChoice(this.luckyCharms),
            preRaceRitual: this.randomChoice(this.rituals),
            phobia: this.randomChoice(this.phobias),
            allergy: this.randomChoice(this.allergies),
            spiritAnimal: this.randomChoice(this.spiritAnimals),
            zodiacSign: this.randomChoice(this.zodiacs),

            leastFavVeg: this.randomChoice(this.veggies),
            sleepAvg: this.randomFloat(4, 10, 1),
            coffeeOrder: this.randomChoice(this.coffeeOrders),
            petName: this.randomChoice(this.petNames),
            petSpecies: this.randomChoice(this.petSpecies),

            highSchoolGPA: this.randomFloat(2.0, 4.0, 2),
            favColor: this.randomColor(),

            // Social/Metagame (51-57)
            charisma: this.randomFloat(0, 100),

            loyalty: this.randomFloat(0, 100),
            greed: this.randomFloat(0, 100),
            mediaSavvy: this.randomFloat(0, 100),
            fanBaseName: this.generateFanBaseName(firstName, lastName, nickname),
            catchphrase: this.randomChoice(this.catchphrases),

            // Relationships (Links) (58-59) - Handled in post-processing
            nemesisId: null,
            bestFriendId: null,

            // RPG Stats (60-65)
            morale: this.randomFloat(50, 100),
            ego: this.randomFloat(0, 100),
            luck: this.randomFloat(0, 100),
            clutchFactor: this.randomFloat(0, 100),
            intimidation: this.randomFloat(0, 100),


            // Booleans (66-69)
            rainHate: Math.random() < 0.2,
            heatStroker: Math.random() < 0.15,
            ovalSpecialist: Math.random() < 0.3,
            homeBonus: Math.random() < 0.1, // Will check against track location in game

            // Risks/History (70-71)
            hangoverRisk: this.randomFloat(0, 50),
            careerDNF: this.randomInt(0, 50),

            // Bio Details (72-80)
            preferredWeather: this.randomChoice(this.preferredWeather),
            bloodType: this.randomChoice(this.bloodTypes),
            shoeSize: this.randomChoice(this.shoeSizes),
            restingHeartRate: this.randomFloat(45, 85, 0),

            morningPerson: Math.random() < 0.5,
            tattooCount: this.randomInt(0, 25),
            siblingCount: this.randomInt(0, 6),
            yearbookSuperlative: this.randomChoice(this.yearbookSuperlatives),

            // Favorites (81-84)
            pizzaTopping: this.randomChoice(this.pizzaToppings),
            favDinosaur: this.randomChoice(this.dinosaurs),
            favTool: this.randomChoice(this.tools),
            preferredHotSauce: this.randomChoice(this.hotSauces),

            // Random Quirks (85-95)
            typingSpeed: this.randomInt(20, 120),
            sockStyle: this.randomChoice(this.sockStyles),
            phoneBattery: this.randomInt(1, 100),
            mostOverusedEmoji: this.randomChoice(this.emojis),
            satScore: this.randomInt(800, 1600),
            favCheese: this.randomChoice(this.cheeses),
            podcastGenre: this.randomChoice(this.podcastGenres),
            tShirtSize: this.randomChoice(this.tShirtSizes),
            catsOrDogs: this.randomChoice(this.catsDogs),
            tpOrientation: this.randomChoice(this.tpOrientation),
            fruitOrRobot: this.randomChoice(["Fruit", "Robot"])
        };

        return driver;
    }

    generateField(count) {
        const field = [];
        for (let i = 0; i < count; i++) {
            field.push(this.generateDriver(i));
        }

        // Post-processing for relationships
        field.forEach(driver => {
            // 30% chance to have a nemesis
            if (Math.random() < 0.3) {
                let nemesis;
                do {
                    nemesis = field[Math.floor(Math.random() * field.length)];
                } while (nemesis.id === driver.id);
                driver.nemesisId = nemesis.id;
            }

            // 40% chance to have a best friend
            if (Math.random() < 0.4) {
                let friend;
                do {
                    friend = field[Math.floor(Math.random() * field.length)];
                } while (friend.id === driver.id || friend.id === driver.nemesisId);
                driver.bestFriendId = friend.id;
            }
        });

        return field;
    }
}

// UI Controller
const generator = new EnhancedDriverGenerator();
const tableBody = document.getElementById('table-body');
const headerRow = document.getElementById('header-row');
const statsPanel = document.getElementById('stats-panel');
const generateBtn = document.getElementById('btn-generate');
const exportBtn = document.getElementById('btn-export');
const statusSpan = document.getElementById('status');

let currentDrivers = [];

const propertyMap = [
    { key: 'id', label: 'ID', type: 'int' },
    { key: 'firstName', label: 'First Name', type: 'string' },
    { key: 'lastName', label: 'Last Name', type: 'string' },
    { key: 'nickname', label: 'Nickname', type: 'string' },
    { key: 'age', label: 'Age', type: 'int' },
    { key: 'nationality', label: 'Nationality', type: 'string' },
    { key: 'teamName', label: 'Team', type: 'string' },
    { key: 'overall', label: 'Overall', type: 'int', calc: (d) => Math.round((d.topSpeed + d.acceleration + d.cornering) / 3) },
    { key: 'topSpeed', label: 'Top Speed', type: 'float' },
    { key: 'acceleration', label: 'Accel', type: 'float' },
    { key: 'cornering', label: 'Cornering', type: 'float' },
    { key: 'aggression', label: 'Aggression', type: 'float' },

    { key: 'luckyCharm', label: 'Lucky Charm', type: 'string' },
    { key: 'favColor', label: 'Color', type: 'color' },
    { key: 'phobia', label: 'Phobia', type: 'string' },
    { key: 'spiritAnimal', label: 'Spirit Animal', type: 'string' },
    { key: 'nemesisId', label: 'Nemesis ID', type: 'int' },
    { key: 'bestFriendId', label: 'BFF ID', type: 'int' },
    { key: 'morningPerson', label: 'Morning?', type: 'bool' },
    { key: 'mostOverusedEmoji', label: 'Emoji', type: 'string' },
    { key: 'favDinosaur', label: 'Dino', type: 'string' },
    { key: 'phoneBattery', label: 'Battery %', type: 'float' }
];

// Generate full list of headers from the first driver object (excluding the mapped ones to avoid dupes if we did dynamic)
// But for the table, we want a specific order or just all of them?
// The prompt asks to flush out the generation and list table. Listing 95 columns is hard, but we can try.
// Let's dynamically generate columns based on the first driver object keys to ensure we show EVERYTHING.

function renderTable(drivers) {
    tableBody.innerHTML = '';
    headerRow.innerHTML = '';

    if (drivers.length === 0) return;

    const keys = Object.keys(drivers[0]);

    // Create Headers
    keys.forEach(key => {
        const th = document.createElement('th');
        // Convert camelCase to Title Case
        const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        th.textContent = title;
        headerRow.appendChild(th);
    });

    // Create Rows
    drivers.forEach(driver => {
        const tr = document.createElement('tr');
        keys.forEach(key => {
            const td = document.createElement('td');
            const value = driver[key];
            
            if (key === 'favColor') {
                td.innerHTML = `<span class="color-swatch" style="background-color: ${value}"></span>${value}`;
            } else if (typeof value === 'boolean') {
                td.textContent = value ? 'Yes' : 'No';
                td.className = value ? 'bool-true' : 'bool-false';
            } else if (typeof value === 'number') {
                td.textContent = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
                td.className = Number.isInteger(value) ? 'col-int' : 'col-float';
            } else {
                td.textContent = value;
                td.className = 'col-string';
            }
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
    
    statusSpan.textContent = `Generated ${drivers.length} drivers.`;
}

function calculateStats(drivers) {
    const avgSpeed = drivers.reduce((acc, d) => acc + d.topSpeed, 0) / drivers.length;
    const avgAge = drivers.reduce((acc, d) => acc + d.age, 0) / drivers.length;


    statsPanel.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Average Top Speed</div>
            <div class="stat-value">${avgSpeed.toFixed(2)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Average Age</div>
            <div class="stat-value">${avgAge.toFixed(1)} yrs</div>
        </div>

        <div class="stat-card">
            <div class="stat-label">Field Size</div>
            <div class="stat-value">${drivers.length}</div>
        </div>
    `;
}

function generate() {
    currentDrivers = generator.generateField(100);
    renderTable(currentDrivers);
    calculateStats(currentDrivers);
}

function exportCSV() {
    if (currentDrivers.length === 0) return;
    
    const keys = Object.keys(currentDrivers[0]);
    const csvRows = [];
    
    // Header
    csvRows.push(keys.join(','));
    
    // Data
    currentDrivers.forEach(driver => {
        const values = keys.map(key => {
            const val = driver[key];
            const stringVal = String(val).replace(/"/g, '""'); // Escape quotes
            return `"${stringVal}"`;
        });
        csvRows.push(values.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'drivers.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Event Listeners
generateBtn.addEventListener('click', generate);
exportBtn.addEventListener('click', exportCSV);

// Initial Load
generate();
