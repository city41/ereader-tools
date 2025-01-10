#!/usr/bin/env node

import * as path from "node:path";
import * as fsp from "node:fs/promises";
import { Command, OptionValues } from "commander";
import { convertRawToBmps } from "../lib/convertRawToBmps";
import { setDpiMultiplier } from "../lib/dcs";

async function main(options: OptionValues) {
  setDpiMultiplier(parseInt(options.dpi ?? "300", 10));
  const buffer = await fsp.readFile(path.resolve(process.cwd(), options.input));

  const bmps = convertRawToBmps(Array.from(buffer));
  const bmpRoot = options.output.replace(".bmp", "") as string;

  for (let i = 0; i < bmps.length; ++i) {
    const bmp = bmps[i];
    const suffix = bmps.length === 1 ? ".bmp" : `-${i}.bmp`;
    const bmpPath = path.resolve(process.cwd(), bmpRoot + suffix);

    await fsp.writeFile(bmpPath, Uint8Array.from(bmp));
    console.log("wrote", bmpPath);
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
