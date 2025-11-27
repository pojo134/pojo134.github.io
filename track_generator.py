import math
import random
from typing import List, Tuple, Optional

# --- Configuration Constants (Can be adjusted) ---
TRACK_WIDTH = 30
MAP_SIZE = (800, 600)
CENTER = (MAP_SIZE / 2, MAP_SIZE / 2)
MARGIN = 60 # Screen margin for point generation check

# --- Vec2 Class (Translated from JS) ---
class Vec2:
    """A simple 2D vector class for geometric operations."""
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def __repr__(self) -> str:
        return f"Vec2({self.x:.2f}, {self.y:.2f})"

    def add(self, v: 'Vec2') -> 'Vec2':
        return Vec2(self.x + v.x, self.y + v.y)

    def sub(self, v: 'Vec2') -> 'Vec2':
        return Vec2(self.x - v.x, self.y - v.y)

    def mul(self, s: float) -> 'Vec2':
        return Vec2(self.x * s, self.y * s)

    def len(self) -> float:
        return math.sqrt(self.x**2 + self.y**2)

    def norm(self) -> 'Vec2':
        l = self.len()
        return Vec2(0, 0) if l == 0 else Vec2(self.x / l, self.y / l)

    def perp(self) -> 'Vec2':
        return Vec2(-self.y, self.x) 

    def dist(self, v: 'Vec2') -> float:
        return math.sqrt((self.x - v.x)**2 + (self.y - v.y)**2)

    def dot(self, v: 'Vec2') -> float:
        return self.x * v.x + self.y * v.y

# --- Track Class ---
class Track:
    """Stores track data, including waypoints (control points) and full track representation."""
    def __init__(self, name: str, complexity: int, windiness: float, straight_length: int, track_type: str, waypoints: List[Vec2] = None):
        self.name = name
        self.complexity = complexity
        self.windiness = windiness
        self.straight_length = straight_length
        self.track_type = track_type
        self.waypoints: List[Vec2] = waypoints if waypoints is not None else []  # Control points (wire outline)
        self.full_waypoints: List[Vec2] = []                                   # Spline-interpolated points (full representation)
        self.wire_outline: List[Tuple[Vec2, Vec2]] = []                        # Left/Right edges of the track (for rendering/physics)

    def generate_full_waypoints(self, steps: int = 20):
        """Phase 4: Generate a smooth, dense path using Catmull-Rom splines."""
        self.full_waypoints = []
        n = len(self.waypoints)
        if n < 3: return

        for i in range(n):
            p0 = self.waypoints[(i - 1 + n) % n]
            p1 = self.waypoints[i]
            p2 = self.waypoints[(i + 1) % n]
            p3 = self.waypoints[(i + 2) % n]
            
            for t in range(steps):
                self.full_waypoints.append(get_spline_point(p0, p1, p2, p3, t / steps))

    def get_start_finish_line(self) -> Tuple[Vec2, Vec2]:
        """Returns the start/finish line segment (point A, point B)."""
        if len(self.full_waypoints) < 2:
            return Vec2(0, 0), Vec2(0, 0)

        w0 = self.full_waypoints
        w1 = self.full_waypoints
        
        # Calculate the normal (perpendicular) vector to the track direction at the start
        dir_vec = w1.sub(w0).norm()
        normal = dir_vec.perp()
        
        # Start and end points of the line across the track
        start_a = w0.sub(normal.mul(TRACK_WIDTH / 2))
        start_b = w0.add(normal.mul(TRACK_WIDTH / 2))
        
        return start_a, start_b

# --- Geometric Algorithms (Translated from JS) ---

def get_spline_point(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: float) -> Vec2:
    """Catmull-Rom spline interpolation."""
    t2 = t * t
    t3 = t2 * t
    b0 = 0.5 * (-t3 + 2 * t2 - t)
    b1 = 0.5 * (3 * t3 - 5 * t2 + 2)
    b2 = 0.5 * (-3 * t3 + 4 * t2 + t)
    b3 = 0.5 * (t3 - t2)
    return Vec2(
        p0.x * b0 + p1.x * b1 + p2.x * b2 + p3.x * b3,
        p0.y * b0 + p1.y * b1 + p2.y * b2 + p3.y * b3
    )

def point_to_segment_distance(p: Vec2, a: Vec2, b: Vec2) -> float:
    """Distance from point p to line segment ab."""
    l2 = (b.x - a.x)**2 + (b.y - a.y)**2
    if l2 == 0: 
        return p.dist(a)
    
    # Project p onto the line ab
    t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2
    t = max(0, min(1, t)) # Clamp t to for segment check
    
    proj = a.add(b.sub(a).mul(t))
    return p.dist(proj)

def ccw(p1: Vec2, p2: Vec2, p3: Vec2) -> bool:
    """Counter-clockwise check for line intersection."""
    return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x)

def intersect(a: Vec2, b: Vec2, c: Vec2, d: Vec2) -> bool:
    """Standard line segment intersection check."""
    return (ccw(a, c, d) != ccw(b, c, d)) and (ccw(a, b, c) != ccw(a, b, d))

