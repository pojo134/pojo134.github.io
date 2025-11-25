

# **Procedural Generation and Simulation of 2D Race Tracks: Algorithms, Data Structures, and Physics Integration in JavaScript**

## **1\. Introduction: The Intersection of Computational Geometry and Motorsport Simulation**

The development of high-fidelity racing simulations within the constraints of a web browser represents a significant engineering challenge that sits at the convergence of computational geometry, rigid body physics, and real-time graphics rendering. While traditional game engines often rely on pre-baked assets and static mesh data, the requirement for *procedural generation* fundamentally shifts the architectural burden from artists to algorithms. In a pure JavaScript environment, devoid of compiled middleware or hardware-accelerated physics engines, the simulation engineer must construct the mathematical reality of the race track from first principles.

This report provides an exhaustive technical analysis of the systems required to generate realistic, closed-loop race tracks, calculate optimal racing trajectories using iterative optimization, and simulate vehicle dynamics with high precision. The scope extends beyond simple visual approximation; it demands a rigorous adherence to the physical principles governing motorsport, ensuring that the generated circuits are not merely random polygons but drivable, competitive venues that respect the constraints of vehicle dynamics.

The core objective is to synthesize a pipeline that operates in three distinct phases: **Geometric Construction**, where the topology of the track is defined; **Trajectory Optimization**, where the optimal racing line is derived via heuristic or gradient-based methods; and **Kinematic Solving**, where a velocity profile is generated to simulate the physical limitations of a vehicle traversing the surface. This analysis addresses the specific memory and performance constraints of the JavaScript runtime, advocating for the use of TypedArrays and efficient spatial partitioning to maintain high-frequency update loops essential for fluid simulation.

## **2\. Geometric Foundations of Procedural Track Layout**

The genesis of any procedural track is the creation of a valid, non-intersecting closed loop. In the domain of 2D racing, this is topological problem: how to generate a simple polygon that exhibits the high-frequency geometric variance (corners, chicanes) of a real circuit without violating the geometric integrity of the loop (self-intersection). The literature suggests a layered approach, moving from a coarse point cloud to a refined spline-based surface.

### **2.1 Stochastic Point Cloud Generation and Spatial Distribution**

The initial input for the generation algorithm is a set of control points $P$ distributed on a 2D plane. A naive approach involving pure random coordinate generation ($x \= \\text{rand}(), y \= \\text{rand}()$) fails to produce viable track skeletons because it lacks spatial coherence. Randomly distributed points frequently form clusters, leading to acute angles that result in impossibly tight hairpins, or vast empty voids that result in excessively long straights.

To achieve the "organic" yet structured layout characteristic of professional circuits, the distribution of control points must mimic a **Blue Noise** distribution—uniform but not periodic. The most robust method for achieving this in a simulation context is **Lloyd’s Algorithm** (Voronoi Relaxation).1

#### **2.1.1 Lloyd’s Relaxation Algorithm**

Lloyd's algorithm iteratively optimizes a set of seed points to achieve a Centroidal Voronoi Tessellation (CVT). The process functions by treating the simulation bounds as a continuous domain partitioned into Voronoi cells.

1. **Initialization:** Generate $N$ random points within the bounding box (typically 20-30 points for a complex circuit).  
2. **Voronoi Partitioning:** Construct the Voronoi diagram for these points. A Voronoi cell $V\_i$ for a point $P\_i$ consists of all pixels (or geometric space) closer to $P\_i$ than to any other point $P\_j$.  
3. **Centroid Computation:** Calculate the geometric centroid $C\_i$ of each cell $V\_i$. For a 2D polygon, the centroid $(C\_x, C\_y)$ is computed via the integral of the area moments.  
4. **Relaxation:** Move each generating point $P\_i$ to the position of its centroid $C\_i$.  
5. **Iteration:** Repeat steps 2-4.

Research indicates that mathematical convergence is typically approximated sufficient for track generation within 3 to 15 iterations.1 The result is a set of points that are evenly spaced, maximizing the distance between neighbors while filling the available space. This pre-processing step is critical: it ensures that the subsequent Convex Hull operation produces a polygon with sides of roughly comparable length, preventing the formation of degenerate track segments.2

### **2.2 Convex Hull and Polygon Construction**

Once the point cloud is spatially optimized, the algorithm must select a subset of points to form the primary loop. The **Convex Hull** of the set $P$ provides a mathematically guaranteed non-intersecting loop, essentially "wrapping" the outermost points like an elastic band.4

#### **2.2.1 Algorithmic Selection: QuickHull vs. Monotone Chain**

