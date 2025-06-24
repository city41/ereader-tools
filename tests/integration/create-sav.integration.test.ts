import * as os from "node:os";
import * as path from "node:path";
import * as fsp from "node:fs/promises";
import execa from "execa";
import { mkdirp } from "mkdirp";
import { createSavMain } from "../../src/cli/create-sav";
import { compressVpk } from "./compress-vpk-utils";

async function neflmak(
  binaryPath: string,
  dir: string,
  ...additionalArgs: string[]
): Promise<number[]> {
  const outputPath = path.resolve(dir, "neflmak_test.sav");
  await execa("./bin/neflmake", [
    "-i",
    binaryPath,
    "-o",
    outputPath,
    ...additionalArgs,
  ]);

  const buffer = await fsp.readFile(outputPath);

  return Array.from(buffer);
}

async function createSav(binaryPath: string, dir: string, additionArgs = {}) {
  const outputPath = path.resolve(dir, "createSav_test.sav");

  await createSavMain({
    input: binaryPath,
    output: outputPath,
    ...additionArgs,
  });

  const buffer = await fsp.readFile(outputPath);

  return Array.from(buffer);
}

describe("create-sav", function () {
  let dir = "";

  beforeEach(async function () {
    dir = path.resolve(
      os.tmpdir(),
      `create-sav-integration-test-${Date.now()}`
    );

    await mkdirp(dir);
  });

  it("should create a sav file that matches neflmake", async function () {
    const binary = [1, 2, 3, 4, 5];
    const binaryPath = path.resolve(dir, "test.bin");

    await fsp.writeFile(binaryPath, Uint8Array.from(binary));

    const createSavData = await createSav(binaryPath, dir, { type: "z80" });
    const neflmakSavData = await neflmak(binaryPath, dir, "-type", "1");

    expect(createSavData).toEqual(neflmakSavData);
  });

  it("should set the name in the sav file", async function () {
    const binary = [1, 2, 3, 4, 5];
    const binaryPath = path.resolve(dir, "test.bin");

    await fsp.writeFile(binaryPath, Uint8Array.from(binary));

    const createSavData = await createSav(binaryPath, dir, {
      type: "z80",
      name: "frodo",
    });
    const neflmakSavData = await neflmak(
      binaryPath,
      dir,
      "-type",
      "1",
      "-name",
      "frodo"
    );

    expect(createSavData).toEqual(neflmakSavData);
  });

  it("should create a sav file from a vpk", async function () {
    const binary = [0, 1, 2, 3, 3, 3, 3, 3, 4, 5, 5];
    const binaryPath = path.resolve(dir, "test.bin");
    await fsp.writeFile(binaryPath, Uint8Array.from(binary));

    const vpkBinary = await compressVpk(binaryPath, dir);

    const vpkPath = path.resolve(dir, "test.vpk");
    await fsp.writeFile(vpkPath, Uint8Array.from(vpkBinary));

    const createSavData = await createSav(vpkPath, dir, { type: "z80" });
    const neflmakSavData = await neflmak(vpkPath, dir, "-type", "1");

    expect(createSavData).toEqual(neflmakSavData);
  });
});
