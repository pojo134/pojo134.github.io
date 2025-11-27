"""
Demo script that uses track_generator.generate_track to create JSON outputs
for each league: a wire outline (centerline waypoints) and full track data.

Run:
    python .\generate_tracks_demo.py

It writes files `track_<league>_wire.json` and `track_<league>_full.json` in the repo folder.
"""

import json
from track_generator import generate_track

LEAGUES = ['Go-Kart', 'GT', 'LM', 'Open wheel', 'Stock Car']


def safe_name(name: str) -> str:
    return name.lower().replace(' ', '_')


def main():
    for league in LEAGUES:
        t = generate_track(league, seed=42)
        wire = {
            'name': t.name,
            'type': t.type,
            'characteristics': t.characteristics,
            'waypoints': t.waypoints  # centerline produced by sampling
        }
        full = {
            'name': t.name,
            'type': t.type,
            'characteristics': t.characteristics,
            'waypoints': t.waypoints,
            'control_points': t.track_data.get('control_points') if t.track_data else None,
            'track_width': t.track_data.get('track_width') if t.track_data else None
        }
        fname_base = f"track_{safe_name(league)}"
        with open(fname_base + '_wire.json', 'w', encoding='utf-8') as f:
            json.dump(wire, f, indent=2)
        with open(fname_base + '_full.json', 'w', encoding='utf-8') as f:
            json.dump(full, f, indent=2)
        print(f"Wrote {fname_base}_wire.json and {fname_base}_full.json")


if __name__ == '__main__':
    main()