For a real-time JavaScript implementation, the choice of hull algorithm impacts initialization time.

* **Jarvis March (Gift Wrapping):** Has a time complexity of $O(nh)$, where $h$ is the number of points on the hull. While conceptually simple, it degenerates to $O(n^2)$ if all points are on the hull.  
* **Monotone Chain Algorithm:** Sorts points by x-coordinate and builds upper and lower hulls separately. It runs in $O(n \\log n)$ due to the sorting step and is generally preferred for its robustness and ease of implementation in JavaScript using standard Array.sort() methods.6

The Convex Hull, however, yields a strictly convex polygon—a shape devoid of the re-entrant corners (concavities) that define interesting tracks. A circle or oval is rarely a compelling race track. Therefore, the hull must be perturbed.

### **2.3 Recursive Perturbation and Midpoint Displacement**

To introduce complexity, the edges of the convex hull are subjected to recursive subdivision, a technique often referred to as **Midpoint Displacement** or recursive shattering.4

For every edge $E\_{AB}$ connecting vertex $A$ and $B$:

1. Compute the midpoint $M \= (A+B)/2$.  
2. Calculate the normalized normal vector $\\vec{n}$ perpendicular to the edge direction $\\vec{d} \= B \- A$.  
3. Displace $M$ along $\\vec{n}$ by a random magnitude $r$. The magnitude $r$ represents the "severity" of the track's corners.  
4. Insert the new point $M'$ into the polygon vertex list between $A$ and $B$.

**Critical Constraint:** The displacement must be bounded. If $M'$ is pushed too far inwards, it may cross another edge of the polygon, creating a self-intersecting "figure-8" or complex knot. This is catastrophic for a simulation engine, as it complicates inside/outside testing and distance calculation. A "Push-Apart" algorithm 4 acts as a post-processing filter. It iterates through all vertices and applies a repulsive force between any non-adjacent vertices that are closer than a threshold distance $D\_{min}$, effectively inflating the track to prevent overlaps.

### **2.4 Spline Interpolation and Surface Parameterization**

The polygon resulting from perturbation is merely a collection of straight lines. To create a drivable surface suitable for physics simulation, this piecewise linear path must be converted into a continuous differentiable curve ($C^1$ or $C^2$ continuity).

**Catmull-Rom Splines** are the industry standard for this application.8 Unlike B-Splines, which do not pass through their control points (making collision boundaries difficult to visualize), or Bezier curves, which require complex handle management, a Catmull-Rom spline passes through every control point and calculates tangents automatically based on the position of neighbors.

The mathematical formulation for a point $P(t)$ on a Catmull-Rom segment relies on four control points: the previous point $P\_{i-1}$, the start point $P\_i$, the end point $P\_{i+1}$, and the next point $P\_{i+2}$. In a closed-loop track, the array indices must be wrapped modulo $N$.10

$$ P(t) \= 0.5 \\cdot \\begin{bmatrix} 1 & t & t^2 & t^3 \\end{bmatrix} \\cdot \\begin{bmatrix} 0 & 2 & 0 & 0 \\ \-1 & 0 & 1 & 0 \\ 2 & \-5 & 4 & \-1 \\ \-1 & 3 & \-3 & 1 \\end{bmatrix} \\cdot \\begin{bmatrix} P\_{i-1} \\ P\_i \\ P\_{i+1} \\ P\_{i+2} \\end{bmatrix} $$

Discretization for Physics:  
While the analytical form of the spline is useful for rendering, the physics engine requires a discrete representation. The spline is sampled at high resolution (e.g., every 0.5 meters). For a 5km track, this results in approximately 10,000 discrete nodes. Each node $W\_k$ stores:

* **Position:** $(x, y)$ world coordinates.  
* **Tangent:** Normalized vector $\\vec{T}$ pointing to $W\_{k+1}$.  
* **Normal:** Normalized vector $\\vec{N}$ perpendicular to $\\vec{T}$.  
* **Curvature:** Signed float $k$.

This discrete array forms the **Reference Line** or **Centerline** of the simulation.

---

## **3\. Topology, Metadata, and Special Sectors**

A race track is more than just a closed loop of asphalt. It is a structured environment with defined zones, boundaries, and rules. Procedural generation must therefore account for track width, pit lanes, timing sectors, and DRS (Drag Reduction System) zones.

### **3.1 The Offset Problem: Generating Track Borders**

The centerline spline defines the path of flow, but the physical track has width. Generating the left and right boundaries requires computing **Parallel Curves** (or offset curves). Mathematically, the boundary points $L\_i$ and $R\_i$ at index $i$ are:

