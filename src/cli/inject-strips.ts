#!/usr/bin/env node

import * as path from "node:path";
import * as fsp from "node:fs/promises";
import { Command, OptionValues } from "commander";
import * as cheerio from "cheerio";

const UPPER_STRIP_TRANSFORM_BLEED =
  "matrix(-0.08465497,0,0,-0.08437968,95.835211,16.078161)";
const LOWER_STRIP_TRANSFORM_BLEED =
  "matrix(0.08465497,0,0,0.08437967,12.099588,66.456639)";

const LOWER_STRIP_TRANSFORM_NO_BLEED =
  "matrix(0.08465497,0,0,0.08437967,2.5821875,56.939244)";
const UPPER_STRIP_TRANSFORM_NO_BLEED =
  "matrix(-0.08465497,0,0,-0.08437969,86.317811,6.5607584)";

async function injectStrip(
  svgImageSrc: string,
  strip1Src: string,
  strip2Src?: string,
  bleed = false
): Promise<string> {
  const $i = cheerio.load(svgImageSrc, { xmlMode: true });
  const $s1 = cheerio.load(strip1Src, { xmlMode: true });

  const circles1 = $s1("svg").find("circle");
  const group1 = $i("<g />");
  group1.prop("id", "strip1");
  group1.prop(
    "transform",
    bleed ? LOWER_STRIP_TRANSFORM_BLEED : LOWER_STRIP_TRANSFORM_NO_BLEED
  );
  group1.append(circles1);
  $i("svg").append(group1);

  const lowerDotStripRects = $i('rect[inkscape\\:label="lowerDotStripRect"]');

  if (lowerDotStripRects.length !== 1) {
    throw new Error(
      `Unexpected number of lowerDotStripRects: ${lowerDotStripRects.length}`
    );
  }

  lowerDotStripRects.remove();

  if (strip2Src) {
    const $s2 = cheerio.load(strip2Src, { xmlMode: true });

    const circles2 = $s2("svg").find("circle");
    const group2 = $i("<g />");
    group2.prop("id", "strip2");
    group2.prop(
      "transform",
      bleed ? UPPER_STRIP_TRANSFORM_BLEED : UPPER_STRIP_TRANSFORM_NO_BLEED
    );
    group2.append(circles2);
    $i("svg").append(group2);
    const upperDotStripRects = $i('rect[inkscape\\:label="upperDotStripRect"]');

    if (upperDotStripRects.length !== 1) {
      throw new Error(
        `Unexpected number of upperDotStripRects: ${upperDotStripRects.length}`
      );
    }

    upperDotStripRects.remove();
  }

  return $i.html();
}

async function main(options: OptionValues) {
  const svgImagePath = path.resolve(process.cwd(), options.input);
  const svgImageSrc = (await fsp.readFile(svgImagePath)).toString();

  const strip1Path = path.resolve(process.cwd(), options.strip1);
  const strip1Src = (await fsp.readFile(strip1Path)).toString();

  let strip2Src: string | undefined;

  if (options.strip2) {
    const strip2Path = path.resolve(process.cwd(), options.strip2);
    strip2Src = (await fsp.readFile(strip2Path)).toString();
  }

  const finalSvgSrc = await injectStrip(
    svgImageSrc,
    strip1Src,
    strip2Src,
    options.bleed === true || options.bleed === "true"
  );

  const svgImageRoot = path.basename(options.input, ".svg");
  const outputPath = path.resolve(
    process.cwd(),
    options.output,
    `${svgImageRoot}_injected.svg`
  );
  await fsp.writeFile(outputPath, finalSvgSrc);
  console.log("wrote", outputPath);
}

if (require.main === module) {
  const packageJson = require("../../package.json");

  const program = new Command();

  program
    .version(packageJson.version)
    .requiredOption(
      "-i, --input <svg-image-file>",
      "The path to the svg image to inject strips into"
    )
    .requiredOption(
      "-o, --output <image file root>",
      "The path for where to write the output image"
    )
    .requiredOption(
      "-s1, --strip1 <strip1-file>",
      "The path to the first strip"
    )
    .option(
      "-s2, --strip2 [strip2-file]",
      "The path to the optional second strip"
    )
    .option("-b, --bleed", "Set for cards with a .375 inch bleed")
    .parse(process.argv);

  const options = program.opts();

  if (!options.input) {
    program.help();
  } else {
    main(options)
      .then(() => {
        console.log("inject-strips finished");
      })
      .catch((e) => {
        console.error("unexpected error", e);
      });
  }
}