def check_collision(points: List[Vec2], track_width: float) -> bool:
    """Robust Collision Check: Checks intersection AND proximity buffer."""
    n = len(points)
    if n < 4: return False
    
    # Buffer: Track width + extra space for anti-overlap
    buffer = track_width * 1.8 

    for i in range(n):
        a = points[i]
        b = points[(i + 1) % n]
        
        # 1. Check strict intersection with non-adjacent segments
        for j in range(i + 2, n):
            # Exclude wrapping segment if i is 0 (i.e., j is n-1)
            if (i == 0 and j == n - 1): continue 
            
            c = points[j]
            d = points[(j + 1) % n]
            if intersect(a, b, c, d): 
                return True
        
        # 2. Check proximity (Buffer Zone)
        for j in range(n):
            # Skip self, next, and previous segments
            if i == j or (i + 1) % n == j or (i - 1 + n) % n == j: continue

            c = points[j]
            d = points[(j + 1) % n]

            # Check if point 'a' invades segment 'cd' buffer
            if point_to_segment_distance(a, c, d) < buffer: 
                return True
                
    return False

# --- Core Track Generation Logic (Phases 1-3) ---

def generate_track(name: str, complexity: int, windiness: float, straight_length: int, track_type: str) -> Optional[Track]:
    """Generates a track using the four-phase process (only Phases 1-3 run here)."""
    
    # Seed randomness for reproducibility if needed, but using random module as is for now
    
    track = Track(name, complexity, windiness, straight_length, track_type)
    pts: List[Vec2] = []
    center = Vec2(CENTER, CENTER)
    width, height = MAP_SIZE
    
    # --- 1. Initial Geometry ---
    if track_type == 'circuit':
        initial_points = 15
        radius = min(width, height) * 0.35
        for i in range(initial_points):
            angle = (i / initial_points) * math.pi * 2
            pts.append(Vec2(center.x + math.cos(angle) * radius, center.y + math.sin(angle) * radius))
            
    elif track_type == 'oval':
        # Simple oval generation
        rx = width * 0.35; ry = height * 0.22
        steps = 8
        for i in range(steps):
            angle = (i / steps) * math.pi * 2
            x = center.x + rx * math.cos(angle)
            y = center.y + ry * math.sin(angle)
            pts.append(Vec2(x, y))
            
    elif track_type == 'tri-oval':
        # Tri-oval generation (simplified from original JS for clean Python translation)
        radius = min(width, height) * 0.35
        for i in range(3):
            # Main corner point (slightly outward)
            angle = (i / 3) * math.pi * 2 - (math.pi / 2)
            pts.append(Vec2(center.x + math.cos(angle) * radius * 1.2, center.y + math.sin(angle) * radius))
            # Midpoint (slightly inward for a smoother transition)
            next_angle = ((i + 1) / 3) * math.pi * 2 - (math.pi / 2)
            mid_angle = (angle + next_angle) / 2
            pts.append(Vec2(center.x + math.cos(mid_angle) * radius * 0.8, center.y + math.sin(mid_angle) * radius * 0.8))

    else:
        # Fallback/Error state for unhandled track_type
        print(f"Error: Unknown track type '{track_type}'")
        return None

    # --- 2. Iterative Subdivision ---
    target_points = complexity
    iterations = 0
    max_iterations = 500

    while len(pts) < target_points and iterations < max_iterations:
        iterations += 1
        
        candidates = []
        for i in range(len(pts)):
            p1 = pts[i]
            p2 = pts[(i + 1) % len(pts)]
            # Use straight_length as the minimum segment length
            if p1.dist(p2) > straight_length: 
                candidates.append(i)

        if not candidates: break

        idx = random.choice(candidates)
        p1 = pts[idx]
        p2 = pts[(idx + 1) % len(pts)]
        
        mid = p1.add(p2).mul(0.5)
        vec = p2.sub(p1)
        normal = vec.perp().norm()
        
        # Use windiness as a displacement factor (chaos in JS)
        displacement_range = vec.len() * windiness 
        offset = (random.random() - 0.5) * 2 * displacement_range
        
        new_point = mid.add(normal.mul(offset))

        # Margin Check
        if (new_point.x < MARGIN or new_point.x > width - MARGIN or 
            new_point.y < MARGIN or new_point.y > height - MARGIN): 
            continue

        new_pts = pts[:idx + 1] + [new_point] + pts[idx + 1:]

        # Collision Check
        if not check_collision(new_pts, TRACK_WIDTH):
            pts = new_pts

    # --- 3. Relaxation Pass (Physics) ---
    # Fewer relaxation passes for ovals/tri-ovals as they are simpler geometries
    relax_passes = 12 if track_type == 'circuit' else 5 
    
    for _ in range(relax_passes):
        new_pts = pts[:]
        for i in range(len(pts)):
            n = len(pts)
            prev = pts[(i - 1 + n) % n]
            curr = pts[i]
            next_p = pts[(i + 1) % n]

            # Elasticity (Smoothing)
            center_p = prev.add(next_p).mul(0.5)
            vec_to_center = center_p.sub(curr)
            smooth_factor = 0.25 if track_type == 'circuit' else 0.1
            new_pts[i] = curr.add(vec_to_center.mul(smooth_factor)) 
            
            # Repulsion Field (Anti-Overlap)
            repel_threshold = TRACK_WIDTH * 2.0 
            repulsion_applied = False
            
            for j in range(n):
                # Don't repel from self or immediate neighbors
                if i == j or (i + 1) % n == j or (i - 1 + n) % n == j: continue

                c = pts[j]
                d = pts[(j + 1) % n]

                dist = point_to_segment_distance(new_pts[i], c, d)
                
                if dist < repel_threshold:
                    # Find closest point on segment (closest) to push away from
                    l2 = (d.x - c.x)**2 + (d.y - c.y)**2
                    
                    if l2 != 0:
                        t = ((new_pts[i].x - c.x) * (d.x - c.x) + (new_pts[i].y - c.y) * (d.y - c.y)) / l2
                        t = max(0, min(1, t))
                        closest = c.add(d.sub(c).mul(t))
                    else:
                        closest = c # Should not happen if points are distinct
                        
                    push_dir = new_pts[i].sub(closest).norm()
                    # Stronger push if closer
                    force = (repel_threshold - dist) * 0.8 
                    new_pts[i] = new_pts[i].add(push_dir.mul(force))
                    repulsion_applied = True

        pts = new_pts

    track.waypoints = pts
    
    # --- 4. Final Rendering Phase (Triggered for waypoints) ---
    track.generate_full_waypoints(steps=20)
    
    return track

