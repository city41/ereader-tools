import * as path from "node:path";

async function main(binFilePath: string, destRawPath: string) {}
const [_tsNode, _dotEncoder, binFilePath, destRawPath] = process.argv;

function usage() {
  console.error("Encodes a binary into a raw file");

  console.error("usage: dot-encoder <bin-file> <dest-raw-file>");
  process.exit(1);
}

if (!binFilePath || !destRawPath) {
  usage();
}

if (require.main === module) {
  main(path.resolve(binFilePath), path.resolve(destRawPath))
    .then(() => console.log("done"))
    .catch((e) => console.error(e));
}
