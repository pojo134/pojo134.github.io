# **Game Design Document: Redline Roulette**

Genre: Simulation / Strategy / Roguelike  
Perspective: Top-Down 2D  
Visual Style: Minimalist Pixel Art (8-bit aesthetic)  
Platform: PC (Mouse & Keyboard)  
Target Resolution: 1280x720 (Native)

## **1\. High Concept**

**Redline Roulette** is a racecar betting simulator where the player fights against variance and "The House." You are a gambler progressing through the underground racing circuit. You don't drive the cars; you analyze the odds, place bets, and use your **"Burner Phone"** to influence the race results without getting caught.

### **The Core Loop**

1. **Analyze:** Review the track layout, weather forecast, and generated driver stats.  
2. **Bet:** Place wagers on specific outcomes (Winner, Top 3, Head-to-Head, Prop Bets).  
3. **Influence:** Watch the race unfold in real-time. Use "Contacts" via your phone to cheat, sabotage, or boost drivers.  
4. **Upgrade:** Use winnings to buy better info, stronger contacts, or buy the "License" for higher Racing Leagues.

## **2\. Visuals & Audio Specification**

### **Graphics**

* **Scale:** Sprites are scaled small to emphasize the full track view on a single screen.  
* **Cars:** **8x8 Pixels**. Minimalist shapes defined by high-contrast primary colors.  
  * *Kart:* 4 dots \+ helmet pixel.  
  * *Stock Car:* Boxy rectangle block.  
  * *Indy Car:* "T" shape (narrow nose, wide rear).  
  * *Dragster:* Long thin line (2x8).  
* **Tracks:** **32x32 Tile-set**. Dark asphalt, green grass, red/white curbs.  
* **UI:** "Data-heavy" but stylized (Retro Dashboard font).  
  * *Betting Screen:* Fighting game character select style (flashing portraits, VS screens).  
  * *Race Screen:* Clean overlay with a "Burner Phone" pixel art interface in the bottom right.

### **Audio**

* **Music:** None (initially). Focus on ambient immersion.  
* **SFX (AI Generated):**  
  * **Engine Drone:** Pitch shifts based on speed. Must vary by League (High whine for Indy, deep rumble for Stock, lawnmower buzz for Karts).  
  * **Positional Audio:** The car you bet on has a slightly louder/distinct engine sound to help track it in the pack.  
  * **UI Sounds:** Old school "Nokia" button beeps for the phone, "Cash Register" cha-ching for wins, low thud for losses.

## **3\. Game Progression (The Roguelike Structure)**

### **The Season Format**

Instead of a branching map, the game uses a **Season Calendar**.

* **Weekly Contracts:** Between races, you choose 1 of 3 race invites (Safe, Risky, or Special/Gimmick).  
* **The Goal:** Reach a specific **Profit Target** or **Reputation Score** by the end of the Season to afford the "License" for the next League Tier.  
* **Failure Condition:** Reaching $0 Bankroll or failing to buy the next License results in a Game Over (Roguelike Reset).

### **The Leagues (Vehicle Types)**

Each league changes the physics simulation and betting strategy.

**Tier 1: The Roots (Chaos)**

* **Go-Karts:**  
  * *Physics:* "Bumper Cars." Very high acceleration, low top speed. No damage from collisions.  
  * *Betting Meta:* **Aggression.** Bullying works here.  
* **Dirt Track:**  
  * *Physics:* Low traction. Sprites rotate 45 degrees (drifting). Mud degrades the track over time (changing grip levels).  
  * *Betting Meta:* **Handling & Stamina.** Aggressive drivers spin out.

**Tier 2: The Semi-Pros (Contact)**

* **Legends Cars (1930s Coupes):**  
  * *Physics:* Bouncy suspension (visual wobble). Loose handling. High chance of "Vendettas" forming.  
* **Stock Cars (NASCAR Style):**  
  * *Physics:* Pack racing. **Drafting Mechanic** (cars move 20% faster when directly behind another). The "Big One" (one crash takes out 5 cars).  
  * *Betting Meta:* **Teamwork.** Drivers of the same color/team draft together.

