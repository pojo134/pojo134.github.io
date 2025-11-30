# Redline Roulette - Art Asset Inventory

This document outlines all the necessary sprite and texture assets required to fully implement the visual design of *Redline Roulette*.

## 1. Car Sprites
These sprites should be grayscale with transparency. The game engine applies team colors dynamically using a "multiply" blend mode.
*   **Format:** PNG (Transparent background)
*   **Orientation:** Facing Right (0 degrees)
*   **Resolution Target:** ~64x32px to 128x64px

| Filename | Description | Usage |
| :--- | :--- | :--- |
| `gokart.png` | Simple open-frame kart with driver visible. | Tier 1 Vehicle |
| `stockcar.png` | Full-bodied sedan racer (NASCAR style). | Tier 2 Vehicle |
| `gt3.png` | Sleek sports car with large rear wing. | Tier 3 Vehicle |
| `openwheel.png` | Formula-style racer (F1/Indy) with exposed wheels. | Tier 4 Vehicle |
| `topfuel.png` | Long dragster with massive rear tires (for Drag mode). | Tier 5 Vehicle |

## 2. Track & Environment Textures
Seamless textures used to fill shapes or tile across backgrounds.
*   **Format:** PNG/JPG
*   **Resolution Target:** 256x256px or 512x512px (Tileable)

| Filename | Description | Usage |
| :--- | :--- | :--- |
| `track_asphalt.png` | Dark grey noisy asphalt texture. | Race track surface |
| `track_dirt.png` | Brown packed dirt/gravel texture. | Off-road sections/tracks |
| `grass_seamless.png` | Green grass pattern. | Off-track areas |
| `rumble_strip.png` | Red and white alternating stripes. | Track borders/curbs |
| `start_finish_line.png` | Black and white checkered pattern strip. | Start/Finish line overlay |
| `background_grid.png` | Retro-style neon grid (Synthwave aesthetic). | Main Menu / Void background |

## 3. UI Elements - General
Common interface elements reused across screens.
*   **Format:** PNG (Transparent background)

| Filename | Description | Usage |
| :--- | :--- | :--- |
| `panel_bg.png` | Semi-transparent dark pane with technological borders. | Windows, popup backgrounds |
| `button_normal.png` | Standard button background. | Interactable buttons |
| `button_hover.png` | Highlighted/Glowing button background. | Hover state |
| `button_disabled.png` | Greyed out/dimmed button background. | Locked options |
| `icon_cash.png` | Green dollar sign or cash stack. | Bankroll display |
| `game_logo.png` | Stylized "Redline Roulette" logo text. | Main Menu Title |

## 4. UI Elements - Garage & Upgrades
Specific icons for the upgrade shop.

| Filename | Description | Usage |
| :--- | :--- | :--- |
| `icon_tv.png` | Retro TV set or camera icon. | "TV Setup" Upgrade |
| `icon_rolodex.png` | Old-school rolodex or address book. | "Rolodex" Upgrade |
| `icon_minibar.png` | Cocktail glass or bottle. | "Minibar" Upgrade |
| `bg_garage.png` | Dark workshop interior (can be blurred). | Garage Screen Background |

## 5. UI Elements - Race HUD & Burner Phone
Assets for the in-race interface and the unique "Burner Phone" mechanic.

| Filename | Description | Usage |
| :--- | :--- | :--- |
| `phone_frame.png` | Outline of an old brick phone or flip phone. | Burner Phone container |
| `icon_battery.png` | Battery charge indicator. | Phone resource meter |
| `icon_signal.png` | Signal bars (antenna icon). | Connectivity indicator |
| `icon_spotter.png` | Binoculars or headset icon. | "Spotter" Contact |
| `icon_marshal.png` | Crossed flags or official's hat. | "Marshal" Contact |
| `icon_heckler.png` | Megaphone or angry face. | "Heckler" Contact |
| `icon_engineer.png` | Wrench or gear icon. | "Engineer" Contact |
| `flag_yellow.png` | Solid yellow flag. | Caution status indicator |
| `flag_green.png` | Solid green flag. | Race active indicator |
| `flag_checkered.png` | Checkered flag. | Race finish indicator |

## 6. Drag Race Specific
*   **Christmas Tree:** The starting light tower for drag races.
    *   `light_tree_off.png`
    *   `light_tree_prestage.png`
    *   `light_tree_stage.png`
    *   `light_tree_amber.png`
    *   `light_tree_green.png`
    *   `light_tree_red.png`
