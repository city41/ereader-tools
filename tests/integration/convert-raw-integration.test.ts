import * as os from "node:os";
import * as path from "node:path";
import * as fsp from "node:fs/promises";
import execa from "execa";
import { mkdirp } from "mkdirp";
import { convertRawMain } from "../../src/cli/convert-raw";
import { Image, ImageData, createCanvas } from "canvas";

async function raw2bmp(
  dir: string,
  ...additionalArgs: string[]
): Promise<{ imagePath: string; imageData: number[] }> {
  await execa("./bin/raw2bmp", [
    "-i",
    path.resolve(dir, "test.raw"),
    "-o",
    path.resolve(dir, "test_raw2bmp"),
    ...additionalArgs,
  ]);

  const bmpPath = path.resolve(dir, "test_raw2bmp.bmp");
  const buffer = await fsp.readFile(bmpPath);

  return {
    imagePath: bmpPath,
    imageData: Array.from(buffer),
  };
}

async function convertRaw(
  dir: string,
  additionalArgs: Record<string, string> = {}
): Promise<{ imagePath: string; imageData: number[] }> {
  await convertRawMain({
    input: path.resolve(dir, "test.raw"),
    output: path.resolve(dir, "test_convertRaw"),
    ...additionalArgs,
  });

  const imgPath = path.resolve(
    dir,
    `test_convertRaw.${additionalArgs.format ?? "bmp"}`
  );
  const buffer = await fsp.readFile(imgPath);

  return {
    imagePath: imgPath,
    imageData: Array.from(buffer),
  };
}

async function createImageData(imagePath: string): Promise<ImageData> {
  console.log("createImageData", imagePath);
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = createCanvas(image.width, image.height);
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    image.src = imagePath;
  });
}

describe("convert-raw", function () {
  let dir = "";

  beforeEach(async function () {
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
      const raw2bmpResult = await raw2bmp(dir);
      const convertRawResult = await convertRaw(dir, { format: "bmp" });

      expect(convertRawResult.imageData).toHaveLength(5518);
      expect(raw2bmpResult.imageData).toEqual(convertRawResult.imageData);
    });

    it("should convert it to a 600dpi bmp", async function () {
      const raw2bmpResult = await raw2bmp(dir, "-dpi", "600");
      const convertRawResult = await convertRaw(dir, {
        dpi: "600",
        format: "bmp",
      });

      expect(convertRawResult.imageData).toHaveLength(21886);
      expect(raw2bmpResult.imageData).toEqual(convertRawResult.imageData);
    });

    describe("png", function () {
      it("should convert it to a 300dpi png", async function () {
        const raw2bmpResult = await raw2bmp(dir);
        const convertRawResult = await convertRaw(dir, { format: "png" });

        const raw2bmpImageData = await createImageData(raw2bmpResult.imagePath);
        const convertRawImageData = await createImageData(
          convertRawResult.imagePath
        );

        expect(Array.from(raw2bmpImageData.data)).toEqual(
          Array.from(convertRawImageData.data)
        );
      });

      it("should convert it to a 600dpi png", async function () {
        const raw2bmpResult = await raw2bmp(dir, "-dpi", "600");
        const convertRawResult = await convertRaw(dir, {
          dpi: "600",
          format: "png",
        });

        const raw2bmpImageData = await createImageData(raw2bmpResult.imagePath);
        const convertRawImageData = await createImageData(
          convertRawResult.imagePath
        );

        const raw2bmpData = Array.from(raw2bmpImageData.data);
        const convertRawData = Array.from(convertRawImageData.data);

        const rawfreq = raw2bmpData.reduce<Record<number, number>>(
          (accum, val) => {
            accum[val] = accum[val] ?? 0;
            accum[val] += 1;

            return accum;
          },
          {}
        );

        const convfreq = convertRawData.reduce<Record<number, number>>(
          (accum, val) => {
            accum[val] = accum[val] ?? 0;
            accum[val] += 1;

            return accum;
          },
          {}
        );

        console.log("rawfreq", JSON.stringify(rawfreq));
        console.log("convfreq", JSON.stringify(convfreq));

        expect(raw2bmpData).toEqual(convertRawData);
      });
    });
  });
});
