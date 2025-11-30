# Audio System Architecture

The game uses a singleton `AudioManager` class (`src/core/audio.js`) to manage background music and sound effects.

## Key Components
- **AudioManager**: Handles loading, playing, stopping, and volume control of audio tracks. Maps `GameStates` to specific audio files.
- **GameState**: Stores audio settings (`musicVolume`, `sfxVolume`, `muted`) in `this.audio` property, ensuring persistence in save files.
- **Game Loop**: `src/core/game.js` checks for state changes in `_update()` and calls `audioManager.playMusicForState()`.
- **Settings Screen**: Provides UI controls (Mute checkbox, Volume sliders) to modify `GameState` audio settings.

## Audio Files
Music tracks are located in `assets/audio/music/` and are mapped as follows:
- `MAIN_MENU`: `Main Menu Theme.mp3`
- `GARAGE`, `BETTING`: `Garage Screen Theme.mp3` (Shared instance to prevent restart on transition)
- `RACE`: `Race Screen Theme.mp3`
- `DRAG_RACE`: `Drag Race Theme.mp3`
- `RESULTS`, `TIER_ADVANCEMENT`, `GAME_OVER`: `Results Screen Theme.mp3`

## Volume Handling
- Default music volume is set to 0.5 (50%).
- Volume scaling is linear (Slider Value = Actual Volume).
- Muting sets actual volume to 0 but preserves the slider value.
- Changes in the settings menu update all tracks immediately.

## Usage
To play a sound or music:
```javascript
// In Game class or where audioManager is accessible
this.audioManager.playMusicForState(GameStates.MAIN_MENU);
```
(SFX support is structured in `AudioManager` but specific SFX files/methods need implementation).