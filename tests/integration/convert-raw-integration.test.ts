import * as os from "node:os";
import * as path from "node:path";
import * as fsp from "node:fs/promises";
import execa from "execa";
import { mkdirp } from "mkdirp";
import { convertRawMain } from "../../src/cli/convert-raw";

async function raw2bmp(
  dir: string,
  ...additionalArgs: string[]
): Promise<number[]> {
  await execa("./bin/raw2bmp", [
    "-i",
    path.resolve(dir, "test.raw"),
    "-o",
    path.resolve(dir, "test"),
    ...additionalArgs,
  ]);

  const bmpPath = path.resolve(dir, "test.bmp");

  const buffer = await fsp.readFile(bmpPath);
  return Array.from(buffer);
}

async function convertRaw(
  dir: string,
  additionalArgs: Record<string, string> = {}
): Promise<number[]> {
  await convertRawMain({
    input: path.resolve(dir, "test.raw"),
    output: "test",
    ...additionalArgs,
  });

  const bmpPath = path.resolve(dir, "test.bmp");

  const buffer = await fsp.readFile(bmpPath);
  return Array.from(buffer);
}

describe("convert-raw", function () {
  let dir = "";

  beforeAll(async function () {
    dir = path.resolve(
      os.tmpdir(),
      `convert-raw-integration-test-${Date.now()}`
    );

    await mkdirp(dir);
    await fsp.copyFile(
      path.resolve(__dirname, "../../testFiles/solitaire.ereader1.testraw"),
      path.resolve(dir, "test.raw")
    );
  });

  describe("solitaire raw", function () {
    it("should convert it to a 300dpi bmp", async function () {
      const raw2bmpImg = await raw2bmp(dir);
      const convertRawImg = await convertRaw(dir);

      expect(convertRawImg).toHaveLength(5518);
      expect(raw2bmpImg).toEqual(convertRawImg);
    });

    it("should convert it to a 600dpi bmp", async function () {
      const raw2bmpImg = await raw2bmp(dir, "-dpi", "600");
      const convertRawImg = await convertRaw(dir, { "--dpi": "600" });

      expect(convertRawImg).toHaveLength(21886);
      expect(raw2bmpImg).toEqual(convertRawImg);
    });
  });
});
