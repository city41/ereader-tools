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
exports.compressVpkMain = main;
const path = __importStar(require("node:path"));
const fsp = __importStar(require("node:fs/promises"));
const commander_1 = require("commander");
const compress_1 = require("../lib/compress");
// TODO: these should not be const
const lzwindow = 4096;
const lzsize = 256;
async function main(options) {
    const buffer = await fsp.readFile(path.resolve(process.cwd(), options.input));
    const result = [];
    (0, compress_1.compress)(Array.from(buffer), buffer.length, parseInt((options.level ?? "2"), 10), lzwindow, lzsize, parseInt((options.method ?? "0"), 10), result);
    return fsp.writeFile(path.resolve(process.cwd(), options.output), Uint8Array.from(result));
}
if (require.main === module) {
    const packageJson = require("../../package.json");
    const program = new commander_1.Command();
    program
        .version(packageJson.version)
        .option("-i, --input <Binary file to compress>", "The path to the input binary to compress")
        .option("-o, --output <Compressed vpk file>", "The path for where to write the compressed vpk")
        .option("-l, --level <0 | 1 | 2 | 3>", "The level of compression. 0: none, 2: max (default), 3: try all", "2")
        .option("-m, --method <0 | 1>", "The compression method to use", "0")
        .parse(process.argv);
    const options = program.opts();
    if (!options.input) {
        program.help();
    }
    else {
        main(options)
            .then(() => {
            console.log("compress-vpk finished");
        })
            .catch((e) => {
            console.error("unexpected error", e);
        });
    }
}
//# sourceMappingURL=compress-vpk.js.map