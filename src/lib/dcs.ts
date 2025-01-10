let raw: number[] | null = null;
const dcsbmp: number[][] = new Array(7912).fill(null).map(() => {
  return new Array(352);
});
const _810mod: number[][] = new Array(28).fill(null).map(() => {
  return new Array(130);
});
const bmpdata: number[][] = new Array(352).fill(null).map(() => {
  return new Array(992);
});

const modtable = [
  0x00, //00000
  0x01, //00001
  0x02, //00010
  0x12, //10010
  0x04, //00100
  0x05, //00101
  0x06, //00110
  0x16, //10110
  0x08, //01000
  0x09, //01001
  0x0a, //01010
  0x14, //10100
  0x0c, //01100
  0x0d, //01101
  0x11, //10001
  0x10, //10000
] as const;

const addr = [0, 0x3ff];

let dpi_multiplier = 1;
let smooth = 0;
let fill = 0;

let dotcodelen = 0;
let bmplen = 0;

const bmpheader = [
  0x42, 0x4d, 0x8e, 0x15, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3e, 0x00, 0x00,
  0x00, 0x28, 0x00, 0x00, 0x00, 0xdd, 0x03, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x15, 0x00, 0x00, 0x23,
  0x2e, 0x00, 0x00, 0x23, 0x2e, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00,
];

const J_LENGTH = 104;
function read_raw(i: number, j: number): number {
  if (!raw) {
    throw new Error("read_raw: raw is not set");
  }
  return raw[i * J_LENGTH + j] ?? 0;
}

function calc_addr(address: number) {
  let start;

  let mask, bits;

  /* Thanks to Martin Korth, The method to calculate the error
    correction info on the address bars is now known. As a result
    it is now possible to calculate what should be in the long and
    short dotcodes rather than have a defined table. */

  /* This is an Address bar calculator, for "Dot Code Technology",
	which is made by Olympus Optical Co. Ltd.  The address bars consist
	of a 14 bit address, and 10 bits of reed-solomon error correction
	information.  The first valid address bar as far as I know, is 1.

	On a dotcode strip,  there is 30 dots in between the top and bottom
	sync marker, that the address bar is contained in.  Top 2 dots are dead
	space, and should be always white.  Next dot down, is black, to indicate
	that this is the top of the dotcode strip.
	Next 24 dots is the address and reed-solomon error correction info.
	Next Dot is white, to indicate this is bottom of the dotcode strip
	Last 2 dots are dead space, and should be white, for proper sync marker
	recognition. */

  /* The reed-solomon error correction on the address bar, is capable of
	correcting up to 2 bits of error in the address bar. */

  /* Nintendo e-Reader dotcodes use Addresss 1 (on left) to 19 (on right)
	for short dotcodes, and address 25 (on left) to 53 (on right) for long
	dotcodes.  Any other address ranges will cause the dotcode to be rejected
	by the Nintendo e-Reader.  The upper address limit that is decoded for
	is 60 (61 on right hand side.)  Anything higher is not decoded by nintendo
	e-Reader. */

  //addr[0] = 0x3FF;
  if (addr[0] >> 10 < address) {
    start = (addr[1] >> 10) + 1;
  }
  if (addr[0] >> 10 == address && address != 0) return; //No need to calculate anything.
  if (addr[0] >> 10 > address || addr[1] == 0x3ff) {
    //Must recalculate the address starting from 0.
    start = 1;
    addr[1] = 0x3ff;
  }

  for (let i = start!, base = 0x769; i <= address + 1; i++, base = 0x769) {
    addr[0] = addr[1];
    addr[1] = addr[0] ^ ((i & -i) * base);
    for (mask = 0x1fff, bits = 0x651; bits > 0; mask >>= 1, bits >>= 1) {
      if ((i & mask) == 0) {
        if (bits & 1) addr[1] ^= base;
        base <<= 1;
      }
    }
  }
}