$$L\_i \= P\_i \+ (w \\cdot \\vec{N}\_i)$$

$$R\_i \= P\_i \- (w \\cdot \\vec{N}\_i)$$  
where $w$ is the half-width of the track.11

The Swallowtail Artifact:  
A critical geometric challenge arises when the radius of curvature $R\_{curve}$ at a specific point is less than the track half-width $w$. In this scenario, the inner offset curve (the side on the inside of the turn) will collapse upon itself and self-intersect, forming a loop known as a "swallowtail" or "loop of intersection."  
For a procedural engine, this must be detected and resolved.

1. **Detection:** Iterate through the discrete centerline points. If curvature $k\_i \> 1/w$, the segment is invalid.  
2. **Resolution:** The generation parameters must be tuned to prevent this. By enforcing a minimum bend radius during the hull perturbation phase (ensuring distance between points is sufficiently large relative to the random displacement), we can guarantee $R\_{curve} \> w$. Alternatively, a post-processing step can perform boolean union operations on the generated boundary polygon, though this is computationally expensive in JavaScript.12

### **3.2 Procedural Pit Lane Generation**

The pit lane is a secondary graph branch that runs parallel to the main track, typically bypassing the start/finish line. Its procedural generation is complex because it requires identifying a valid "straight" section and handling the branching logic.13

**Algorithm for Pit Lane Construction:**

1. **Identification:** Analyze the curvature of the centerline to identify the longest continuous segment with curvature near zero. This becomes the "Pit Straight".  
2. **Topology Branching:** Define two indices on the centerline: $I\_{entry}$ (pit entry) and $I\_{exit}$ (pit exit).  
3. **Parallel Offset:** Generate the pit lane path as a parallel spline offset by $w\_{pit\\\_offset}$ (e.g., 20 meters) from the centerline.  
4. **Entry/Exit Blending:** The generated parallel line must not start abruptly. A Hermite blend or S-curve is used to connect the main track at $I\_{entry}$ to the start of the parallel pit lane. The same logic applies to the exit, merging back at $I\_{exit}$.14  
5. **Safety Lines:** As per racing regulations (e.g., Formula 1), the pit entry and exit must have "safety lines" that prevent cars on the racing line from crossing into the pit path. Procedurally, this is marked by generating a third spline—the safety barrier—that separates the main track from the pit blend region for a set distance.14

Data Structure Implications:  
The track graph is no longer a simple cycle. The node at $I\_{entry}$ has two successors. The simulation engine must support a state flag (e.g., isPitting) to determine which edge of the graph the vehicle traverses.

### **3.3 Sectorization and Timing Splits**

Modern racing circuits are divided into three sectors for telemetry analysis. Procedural placement of these sectors should follow the logic of real-world track design.15

**Sector Logic:**

* **Sector 1:** Typically covers the start/finish straight and the first sequence of corners.  
* **Sector 2:** Often covers the rigorous, technical middle section of the lap.  
* **Sector 3:** Covers the final approach and corners leading back to the main straight.

A simple algorithm divides the track index $N$ into three ranges $

Mini-Sectors:  
For high-fidelity analysis, the track is further divided into "mini-sectors" (typically 100m-200m segments). This allows the simulation to compare the "ghost" car against the player with high granularity. The data structure should include an array miniSectors, where each entry holds the startIndex and endIndex of the centerline nodes.16

### **3.4 DRS (Drag Reduction System) Zone Generation**

DRS zones allow cars to open a flap for higher top speed, permitted only on specific straights.  
Procedural Placement Rules:

1. **Detection Point:** Placed before the corner preceding the straight. The gap between cars is measured here.  
2. **Activation Point:** Placed 50-100 meters after the corner exit onto the straight.  
3. **Deactivation:** Triggered by braking or reaching the end of the straight.18

The generator scans the curvature array for segments of zero curvature longer than a threshold $L\_{DRS\\\_min}$ (e.g., 600 meters). If such a straight exists, a DRS zone is instantiated. The Detection Point is back-propagated along the track graph to the entry of the preceding corner sequence.20

---

## **4\. Calculating the Optimal Racing Line (ORL)**

The track centerline is rarely the fastest path. The Optimal Racing Line (ORL) minimizes lap time by maximizing the radius of the path through corners, allowing for higher maintenance speeds. In a 2D simulation, finding this line is an optimization problem solvable via iterative relaxation methods, most notably the **K1999 Algorithm** (Elastic Band Method) derived from robotic path planning.21

### **4.1 The K1999 Algorithm (Elastic Band Optimization)**

This method models the racing line as a flexible string constrained between the left and right track boundaries. The string attempts to shorten itself (minimize distance) or straighten itself (minimize curvature) while "bouncing" off the walls.

