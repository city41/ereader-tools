import * as path from "node:path";
import * as fsp from "node:fs/promises";
import { compress } from "../lib/compress";

// TODO: these should not be const
const lzwindow = 4096;
const lzsize = 256;
const method = 0;

async function main(binFilePath: string, destRawPath: string) {
  const buffer = await fsp.readFile(binFilePath);

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

  return fsp.writeFile(destRawPath, Uint8Array.from(result));
}

if (require.main === module) {
  const [_tsNode, _dotEncoder, binFilePath, destVpkPath] = process.argv;

  function usage() {
    console.error("Encodes a binary into a raw file");

    console.error("usage: compress-vpk <bin-file> <dest-vpk-file>");
    process.exit(1);
  }

  if (!binFilePath || !destVpkPath) {
    usage();
  }

  main(path.resolve(binFilePath), path.resolve(destVpkPath))
    .then(() => console.log("done"))
    .catch((e) => console.error(e));
}

// used by tests
export { main as compressVpkMain };
