# 🏁 Redline Roulette

**A Racing Betting Simulator with Roguelike Elements**

![Genre](https://img.shields.io/badge/Genre-Simulation%20%2F%20Strategy%20%2F%20Roguelike-blue)
![Platform](https://img.shields.io/badge/Platform-Web%20Browser-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)

## 🎮 Play Now

**[Play Redline Roulette](https://pojo134.github.io/)**

## 📖 About

Redline Roulette is a racecar betting simulator where you fight against variance and "The House." You are a gambler progressing through the underground racing circuit. You don't drive the cars; you analyze the odds, place bets, and use your **"Burner Phone"** to influence race results without getting caught.

### Core Gameplay Loop

1. **Analyze** - Review track layout, weather forecast, and generated driver stats
2. **Bet** - Place wagers on specific outcomes (Winner, Top 3, Head-to-Head)
3. **Influence** - Watch the race unfold in real-time. Use contacts via your phone to cheat, sabotage, or boost drivers
4. **Upgrade** - Use winnings to buy better info, stronger contacts, or buy the "License" for higher Racing Leagues

## 🏎️ Features

- **5 Racing Tiers** - Progress from Go-Karts to GT3 to Open Wheel racing
- **Procedural Generation** - Every season generates new drivers, tracks, and odds
- **Strategic Betting** - Multiple bet types with realistic odds calculations
- **Burner Phone System** - Influence races with strategic contact usage
- **Roguelike Structure** - Seasonal progression with permanent consequences
- **16-Week Seasons** - Build your bankroll and advance through tiers
- **Full Save System** - 3 save slots with auto-save functionality
- **Retro Aesthetic** - Minimalist 8-bit pixel art style

## 🎯 Racing Leagues

### Tier 1: The Roots
- **Go-Karts** - Chaotic bumper car physics
- **Dirt Track** - Low traction, drifting mechanics

### Tier 2: The Semi-Pros
- **Stock Cars** - Pack racing with drafting mechanics
- Contact-heavy racing

### Tier 3: The Professionals
- **GT3 / Touring** - Weather-dependent, high-grip racing
- **Open Wheel** - Extreme speed, fragile cars

### Tier 4: The Endurance
- **Le Mans (LMP)** - Multi-class racing with day/night cycles

## 🎲 Game Modes

- **Career Mode** - Progress through all tiers, build your empire
- **Drag Strip** - Bonus tournament bracket racing between seasons
- **Free Play** - Practice betting strategies without risk

## 🛠️ Technical Details

- **Engine**: Pure HTML5 Canvas + Vanilla JavaScript
- **Resolution**: 1280x720 native
- **Performance**: 60 FPS target
- **Physics**: Waypoint-based racing with realistic AI
- **Save System**: LocalStorage with backup/restore

## 📊 Statistics Tracking

- Total races entered
- Win percentage
- Biggest win/loss
- Favorite tracks and vehicles
- Season completion rate
- Net profit over time

## 🎨 Credits

- **Design Document**: Included in repository
- **Game Development**: Built with Claude Code
- **Art Style**: Minimalist 8-bit aesthetic
- **Sprites**: Greyscale base with color overlay system

## 🧪 Testing

Run the automated test suite:

```bash
open test.html
```

40 comprehensive tests covering:
- Game flow and state management
- Betting system and payouts
- Race simulation accuracy
- Save/load integrity

## 📝 Documentation

- [Design Document](Redline-Roulette%20-%20Outline%20and%20Design%20Document.md) - Full game design specification
- [Test Suite Summary](TEST-SUITE-SUMMARY.md) - Testing documentation
- [Burner Phone Integration](BURNER_PHONE_INTEGRATION.md) - Contact system details

## 🚀 Development

### Project Structure

```
├── index.html              # Main game entry point
├── game.js                 # Core game engine
├── gamestate.js           # State management
├── screens.js             # All UI screens
├── generators.js          # Procedural generation systems
├── racing.js              # Physics and race simulation
├── saveload.js            # Save/load system
├── styles.css             # Game styling
└── test-suite.js          # Automated tests
```

### Running Locally

1. Clone the repository
2. Open `index.html` in a modern web browser
3. No build process required!

## 🎮 Controls

- **Mouse** - All interactions (click-based UI)
- **Keyboard** - ESC to pause, F5 for quick save

## 💰 Betting System

### Bet Types

1. **Win Bet** - Pick the race winner (highest payout)
2. **Top 3 Bet** - Driver finishes in top 3 (safer option)
3. **Head-to-Head** - One driver beats another (coming soon)

### Strategy Tips

- Study driver stats before betting
- Weather affects cornering performance
- Aggressive drivers are risky but rewarding
- Use the Burner Phone wisely (limited battery!)
- Save money for tier advancement licenses

## 🏆 Progression

- **Starting Bankroll**: $10,000
- **Tier 2 License**: $50,000
- **Tier 3 License**: $100,000
- **Tier 4 License**: $200,000
- **Tier 5 License**: $400,000

Reach $0 and it's **Game Over** (roguelike permadeath)

## 🔧 Future Enhancements

- Sound effects and music
- Additional track varieties
- More burner phone contacts
- Championship leaderboards
- Multiplayer betting pools
- Mobile responsive design

## 📜 License

This project is a demonstration of game development with AI assistance.

---

**Built with ❤️ and lots of ☕**

*Ready to test your luck? Place your bets!* 🎲