function draw_dcs_pixel(x: number, y: number) {
  switch (dpi_multiplier) {
    case 1: //300 DPI
      dcsbmp[x][y] = 1;
      break;
    case 2: //600 DPI
      if (fill != 0) {
        for (let i = 0; i < 2; i++)
          for (let j = 0; j < 2; j++) dcsbmp[x * 2 + i][y * 2 + j] = 1;
      } else {
        dcsbmp[x * 2][y * 2] = 1;
      }
      break;
    case 4: //1200 DPI
      if (fill != 0) {
        for (let i = 0; i < 4; i++)
          for (let j = 0; j < 4; j++) dcsbmp[x * 4 + i][y * 4 + j] = 1;
      } else {
        for (let i = 1; i < 3; i++)
          for (let j = 1; j < 3; j++) dcsbmp[x * 4 + i][y * 4 + j] = 1;
      }
      break;
    case 8: //2400 DPI
      if (fill != 0) {
        for (let i = 0; i < 8; i++)
          for (let j = 0; j < 8; j++) dcsbmp[x * 8 + i][y * 8 + j] = 1;
      } else {
        for (let i = 2; i < 5; i++) {
          dcsbmp[x * 8 + i][y * 8 + 1] = 1;
          dcsbmp[x * 8 + i][y * 8 + 5] = 1;
        }
        for (let i = 1; i < 6; i++)
          for (let j = 2; j < 5; j++) dcsbmp[x * 8 + i][y * 8 + j] = 1;
      }
      break;
  }
}

function draw_sync_marker(x: number, y: number) {
  // int xx, yy;
  // int i,j,k, l, m;

  const xx = x * dpi_multiplier;
  const yy = y * dpi_multiplier;
  const l = 5 * dpi_multiplier;

  if (dpi_multiplier == 1 || smooth == 0) {
    fill = 1;
    for (let i = 1; i < 4; i++)
      for (let j = 1; j < 4; j++) {
        draw_dcs_pixel(x, y + j);
        draw_dcs_pixel(x + 4, y + j);
        draw_dcs_pixel(x + i, y + j);
        draw_dcs_pixel(x + i, y);
        draw_dcs_pixel(x + i, y + 4);
      }
    fill = 0;
  } else {
    const k = (l / 2) * (l / 2);
    for (let i = l / 2; i >= 0; i--)
      for (let j = l / 2; j >= 0; j--) {
        let m = i * i + j * j <= k ? 1 : 0;
        if (i + j == l / 2 && (i == 0 || j == 0)) m = 0;
        dcsbmp[xx + (l / 2 - 1) + i][yy + (l / 2 - 1) + j] = m;
        dcsbmp[xx + (l / 2 - 1) + i][yy + (l / 2 - 1) - j] = m;
        dcsbmp[xx + (l / 2 - 1) - i][yy + (l / 2 - 1) - j] = m;
        dcsbmp[xx + (l / 2 - 1) - i][yy + (l / 2 - 1) + j] = m;
        //dcsbmp[xx+((l/2)-1)][yy+((l/2)-1)] = 1;
      }
  }
}

function draw_address_bar(dotcodeblock: number, address: number) {
  const j = dotcodeblock;
  draw_dcs_pixel(j * 35 + 4, 9); //Render the T pixel
  draw_dcs_pixel((j + 1) * 35 + 4, 9); //The B pixel is not rendered.

  calc_addr(j + address); //Calculate Error info for Address.

  for (
    let i = 0;
    i < 16;
    i++ //Render the A pixels and E pixels.  (A = Address, E = Error correction info.)
  ) {
    if (((0x0001 << i) & addr[0]) >> i == 1) {
      draw_dcs_pixel(j * 35 + 4, 33 - i);
    }
    if (((0x0001 << i) & addr[1]) >> i == 1) {
      draw_dcs_pixel((j + 1) * 35 + 4, 33 - i);
    }
  }
}

function clear_dcs() {
  for (let i = 0; i < 7912; i++) for (let j = 0; j < 352; j++) dcsbmp[i][j] = 0;
  for (let i = 0; i < 28; i++) for (let j = 0; j < 130; j++) _810mod[i][j] = 0;
}

