# Pit Lane Simplification

## User Feedback
*   **Visuals:** The pit lane in Race Mode felt "too large", had an unwanted yellow border, and stall alignment was tricky.
*   **Goal:** "Just have a grey box directly beside the track". Keep proportions similar to the test view (where it looked good).

## Changes Implemented (`src/models/track.js`)
1.  **Removed Complexity:** Deleted the rendering code for the **Yellow Border** and the **White Stall Boxes**.
2.  **Simplified Style:** The pit lane now renders as a single, clean, light-grey stroke (`#666666`).
3.  **Proportions:** Kept the logic that scales the pit width relative to the track scale (`pl.width * scale`), ensuring it remains proportional across different screen sizes (Test vs Race Screen).

## Verification
*   **Appearance:** Pit lane is now a simple, unobtrusive grey rectangle parallel to the track.
*   **Clutter:** No more misaligned boxes or distracting borders.
*   **Consistency:** Drag races still have no pit lane (preserved from previous fix).
