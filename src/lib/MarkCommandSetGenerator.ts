type MarkCommand = {
  x: number;
  y: number;
  type: "dot" | "sync";
};

const J_LENGTH = 104;

class MarkCommandSetGenerator {
  static modtable = [
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

  addr = [0, 0x3ff];
  raw: number[];
  marks: MarkCommand[] = [];

  _810mod: number[][] = new Array(28).fill(null).map(() => {
    return new Array(130);
  });

  private readRaw(i: number, j: number): number {
    return this.raw[i * J_LENGTH + j] ?? 0;
  }

  private drawDot(x: number, y: number) {
    this.marks.push({
      x,
      y,
      type: "dot",
    });
  }

  private drawSyncMarker(x: number, y: number) {
    this.marks.push({
      x,
      y,
      type: "sync",
    });
  }

  private calcAddr(address: number) {
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
    if (this.addr[0] >> 10 < address) {
      start = (this.addr[1] >> 10) + 1;
    }
    if (this.addr[0] >> 10 == address && address != 0) return; //No need to calculate anything.
    if (this.addr[0] >> 10 > address || this.addr[1] == 0x3ff) {
      //Must recalculate the address starting from 0.
      start = 1;
      this.addr[1] = 0x3ff;
    }

    for (let i = start!, base = 0x769; i <= address + 1; i++, base = 0x769) {
      this.addr[0] = this.addr[1];
      this.addr[1] = this.addr[0] ^ ((i & -i) * base);
      for (mask = 0x1fff, bits = 0x651; bits > 0; mask >>= 1, bits >>= 1) {
        if ((i & mask) == 0) {
          if (bits & 1) this.addr[1] ^= base;
          base <<= 1;
        }
      }
    }
  }

  private drawAddressBar(dotcodeblock: number, address: number) {
    const j = dotcodeblock;
    this.drawDot(j * 35 + 4, 9); //Render the T pixel
    this.drawDot((j + 1) * 35 + 4, 9); //The B pixel is not rendered.

    this.calcAddr(j + address); //Calculate Error info for Address.

    for (
      let i = 0;
      i < 16;
      i++ //Render the A pixels and E pixels.  (A = Address, E = Error correction info.)
    ) {
      if (((0x0001 << i) & this.addr[0]) >> i == 1) {
        this.drawDot(j * 35 + 4, 33 - i);
      }
      if (((0x0001 << i) & this.addr[1]) >> i == 1) {
        this.drawDot((j + 1) * 35 + 4, 33 - i);
      }
    }
  }

  constructor(raw: number[]) {
    this.raw = raw;
  }

  init() {
    const dotCodeLength = this.raw.length / 0x68;
    const start_address = this.readRaw(1, 1);

    for (let j = 0; j < dotCodeLength; j++) {
      this.drawSyncMarker(j * 35 + 2, 2);
      this.drawSyncMarker(j * 35 + 2, 37);
      this.drawSyncMarker((j + 1) * 35 + 2, 2);
      this.drawSyncMarker((j + 1) * 35 + 2, 37); //Render X/Y pixels.

      this.drawAddressBar(j, start_address);

      for (
        let i = 0;
        i <= 5;
        i++ //Render the Z pixels. (
      ) {
        this.drawDot(j * 35 + (10 + i * 2), 4);
        this.drawDot(j * 35 + (23 + i * 2), 4);
        this.drawDot(j * 35 + (10 + i * 2), 39);
        this.drawDot(j * 35 + (23 + i * 2), 39);
      }
    }
  }

  eightTenModulate() {
    const dotCodeLength = this.raw.length / 0x68;

    for (let i = 0; i < dotCodeLength; i++) {
      for (let j = 0; j < 104; j += 4) {
        const raw0 = this.readRaw(i, j + 0);
        const raw1 = this.readRaw(i, j + 1);
        const raw2 = this.readRaw(i, j + 2);
        const raw3 = this.readRaw(i, j + 3);
        const mod0 = MarkCommandSetGenerator.modtable[(raw0 & 0xf0) >> 4];
        const mod1 = MarkCommandSetGenerator.modtable[raw0 & 0x0f];
        const mod2 = MarkCommandSetGenerator.modtable[(raw1 & 0xf0) >> 4];
        const mod3 = MarkCommandSetGenerator.modtable[raw1 & 0x0f];
        const mod4 = MarkCommandSetGenerator.modtable[(raw2 & 0xf0) >> 4];
        const mod5 = MarkCommandSetGenerator.modtable[raw2 & 0x0f];
        const mod6 = MarkCommandSetGenerator.modtable[(raw3 & 0xf0) >> 4];
        const mod7 = MarkCommandSetGenerator.modtable[raw3 & 0x0f];

        this._810mod[i][(j * 10) / 8 + 0] =
          ((mod0 & 0x1f) << 3) + ((mod1 & 0x1c) >> 2);
        this._810mod[i][(j * 10) / 8 + 1] =
          ((mod1 & 0x03) << 6) + ((mod2 & 0x1f) << 1) + ((mod3 & 0x10) >> 4);
        this._810mod[i][(j * 10) / 8 + 2] =
          ((mod3 & 0x0f) << 4) + ((mod4 & 0x1e) >> 1);
        this._810mod[i][(j * 10) / 8 + 3] =
          ((mod4 & 0x01) << 7) + ((mod5 & 0x1f) << 2) + ((mod6 & 0x18) >> 3);
        this._810mod[i][(j * 10) / 8 + 4] =
          ((mod6 & 0x07) << 5) + (mod7 & 0x1f);
      }
    }
  }

  generateMarks(): MarkCommand[] {
    const dotCodeLength = this.raw.length / 0x68;
    let count = 0;
    for (let i = 0; i < dotCodeLength; i++) {
      for (let j = 0; j < 3; j++)
        for (let k = 0; k < 26; k++, count++) {
          if (
            (this._810mod[i][Math.floor(count / 8)] >> (7 - (count % 8))) &
            0x01
          )
            this.drawDot(i * 35 + 9 + k, j + 6);
        }
      for (let j = 0; j < 26; j++)
        for (let k = 0; k < 34; k++, count++) {
          if (
            (this._810mod[i][Math.floor(count / 8)] >> (7 - (count % 8))) &
            0x01
          )
            this.drawDot(i * 35 + 5 + k, j + 9);
        }
      for (let j = 0; j < 3; j++)
        for (let k = 0; k < 26; k++, count++) {
          if (
            (this._810mod[i][Math.floor(count / 8)] >> (7 - (count % 8))) &
            0x01
          )
            this.drawDot(i * 35 + 9 + k, j + 35);
        }

      count = 0;
    }

    return this.marks;
  }
}

export { MarkCommandSetGenerator };
export type { MarkCommand };
