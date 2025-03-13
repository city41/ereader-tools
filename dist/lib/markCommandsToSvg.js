"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markCommandsToSvg = markCommandsToSvg;
const svg_js_1 = require("@svgdotjs/svg.js");
async function markCommandsToSvg(markCommands, svgShape, dotGap) {
    const { createHTMLWindow } = await import("svgdom");
    const window = createHTMLWindow();
    const document = window.document;
    (0, svg_js_1.registerWindow)(window, document);
    const dotCodeLength = 28;
    const width = dotCodeLength * 35 + 9;
    const height = 44;
    const canvas = (0, svg_js_1.SVG)().viewbox({ x: 0, y: 0, width, height });
    canvas.rect("100%", "100%").fill("white");
    markCommands.forEach((mc) => {
        if (mc.type === "dot") {
            const size = 1 - dotGap / 100;
            const offset = (1 - size) / 2;
            const s = svgShape === "circle"
                ? canvas.circle(size).fill("black")
                : canvas.rect(size, size).fill("black");
            s.move(mc.x + offset, mc.y + offset);
        }
        else {
            canvas.circle(5.14).fill("black").move(mc.x, mc.y);
        }
    });
    return canvas.svg();
}
//# sourceMappingURL=markCommandsToSvg.js.map