**Tier 3: The Professionals (Precision)**

* **GT3 / Touring:**  
  * *Physics:* High grip. Braking zones are critical. **Weather** (Rain) drastically affects cornering speed.  
  * *Betting Meta:* **Weather Watching.**  
* **Open Wheel (Indy/F1):**  
  * *Physics:* Extreme speed. **Fragility** (Cars explode/DNF on contact). Pit stops must be perfect (2 seconds).  
  * *Betting Meta:* **Qualifying.** The car that starts first usually stays first unless sabotaged.

**Tier 4: The Endurance**

* **Le Mans (LMP):**  
  * *Physics:* Multi-class racing. Fast cars must weave through slower AI traffic. Day/Night cycle visibility.  
  * *Betting Meta:* **Traffic Management.**

**Bonus Mode: The Drag Strip**

* Occurs randomly between seasons.  
* **Format:** Tournament Bracket (Top 8).  
* **Gameplay:** 5-second races. Purely based on Reaction Time \+ Top Speed.  
* **Betting:** You bet on the winner of the *entire bracket*.

## **4\. Mechanics & Systems**

### **The Drivers (Procedural Generation)**

Every run generates a new roster. Drivers have stats (1-100):

* **Top Speed:** Max velocity on straights.  
* **Cornering:** Speed maintained in turns.  
* **Aggression:** Likelihood to attempt risky overtakes (increases crash chance).  
* **Reliability:** Resistance to mechanical failure (blown engines, flat tires).  
* **Stamina:** Ability to maintain stats in the final laps.  
* **Hidden Traits:** *e.g., "Rain Master," "Choker" (stats drop if leading), "Vendetta" (targets specific rival).*

### **The Burner Phone (Active Influence)**

Replaces "Cards." Located in the bottom-right of the HUD.

* **Mechanic:** Click a contact to trigger an immediate effect.  
* **Resources:**  
  * **Battery:** Action points per race.  
  * **Heat:** Suspicion meter. If it hits 100%, investigation triggers (Contacts disabled for next 2 races \+ Fine).  
* **Contacts (Examples):**  
  * *The Spotter:* "Take the wide line" (Target driver avoids crashes for 10s).  
  * *The Marshal:* "Yellow Flag" (Slows race, bunches pack).  
  * *The Heckler:* "Rattle Him" (Lowers target's focus/cornering).  
  * *The Engineer:* "Overclock" (Boosts speed, lowers reliability significantly).  
  * *The Water Truck (Dirt only):* Floods the high line of the track.

### **The Garage (The Hub)**

Between races, spend money to upgrade your "Setup":

* **TV Setup:** Better monitors reveal Hidden Traits and real-time crash probabilities.  
* **Rolodex:** Increases the number of Contacts you can bring to a race.  
* **Minibar:** Reduces "Player Nerves" (Visual effects like shake/blur during high tension moments).

## **5\. UI Screen Flow**

1. **Main Menu:** Continue, New Game, Load Game, Settings, Exit.  
2. **The Garage:** View stats, upgrade equipment, choose Weekly Contract (Race Invite).  
3. **Place Bets Screen:**  
   * **Top Left:** Track Map (Highways vs. Technical).  
   * **Top Right:** Selected Driver Portrait (Animated/Flashing).  
   * **Bottom:** Scrollable list of drivers with Stats and Odds.  
4. **Race Screen:**  
   * **Main View:** Large window of the track.  
   * **Left Edge:** Live Leaderboard (updates real-time).  
   * **Bottom Center:** Text Ticker (Crashes, overtakes, events).  
   * **Bottom Right:** **Burner Phone** (Pop-up menu).  
5. **Results Screen:** Podium, Payout calculation, Auto-save.

## **6\. Technical Requirements**

* **Pathfinding:** Waypoint system for the racing line. Overtaking logic requires cars to temporarily deviate from the main path.  
* **Physics Engine:** 2D collision detection. Momentum calculations for "drifting" visual effects.  
* **Odds Algorithm:** (Driver Stats \+ Track Suitability) / Field Strength \= Win Probability.