import { createCanvas } from "canvas";
import { getDotcodelen, getDpiMultiplier } from "./dcs";

function dcsToPng(dcs: number[][]): number[] {
  const dpi_multiplier = getDpiMultiplier();
  const width = (getDotcodelen() * 35 + 9) * dpi_multiplier;
  const height = 44 * dpi_multiplier;
  console.log({ width, height });

  const canvas = createCanvas(width, height);
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

export { dcsToPng };
