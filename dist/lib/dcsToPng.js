"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dcsToPng = dcsToPng;
const canvas_1 = require("canvas");
const dcs_1 = require("./dcs");
function dcsToPng(dcs) {
    const dpi_multiplier = (0, dcs_1.getDpiMultiplier)();
    const width = ((0, dcs_1.getDotcodelen)() * 35 + 9) * dpi_multiplier;
    const height = 44 * dpi_multiplier;
    console.log({ width, height });
    const canvas = (0, canvas_1.createCanvas)(width, height);
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black";
    for (let x = 0; x < width; ++x) {
        for (let y = 0; y < height; ++y) {
            const pixel = dcs[x][y];
            if (pixel === 1) {
                context.fillRect(x, y, 1, 1);
            }
        }
    }
    const buffer = canvas.toBuffer();
    return Array.from(buffer);
}
//# sourceMappingURL=dcsToPng.js.map