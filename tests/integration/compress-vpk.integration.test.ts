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

describe("compress-vpk", function () {
  let dir = "";

  beforeAll(async function () {
    dir = path.resolve(
      os.tmpdir(),
      `compress-vpk-integration-test-${Date.now()}`
    );

    await mkdirp(dir);
  });

  describe("compress", function () {
    it("should do very basic compression", async function () {
      const bin = [0, 1, 2, 3, 3, 3, 3, 3, 4, 5, 5];

      const binPath = await writeBin(bin, dir);

      const nevpkCompressedBin = await nevpk(binPath, dir);

      const compressVpkCompressedBin = await compressVpk(binPath, dir);

      expect(nevpkCompressedBin).toEqual(compressVpkCompressedBin);
    });

    it("should compress at level 0", async function () {
      const bin = [0, 1, 2, 3, 3, 3, 3, 3, 4, 5, 5];

      const binPath = await writeBin(bin, dir);

      const nevpkCompressedBin = await nevpk(binPath, dir, ["-level", "0"]);

      const compressVpkCompressedBin = await compressVpk(binPath, dir, {
        level: "0",
      });

      expect(nevpkCompressedBin).toEqual(compressVpkCompressedBin);
    });

    it("should compress at level 1", async function () {
      const bin = [0, 1, 2, 3, 3, 3, 3, 3, 4, 5, 5];

      const binPath = await writeBin(bin, dir);

      const nevpkCompressedBin = await nevpk(binPath, dir, ["-level", "1"]);

      const compressVpkCompressedBin = await compressVpk(binPath, dir, {
        level: "1",
      });

      expect(nevpkCompressedBin).toEqual(compressVpkCompressedBin);
    });

    it("should compress at level 2", async function () {
      const bin = [0, 1, 2, 3, 3, 3, 3, 3, 4, 5, 5];

      const binPath = await writeBin(bin, dir);

      const nevpkCompressedBin = await nevpk(binPath, dir, ["-level", "2"]);

      const compressVpkCompressedBin = await compressVpk(binPath, dir, {
        level: "2",
      });

      expect(nevpkCompressedBin).toEqual(compressVpkCompressedBin);
    });

    it("should compress using method 0", async function () {
      const bin = [0, 1, 2, 3, 3, 3, 3, 3, 4, 5, 5];

      const binPath = await writeBin(bin, dir);

      const nevpkCompressedBin = await nevpk(binPath, dir, ["-method", "0"]);

      const compressVpkCompressedBin = await compressVpk(binPath, dir, {
        method: "0",
      });

      expect(nevpkCompressedBin).toEqual(compressVpkCompressedBin);
    });

    it.skip("should compress using method 1", async function () {
      const bin = [0, 1, 2, 3, 3, 3, 3, 3, 4, 5, 5];

      const binPath = await writeBin(bin, dir);

      const nevpkCompressedBin = await nevpk(binPath, dir, ["-method", "1"]);

      const compressVpkCompressedBin = await compressVpk(binPath, dir, {
        method: "1",
      });

      expect(nevpkCompressedBin).toEqual(compressVpkCompressedBin);
    });
  });
});
