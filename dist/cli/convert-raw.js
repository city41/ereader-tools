#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertRawMain = main;
const path = __importStar(require("node:path"));
const fsp = __importStar(require("node:fs/promises"));
const commander_1 = require("commander");
const dcs_1 = require("../lib/dcs");
const rawToMarkCommands_1 = require("../lib/rawToMarkCommands");
const markCommandsToSvg_1 = require("../lib/markCommandsToSvg");
const markCommandsToPng_1 = require("../lib/markCommandsToPng");
const rawToDcses_1 = require("../lib/rawToDcses");
const dcsToBmp_1 = require("../lib/dcsToBmp");
async function convertMarkCommandsToImage(markCommands, index, dcsCount, outputRoot, format, svgShape, dotGap) {
    let suffix = dcsCount === 1 ? `.${format}` : `-${index}.${format}`;
    if (format === "svg") {
        suffix = `.${svgShape}_gap${dotGap}${suffix}`;
    }
    const imagePath = path.resolve(process.cwd(), outputRoot + suffix);
    let imageData = [];
    switch (format) {
        case "svg": {
            imageData = await (0, markCommandsToSvg_1.markCommandsToSvg)(markCommands, svgShape, dotGap);
            break;
        }
        case "png": {
            imageData = await (0, markCommandsToPng_1.markCommandsToPng)(markCommands);
            break;
        }
    }
    return { imagePath, imageData };
}
async function main(options) {
    const format = options.format ?? "svg";
    if (format === "bmp") {
        return bmpMain(options);
    }
    else {
        return markCommandsMain(options);
    }
}
async function bmpMain(options) {
    // TODO: strip off file extension
    const outputRoot = options.output;
    const dpi = parseInt(options.dpi ?? "300", 10);
    (0, dcs_1.setDpiMultiplier)(dpi);
    const buffer = await fsp.readFile(path.resolve(process.cwd(), options.input));
    const dcses = (0, rawToDcses_1.rawToDcses)(Array.from(buffer));
    for (let i = 0; i < dcses.length; ++i) {
        const dcs = dcses[i];
        const suffix = dcses.length === 1 ? ".bmp" : `-${i}.bmp`;
        const bmpPath = path.resolve(process.cwd(), outputRoot + suffix);
        const bmpData = (0, dcsToBmp_1.dcsToBmp)(dcs);
        await fsp.writeFile(bmpPath, Uint8Array.from(bmpData));
        console.log("wrote", bmpPath);
    }
}
async function markCommandsMain(options) {
    const buffer = await fsp.readFile(path.resolve(process.cwd(), options.input));
    const markCommandSets = (0, rawToMarkCommands_1.rawToMarkCommands)(Array.from(buffer));
    // TODO: strip off file extension
    const outputRoot = options.output;
    for (let i = 0; i < markCommandSets.length; ++i) {
        const markCommands = markCommandSets[i];
        const { imagePath, imageData } = await convertMarkCommandsToImage(markCommands, i, markCommandSets.length, outputRoot, options.format ?? "svg", options.svgShape ?? "square", parseFloat(options.dotGap ?? "10"));
        if (typeof imageData === "string") {
            await fsp.writeFile(imagePath, imageData);
        }
        else {
            await fsp.writeFile(imagePath, Uint8Array.from(imageData));
        }
        console.log("wrote", imagePath);
    }
}
if (require.main === module) {
    const packageJson = require("../../package.json");
    const program = new commander_1.Command();
    program
        .version(packageJson.version)
        .option("-i, --input <raw file>", "The path to the raw file to convert")
        .option("-o, --output <image file root>", "The path for where to write the output image")
        .option("--dpi <dpi>", "The output image's dpi (300, 600, 1200, 2400), only supported with bmp", "300")
        .option("-f, --format <format>", "The output image format (bmp, png or svg)", "svg")
        .option("-s, --svg-shape <circle | square>", "The shape of the main data dots, either circle or square", "square")
        .option("-g, --dot-gap <percentage>", "How much gap should be between data dots, in percentage", "10")
        .parse(process.argv);
    const options = program.opts();
    if (!options.input) {
        program.help();
    }
    else {
        main(options)
            .then(() => {
            console.log("convert-raw finished");
        })
            .catch((e) => {
            console.error("unexpected error", e);
        });
    }
}
//# sourceMappingURL=convert-raw.js.map