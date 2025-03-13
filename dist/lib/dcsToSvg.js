"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dcsToSvg = dcsToSvg;
const svg_js_1 = require("@svgdotjs/svg.js");
const dcs_1 = require("./dcs");
async function dcsToSvg(dcs) {
    const dpi_multiplier = (0, dcs_1.getDpiMultiplier)();
    if (dpi_multiplier !== 1) {
        throw new Error("svg only supports dpi multiplier 1x (300dpi)");
    }
    const { createHTMLWindow } = await import("svgdom");
    const window = createHTMLWindow();
    const document = window.document;
    (0, svg_js_1.registerWindow)(window, document);
    const width = ((0, dcs_1.getDotcodelen)() * 35 + 9) * dpi_multiplier;
    const height = 44 * dpi_multiplier;
    const canvas = (0, svg_js_1.SVG)().size(`${width}mm`, `${height}mm`);
    canvas.rect("100%", "100%").fill("white");
    for (let x = 0; x < width; ++x) {
        for (let y = 0; y < height; ++y) {
            const pixel = dcs[x][y];
            if (pixel === 1) {
                canvas.rect("1mm", "1mm").fill("black").move(`${x}mm`, `${y}mm`);
            }
        }
    }
    return canvas.svg();
}
//# sourceMappingURL=dcsToSvg.js.map