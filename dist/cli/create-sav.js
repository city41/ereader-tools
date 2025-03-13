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
exports.createSavMain = main;
const path = __importStar(require("node:path"));
const fsp = __importStar(require("node:fs/promises"));
const commander_1 = require("commander");
const createSavFile_1 = require("../lib/createSavFile");
async function main(options) {
    const buffer = await fsp.readFile(path.resolve(process.cwd(), options.input));
    const savFile = (0, createSavFile_1.createSavFile)(Array.from(buffer), options.type ?? "z80", options.region ?? "us", options.name ?? "");
    const outputPath = path.resolve(process.cwd(), options.output);
    await fsp.writeFile(outputPath, Uint8Array.from(savFile));
    console.log("wrote", outputPath);
}
if (require.main === module) {
    const packageJson = require("../../package.json");
    const program = new commander_1.Command();
    program
        .version(packageJson.version)
        .option("-i, --input <binary file>", "The path to the input binary")
        .option("-o, --output <sav file>", "The path for where to write the sav file")
        .option("-t, --type <z80 | gba | nes>", "The binary type", "z80")
        .option("-r, --region <us | jpn | jpn+ >", "The region to use", "us")
        .option("-n, --name <name>", "The name to display in the e-reader menu")
        .parse(process.argv);
    const options = program.opts();
    if (!options.input) {
        program.help();
    }
    else {
        main(options)
            .then(() => {
            console.log("create-sav finished");
        })
            .catch((e) => {
            console.error("unexpected error", e);
        });
    }
}
//# sourceMappingURL=create-sav.js.map