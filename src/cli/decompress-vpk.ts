#!/usr/bin/env node

import * as path from "node:path";
import * as fsp from "node:fs/promises";
import { Command, OptionValues } from "commander";
import { VPK } from "../lib/VPK";

async function main(options: OptionValues) {
  const buffer = await fsp.readFile(path.resolve(process.cwd(), options.input));

  const vpk = new VPK(Array.from(buffer));
  const decompressed = vpk.decompress();

  return fsp.writeFile(
    path.resolve(process.cwd(), options.output),
    Uint8Array.from(decompressed)
  );
}

if (require.main === module) {
  const packageJson = require("../../package.json");

  const program = new Command();

  program
    .version(packageJson.version)
    .option(
      "-i, --input <vpk file to decompress>",
      "The path to the input vpk to decompress"
    )
    .option(
      "-o, --output <Decompressed file>",
      "The path for where to write the decompressed result"
    )
    .parse(process.argv);

  const options = program.opts();

  if (!options.input) {
    program.help();
  } else {
    main(options)
      .then(() => {
        console.log("decompress-vpk finished");
      })
      .catch((e) => {
        console.error("unexpected error", e);
      });
  }
}

// used by tests
export { main as compressVpkMain };
