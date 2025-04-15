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
const path = __importStar(require("node:path"));
const fsp = __importStar(require("node:fs/promises"));
const commander_1 = require("commander");
async function injectStrip(_svgImageSrc, _strip1Src, _strip2Src) {
    return "coming...";
}
async function main(options) {
    const svgImagePath = path.resolve(process.cwd(), options.input);
    const svgImageSrc = (await fsp.readFile(svgImagePath)).toString();
    const strip1Path = path.resolve(process.cwd(), options.strip1);
    const strip1Src = (await fsp.readFile(strip1Path)).toString();
    let strip2Src;
    if (options.strip2) {
        const strip2Path = path.resolve(process.cwd(), options.strip2);
        strip2Src = (await fsp.readFile(strip2Path)).toString();
    }
    const finalSvgSrc = await injectStrip(svgImageSrc, strip1Src, strip2Src);
    const svgImageRoot = path.basename(options.input, ".svg");
    const outputPath = path.resolve(process.cwd(), options.output, `${svgImageRoot}_injected.svg`);
    await fsp.writeFile(outputPath, finalSvgSrc);
    console.log("wrote", outputPath);
}
if (require.main === module) {
    const packageJson = require("../../package.json");
    const program = new commander_1.Command();
    program
        .version(packageJson.version)
        .requiredOption("-i, --input <svg-image-file>", "The path to the svg image to inject strips into")
        .requiredOption("-o, --output <image file root>", "The path for where to write the output image")
        .requiredOption("-s1, --strip1 <strip1-file>", "The path to the first strip")
        .option("-s2, --strip2 [strip2-file]", "The path to the optional second strip")
        .parse(process.argv);
    const options = program.opts();
    if (!options.input) {
        program.help();
    }
    else {
        main(options)
            .then(() => {
            console.log("inject-strips finished");
        })
            .catch((e) => {
            console.error("unexpected error", e);
        });
    }
}
//# sourceMappingURL=inject-strips.js.map