# --- League Generation Functions ---

def generate_go_kart_track() -> Optional[Track]:
    """Go-Kart: Complexity: 20-40, Windiness: 0.70-0.80, Straight Length: 75-86"""
    complexity = random.randint(20, 40)
    windiness = random.uniform(0.70, 0.80)
    straight_length = random.randint(75, 86)
    return generate_track("Go-Kart Track", complexity, windiness, straight_length, 'circuit')

def generate_gt_track() -> Optional[Track]:
    """GT: Complexity: 40-50, Windiness: 0.80-0.90, Straight Length: 65-75"""
    complexity = random.randint(40, 50)
    windiness = random.uniform(0.80, 0.90)
    straight_length = random.randint(65, 75)
    return generate_track("GT Track", complexity, windiness, straight_length, 'circuit')

def generate_lm_track() -> Optional[Track]:
    """LM: Complexity: 45-50, Windiness: 1.00-1.10, Straight Length: 60"""
    complexity = random.randint(45, 50)
    windiness = random.uniform(1.00, 1.10)
    straight_length = 60
    return generate_track("LM Track", complexity, windiness, straight_length, 'circuit')

def generate_open_wheel_track() -> Optional[Track]:
    """Open Wheel: Complexity: 55-60, Windiness: 1.10-1.30, Straight Length: 70. 5% chance for oval/tri-oval."""
    complexity = random.randint(55, 60)
    windiness = random.uniform(1.10, 1.30)
    straight_length = 70
    
    track_type = 'circuit'
    if random.random() < 0.05: # 5% chance for oval or tri-oval
        track_type = random.choice(['oval', 'tri-oval'])

    return generate_track("Open Wheel Track", complexity, windiness, straight_length, track_type)

def generate_stock_car_track() -> Optional[Track]:
    """Stock Car: Generate oval and tri-ovals of slightly different scales."""
    track_type = random.choice(['oval', 'tri-oval'])
    
    # Use consistent complexity/windiness for fixed-shape tracks, vary straight_length/scale
    complexity = random.randint(8, 20) 
    windiness = 0.05 # Very low windiness for mostly fixed shape
    straight_length = random.randint(100, 150) # Controls max segment length / shape scale
    
    if track_type == 'oval':
        name = "Stock Car Oval"
    else:
        name = "Stock Car Tri-Oval"
        
    return generate_track(name, complexity, windiness, straight_length, track_type)


# --- Example Usage (Included for testing/demonstration) ---

if __name__ == '__main__':
    print("--- Generating Tracks for Redline Roulette ---")

    for generator in [
        generate_go_kart_track, 
        generate_gt_track, 
        generate_lm_track, 
        generate_open_wheel_track, 
        generate_stock_car_track
    ]:
        track = generator()
        if track:
            print(f"\nGenerated Track: {track.name} ({track.track_type})")
            print(f"  Complexity: {track.complexity}, Windiness: {track.windiness:.2f}, Min Segment: {track.straight_length}")
            print(f"  Control Points (Waypoints): {len(track.waypoints)}")
            print(f"  Full Path Points (Car Pathfinding): {len(track.full_waypoints)}")
            
            start_a, start_b = track.get_start_finish_line()
            print(f"  Start/Finish Line: {start_a} to {start_b}")
        else:
            print(f"Failed to generate track for {generator.__name__}")