**Algorithm Steps:**

1. **Initialization:** Create a list of points $R$ initialized to the coordinates of the track centerline.  
2. **Optimization Loop:** Iterate $K$ times (e.g., 100 iterations). In each iteration, update every point $R\_i$.  
   * The update logic moves $R\_i$ to minimize a cost function involving its neighbors $R\_{i-1}$ and $R\_{i+1}$.  
3. Update Rule: For curvature minimization, the optimal position for $R\_i$ is on the line segment connecting $R\_{i-1}$ and $R\_{i+1}$. Moving $R\_i$ towards this chord maximizes the radius of the turn at that point.

   $$R\_i^{new} \= (1 \- \\epsilon) R\_i \+ \\epsilon \\frac{R\_{i-1} \+ R\_{i+1}}{2}$$

   Here, $\\epsilon$ is a learning rate or "elasticity" factor.  
4. **Constraint Enforcement:** After calculating the tentative $R\_i^{new}$, clip it to the track boundaries.  
   * Project $R\_i^{new}$ onto the local track normal $\\vec{N}\_i$.  
   * Ensure the lateral offset distance $d$ satisfies $d \\in \[-w \+ \\text{margin}, w \- \\text{margin}\]$.  
   * The "margin" accounts for the car's width, preventing the center of mass from hitting the wall.22

Convergence:  
As the iterations proceed, the line will naturally migrate towards the "apex" of corners (the inside) and swing wide on exits, approximating a geometric racing line. While strictly finding the shortest path, this geometry closely correlates with the fastest path in 2D racing dynamics.23

### **4.2 Gradient Descent and Genetic Algorithms**

While K1999 is fast ($O(N)$ per iteration), it is a heuristic. Alternative approaches use Gradient Descent on a formal cost function:

$$J \= \\sum\_{i} \\left( \\text{Time}(R\_i) \+ \\lambda \\cdot \\text{Curvature}(R\_i)^2 \\right)$$

By calculating the gradient of the lap time with respect to the lateral position of each node, one can descend towards a true local minimum.24  
Genetic Algorithms (GA):  
GA can also be employed, treating the lateral offsets of all waypoints as a "genome." Populations of racing lines are generated, evaluated by running a physics simulation (or approximate lap time calculation), and cross-bred. GA is significantly slower than K1999 but can optimize for complex non-linear vehicle dynamics that K1999 ignores (e.g., tire heating, complex slip angles).25 For a web-based procedural generator, K1999 is preferred for its sub-second execution time.

### **4.3 Menger Curvature Calculation**

The optimization requires precise curvature measurement. For discrete points, the derivative-based definition of curvature $\\kappa \= \\frac{x'y'' \- y'x''}{(x'^2 \+ y'^2)^{3/2}}$ is unstable due to noise. The **Menger Curvature** provides a robust geometric alternative using three points $A, B, C$:

$$\\kappa \= \\frac{4 \\cdot \\text{Area}(ABC)}{|AB| \\cdot |BC| \\cdot |CA|}$$  
The area is computed using the shoelace formula (cross product), and the lengths are Euclidean distances. This value $\\kappa$ (where radius $R \= 1/\\kappa$) is the input for the physics solver.27

---

## **5\. Velocity Profiling and Kinematic Solving**

Once the geometry of the ORL is fixed, the simulation must derive a **Velocity Profile**: the optimal speed of the vehicle at every point on the track. This is effectively a "solved" perfect lap. The standard solution in racing simulation is the **Forward-Backward Integration Solver**.29

### **5.1 The Friction Circle and Cornering Limits**

The fundamental constraint is the tire's ability to generate grip, modeled by the **Friction Circle**. The total force vector (lateral \+ longitudinal) cannot exceed the maximum friction force $F\_{max} \= \\mu \\cdot m \\cdot g$, where $\\mu$ is the coefficient of friction (typically 1.2–1.5 for racing slicks).

In a pure cornering scenario (no acceleration/braking), all friction is used for lateral acceleration $a\_{lat} \= v^2 / R$. This gives the maximum cornering speed at any point $i$:

$$V\_{limit}\[i\] \= \\sqrt{ \\mu \\cdot g \\cdot R\[i\] } \= \\sqrt{ \\frac{\\mu \\cdot g}{\\kappa\[i\]} }$$  
This array $V\_{limit}$ represents the "speed ceiling" defined purely by the track geometry.31

### **5.2 The Forward-Backward Solver Algorithm**

Real cars cannot instantly switch between speeds; they have mass and inertia. The solver calculates the feasible speed profile by satisfying longitudinal acceleration constraints.

