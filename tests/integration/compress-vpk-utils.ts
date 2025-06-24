import * as path from "node:path";
import * as fsp from "node:fs/promises";
import execa from "execa";
import { compressVpkMain } from "../../src/cli/compress-vpk";

async function writeBin(bin: number[], dir: string): Promise<string> {
  const uint8Array = Uint8Array.from(bin);

  const binPath = path.resolve(dir, "testBinToCompress.bin");

  await fsp.writeFile(binPath, uint8Array);

  return binPath;
}

async function nevpk(
  binPath: string,
  dir: string,
  args: string[] = []
): Promise<number[]> {
  const compressedPath = path.resolve(dir, "nevpk.vpk");

  await execa("./bin/nevpk", [
    "-i",
    binPath,
    "-o",
    compressedPath,
    "-c",
    ...args,
  ]);

  const buffer = await fsp.readFile(compressedPath);
  return Array.from(buffer);
}

async function compressVpk(
  binPath: string,
  dir: string,
  args: Record<string, string> = {}
): Promise<number[]> {
  const compressedPath = path.resolve(dir, "compressVpk.vpk");

  await compressVpkMain({ input: binPath, output: compressedPath, ...args });

  const buffer = await fsp.readFile(compressedPath);
  return Array.from(buffer);
}

export { writeBin, nevpk, compressVpk };
