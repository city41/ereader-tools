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
const rawToDcses_1 = require("../lib/rawToDcses");
const dcs_1 = require("../lib/dcs");
const dcsToBmp_1 = require("../lib/dcsToBmp");
const dcsToPng_1 = require("../lib/dcsToPng");
function convertDcsToImage(dcs, index, dcsCount, outputRoot, format) {
    const suffix = dcsCount === 1 ? `.${format}` : `-${index}.${format}`;
    const imagePath = path.resolve(process.cwd(), outputRoot + suffix);
    let imageData = [];
    switch (format) {
        case "bmp": {
            imageData = (0, dcsToBmp_1.dcsToBmp)(dcs);
            break;
        }
        case "png": {
            imageData = (0, dcsToPng_1.dcsToPng)(dcs);
            break;
        }
    }
    return { imagePath, imageData };
}
async function main(options) {
    const dpi = parseInt(options.dpi ?? "300", 10);
    (0, dcs_1.setDpiMultiplier)(dpi);
    const buffer = await fsp.readFile(path.resolve(process.cwd(), options.input));
    console.log(JSON.stringify(options));
    const dcses = (0, rawToDcses_1.rawToDcses)(Array.from(buffer));
    // TODO: strip off file extension
    const outputRoot = options.output;
    for (let i = 0; i < dcses.length; ++i) {
        const dcs = dcses[i];
        const { imagePath, imageData } = convertDcsToImage(dcs, i, dcses.length, outputRoot, options.format ?? "bmp");
        await fsp.writeFile(imagePath, Uint8Array.from(imageData));
        console.log("wrote", imagePath);
    }
}
if (require.main === module) {
    const packageJson = require("../../package.json");
    const program = new commander_1.Command();
    program
        .version(packageJson.version)
        .option("-i, --input <raw file>", "The path to the raw file to convert")
        .option("-o, --output <bmp image file root>", "The path for where to write the bmp image")
        .option("--dpi <dpi>", "The output image's dpi (300, 600, 1200, 2400)", "300")
        .option("-f, --format <format>", "The output image format (bmp or png)", "bmp")
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