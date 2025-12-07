// utils.js

// --- Vector Math Helpers ---
export class Vec2 {
    constructor(x, y) { this.x = x; this.y = y = y; }
    add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
    mul(s) { return new Vec2(this.x * s, this.y * s); }
    len() { return Math.sqrt(this.x**2 + this.y**2); }
    norm() { let l = this.len(); return l === 0 ? new Vec2(0,0) : new Vec2(this.x/l, this.y/l); }
    perp() { return new Vec2(-this.y, this.x); } 
    dist(v) { return Math.sqrt((this.x-v.x)**2 + (this.y-v.y)**2); }
    dot(v) { return this.x * v.x + this.y * v.y; }
}

/**
 * Returns a random element from an array
 */
export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// --- Geometric Algorithms ---

export function getSplinePoint(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    const b0 = 0.5 * (-t3 + 2*t2 - t);
    const b1 = 0.5 * (3*t3 - 5*t2 + 2);
    const b2 = 0.5 * (-3*t3 + 4*t2 + t);
    const b3 = 0.5 * (t3 - t2);
    return new Vec2(
        p0.x*b0 + p1.x*b1 + p2.x*b2 + p3.x*b3,
        p0.y*b0 + p1.y*b1 + p2.y*b2 + p3.y*b3
    );
}

// Distance from point p to line segment ab
export function pointToSegmentDistance(p, a, b) {
    const l2 = (b.x - a.x)**2 + (b.y - a.y)**2;
    if (l2 === 0) return p.dist(a);
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const proj = new Vec2(a.x + t * (b.x - a.x), a.y + t * (b.y - a.y));
    return p.dist(proj);
}

// Standard line intersection
export function intersect(a, b, c, d) {
    const ccw = (p1, p2, p3) => (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
    return (ccw(a, c, d) !== ccw(b, c, d)) && (ccw(a, b, c) !== ccw(a, b, d));
}

// Robust Collision Check: Checks intersection AND proximity buffer
export function checkCollision(points, trackWidth) {
    const n = points.length;
    if(n < 4) return false;
    
    // Buffer: Track width + extra space for kerbs/gravel
    const buffer = trackWidth * 1.8; 

    for (let i = 0; i < n; i++) {
        let a = points[i];
        let b = points[(i + 1) % n];
        
        // 1. Check strict intersection with non-adjacent segments
        for (let j = i + 2; j < n; j++) {
            if ((i === 0 && j === n - 1)) continue; // Allow start/end point connection
            if (j === (i + 1) % n || j === (i - 1 + n) % n) continue; // Skip adjacent segments
            if (intersect(a, b, points[j], points[(j + 1) % n])) return true;
        }

        // 2. Check proximity (Buffer Zone)
        // We check if any point is too close to any non-adjacent segment
        for (let j = 0; j < n; j++) {
            // Skip self and immediate neighbors
            if (i === j || (i + 1)%n === j || (i - 1 + n)%n === j) continue;

            let c = points[j];
            let d = points[(j + 1) % n];

            // Check if point 'a' invades segment 'cd' buffer
            if (pointToSegmentDistance(a, c, d) < buffer) return true;
        }
    }
    return false;
}
