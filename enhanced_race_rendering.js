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
 * @param {object|Array} trackObject - The full track object or a simple array of waypoints
 * @param {HTMLImageElement} trackTexture
 * @param {HTMLImageElement} grassTexture
 * @param {number} width
 * @param {number} height
 */
function drawTexturedTrack(ctx, trackObject, trackTexture, grassTexture, width, height) {
    // Determine if we have the full track object or a simple array of waypoints (for backwards compatibility)
    const isFullTrackObject = trackObject && trackObject.trackData && Array.isArray(trackObject.trackData.leftBorder);
    const waypoints = isFullTrackObject ? trackObject.waypoints : trackObject;
    
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

    // Draw track surface (for generated tracks, use borders for accurate shape)
    if (isFullTrackObject) {
        const leftBorder = trackObject.trackData.leftBorder;
        const rightBorder = trackObject.trackData.rightBorder;
        // Combine borders to form the track polygon
        const trackSurfacePoints = [...rightBorder, ...leftBorder.slice().reverse()];
        
        ctx.beginPath();
        ctx.moveTo(trackSurfacePoints[0].x, trackSurfacePoints[0].y);
        for (let i = 1; i < trackSurfacePoints.length; i++) {
            ctx.lineTo(trackSurfacePoints[i].x, trackSurfacePoints[i].y);
        }
        ctx.closePath();
        
        // Draw track surface with texture (using the defined clip path)
        if (trackTexture) {
            ctx.save();
            ctx.clip(); // Clip to the track surface path defined above
            const pattern = ctx.createPattern(trackTexture, 'repeat');
            ctx.fillStyle = pattern;
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fillStyle = '#333333'; // Asphalt gray
            ctx.fill();
        }
        
        // Draw Borders
        ctx.strokeStyle = '#ffffff'; // White border color
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        
        // Draw Left Border
        ctx.beginPath();
        ctx.moveTo(leftBorder[0].x, leftBorder[0].y);
        for (let i = 1; i < leftBorder.length; i++) {
            ctx.lineTo(leftBorder[i].x, leftBorder[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Draw Right Border
        ctx.beginPath();
        ctx.moveTo(rightBorder[0].x, rightBorder[0].y);
        for (let i = 1; i < rightBorder.length; i++) {
            ctx.lineTo(rightBorder[i].x, rightBorder[i].y);
        }
        ctx.closePath();
        ctx.stroke();

    } else {
        // Fallback for legacy waypoints array (draw as thick stroke)
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
    }

    // Draw center line (use the racing line waypoints)
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
        
        // Use tangent from the generated waypoints (or calculate from next point as fallback)
        const tangent = waypoints[0].tangent || {
            x: waypoints[1].x - startX,
            y: waypoints[1].y - startY
        };
        const angle = Math.atan2(tangent.y, tangent.x);

        ctx.save();
        ctx.translate(startX, startY);
        ctx.rotate(angle + Math.PI / 2);

        // Checkered pattern for start/finish
        const lineWidth = isFullTrackObject ? trackObject.trackData.trackWidth : 60; // Use actual track width or fallback
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
