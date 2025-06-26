import * as os from "node:os";
import * as path from "node:path";
import * as fsp from "node:fs/promises";
import execa from "execa";
import { mkdirp } from "mkdirp";
import {
  VPK,
  VPK_COMPRESSION_TYPE_ONE_SAMPLE,
  ValidVPKHeader,
} from "../../src/lib/VPK";

const fillerBytes = new Array(128).fill(0xff);

async function nevpkDecompress(dir: string): Promise<number[]> {
  await execa("./bin/nevpk", [
    "-d",
    "-i",
    path.resolve(dir, "test.vpk"),
    "-o",
    path.resolve(dir, "test_nevpk.bin"),
  ]);

  const binPath = path.resolve(dir, "test_nevpk.bin");
  const buffer = await fsp.readFile(binPath);

  return Array.from(buffer);
}

describe("VPK", function () {
  let dir = "";
  let vpkBin: number[] = [];

  beforeAll(async function () {
    dir = path.resolve(os.tmpdir(), `VPK-integration-test-${Date.now()}`);

    await mkdirp(dir);
    await fsp.copyFile(
      path.resolve(__dirname, "../../testFiles/solitaire.testvpk"),
      path.resolve(dir, "test.vpk")
    );

    const vpkBuffer = await fsp.readFile(
      path.resolve(__dirname, "../../testFiles/solitaire.testvpk")
    );

    vpkBin = Array.from(new Uint8Array(vpkBuffer));
  });

  describe("header", function () {
    it("should parse the header from a valid vpk", function () {
      const vpk = new VPK(vpkBin);

      expect(vpk.header.isValid).toBe(true);
      const header: ValidVPKHeader = vpk.header as ValidVPKHeader;
      expect(header.compressionSampleType).toBe(
        VPK_COMPRESSION_TYPE_ONE_SAMPLE
      );
      expect(header.size).toBe(18052);
    });

    it("should parse the header from an invalid vpk", function () {
      const vpk = new VPK([
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        ...fillerBytes,
      ]);

      expect(vpk.header.isValid).toBe(false);
      expect("size" in vpk.header).toBe(false);
      expect("compressionType" in vpk.header).toBe(false);
    });

    it("should indicate the vpk is invalid if it has an unknown compression type value", function () {
      const markerBytes = "vpk0".split("").map((c) => c.charCodeAt(0));
      // size is a big endian 32 bit value, so size of 100 -> [0,0,0,100]
      const vpk = new VPK([...markerBytes, 0, 0, 0, 100, 4, ...fillerBytes]);

      expect(vpk.header.isValid).toBe(false);
      expect("size" in vpk.header).toBe(false);
      expect("compressionType" in vpk.header).toBe(false);
    });

    it("should determine the vpk size correctly", function () {
      const vpk = new VPK(vpkBin);

      expect(vpk.header.isValid).toBe(true);
      const header: ValidVPKHeader = vpk.header as ValidVPKHeader;
      expect(header.size).toBe(18052);
    });
  });

  describe("decompress", function () {
    it("should decompress the same as nevpk", async function () {
      const nevpkDecompressedBin = await nevpkDecompress(dir);

      const vpk = new VPK(vpkBin);
      const vpkDecompressedBin = vpk.decompress();

      expect(vpkDecompressedBin).toEqual(nevpkDecompressedBin);
    });
  });
});
