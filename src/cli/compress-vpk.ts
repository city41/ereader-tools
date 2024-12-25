#!/usr/bin/env node

import * as path from "node:path";
import * as fsp from "node:fs/promises";
import { Command, OptionValues } from "commander";
import { compress } from "../lib/compress";

// TODO: these should not be const
const lzwindow = 4096;
const lzsize = 256;
const method = 0;

async function main(options: OptionValues) {
  const buffer = await fsp.readFile(path.resolve(process.cwd(), options.input));

  const result: number[] = [];

  compress(
    Array.from(buffer),
    buffer.length,
    2,
    lzwindow,
    lzsize,
    method,
    result
  );

  return fsp.writeFile(
    path.resolve(process.cwd(), options.output),
    Uint8Array.from(result)
  );
}

if (require.main === module) {
  const packageJson = require("../package.json");

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
