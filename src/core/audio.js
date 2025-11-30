import { GameStates } from './constants.js';

export class AudioManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.currentTrack = null;
        this.musicTracks = {};
        this.isInitialized = false;

        // Initialize tracks
        this.initTracks();
    }

    initTracks() {
        // Create audio instances
        const mainMenuTheme = new Audio('assets/audio/music/Main Menu Theme.mp3');
        const garageTheme = new Audio('assets/audio/music/Garage Screen Theme.mp3');
        const raceTheme = new Audio('assets/audio/music/Race Screen Theme.mp3');
        const dragRaceTheme = new Audio('assets/audio/music/Drag Race Theme.mp3');
        const resultsTheme = new Audio('assets/audio/music/Results Screen Theme.mp3');

        // Map GameStates to audio files
        this.musicTracks = {
            [GameStates.MAIN_MENU]: mainMenuTheme,
            [GameStates.GARAGE]: garageTheme,
            [GameStates.RACE]: raceTheme,
            [GameStates.DRAG_RACE]: dragRaceTheme,
            [GameStates.RESULTS]: resultsTheme,
            
            // Reused themes
            // [GameStates.BETTING]: new Audio('assets/audio/music/Garage Screen Theme.mp3'), // Original behavior: restart track
            [GameStates.BETTING]: garageTheme, // New behavior: continue playing garage theme
            
            [GameStates.TIER_ADVANCEMENT]: resultsTheme,
            [GameStates.GAME_OVER]: resultsTheme,
            
            // States that shouldn't interrupt music (keep playing previous)
            [GameStates.SETTINGS]: null,
            [GameStates.LOAD_GAME]: null
        };

        // Configure looping
        Object.values(this.musicTracks).forEach(track => {
            if (track) {
                track.loop = true;
            }
        });
        
        // Apply initial volume
        this.updateVolume();
        
        this.isInitialized = true;
    }

    /**
     * Plays music for the specified game state
     * @param {string} state - The GameState to play music for
     */
    playMusicForState(state) {
        if (!this.isInitialized) return;

        const nextTrack = this.musicTracks[state];

        // If nextTrack is explicitly null (e.g., SETTINGS), we keep playing the current track.
        // However, if the state is not in the map at all (undefined), we might want to stop or default.
        // For now, we assume undefined means "no change" or "stop".
        // But looking at the map, we cover most states.
        
        if (nextTrack === null) {
            return; // Continue playing current music
        }

        if (nextTrack === undefined) {
             // If unknown state, maybe stop music? Or keep playing? 
             // Let's keep playing for safety, or log warning.
             console.warn(`No music defined for state: ${state}`);
             return;
        }

        // If the requested track is already playing, do nothing
        if (this.currentTrack === nextTrack && !this.currentTrack.paused) {
            return;
        }

        // Stop current track
        this.stopMusic();

        // Play new track
        if (nextTrack) {
            this.currentTrack = nextTrack;
            this.updateVolume(); // Ensure volume is correct before playing
            
            const playPromise = nextTrack.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Auto-play policy might block playback until user interaction
                    console.warn("Audio playback failed (waiting for user interaction):", error);
                });
            }
        }
    }

    /**
     * Stops the currently playing music
     */
    stopMusic() {
        if (this.currentTrack) {
            this.currentTrack.pause();
            this.currentTrack.currentTime = 0; // Reset to beginning
            // We don't set this.currentTrack to null here because we might want to resume?
            // No, for this simple implementation, stop means stop.
            this.currentTrack = null;
        }
    }

    /**
     * Updates the volume of all tracks based on GameState
     */
    updateVolume() {
        // Direct volume mapping as requested: Slider Value = Volume
        const musicVolume = this.gameState.audio.muted ? 0 : this.gameState.audio.musicVolume;
        
        Object.values(this.musicTracks).forEach(track => {
            if (track) {
                track.volume = musicVolume;
            }
        });
    }

    /**
     * Sets the music volume (0.0 to 1.0)
     */
    setMusicVolume(volume) {
        this.gameState.audio.musicVolume = Math.max(0, Math.min(1, volume));
        this.updateVolume();
    }

    /**
     * Toggles mute state
     */
    toggleMute() {
        this.gameState.audio.muted = !this.gameState.audio.muted;
        this.updateVolume();
        
        // If unmuted and we have a current track that was paused/silenced, ensure it's playing
        if (!this.gameState.audio.muted && this.currentTrack && this.currentTrack.paused) {
            this.currentTrack.play().catch(e => console.warn(e));
        }
    }
}
