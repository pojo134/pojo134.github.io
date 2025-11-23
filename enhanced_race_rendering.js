/**
 * Enhanced Race Screen Rendering
 * Adds car sprite rendering with color overlays and track textures
 */

/**
 * Draw a car sprite with color overlay
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} sprite
 * @param {number} x
 * @param {number} y
 * @param {string} color - Team color for overlay
 * @param {number} rotation - Rotation in radians
 */
function drawColoredCarSprite(ctx, sprite, x, y, color, rotation = 0) {
    if (!sprite) return;

    const width = sprite.width * 2; // Scale up 2x
    const height = sprite.height * 2;

    ctx.save();

    // Move to car position and rotate
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Draw the sprite
    ctx.drawImage(sprite, -width / 2, -height / 2, width, height);

    // Apply color overlay using multiply blend mode
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = color;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // Restore normal blending
    ctx.globalCompositeOperation = 'source-over';

    ctx.restore();
}

/**
 * Draw track with texture
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} waypoints
 * @param {HTMLImageElement} trackTexture
 * @param {HTMLImageElement} grassTexture
 * @param {number} width
 * @param {number} height
 */
function drawTexturedTrack(ctx, waypoints, trackTexture, grassTexture, width, height) {
    if (!waypoints || waypoints.length === 0) return;

    // Fill background with grass texture (if available)
    if (grassTexture) {
        const pattern = ctx.createPattern(grassTexture, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
    } else {
        ctx.fillStyle = '#2a4a2a'; // Grass green
        ctx.fillRect(0, 0, width, height);
    }

    // Draw track surface
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 60;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw main track path
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw track surface with texture (if available)
    if (trackTexture) {
        ctx.save();
        ctx.clip();
        const pattern = ctx.createPattern(trackTexture, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fill();
        ctx.restore();
    } else {
        ctx.fillStyle = '#333333'; // Asphalt gray
        ctx.fill();
    }

    // Draw center line
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw start/finish line
    if (waypoints.length > 1) {
        const startX = waypoints[0].x;
        const startY = waypoints[0].y;
        const angle = Math.atan2(waypoints[1].y - startY, waypoints[1].x - startX);

        ctx.save();
        ctx.translate(startX, startY);
        ctx.rotate(angle + Math.PI / 2);

        // Checkered pattern for start/finish
        const lineWidth = 60;
        const squareSize = 10;
        for (let i = -lineWidth / 2; i < lineWidth / 2; i += squareSize) {
            for (let j = -5; j < 5; j += squareSize) {
                const isWhite = (Math.floor(i / squareSize) + Math.floor(j / squareSize)) % 2 === 0;
                ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
                ctx.fillRect(i, j, squareSize, squareSize);
            }
        }

        ctx.restore();
    }
}

/**
 * Get car sprite based on tier
 * @param {AssetManager} assetManager
 * @param {number} tier
 * @returns {HTMLImageElement}
 */
function getCarSpriteForTier(assetManager, tier) {
    const spriteMap = {
        1: 'gokart',
        2: 'stockcar',
        3: 'gt3',
        4: 'openwheel',
        5: 'topfuel'
    };

    const spriteName = spriteMap[tier] || 'gokart';
    return assetManager.getImage(spriteName);
}