function eight_ten_modulate() {
  for (let i = 0; i < dotcodelen; i++) {
    for (let j = 0; j < 104; j += 4) {
      const raw0 = read_raw(i, j + 0);
      const raw1 = read_raw(i, j + 1);
      const raw2 = read_raw(i, j + 2);
      const raw3 = read_raw(i, j + 3);
      const mod0 = modtable[(raw0 & 0xf0) >> 4];
      const mod1 = modtable[raw0 & 0x0f];
      const mod2 = modtable[(raw1 & 0xf0) >> 4];
      const mod3 = modtable[raw1 & 0x0f];
      const mod4 = modtable[(raw2 & 0xf0) >> 4];
      const mod5 = modtable[raw2 & 0x0f];
      const mod6 = modtable[(raw3 & 0xf0) >> 4];
      const mod7 = modtable[raw3 & 0x0f];

      _810mod[i][(j * 10) / 8 + 0] =
        ((mod0 & 0x1f) << 3) + ((mod1 & 0x1c) >> 2);
      _810mod[i][(j * 10) / 8 + 1] =
        ((mod1 & 0x03) << 6) + ((mod2 & 0x1f) << 1) + ((mod3 & 0x10) >> 4);
      _810mod[i][(j * 10) / 8 + 2] =
        ((mod3 & 0x0f) << 4) + ((mod4 & 0x1e) >> 1);
      _810mod[i][(j * 10) / 8 + 3] =
        ((mod4 & 0x01) << 7) + ((mod5 & 0x1f) << 2) + ((mod6 & 0x18) >> 3);
      _810mod[i][(j * 10) / 8 + 4] = ((mod6 & 0x07) << 5) + (mod7 & 0x1f);
    }
  }
}

function init_dcs() {
  /* Purpose - Draw the bmp template for Dotcodes. */
  /*
		 XXX                                XXX
		YYYYY                              YYYYY
		YYYYY   Z Z Z Z Z Z  Z Z Z Z Z Z   YYYYY
		YYYYY                              YYYYY
		 XXX                                XXX
		  

		  T                                  T
		  A                                  A
		  A                                  A
		  .                                  .
		  .                                  .
		  .                                  .
		  A                                  A
		  A                                  A
		  E                                  E
		  E                                  E
		  E                                  E
		  .                                  .
		  .                                  .
		  .                                  .
		  E                                  E
		  E                                  E
		  B                                  B


		 XXX                                XXX
		YYYYY                              YYYYY
		YYYYY   Z Z Z Z Z Z  Z Z Z Z Z Z   YYYYY
		YYYYY                              YYYYY
		 XXX                                XXX
	 */
  /*if(dotcodelen==28)
		start_address=25;
	else
		start_address=1;*/
  const start_address = read_raw(1, 1);

  for (let j = 0; j < dotcodelen; j++) {
    draw_sync_marker(j * 35 + 2, 2);
    draw_sync_marker(j * 35 + 2, 37);
    draw_sync_marker((j + 1) * 35 + 2, 2);
    draw_sync_marker((j + 1) * 35 + 2, 37); //Render X/Y pixels.

    draw_address_bar(j, start_address);

    for (
      let i = 0;
      i <= 5;
      i++ //Render the Z pixels. (
    ) {
      draw_dcs_pixel(j * 35 + (10 + i * 2), 4);
      draw_dcs_pixel(j * 35 + (23 + i * 2), 4);
      draw_dcs_pixel(j * 35 + (10 + i * 2), 39);
      draw_dcs_pixel(j * 35 + (23 + i * 2), 39);
    }
  }
}

function makebmp() {
  const width = (dotcodelen * 35 + 9) * dpi_multiplier;
  // if(dotcodelen == 18)
  //         width=639*dpi_multiplier;

  /*if (bmplen == 0x7C)
	{*/

  for (let i = 0; i < 352; i++) for (let j = 0; j < 992; j++) bmpdata[i][j] = 0;

  for (let j = 0; j < 44 * dpi_multiplier; j++) {
    /*for (i=0;i<(bmplen*dpi_multiplier);i++)
                {
                        bmpdata[(44*dpi_multiplier)-1-j][i] = 0xFF;
                        bmpdata[(44*dpi_multiplier)-1-j][i] -= (dcsbmp[(i*8)+0][j]<<7)+(dcsbmp[(i*8)+1][j]<<6);
                        bmpdata[(44*dpi_multiplier)-1-j][i] -= (dcsbmp[(i*8)+2][j]<<5)+(dcsbmp[(i*8)+3][j]<<4);
                        bmpdata[(44*dpi_multiplier)-1-j][i] -= (dcsbmp[(i*8)+4][j]<<3)+(dcsbmp[(i*8)+5][j]<<2);
                        bmpdata[(44*dpi_multiplier)-1-j][i] -= (dcsbmp[(i*8)+6][j]<<1)+(dcsbmp[(i*8)+7][j]<<0);
                }*/
    for (let i = 0; i < width; i++) {
      bmpdata[44 * dpi_multiplier - 1 - j][Math.floor(i / 8)] +=
        1 << (7 - (i % 8));
      bmpdata[44 * dpi_multiplier - 1 - j][Math.floor(i / 8)] -=
        dcsbmp[i][j] << (7 - (i % 8));
    }
  }
}

