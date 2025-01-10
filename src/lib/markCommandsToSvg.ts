import { SVG, registerWindow } from "@svgdotjs/svg.js";
import { MarkCommand } from "./MarkCommandSetGenerator";

async function markCommandsToSvg(markCommands: MarkCommand[]): Promise<string> {
  const { createHTMLWindow } = await import("svgdom");

  const window = createHTMLWindow();
  const document = window.document;
  registerWindow(window, document);

  const dotCodeLength = 28;
  const width = dotCodeLength * 35 + 9;
  const height = 44;

  const canvas = SVG().viewbox({ x: 0, y: 0, width, height });
  canvas.rect("100%", "100%").fill("white");

  markCommands.forEach((mc) => {
    if (mc.type === "dot") {
      canvas.circle(0.7).fill("black").move(mc.x, mc.y);
    } else {
      canvas.circle(5.14).fill("black").move(mc.x, mc.y);
    }
  });

  return canvas.svg();
}

export { markCommandsToSvg };
