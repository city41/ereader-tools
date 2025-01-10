"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawToDcses = rawToDcses;
const count_raw_1 = require("./count_raw");
const dcs_1 = require("./dcs");
function rawToDcses(rawfile) {
    const num_raw = (0, count_raw_1.count_raw)(rawfile);
    let offset = 0;
    const dcses = [];
    for (let i = 0; i < num_raw; i++) {
        //switch(read_next_raw(f,&raw[0][0]))
        let raw = (0, count_raw_1.read_next_raw)(rawfile, offset);
        if (!raw) {
            throw new Error("raw unexpectedly null");
        }
        offset += raw.length;
        let dotcodelen = raw.length / 0x68;
        let bmplen = dotcodelen * 35 + 9;
        if (bmplen % 32 > 0)
            bmplen += 32 - (bmplen % 32);
        bmplen /= 32;
        bmplen *= 4;
        (0, dcs_1.setDotcodelen)(dotcodelen);
        (0, dcs_1.setBmplen)(bmplen);
        (0, dcs_1.setRaw)(raw);
        /*
                {
                case 0xB60:
                    dotcodelen = 28;
                    bmplen = 0x7C;
                    break;
                case 0x750:
                    dotcodelen = 18;
                    bmplen = 0x50;
                    break;
                }*/
        (0, dcs_1.clear_dcs)();
        (0, dcs_1.init_dcs)();
        (0, dcs_1.eight_ten_modulate)();
        const dcs = (0, dcs_1.make_dcs)();
        dcses.push(dcs);
        //flipbmp();
        // makebmp();
        // const bmp = write_bmp();
        // dcs.push(bmp);
    }
    return dcses;
}
//# sourceMappingURL=rawToDcses.js.map