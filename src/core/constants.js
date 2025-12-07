export const GameStates = Object.freeze({
    MAIN_MENU: 'MAIN_MENU',
    GARAGE: 'GARAGE',
    BETTING: 'BETTING',
    RACE: 'RACE',
    DRAG_RACE: 'DRAG_RACE', // Added DRAG_RACE state
    RESULTS: 'RESULTS',
    SETTINGS: 'SETTINGS',
    LOAD_GAME: 'LOAD_GAME',
    GAME_OVER: 'GAME_OVER',
    TIER_ADVANCEMENT: 'TIER_ADVANCEMENT',
    CREDITS: 'CREDITS'
});

export const RaceState = Object.freeze({
    PRE_RACE: 'PRE_RACE',
    RACING: 'RACING',
    FINISHED: 'FINISHED',
    PRE_HEAT: 'PRE_HEAT',
    HEAT_FINISHED: 'HEAT_FINISHED'
});

export const CarStatus = Object.freeze({
    RACING: 'RACING',
    PIT_STOP: 'PIT_STOP', // New status for cars pitting
    DNF_CRASH: 'DNF_CRASH',
    DNF_MECHANICAL: 'DNF_MECHANICAL',
    FINISHED: 'FINISHED'
});

export const EventType = Object.freeze({
    RACE_START: 'RACE_START',
    OVERTAKE: 'OVERTAKE',
    CRASH: 'CRASH',
    MECHANICAL_FAILURE: 'MECHANICAL_FAILURE',
    YELLOW_FLAG: 'YELLOW_FLAG',
    CAUTION_END: 'CAUTION_END', // New event
    PIT_STOP: 'PIT_STOP',       // New event
    LAP_COMPLETE: 'LAP_COMPLETE',
    RACE_FINISH: 'RACE_FINISH',
    CONTACT_USED: 'CONTACT_USED'
});

export const ContactType = Object.freeze({
    SPOTTER: 'Spotter',
    MARSHAL: 'Marshal',
    HECKLER: 'Heckler',
    ENGINEER: 'Engineer'
});