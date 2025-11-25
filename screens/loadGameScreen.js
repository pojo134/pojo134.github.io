class LoadGameScreen {
    constructor() {
        this.selectedSlot = null;
        this.hoveredSlot = null;
    }

    update(deltaTime, gameState) {
        // Animation updates
    }

    render(ctx, gameState) {
        const canvas = ctx.canvas;

        // Background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header
        ctx.fillStyle = '#1a0a1a';
        ctx.fillRect(0, 0, canvas.width, 80);
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.fillStyle = '#ff0066';
        ctx.textAlign = 'center';
        ctx.fillText('LOAD GAME', canvas.width / 2, 55);

        // Save slots
        this.renderSaveSlots(ctx, 200, 120);

        // Back button
        this.renderBackButton(ctx, canvas.width / 2 - 100, 630, 200, 50);
    }

    renderSaveSlots(ctx, x, y) {
        const slotWidth = 880;
        const slotHeight = 120;
        const slotSpacing = 20;

        for (let i = 0; i < 3; i++) {
            const slotY = y + i * (slotHeight + slotSpacing);
            const isSelected = this.selectedSlot === i;
            const isHovered = this.hoveredSlot === i;

            ctx.fillStyle = isHovered ? '#1a1a00' : '#1a1a1a';
            ctx.fillRect(x, slotY, slotWidth, slotHeight);
            ctx.strokeStyle = isSelected ? '#ffff00' : (isHovered ? '#ff0066' : '#444444');
            ctx.lineWidth = 2;
            ctx.strokeRect(x, slotY, slotWidth, slotHeight);

            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.fillStyle = '#00ffff';
            ctx.textAlign = 'left';
            ctx.fillText(`SLOT ${i + 1}`, x + 20, slotY + 35);

            ctx.font = '16px "Courier New", monospace';
            ctx.fillStyle = '#aaaaaa';
            ctx.fillText('[Empty Slot - Save data will appear here]', x + 20, slotY + 70);
        }
    }

    renderBackButton(ctx, x, y, width, height) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('BACK', x + width / 2, y + 32);
    }

    handleClick(x, y, gameState) {
        const canvas = { width: 1280, height: 720 };

        // Check save slots
        const slotWidth = 880;
        const slotHeight = 120;
        const slotSpacing = 20;
        for (let i = 0; i < 3; i++) {
            const slotY = 120 + i * (slotHeight + slotSpacing);
            if (x >= 200 && x <= 200 + slotWidth && y >= slotY && y <= slotY + slotHeight) {
                this.selectedSlot = i;
                return { action: 'loadSlot', slot: i };
            }
        }

        // Check back button
        const btnX = canvas.width / 2 - 100;
        const btnY = 630;
        if (x >= btnX && x <= btnX + 200 && y >= btnY && y <= btnY + 50) {
            return { action: 'back' };
        }

        return null;
    }

    handleMouseMove(x, y) {
        const slotWidth = 880;
        const slotHeight = 120;
        const slotSpacing = 20;

        this.hoveredSlot = null;
        for (let i = 0; i < 3; i++) {
            const slotY = 120 + i * (slotHeight + slotSpacing);
            if (x >= 200 && x <= 200 + slotWidth && y >= slotY && y <= slotY + slotHeight) {
                this.hoveredSlot = i;
            }
        }
    }
}

export default LoadGameScreen;