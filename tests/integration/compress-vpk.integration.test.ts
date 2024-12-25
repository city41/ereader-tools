import * as os from "node:os";
import * as path from "node:path";
import * as fsp from "node:fs/promises";
import execa from "execa";
import { mkdirp } from "mkdirp";
import { compressVpkMain } from "../../src/cli/compress-vpk";

async function writeBin(bin: number[], dir: string): Promise<string> {
  const uint8Array = Uint8Array.from(bin);

  const binPath = path.resolve(dir, "testBinToCompress.bin");

  await fsp.writeFile(binPath, uint8Array);

  return binPath;
}

async function nevpk(binPath: string, dir: string): Promise<number[]> {
  const compressedPath = path.resolve(dir, "nevpk.vpk");

  await execa("./bin/nevpk", ["-i", binPath, "-o", compressedPath, "-c"]);

  const buffer = await fsp.readFile(compressedPath);
  return Array.from(buffer);
}

async function compressVpk(binPath: string, dir: string): Promise<number[]> {
  const compressedPath = path.resolve(dir, "compressVpk.vpk");

  await compressVpkMain(binPath, compressedPath);

  const buffer = await fsp.readFile(compressedPath);
  return Array.from(buffer);
}

describe("compress-vpk", function () {
  let dir = "";

  beforeAll(async function () {
    dir = path.resolve(
      os.tmpdir(),
      `compress-vpk-integration-test-${Date.now()}`
    );

    await mkdirp(dir);
  });

  describe("basic compress", function () {
    it("should do very basic compression", async function () {
      const bin = [0, 1, 2, 3, 3, 3, 3, 3, 4, 5, 5];

      const binPath = await writeBin(bin, dir);

      const nevpkCompressedBin = await nevpk(binPath, dir);

      const compressVpkCompressedBin = await compressVpk(binPath, dir);

      expect(nevpkCompressedBin).toEqual(compressVpkCompressedBin);
    });
  });
});
