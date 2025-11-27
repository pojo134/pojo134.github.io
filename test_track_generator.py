import unittest
import math
import random
from track_generator import Vec2, Track, generate_track, generate_go_kart_track, generate_gt_track, generate_lm_track, generate_open_wheel_track, generate_stock_car_track, check_collision

class TestTrackGenerator(unittest.TestCase):
    pass
    def test_track_instantiation(self):
        track = Track("Test Track", 20, 0.5, 100, "circuit")
        self.assertEqual(track.name, "Test Track")
        self.assertEqual(track.complexity, 20)
        self.assertEqual(track.windiness, 0.5)
        self.assertEqual(track.straight_length, 100)
        self.assertEqual(track.track_type, "circuit")
        self.assertEqual(track.waypoints, [])
        self.assertEqual(track.full_waypoints, [])

    def test_initial_shape_circuit(self):
        track = generate_track("Test Circuit", 20, 0.5, 100, "circuit")
        self.assertIsNotNone(track)
        self.assertTrue(len(track.waypoints) >= 15)

    def test_initial_shape_oval(self):
        track = generate_track("Test Oval", 10, 0.1, 150, "oval")
        self.assertIsNotNone(track)
        self.assertTrue(len(track.waypoints) >= 8)

    def test_initial_shape_tri_oval(self):
        track = generate_track("Test Tri-Oval", 12, 0.1, 150, "tri-oval")
        self.assertIsNotNone(track)
    def test_subdivision_pass(self):
        track = generate_track("Test Subdivision", 30, 0.5, 50, "circuit")
        self.assertIsNotNone(track)
        self.assertGreater(len(track.waypoints), 15)

    def test_relaxation_pass(self):
        # It's hard to assert specific changes, but we can check if the track is still valid
        track = generate_track("Test Relaxation", 30, 0.5, 50, "circuit")
        self.assertIsNotNone(track)
        self.assertFalse(check_collision(track.waypoints, 30))

    def test_get_start_finish_line(self):
        track = generate_track("Test Start/Finish", 30, 0.5, 50, "circuit")
        self.assertIsNotNone(track)
        track.generate_full_waypoints()
        start_a, start_b = track.get_start_finish_line()
    def _run_league_generation_test(self, generator_func, min_complexity, max_complexity):
        tracks = [generator_func() for _ in range(100)]
        for track in tracks:
            self.assertIsNotNone(track)
            self.assertGreaterEqual(track.complexity, min_complexity)
            self.assertLessEqual(track.complexity, max_complexity)
            self.assertFalse(check_collision(track.waypoints, 30))

    def test_generate_go_kart_track(self):
        self._run_league_generation_test(generate_go_kart_track, 20, 40)

    def test_generate_gt_track(self):
        self._run_league_generation_test(generate_gt_track, 40, 50)

    def test_generate_lm_track(self):
        self._run_league_generation_test(generate_lm_track, 45, 50)
        self.assertIsInstance(start_a, Vec2)
    def test_generate_open_wheel_track(self):
        tracks = [generate_open_wheel_track() for _ in range(200)] # Larger sample for probability
        oval_count = 0
        for track in tracks:
            self.assertIsNotNone(track)
            self.assertGreaterEqual(track.complexity, 55)
            self.assertLessEqual(track.complexity, 60)
            self.assertFalse(check_collision(track.waypoints, 30))
            if track.track_type in ['oval', 'tri-oval']:
                oval_count += 1
        
        # Check if the oval/tri-oval probability is approximately 5%
        self.assertAlmostEqual(oval_count / 200, 0.05, delta=0.04)

    def test_generate_stock_car_track(self):
        self._run_league_generation_test(generate_stock_car_track, 8, 20)
        self.assertIsInstance(start_b, Vec2)
        self.assertNotEqual(start_a.x, start_b.x)
        self.assertNotEqual(start_a.y, start_b.y)
        self.assertTrue(len(track.waypoints) >= 6)