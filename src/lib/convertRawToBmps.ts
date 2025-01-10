import { count_raw, read_next_raw } from "./count_raw";
import {
  clear_dcs,
  eight_ten_modulate,
  init_dcs,
  make_dcs,
  makebmp,
  setBmplen,
  setDotcodelen,
  setRaw,
  write_bmp,
} from "./dcs";

function convertRawToBmps(rawfile: number[]): number[][] {
  const num_raw = count_raw(rawfile);
  let offset = 0;
  const bmps: number[][] = [];

  for (let i = 0; i < num_raw; i++) {
    //switch(read_next_raw(f,&raw[0][0]))
    let raw = read_next_raw(rawfile, offset);

    if (!raw) {
      throw new Error("raw unexpetedly null");
    }

    offset += raw.length;
    let dotcodelen = raw.length / 0x68;
    let bmplen = dotcodelen * 35 + 9;
    if (bmplen % 32 > 0) bmplen += 32 - (bmplen % 32);
    bmplen /= 32;
    bmplen *= 4;

    setDotcodelen(dotcodelen);
    setBmplen(bmplen);
    setRaw(raw);

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
    clear_dcs();
    init_dcs();
    eight_ten_modulate();
    make_dcs();
    //flipbmp();
    makebmp();

    const bmp = write_bmp();

    bmps.push(bmp);
  }

  return bmps;
}

export { convertRawToBmps };
