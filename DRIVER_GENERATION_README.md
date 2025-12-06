# Driver Generation Test Suite

This test suite generates comprehensive driver profiles for Redline Roulette, expanding the driver model to include over 95 unique properties ranging from performance stats to personal trivia.

## Files
- `driver-generation-test.html`: The main entry point for the test suite.
- `test_driver_generator.js`: Contains the `EnhancedDriverGenerator` class and UI logic.

## How to Run
1. Ensure your local web server is running (e.g., `python -m http.server 8000` or `npx serve`).
2. Navigate to `http://localhost:8000/driver-generation-test.html`.
3. Click "Generate 100 Drivers" to create a new batch.
4. View the generated drivers in the table.
5. Click "Export CSV" to download the data for analysis or integration.

## Features
- **95+ Properties:** Includes racing stats, physical attributes, personality quirks, and RPG elements.
- **Relationships:** Automatically links drivers as Nemeses or Best Friends.
- **Visuals:** Displays color swatches and formatted booleans.
- **Stats Panel:** Shows aggregate statistics for the generated field.
