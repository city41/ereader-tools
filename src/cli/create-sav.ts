#!/usr/bin/env node

import * as path from "node:path";
import * as fsp from "node:fs/promises";

import { Command, OptionValues } from "commander";
import { createSavFile } from "src/lib/createSavFile";

async function main(options: OptionValues) {
  const buffer = await fsp.readFile(path.resolve(process.cwd(), options.input));

  const savFile = createSavFile(
    Array.from(buffer),
    options.type ?? "z80",
    options.region ?? "us",
    "create-sav"
  );

  const outputPath = path.resolve(process.cwd(), options.output);
  await fsp.writeFile(outputPath, Uint8Array.from(savFile));
  console.log("wrote", outputPath);
}

if (require.main === module) {
  const packageJson = require("../../package.json");

  const program = new Command();

  program
    .version(packageJson.version)
    .option("-i, --input <binary file>", "The path to the input binary")
    .option(
      "-o, --output <sav file>",
      "The path for where to write the sav file"
    )
    .option("-t, --type <z80 | gba | nes>", "The binary type", "z80")
    .option("-r, --region <us | jpn | jpn+ >", "The region to use", "us")
    .parse(process.argv);

  const options = program.opts();

  if (!options.input) {
    program.help();
  } else {
    main(options)
      .then(() => {
        console.log("create-sav finished");
      })
      .catch((e) => {
        console.error("unexpected error", e);
      });
  }
}

// used by tests
export { main as createSavMain };
