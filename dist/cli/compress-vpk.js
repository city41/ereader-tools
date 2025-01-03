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
const compress_1 = require("../lib/compress");
// TODO: these should not be const
const lzwindow = 4096;
const lzsize = 256;
const method = 0;
async function main(binFilePath, destRawPath) {
    const buffer = await fsp.readFile(binFilePath);
    const result = [];
    (0, compress_1.compress)(Array.from(buffer), buffer.length, 2, lzwindow, lzsize, method, result);
    return fsp.writeFile(destRawPath, Uint8Array.from(result));
}
if (require.main === module) {
    const [_tsNode, _dotEncoder, binFilePath, destVpkPath] = process.argv;
    function usage() {
        console.error("Encodes a binary into a raw file");
        console.error("usage: compress-vpk <bin-file> <dest-vpk-file>");
        process.exit(1);
    }
    if (!binFilePath || !destVpkPath) {
        usage();
    }
    main(path.resolve(binFilePath), path.resolve(destVpkPath))
        .then(() => console.log("done"))
        .catch((e) => console.error(e));
}
//# sourceMappingURL=compress-vpk.js.map