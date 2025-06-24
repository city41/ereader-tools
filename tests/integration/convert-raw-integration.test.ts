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
  additionalArgs: Record<string, any> = {}
): Promise<{ imagePath: string; imageData: number[] }> {
  const outputPath = path.resolve(dir, `test_${Date.now()}_convertRaw`);

  await convertRawMain({
    input: path.resolve(dir, "test.raw"),
    output: outputPath,
    ...additionalArgs,
  });

  const imgPath = path.resolve(
    dir,
    `${outputPath}.${additionalArgs.format ?? "bmp"}`
  );
  const buffer = await fsp.readFile(imgPath);

  return {
    imagePath: imgPath,
    imageData: Array.from(buffer),
  };
}

async function createImageData(
  imagePath: string,
  flip?: boolean
): Promise<ImageData> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = createCanvas(image.width, image.height);
      const context = canvas.getContext("2d")!;

      if (flip) {
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate(Math.PI);
        context.drawImage(image, -canvas.width / 2, -canvas.height / 2);
      } else {
        context.drawImage(image, 0, 0);
      }

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

      it("should flip the png strip", async function () {
        const convertRawResult = await convertRaw(dir, { format: "png" });
        const convertRawFlippedResult = await convertRaw(dir, {
          format: "png",
          flip: true,
        });

        const nonFlippedImageData = await createImageData(
          convertRawResult.imagePath
        );

        // by flipping it back, the two should then be the same
        const flippedImageData = await createImageData(
          convertRawFlippedResult.imagePath,
          true
        );

        const nonFlippedImageDataArray = Array.from(nonFlippedImageData.data);
        const flippedImageDataArray = Array.from(flippedImageData.data);

        // if this hangs that is a "no", stupid jest...
        expect(nonFlippedImageDataArray).toEqual(flippedImageDataArray);
      });
    });
  });
});
