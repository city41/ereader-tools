#!/usr/bin/env node

import * as path from "node:path";
import * as fsp from "node:fs/promises";
import { Command, OptionValues } from "commander";
import * as cheerio from "cheerio";

async function injectStrip(
  svgImageSrc: string,
  strip1Src: string,
  strip2Src?: string
): Promise<string> {
  const $i = cheerio.load(svgImageSrc, { xmlMode: true });
  const $s1 = cheerio.load(strip1Src, { xmlMode: true });

  const circles1 = $s1("svg").find("circle");
  const group1 = $i("<g />");
  group1.prop("id", "strip1");
  group1.prop(
    "transform",
    "matrix(0.08465497,0,0,0.08437967,2.5821875,56.939244)"
  );
  group1.append(circles1);
  $i("svg").append(group1);
  $i('rect[inkscape\\:label="lowerDotStripRect"]').remove();

  if (strip2Src) {
    const $s2 = cheerio.load(strip2Src, { xmlMode: true });

    const circles2 = $s2("svg").find("circle");
    const group2 = $i("<g />");
    group2.prop("id", "strip2");
    group2.prop(
      "transform",
      "matrix(0.08465497,0,0,0.08437967,2.5821875,2.8362396)"
    );
    group2.append(circles2);
    $i("svg").append(group2);
    $i('rect[inkscape\\:label="upperDotStripRect"]').remove();
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

  const finalSvgSrc = await injectStrip(svgImageSrc, strip1Src, strip2Src);

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