Phase 1: The Apex Speed Initialization  
Initialize the velocity array $V$ with the geometric limit:

$$V\[i\] \= V\_{limit}\[i\]$$

(Clamp this to the vehicle's maximum mechanical speed $V\_{max\\\_mech}$).  
Phase 2: The Backward Pass (Braking)  
We must ensure the car slows down in time for corners. We iterate backwards from the end of the track to the start. The car at point $i$ must not be faster than what allows it to safely decelerate to the speed at $i+1$.

$$V\_{bwd}\[i\] \= \\min \\left( V\[i\], \\sqrt{ V\_{bwd}\[i+1\]^2 \+ 2 \\cdot a\_{brake} \\cdot \\Delta d } \\right)$$

Here, $a\_{brake}$ is the maximum braking deceleration (e.g., $4g$). $\\Delta d$ is the distance between waypoints. This pass effectively "propagates" the low speeds of tight corners backwards up the straights, identifying the Braking Points.29  
Phase 3: The Forward Pass (Acceleration)  
We must ensure the car can actually reach the speeds. Iterate forwards from the start. The car at $i$ cannot exceed the speed attainable by accelerating from $i-1$.  
$$ V\_{fwd}\[i\] \= \\min \\left( V\_{bwd}\[i\], \\sqrt{ V\_{fwd}\[i-1\]^2 \+ 2 \\cdot a\_{acc}(v) \\cdot \\Delta d } \\right) $$  
Here, $a\_{acc}(v)$ is the acceleration capability, which is often a function of current speed (accounting for aerodynamic drag $F\_{drag} \\propto v^2$ and engine power curves).  
The result $V\_{fwd}$ is the final, physically valid velocity profile. This profile identifies exactly where to brake, where the apex is, and where to throttle out.

### **5.3 Drag and Aerodynamics**

In 2D simulations, air resistance is often modeled simply:

$$F\_{drag} \= 0.5 \\cdot \\rho \\cdot C\_d \\cdot A \\cdot v^2$$

This force opposes the engine force. In the Forward Pass, the available acceleration $a\_{acc}$ is:

$$a\_{acc} \= \\frac{F\_{engine} \- F\_{drag}}{m}$$

Including drag is crucial for procedurally generated tracks with very long straights, as it naturally caps the top speed, preventing the car from accelerating infinitely.32

---

## **6\. High-Performance 2D Rendering and Optimization**

Rendering a procedural track with thousands of spline segments and dynamic overlays in a browser requires leveraging the HTML5 Canvas API efficiently. The key is to minimize the "immediate mode" draw calls that bottleneck the CPU-GPU bridge.

### **6.1 Geometry Caching (Offscreen Canvas)**

The track geometry is static. Redrawing 10,000 line segments every frame (at 60Hz) is wasteful. The robust solution is **Offscreen Caching**.

1. **Generation Time:** Create a separate \<canvas\> element (not attached to the DOM).  
2. **Rasterization:** Draw the entire track (asphalt, grass, curbs) onto this offscreen canvas once.  
3. Runtime: In the requestAnimationFrame loop, simply copy the relevant viewport from the offscreen canvas to the visible canvas using ctx.drawImage().

   $$\\text{ctx.drawImage(offscreen, viewX, viewY, width, height, 0, 0, width, height)}$$

   This reduces the rendering complexity from $O(N)$ (number of segments) to $O(1)$ (single bitmap blit).33

### **6.2 Rendering Thick Lines with Borders**

The Canvas API lacks a native "stroke with border" command. To render a road with a distinct outline (e.g., gray asphalt with white rails), the **Painter's Algorithm** is employed:

1. **Layer 1 (Border):** Draw the spline path with a large lineWidth (e.g., track width \+ 4 pixels) and the border color.  
2. **Layer 2 (Road):** Draw the exact same path with the actual track lineWidth and the asphalt color.  
3. Layer 3 (Detail): Draw markings, grid slots, and start/finish lines on top.  
   This stacking order creates the visual illusion of a bordered road without requiring complex mesh generation.35

### **6.3 Frame Interpolation and Delta Time**

The physics simulation often runs at a fixed time step (e.g., dt \= 0.01s) to maintain integration stability, while the display refreshes at the monitor's rate (60Hz, 144Hz). Decoupling these is essential. The rendering loop should interpolate the vehicle's position between the last two physics states based on the accumulated frame time (alpha).

$$\\text{Pos}\_{render} \= \\text{Pos}\_{prev} \\cdot (1 \- \\alpha) \+ \\text{Pos}\_{curr} \\cdot \\alpha$$

This ensures smooth motion even if the physics update rate doesn't match the display refresh rate.

---

## **7\. Data Structure Design and Serialization**

To support the simulation features described, the data must be organized into a coherent schema.

### **7.1 Waypoint Data Structure**

A flat array of waypoint objects is efficient for traversal.

**Table 1: Proposed Waypoint Data Schema**

| Property | Type | Unit | Description |
| :---- | :---- | :---- | :---- |
| x, y | Float32 | Meters | World space coordinates of the racing line. |
| center\_x, center\_y | Float32 | Meters | Original centerline coordinates. |
| width\_L, width\_R | Float32 | Meters | Distance to track edges (variable width supported). |
| curvature | Float32 | $1/m$ | Menger curvature at this point. |
| velocity | Float32 | $m/s$ | Pre-calculated optimal speed (from solver). |
| distance | Float32 | Meters | Cumulative distance from start line. |
| sector\_id | Uint8 | ID | 1, 2, or 3 (0 for pit lane). |
| flags | Uint8 | Bitmask | Flags for DRS\_ZONE, PIT\_ENTRY, START\_LINE. |

Using Float32Array (Struct of Arrays) instead of an Array of Objects (Array of Structs) is recommended for memory locality and performance in JavaScript, preventing garbage collection overhead during tight loops.

### **7.2 JSON Serialization**

For saving and sharing tracks, the procedural parameters and the generated graph should be serializable.

JSON

{  
  "metadata": {  
    "name": "Procedural GP 01",  
    "seed": 987234,  
    "length\_meters": 4521.4,  
    "sectors":   
  },  
  "geometry": {  
    "controlPoints": \[\[x1,y1\], \[x2,y2\]...\],  
    "width": 12.0  
  },  
  "features": {  
    "pitLane": { "startIdx": 900, "endIdx": 50 },  
    "drsZones": \[ { "start": 200, "end": 600 } \]  
  }  
}

## **8\. Conclusion**

The procedural generation of 2D race tracks is a solvable engineering problem that yields rich simulation environments through the application of rigorous mathematics. By moving from random noise to Voronoi-relaxed point clouds, employing convex hull perturbation for topology, and refining geometry with Catmull-Rom splines, a robust track skeleton is formed. The application of the K1999 algorithm and Forward-Backward integration transforms this static geometry into a dynamic data set containing the optimal racing line and velocity profile.

Crucially, the integration of "secondary" features such as pit lanes, sectorization, and DRS zones elevates the system from a simple path generator to a complete motorsport simulation tool. When implemented with the memory and rendering optimizations specific to the JavaScript ecosystem—offscreen caching, TypedArrays, and garbage-collection-aware loops—the result is a high-performance engine capable of generating competitive, physically valid, and visually distinct racing circuits in real-time. Future extensions of this work could leverage WebAssembly for parallelized genetic optimization or WebGL for texture-rich visualization, but the foundational algorithms presented herein remain the bedrock of any competent 2D racing simulation.

#### **Works cited**

1. Lloyd's algorithm \- Wikipedia, accessed November 23, 2025, [https://en.wikipedia.org/wiki/Lloyd%27s\_algorithm](https://en.wikipedia.org/wiki/Lloyd%27s_algorithm)  
2. Lloyd Relaxation of Voronoi Diagrams \- Wolfram Demonstrations Project, accessed November 23, 2025, [https://demonstrations.wolfram.com/LloydRelaxationOfVoronoiDiagrams/](https://demonstrations.wolfram.com/LloydRelaxationOfVoronoiDiagrams/)  
3. Voronoi Relaxation / Lloyd's Algorithm \- YouTube, accessed November 23, 2025, [https://www.youtube.com/watch?v=Tjf3H0VGjjA](https://www.youtube.com/watch?v=Tjf3H0VGjjA)  
4. Procedural Racetrack Generation \- Bites of code \- WordPress.com, accessed November 23, 2025, [https://bitesofcode.wordpress.com/2020/04/09/procedural-racetrack-generation/](https://bitesofcode.wordpress.com/2020/04/09/procedural-racetrack-generation/)  
5. juangallostra/procedural-tracks: Procedural race track generation \- GitHub, accessed November 23, 2025, [https://github.com/juangallostra/procedural-tracks](https://github.com/juangallostra/procedural-tracks)  
6. Convex hull algorithm, accessed November 23, 2025, [https://www.nayuki.io/page/convex-hull-algorithm](https://www.nayuki.io/page/convex-hull-algorithm)  
7. \[Article\] How To Generate Procedural Racetracks Without Noise : r/gamedev \- Reddit, accessed November 23, 2025, [https://www.reddit.com/r/gamedev/comments/1tg01m/article\_how\_to\_generate\_procedural\_racetracks/](https://www.reddit.com/r/gamedev/comments/1tg01m/article_how_to_generate_procedural_racetracks/)  
8. How to create procedural racetrack for your game\! \- YouTube, accessed November 23, 2025, [https://www.youtube.com/watch?v=BTfghIWZFMw](https://www.youtube.com/watch?v=BTfghIWZFMw)  
9. CatmullRomCurve3.closed – three.js docs, accessed November 23, 2025, [https://threejs.org/docs/\#api/en/extras/curves/CatmullRomCurve3.closed](https://threejs.org/docs/#api/en/extras/curves/CatmullRomCurve3.closed)  
10. Catmull-Rom spline interpolation / Milan G \- Observable, accessed November 23, 2025, [https://observablehq.com/@milangress/catmull-rom-spline-interpolation](https://observablehq.com/@milangress/catmull-rom-spline-interpolation)  
11. How can I achieve "parallel" spline curves? : r/proceduralgeneration \- Reddit, accessed November 23, 2025, [https://www.reddit.com/r/proceduralgeneration/comments/sysfdu/how\_can\_i\_achieve\_parallel\_spline\_curves/](https://www.reddit.com/r/proceduralgeneration/comments/sysfdu/how_can_i_achieve_parallel_spline_curves/)  
12. Parallel curves of cubic Béziers | Raph Levien's blog, accessed November 23, 2025, [https://raphlinus.github.io/curves/2022/09/09/parallel-beziers.html](https://raphlinus.github.io/curves/2022/09/09/parallel-beziers.html)  
13. The Guide To Pit Lane Editing \- GrandPrix2.de, accessed November 23, 2025, [http://grandprix2.de/Anleitung/tutus/pitlane/pitlane.htm](http://grandprix2.de/Anleitung/tutus/pitlane/pitlane.htm)  
14. Pit lane design : r/RaceTrackDesigns \- Reddit, accessed November 23, 2025, [https://www.reddit.com/r/RaceTrackDesigns/comments/1e79mre/pit\_lane\_design/](https://www.reddit.com/r/RaceTrackDesigns/comments/1e79mre/pit_lane_design/)  
15. 2023 FORMULA ONE SPORTING REGULATIONS \- FIA, accessed November 23, 2025, [https://www.fia.com/sites/default/files/fia\_2023\_formula\_1\_sporting\_regulations\_-\_issue\_2\_-\_2022-09-30.pdf](https://www.fia.com/sites/default/files/fia_2023_formula_1_sporting_regulations_-_issue_2_-_2022-09-30.pdf)  
16. How are sectors determined on a Formula 1 track? : r/F1Technical \- Reddit, accessed November 23, 2025, [https://www.reddit.com/r/F1Technical/comments/v4yaa3/how\_are\_sectors\_determined\_on\_a\_formula\_1\_track/](https://www.reddit.com/r/F1Technical/comments/v4yaa3/how_are_sectors_determined_on_a_formula_1_track/)  
17. The Data Behind DRS Zones, Explained \- Pure Storage Blog, accessed November 23, 2025, [https://blog.purestorage.com/perspectives/the-data-behind-drs-zones-explained/?Social+Account=Pure+Storage\&print=pdf](https://blog.purestorage.com/perspectives/the-data-behind-drs-zones-explained/?Social+Account=Pure+Storage&print=pdf)  
18. Can someone explain this to me. Is it a rule I don't understand or a mistake by the game. I'm less than a sec behind, and Noris gets DRS twice while in the lead and I didn't. (Once right in the beginning and once towards the end) playing 2021 btw : \- Reddit, accessed November 23, 2025, [https://www.reddit.com/r/F1Game/comments/wnhkok/can\_someone\_explain\_this\_to\_me\_is\_it\_a\_rule\_i/](https://www.reddit.com/r/F1Game/comments/wnhkok/can_someone_explain_this_to_me_is_it_a_rule_i/)  
19. Are the DRS detection and activation lines simply extra timing lines added for the GP? How precisely and accurately does race control know each car's location and what's their data source? : r/F1Technical \- Reddit, accessed November 23, 2025, [https://www.reddit.com/r/F1Technical/comments/144lyyy/are\_the\_drs\_detection\_and\_activation\_lines\_simply/](https://www.reddit.com/r/F1Technical/comments/144lyyy/are_the_drs_detection_and_activation_lines_simply/)  
20. cdthompson/deepracer-k1999-race-lines \- GitHub, accessed November 23, 2025, [https://github.com/cdthompson/deepracer-k1999-race-lines](https://github.com/cdthompson/deepracer-k1999-race-lines)  
21. A Study of Deep Reinforcement Learning in Autonomous Racing Using DeepRacer Car \- eGrove \- University of Mississippi, accessed November 23, 2025, [https://egrove.olemiss.edu/cgi/viewcontent.cgi?article=2782\&context=hon\_thesis](https://egrove.olemiss.edu/cgi/viewcontent.cgi?article=2782&context=hon_thesis)  
22. Race car strategy optimisation under simulation \- CSE \- IIT Kanpur, accessed November 23, 2025, [https://cse.iitk.ac.in/users/cs365/2013/submissions/\~naveen/cs365/project/report.pdf](https://cse.iitk.ac.in/users/cs365/2013/submissions/~naveen/cs365/project/report.pdf)  
23. Gradient Descent Optimization in Linear Regression | CodeSignal Learn, accessed November 23, 2025, [https://codesignal.com/learn/courses/regression-and-gradient-descent/lessons/gradient-descent-optimization-in-linear-regression](https://codesignal.com/learn/courses/regression-and-gradient-descent/lessons/gradient-descent-optimization-in-linear-regression)  
24. Racing line optimization for an autonomous race car \- Resource summary | openEQUELLA, accessed November 23, 2025, [https://radar.brookes.ac.uk/radar/items/442168ac-aa31-487a-97c8-8fc47d72ab77/1/](https://radar.brookes.ac.uk/radar/items/442168ac-aa31-487a-97c8-8fc47d72ab77/1/)  
25. Car Racing Line Optimization with Genetic Algorithm using Approximate Homeomorphism, accessed November 23, 2025, [https://www.researchgate.net/publication/357104587\_Car\_Racing\_Line\_Optimization\_with\_Genetic\_Algorithm\_using\_Approximate\_Homeomorphism](https://www.researchgate.net/publication/357104587_Car_Racing_Line_Optimization_with_Genetic_Algorithm_using_Approximate_Homeomorphism)  
26. Calculate curvature for 3 Points (x,y) \- Stack Overflow, accessed November 23, 2025, [https://stackoverflow.com/questions/41144224/calculate-curvature-for-3-points-x-y](https://stackoverflow.com/questions/41144224/calculate-curvature-for-3-points-x-y)  
27. How do I calculate radius of curvature from discrete samples? \- Stack Overflow, accessed November 23, 2025, [https://stackoverflow.com/questions/27095399/how-do-i-calculate-radius-of-curvature-from-discrete-samples](https://stackoverflow.com/questions/27095399/how-do-i-calculate-radius-of-curvature-from-discrete-samples)  
28. Speed Profile Generation: An Easy and Fast Method for Motion ..., accessed November 23, 2025, [https://federicosarrocco.com/blog/speed-profile-easy-generation](https://federicosarrocco.com/blog/speed-profile-easy-generation)  
29. A Sequential Two-Step Algorithm for Fast Generation of Vehicle Racing Trajectories \- Dynamic Design Lab \- Stanford University, accessed November 23, 2025, [https://ddl.stanford.edu/sites/g/files/sbiybj25996/files/media/file/2015\_dscc\_kapania\_sequential\_2step\_0.pdf](https://ddl.stanford.edu/sites/g/files/sbiybj25996/files/media/file/2015_dscc_kapania_sequential_2step_0.pdf)  
30. Racing Line Optimization \- DSpace@MIT, accessed November 23, 2025, [https://dspace.mit.edu/bitstream/handle/1721.1/64669/706825301-MIT.pdf](https://dspace.mit.edu/bitstream/handle/1721.1/64669/706825301-MIT.pdf)  
31. An attempt at procedural race generation \- The stuff I do \- statox.fr, accessed November 23, 2025, [https://www.statox.fr/posts/2021/10/race\_generator/](https://www.statox.fr/posts/2021/10/race_generator/)  
32. Optimizing canvas \- Web APIs | MDN, accessed November 23, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Canvas\_API/Tutorial/Optimizing\_canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)  
33. Improving HTML5 Canvas performance | Articles \- web.dev, accessed November 23, 2025, [https://web.dev/articles/canvas-performance](https://web.dev/articles/canvas-performance)  
34. How create a line with borders in HTML5 canvas properly \- Stack Overflow, accessed November 23, 2025, [https://stackoverflow.com/questions/20874375/how-create-a-line-with-borders-in-html5-canvas-properly](https://stackoverflow.com/questions/20874375/how-create-a-line-with-borders-in-html5-canvas-properly)