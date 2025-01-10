"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dcsToBmp = dcsToBmp;
const dcs_1 = require("./dcs");
const bmpheader = [
    0x42, 0x4d, 0x8e, 0x15, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3e, 0x00, 0x00,
    0x00, 0x28, 0x00, 0x00, 0x00, 0xdd, 0x03, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x15, 0x00, 0x00, 0x23,
    0x2e, 0x00, 0x00, 0x23, 0x2e, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00,
];
function dcsToBmp(dcs) {
    // TODO: guard against bad dpis
    const dpi_multiplier = (0, dcs_1.getDpiMultiplier)();
    const length = ((0, dcs_1.getDotcodelen)() * 35 + 9) * dpi_multiplier;
    const width = 44 * dpi_multiplier;
    const bmp = [];
    const bmpData = new Array(352).fill(null).map(() => {
        return new Array(992).fill(0);
    });
    for (let j = 0; j < 44 * dpi_multiplier; j++) {
        for (let i = 0; i < length; i++) {
            bmpData[44 * dpi_multiplier - 1 - j][Math.floor(i / 8)] +=
                1 << (7 - (i % 8));
            bmpData[44 * dpi_multiplier - 1 - j][Math.floor(i / 8)] -=
                dcs[i][j] << (7 - (i % 8));
        }
    }
    let i = length;
    bmpheader[0x12] = i & 0xff;
    bmpheader[0x13] = i >> 8;
    bmpheader[0x14] = i >> 16;
    bmpheader[0x15] = i >> 24;
    bmpheader[0x16] = width & 0xff;
    bmpheader[0x17] = (width >> 8) & 0xff;
    bmpheader[0x18] = (width >> 16) & 0xff;
    bmpheader[0x19] = (width >> 24) & 0xff;
    i = Math.floor(i / 32);
    if (length % 32 > 0)
        i++;
    i *= 4;
    i *= 44 * dpi_multiplier;
    bmpheader[2] = (i + 0x3e) & 0xff;
    bmpheader[3] = ((i + 0x3e) >> 8) & 0xff;
    bmpheader[4] = ((i + 0x3e) >> 16) & 0xff;
    bmpheader[5] = ((i + 0x3e) >> 24) & 0xff;
    bmpheader[0x22] = i & 0xff;
    bmpheader[0x23] = (i >> 8) & 0xff;
    bmpheader[0x24] = (i >> 16) & 0xff;
    bmpheader[0x24] = (i >> 24) & 0xff;
    i = 0x2e23 * dpi_multiplier;
    bmpheader[0x26] = (i >> 0) & 0xff;
    bmpheader[0x27] = (i >> 8) & 0xff;
    bmpheader[0x28] = (i >> 16) & 0xff;
    bmpheader[0x29] = (i >> 24) & 0xff;
    bmpheader[0x2a] = (i >> 0) & 0xff;
    bmpheader[0x2b] = (i >> 8) & 0xff;
    bmpheader[0x2c] = (i >> 16) & 0xff;
    bmpheader[0x2d] = (i >> 24) & 0xff;
    bmp.push(...bmpheader);
    for (let j = 0; j < width; j++)
        for (let i = 0; i < (0, dcs_1.getBmplen)() * dpi_multiplier; i++) {
            bmp.push(bmpData[j][i]);
        }
    return bmp;
}
//# sourceMappingURL=dcsToBmp.js.map