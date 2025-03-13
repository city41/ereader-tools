"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSavFile = createSavFile;
const crc32_1 = require("./crc32");
const SAV_SIZE = 128 * 1024;
const D000_TO_D07F = [
    0x43, 0x61, 0x72, 0x64, 0x2d, 0x45, 0x20, 0x52, 0x65, 0x61, 0x64, 0x65, 0x72,
    0x20, 0x32, 0x30, 0x30, 0x31, 0x00, 0x00, 0x67, 0xb7, 0x2b, 0x2e, 0x32, 0x33,
    0x33, 0x33, 0x2f, 0x28, 0x2d, 0x2e, 0x31, 0x32, 0x33, 0x32, 0x30, 0x2b, 0x2b,
    0x30, 0x31, 0x32, 0x34, 0x33, 0x32, 0x2f, 0x2a, 0x2c, 0x30, 0x33, 0x33, 0x33,
    0x31, 0x2f, 0x28, 0x2c, 0x30, 0x33, 0x32, 0x33, 0x32, 0x30, 0x29, 0x2d, 0x30,
    0x30, 0x31, 0x31, 0x2f, 0x2d, 0x23, 0x20, 0x61, 0x05, 0x00, 0x00, 0x80, 0xfd,
    0x77, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];
function initSav() {
    const savData = new Array(SAV_SIZE).fill(0);
    function memset(start, value, count) {
        savData.splice(start, count, ...new Array(count).fill(value));
    }
    function memcpy(start, data) {
        savData.splice(start, data.length, ...data);
    }
    // 1st bank
    memset(0x00000, 0xff, 0xd000);
    memcpy(0x0d000, D000_TO_D07F);
    memset(0x0d080, 0x00, 0x0f80);
    memcpy(0x0e000, D000_TO_D07F);
    memset(0x0e080, 0x00, 0x0f80);
    memset(0x0f000, 0xff, 0x0f80);
    memset(0x0ff80, 0x00, 0x0080);
    // 2nd bank
    memset(0x10000, 0xff, 0xff80);
    memset(0x1ff80, 0x00, 0x0080);
    return savData;
}
function createSavFile(binary, type, region, name) {
    const savData = initSav();
    function memset(start, value, count) {
        savData.splice(start, count, ...new Array(count).fill(value));
    }
    function memcpy(start, data) {
        savData.splice(start, data.length, ...data);
    }
    const isVpk = binary[0] === "v".charCodeAt(0) &&
        binary[1] === "p".charCodeAt(0) &&
        binary[2] === "k".charCodeAt(0) &&
        binary[3] === "0".charCodeAt(0);
    memset(0x10004, 0, 0x24);
    // if (args->region == ARG_REGION_USA)
    if (region === "us") {
        const nameData = name.split("").map((c) => c.charCodeAt(0));
        memcpy(0x10004, nameData);
    }
    else {
        // TODO: SJIS
        // for (i=0;i<strlen( args->name);i++) *(u16*)(datadst + 0x10004 + (i * 2)) = ascii_to_sjis( args->name[i]);
    }
    // type (gba/nes/z80/compress)
    let data2 = 0;
    switch (type) {
        case "gba":
            data2 = 0x0402;
            break; // 0x0602 (ac - jap) 0x0702 (sma4 - eur)
        case "nes":
            data2 = 0x050c;
            break;
        case "z80":
            data2 = 0x0004;
            break;
        default:
            data2 = 0x0000;
            break;
    }
    if (!isVpk)
        data2 = data2 | 0x0100;
    // *(datadst + 0x10028) = (data2 >> 0) & 0xFF;
    savData[0x10028] = (data2 >> 0) & 0xff;
    // *(datadst + 0x10029) = (data2 >> 8) & 0xFF;
    savData[0x10029] = (data2 >> 8) & 0xff;
    // skip
    memset(0x1002a, 0, 10);
    let pos = 0;
    let size_vpk = 0;
    let overflow = 0;
    let crc = 0;
    if (isVpk) {
        // compressed data
        if (binary.length < 0x10000) {
            // *(datadst + 0x10034) = (sizesrc >> 0) & 0xFF;
            savData[0x10034] = (binary.length >> 0) & 0xff;
            // *(datadst + 0x10035) = (sizesrc >> 8) & 0xFF;
            savData[0x10035] = (binary.length >> 8) & 0xff;
            pos = 0x10036;
            size_vpk = binary.length + 2;
        }
        else {
            // *(datadst + 0x10034) = (sizesrc >>  0) & 0xFF;
            savData[0x10034] = (binary.length >> 0) & 0xff;
            // *(datadst + 0x10035) = (sizesrc >>  8) & 0xFF;
            savData[0x10035] = (binary.length >> 8) & 0xff;
            // *(datadst + 0x10036) = (sizesrc >> 16) & 0xFF;
            savData[0x10036] = (binary.length >> 16) & 0xff;
            // *(datadst + 0x10037) = (sizesrc >> 24) & 0xFF;
            savData[0x10037] = (binary.length >> 24) & 0xff;
            pos = 0x10038;
            size_vpk = binary.length + 4;
        }
        if (pos + binary.length > 0x1f000) {
            memcpy(pos, binary.slice(0, 0x1f000 - pos));
            memcpy(0, binary.slice(0x1f000 - pos, 0x1f000 + binary.length - (0x1f000 - pos)));
            overflow = 1;
        }
        else {
            memcpy(pos, binary);
            overflow = 0;
        }
    }
    else {
        // *(datadst + 0x10034) = 0x0E;
        savData[0x10034] = 0x0e;
        memcpy(0x10035, binary);
        size_vpk = binary.length + 1;
    }
    // data size
    // *(datadst + 0x1002C) = (size_vpk >>  0) & 0xFF;
    savData[0x1002c] = (size_vpk >> 0) & 0xff;
    // *(datadst + 0x1002D) = (size_vpk >>  8) & 0xFF;
    savData[0x1002d] = (size_vpk >> 8) & 0xff;
    // *(datadst + 0x1002E) = (size_vpk >> 16) & 0xFF;
    savData[0x1002e] = (size_vpk >> 16) & 0xff;
    // *(datadst + 0x1002F) = (size_vpk >> 24) & 0xFF;
    savData[0x1002f] = (size_vpk >> 24) & 0xff;
    // checksum
    if (overflow) {
        // crc = crc32(datadst + 0x10004, 0x1f000 - 0x10004, 0xaa478422);
        crc = (0, crc32_1.crc32)(savData.slice(0x10004, 0x10004 + 0x1f000 - 0x10004), 0xaa478422);
        // crc = crc32(datadst + 0, size_vpk + 0x30 - (0x1f000 - 0x10004), crc);
        crc = (0, crc32_1.crc32)(savData.slice(0, size_vpk + 0x30 - (0x1f000 - 0x100004)), crc);
    }
    else {
        // crc = crc32(datadst + 0x10004, size_vpk + 0x30, 0xaa478422);
        crc = (0, crc32_1.crc32)(savData.slice(0x10004, 0x10004 + size_vpk + 0x30), 0xaa478422);
    }
    // *(u32*)(datadst + 0x10000) = crc;
    savData[0x10000] = crc & 0xff;
    savData[0x10001] = (crc >> 8) & 0xff;
    savData[0x10002] = (crc >> 16) & 0xff;
    savData[0x10003] = (crc >> 24) & 0xff;
    return savData;
}
//# sourceMappingURL=createSavFile.js.map