function make_dcs(): number[][] {
  let count = 0;
  fill = 0;
  for (let i = 0; i < dotcodelen; i++) {
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 26; k++, count++) {
        if ((_810mod[i][Math.floor(count / 8)] >> (7 - (count % 8))) & 0x01)
          draw_dcs_pixel(i * 35 + 9 + k, j + 6);
        //dcsbmp[(i*35)+9+k][j+6] = (_810mod[i][(int)(count/8)] >> (7 - (count % 8))) & 0x01;
      }
    for (let j = 0; j < 26; j++)
      for (let k = 0; k < 34; k++, count++) {
        if ((_810mod[i][Math.floor(count / 8)] >> (7 - (count % 8))) & 0x01)
          draw_dcs_pixel(i * 35 + 5 + k, j + 9);
        //dcsbmp[(i*35)+5+k][j+9] = (_810mod[i][(int)(count/8)] >> (7 - (count % 8))) & 0x01;
      }
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 26; k++, count++) {
        //if(((_810mod[i][(int)(count/8)] >> (7 - (count % 8))))>0)
        if ((_810mod[i][Math.floor(count / 8)] >> (7 - (count % 8))) & 0x01)
          draw_dcs_pixel(i * 35 + 9 + k, j + 35);
        //dcsbmp[(i*35)+9+k][j+35] = (_810mod[i][(int)(count/8)] >> (7 - (count % 8))) & 0x01;
      }

    count = 0;
  }

  return dcsbmp;
}

function write_bmp(): number[] {
  const bmp: number[] = [];

  const length = (dotcodelen * 35 + 9) * dpi_multiplier;
  const width = 44 * dpi_multiplier;

  let i = length;
  bmpheader[0x12] = i & 0xff;
  bmpheader[0x13] = i >> 8;
  bmpheader[0x14] = i >> 16;
  bmpheader[0x15] = i >> 24;
  bmpheader[0x16] = width & 0xff;
  bmpheader[0x17] = (width >> 8) & 0xff;
  bmpheader[0x18] = (width >> 16) & 0xff;
  bmpheader[0x19] = (width >> 24) & 0xff;
  i /= 32;
  if (length % 32 > 0) i++;
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
    for (let i = 0; i < bmplen * dpi_multiplier; i++) {
      bmp.push(bmpdata[j][i]);
    }

  return bmp;
}

function getDotcodelen() {
  return dotcodelen;
}

function setDotcodelen(dcl: number) {
  dotcodelen = dcl;
}

function getBmplen() {
  return bmplen;
}

function setBmplen(bl: number) {
  bmplen = bl;
}

function setRaw(r: number[]) {
  raw = r;
}

function getDpiMultiplier() {
  return dpi_multiplier;
}

function setDpiMultiplier(dpi: number) {
  dpi_multiplier = dpi / 300;

  if (dpi_multiplier !== Math.floor(dpi_multiplier)) {
    throw new Error(`Invalid dpi specified: ${dpi}`);
  }

  if (dpi_multiplier < 1 || dpi_multiplier > 8) {
    throw new Error(`Invalid dpi specified: ${dpi}`);
  }
}

export {
  clear_dcs,
  init_dcs,
  eight_ten_modulate,
  make_dcs,
  makebmp,
  write_bmp,
  getDotcodelen,
  setDotcodelen,
  getBmplen,
  setBmplen,
  setRaw,
  getDpiMultiplier,
  setDpiMultiplier,
};
