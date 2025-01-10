#!/usr/bin/env node

import * as path from "node:path";
import * as fsp from "node:fs/promises";
import { Command, OptionValues } from "commander";
import { rawToDcses } from "../lib/rawToDcses";
import { setDpiMultiplier } from "../lib/dcs";
import { dcsToBmp } from "../lib/dcsToBmp";
import { dcsToPng } from "../lib/dcsToPng";
import { dcsToSvg } from "../lib/dcsToSvg";

async function convertDcsToImage(
  dcs: number[][],
  index: number,
  dcsCount: number,
  outputRoot: string,
  format: "bmp" | "png" | "svg"
): Promise<{ imagePath: string; imageData: number[] | string }> {
  const suffix = dcsCount === 1 ? `.${format}` : `-${index}.${format}`;
  const imagePath = path.resolve(process.cwd(), outputRoot + suffix);

  let imageData: number[] | string = [];

  switch (format) {
    case "bmp": {
      imageData = dcsToBmp(dcs);
      break;
    }
    case "png": {
      imageData = dcsToPng(dcs);
      break;
    }
    case "svg": {
      imageData = await dcsToSvg(dcs);
      break;
    }
  }

  return { imagePath, imageData };
}

async function main(options: OptionValues) {
  const dpi = parseInt(options.dpi ?? "300", 10);
  setDpiMultiplier(dpi);
  const buffer = await fsp.readFile(path.resolve(process.cwd(), options.input));

  console.log(JSON.stringify(options));

  const dcses = rawToDcses(Array.from(buffer));
  // TODO: strip off file extension
  const outputRoot = options.output;

  for (let i = 0; i < dcses.length; ++i) {
    const dcs = dcses[i];

    const { imagePath, imageData } = await convertDcsToImage(
      dcs,
      i,
      dcses.length,
      outputRoot,
      options.format ?? "bmp"
    );

    if (typeof imageData === "string") {
      await fsp.writeFile(imagePath, imageData);
    } else {
      await fsp.writeFile(imagePath, Uint8Array.from(imageData));
    }
    console.log("wrote", imagePath);
  }
}

if (require.main === module) {
  const packageJson = require("../../package.json");

  const program = new Command();

  program
    .version(packageJson.version)
    .option("-i, --input <raw file>", "The path to the raw file to convert")
    .option(
      "-o, --output <bmp image file root>",
      "The path for where to write the bmp image"
    )
    .option(
      "--dpi <dpi>",
      "The output image's dpi (300, 600, 1200, 2400)",
      "300"
    )
    .option(
      "-f, --format <format>",
      "The output image format (bmp or png)",
      "bmp"
    )
    .parse(process.argv);

  const options = program.opts();

  if (!options.input) {
    program.help();
  } else {
    main(options)
      .then(() => {
        console.log("convert-raw finished");
      })
      .catch((e) => {
        console.error("unexpected error", e);
      });
  }
}

// used by tests
export { main as convertRawMain };
