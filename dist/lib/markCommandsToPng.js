"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markCommandsToPng = markCommandsToPng;
const canvas_1 = require("canvas");
function markCommandsToPng(markCommands) {
    const dotCodeLength = 28;
    const width = dotCodeLength * 35 + 9;
    const height = 44;
    const canvas = (0, canvas_1.createCanvas)(width, height);
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black";
    markCommands.forEach((mc) => {
        if (mc.type === "dot") {
            context.fillRect(mc.x, mc.y, 1, 1);
        }
        else {
            context.fillRect(mc.x + 1, mc.y, 3, 5);
            context.fillRect(mc.x, mc.y + 1, 5, 3);
        }
    });
    const buffer = canvas.toBuffer();
    return Array.from(buffer);
}
//# sourceMappingURL=markCommandsToPng.js.map