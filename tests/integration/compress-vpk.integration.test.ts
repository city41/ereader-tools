import * as os from "node:os";
import * as path from "node:path";
import { mkdirp } from "mkdirp";
import { compressVpk, nevpk, writeBin } from "./compress-vpk-utils";

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

export { compressVpk };
