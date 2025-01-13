#!/usr/bin/env node

import * as path from "node:path";
import * as fsp from "node:fs/promises";
import { Command, OptionValues } from "commander";
import { setDpiMultiplier } from "../lib/dcs";
import { rawToMarkCommands } from "../lib/rawToMarkCommands";
import { MarkCommand } from "../lib/MarkCommandSetGenerator";
import { markCommandsToSvg } from "../lib/markCommandsToSvg";
import { markCommandsToPng } from "../lib/markCommandsToPng";
import { rawToDcses } from "../lib/rawToDcses";
import { dcsToBmp } from "../lib/dcsToBmp";

async function convertMarkCommandsToImage(
  markCommands: MarkCommand[],
  index: number,
  dcsCount: number,
  outputRoot: string,
  format: "png" | "svg",
  svgShape: "circle" | "square",
  dotGap: number
): Promise<{ imagePath: string; imageData: number[] | string }> {
  let suffix = dcsCount === 1 ? `.${format}` : `-${index}.${format}`;

  if (format === "svg") {
    suffix = `.${svgShape}_gap${dotGap}${suffix}`;
  }

  const imagePath = path.resolve(process.cwd(), outputRoot + suffix);

  let imageData: number[] | string = [];

  switch (format) {
    case "svg": {
      imageData = await markCommandsToSvg(markCommands, svgShape, dotGap);
      break;
    }
    case "png": {
      imageData = await markCommandsToPng(markCommands);
      break;
    }
  }

  return { imagePath, imageData };
}

async function main(options: OptionValues) {
  const format = options.format ?? "svg";

  if (format === "bmp") {
    return bmpMain(options);
  } else {
    return markCommandsMain(options);
  }
}

async function bmpMain(options: OptionValues) {
  // TODO: strip off file extension
  const outputRoot = options.output;

  const dpi = parseInt(options.dpi ?? "300", 10);
  setDpiMultiplier(dpi);
  const buffer = await fsp.readFile(path.resolve(process.cwd(), options.input));

  const dcses = rawToDcses(Array.from(buffer));

  for (let i = 0; i < dcses.length; ++i) {
    const dcs = dcses[i];
    const suffix = dcses.length === 1 ? ".bmp" : `-${i}.bmp`;
    const bmpPath = path.resolve(process.cwd(), outputRoot + suffix);
    const bmpData = dcsToBmp(dcs);

    await fsp.writeFile(bmpPath, Uint8Array.from(bmpData));
    console.log("wrote", bmpPath);
  }
}

async function markCommandsMain(options: OptionValues) {
  const buffer = await fsp.readFile(path.resolve(process.cwd(), options.input));

  const markCommandSets = rawToMarkCommands(Array.from(buffer));
  // TODO: strip off file extension
  const outputRoot = options.output;

  for (let i = 0; i < markCommandSets.length; ++i) {
    const markCommands = markCommandSets[i];

    const { imagePath, imageData } = await convertMarkCommandsToImage(
      markCommands,
      i,
      markCommandSets.length,
      outputRoot,
      options.format ?? "svg",
      options.svgShape ?? "square",
      parseInt(options.dotGap ?? "10", 10)
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
      "-o, --output <image file root>",
      "The path for where to write the output image"
    )
    .option(
      "--dpi <dpi>",
      "The output image's dpi (300, 600, 1200, 2400), only supported with bmp",
      "300"
    )
    .option(
      "-f, --format <format>",
      "The output image format (bmp, png or svg)",
      "svg"
    )
    .option(
      "-s, --svg-shape <circle | square>",
      "The shape of the main data dots, either circle or square",
      "square"
    )
    .option(
      "-g, --dot-gap <percentage>",
      "How much gap should be between data dots, in percentage",
      "10"
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
