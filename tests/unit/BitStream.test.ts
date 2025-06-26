import { BitStream } from "../../src/lib/VPK";

describe.only("BitStream", function () {
  it("should read the stream of bits", function () {
    const bitStream = new BitStream([1, 2, 3]);

    expect(bitStream.read(8)).toBe(1);
    expect(bitStream.read(8)).toBe(2);
    expect(bitStream.read(8)).toBe(3);
  });

  it("should read out a byte not on a byte boundary", function () {
    const bitStream = new BitStream([0x77, 0x33, 0x22]);

    expect(bitStream.read(4)).toBe(0x7);
    expect(bitStream.read(8)).toBe(0x73);
  });

  it("should read out more than 8 bits at once", function () {
    const bitStream = new BitStream([0x77, 0x33, 0x22]);

    expect(bitStream.read(12)).toBe(0x773);
    expect(bitStream.read(12)).toBe(0x322);
  });

  it("should read out an unusual number of bits at once", function () {
    const bitStream = new BitStream([0x70, 0x33, 0x22]);

    expect(bitStream.read(5)).toBe(0b01110);
    expect(bitStream.read(6)).toBe(0b000001);
  });

  it("should throw if told to read more bits than are present", function () {
    const bitStream = new BitStream([0xff, 0x33, 0x22]);

    const fn = () => {
      bitStream.read(32);
    };

    expect(fn).toThrow(/asked to read more/);
  });

  it("should read unsigned values", function () {
    const bitStream = new BitStream([0xff, 0xfe]);
    expect(bitStream.read(8)).toBe(0xff);
    expect(bitStream.read(4)).toBe(0xf);
    expect(bitStream.read(4)).toBe(0xe);
  });

  it("should read single bits", function () {
    const bitStream = new BitStream([0b10110000]);
    expect(bitStream.read(1)).toBe(1);
    expect(bitStream.read(1)).toBe(0);
    expect(bitStream.read(1)).toBe(1);
  });
});
