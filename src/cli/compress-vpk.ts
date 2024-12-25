#!/usr/bin/env node

import * as path from "node:path";
import * as fsp from "node:fs/promises";
import { Command, OptionValues } from "commander";
import { compress } from "../lib/compress";

// TODO: these should not be const
const lzwindow = 4096;
const lzsize = 256;

async function main(options: OptionValues) {
  const buffer = await fsp.readFile(path.resolve(process.cwd(), options.input));

  const result: number[] = [];

  compress(
    Array.from(buffer),
    buffer.length,
    parseInt((options.level ?? "2") as string, 10) as 0 | 1 | 2 | 3,
    lzwindow,
    lzsize,
    parseInt((options.method ?? "0") as string, 10),
    result
  );

  return fsp.writeFile(
    path.resolve(process.cwd(), options.output),
    Uint8Array.from(result)
  );
}

if (require.main === module) {
  const packageJson = require("../../package.json");

  const program = new Command();

  program
    .version(packageJson.version)
    .option(
      "-i, --input <Binary file to compress>",
      "The path to the input binary to compress"
    )
    .option(
      "-o, --output <Compressed vpk file>",
      "The path for where to write the compressed vpk"
    )
    .option(
      "-l, --level <0 | 1 | 2 | 3>",
      "The level of compression. 0: none, 2: max (default), 3: try all",
      "2"
    )
    .option("-m, --method <0 | 1>", "The compression method to use", "0")
    .parse(process.argv);

  const options = program.opts();

  if (!options.input) {
    program.help();
  } else {
    main(options)
      .then(() => {
        console.log("sromcrom finished");
      })
      .catch((e) => {
        console.error("unexpected error", e);
      });
  }
}

// used by tests
export { main as compressVpkMain };
