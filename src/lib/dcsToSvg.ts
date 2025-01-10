import { SVG, registerWindow } from "@svgdotjs/svg.js";
import { getDotcodelen, getDpiMultiplier } from "./dcs";

async function dcsToSvg(dcs: number[][]): Promise<string> {
  const dpi_multiplier = getDpiMultiplier();

  if (dpi_multiplier !== 1) {
    throw new Error("svg only supports dpi multiplier 1x (300dpi)");
  }

  const { createHTMLWindow } = await import("svgdom");

  const window = createHTMLWindow();
  const document = window.document;
  registerWindow(window, document);

  const width = (getDotcodelen() * 35 + 9) * dpi_multiplier;
  const height = 44 * dpi_multiplier;

  const canvas = SVG().size(width, height);
  canvas.rect(width, height).fill("white");

  for (let x = 0; x < width; ++x) {
    for (let y = 0; y < height; ++y) {
      const pixel = dcs[x][y];

      if (pixel === 1) {
        canvas.rect(1, 1).fill("black").move(x, y);
      }
    }
  }

  return canvas.svg();
}

export { dcsToSvg };
