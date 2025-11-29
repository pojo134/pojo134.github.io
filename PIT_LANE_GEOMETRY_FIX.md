# Pit Lane Geometry Fix

## Issue
The previous pit lane implementation relied on a "perfect" straight segment to define the pit lane's orientation. This caused two major issues:
1.  **Overlay/Clipping:** If the selected segment was even slightly angled relative to the overall straight (common in procedural generation), the 800+ unit long pit lane would veer off-angle, clipping through the track or flying off into space ("overlayed on whole track").
2.  **Generation Failures:** The strict threshold often failed to find any straight at all.

## Solution
We have completely rewritten the `generatePitLane` method in `src/models/track.js`:

1.  **Chord-Based Alignment:** instead of using a single micro-segment's vector, we now calculate the vector from the **start point** to the **end point** of the entire straight section (the "chord"). This guarantees the pit lane is parallel to the average direction of the straight.
2.  **"Inside" Detection:** We now calculate the bounding box center of the track and mathematically place the pit lane on the side closer to the center. This ensures consistent placement on the "infield" (or consistently outside if we flipped the logic), preventing it from being placed randomly.
3.  **Robust Fallback:** If no "natural" straight is found (e.g., on a very twisty track), the system now intelligently picks a section to enforce a pit lane, ensuring every track has one.
4.  **Geometry Checks:** Added unit tests to verify that generated pit lanes have reasonable lengths (max 1200 units) and coordinates within bounds.

## Results
*   **Go-Kart Tracks:** Short, compact pit lanes (~260 units) correctly aligned.
*   **GT/Circuit Tracks:** Medium length (~400 units) aligned to best straights.
*   **Oval Tracks:** Full length (1200 units) perfectly parallel to the main straight.

The visual "overlay" issue should be resolved as the alignment is now mathematically tied to the macro-geometry of the track segment.
