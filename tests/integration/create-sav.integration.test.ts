import * as os from "node:os";
import * as path from "node:path";
import * as fsp from "node:fs/promises";
import execa from "execa";
import { mkdirp } from "mkdirp";
import { compressVpkMain } from "../../src/cli/compress-vpk";

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

describe("create-sav", function () {
  it("should create a sav file that matches neflmake", function () {});
});
