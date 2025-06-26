type CompressionSampleType = 0 | 1 | 2;

const VPK_COMPRESSION_TYPE_UNKNOWN = 0;
const VPK_COMPRESSION_TYPE_ONE_SAMPLE = 1;
const VPK_COMPRESSION_TYPE_TWO_SAMPLE = 2;

type ValidVPKHeader = {
  isValid: true;
  size: number;
  compressionSampleType: CompressionSampleType;
};

type InvalidVPKHeader = {
  isValid: false;
};

type VPKHeader = ValidVPKHeader | InvalidVPKHeader;

type NodeVPKTreeEntry = {
  type: "node";
  left: number;
  right: number;
};

type LeafVPKTreeEntry = {
  type: "leaf";
  value: number;
};

type VPKTreeEntry = NodeVPKTreeEntry | LeafVPKTreeEntry;

/**
 * Takes a byte array and turns it into a stream of bits.
 */
class BitStream {
  #buf: number[];
  #byteIndex: number;
  #bitIndex: number;

  constructor(buf: number[]) {
    this.#buf = [...buf];
    this.#byteIndex = 0;
    this.#bitIndex = 0;
  }

  /**
   * Read bits out of the stream and convert them into an unsigned number.
   * This is a stateful function, each read moves the index forward.
   * @param count how many bits to read
   * @returns those bits formed into a number
   */
  read(count = 1): number {
    if (count < 1) {
      throw new Error(`BitStream#read: count must be >= 1, (given ${count})`);
    }

    if (count > 32) {
      throw new Error(
        `BitStream#read: can only read a max of 32 bits (given: ${count}`
      );
    }

    const availableWholeBytes = this.#buf.length - this.#byteIndex;
    const availablePartialBits = this.#bitIndex === 0 ? 0 : 8 - this.#bitIndex;
    const availableBits = availableWholeBytes * 8 + availablePartialBits;

    if (availableBits < count) {
      throw new Error(
        `BitStream#read: asked to read more bits (${count}) than available ${availableBits}`
      );
    }

    let result = 0;

    for (let b = 0; b < count; ++b) {
      const curByte = this.#buf[this.#byteIndex];
      const curBit = (curByte >> (7 - this.#bitIndex)) & 1;

      result |= curBit << (count - 1 - b);

      this.#bitIndex += 1;

      if (this.#bitIndex > 7) {
        this.#bitIndex = 0;
        this.#byteIndex += 1;
      }
    }

    return result;
  }

  get remainingBytes() {
    return this.#buf.length - this.#byteIndex;
  }
}

class VPKTree {
  #loopMap: Record<number, boolean> = {};
  #entries: VPKTreeEntry[] = [];

  #dumpEntry(index: number): string {
    if (this.#loopMap[index]) {
      throw new Error("VPKTree contains a loop");
    }

    this.#loopMap[index] = true;

    const e = this.#entries[index];

    if (e.type === "leaf") {
      return e.value.toString();
    } else {
      return `(${this.#dumpEntry(e.left)},${this.#dumpEntry(e.right)})`;
    }
  }

  constructor(bits: BitStream) {
    const buffer: number[] = [];

    while (true) {
      const currentIndex = this.#entries.length;

      if (bits.read() === 1) {
        // if there are less than 2 "outstanding" entries, the tree is done
        if (buffer.length < 2) {
          break;
        }

        this.#entries.push({
          type: "node",
          right: buffer.pop()!,
          left: buffer.pop()!,
        });
      } else {
        this.#entries.push({
          type: "leaf",
          value: bits.read(8),
        });
      }
      buffer.push(currentIndex);
    }
  }

  readValue(bits: BitStream): number {
    if (this.#entries.length === 0) {
      return 0;
    }

    let index = this.#entries.length - 1;
    let node: VPKTreeEntry = this.#entries[index];

    while (node?.type === "node") {
      if (bits.read() === 1) {
        index = node.right;
      } else {
        index = node.left;
      }

      node = this.#entries[index];
    }

    if (!node) {
      throw new Error("VPKTree: bad huffman tree, navigated to undefined");
    }

    return bits.read(node.value);
  }

  toString(): string {
    this.#loopMap = {};
    return this.#dumpEntry(this.#entries.length - 1);
  }
}

class VPK {
  #debugLog: boolean;
  #data: BitStream;
  #offsets: VPKTree;
  #lengths: VPKTree;
  #header: VPKHeader;

  #log(...args: any[]) {
    if (this.#debugLog) {
      console.log(...args);
    }
  }

  #parseHeader(bits: BitStream): VPKHeader {
    const markerBytes = [
      bits.read(8),
      bits.read(8),
      bits.read(8),
      bits.read(8),
    ];
    const marker = String.fromCharCode(...markerBytes);
    const size = bits.read(32);
    const rawCompressionType = bits.read(8);

    const isValid =
      marker === "vpk0" &&
      (rawCompressionType === 0 || rawCompressionType === 1);

    const compressionType = (
      isValid ? rawCompressionType + 1 : 0
    ) as CompressionSampleType;

    if (isValid) {
      return {
        isValid,
        size,
        compressionSampleType: compressionType,
      };
    } else {
      return { isValid: false };
    }
  }

  constructor(buf: number[], debugLog = false) {
    this.#debugLog = debugLog;
    this.#data = new BitStream(buf);
    this.#header = this.#parseHeader(this.#data);
    this.#offsets = new VPKTree(this.#data);
    this.#lengths = new VPKTree(this.#data);

    if (this.#header.isValid) {
      this.#log("offsets tree", this.#offsets.toString());
      this.#log("lengths tree", this.#lengths.toString());
    } else {
      this.#log("invalid header", JSON.stringify(this.#header));
    }
  }

  get header(): VPKHeader {
    return this.#header;
  }

  decompress(): number[] {
    if (!this.#header.isValid) {
      throw new Error("VPK#decompress: invalid header, cannot proceed");
    }

    const output: number[] = [];

    while (output.length < this.#header.size) {
      if (this.#data.read() === 1) {
        const initialMove = this.#offsets.readValue(this.#data);
        let moveBack: number;
        if (
          this.#header.compressionSampleType === VPK_COMPRESSION_TYPE_TWO_SAMPLE
        ) {
          if (initialMove < 3) {
            const l = initialMove + 1;
            const u = this.#offsets.readValue(this.#data);
            moveBack = l + (u << 2) - 8;
          } else {
            moveBack = (initialMove << 2) - 8;
          }
        } else {
          moveBack = initialMove;
        }

        if (moveBack > output.length) {
          throw new Error(
            `decompress: bad move back, (${moveBack}), is greater than output size, (${output.length})`
          );
        }

        const start = output.length - moveBack;
        const size = this.#lengths.readValue(this.#data);

        this.#log("moveBack", moveBack, "size", size);

        for (let i = 0; i < size; ++i) {
          const byte = output[start + i];
          this.#log("byte", byte.toString(16));
          output.push(byte);
        }
      } else {
        const byte = this.#data.read(8);
        this.#log("byte", byte.toString(16));
        output.push(byte);
      }
    }

    return output;
  }

  get offsets(): VPKTree {
    return this.#offsets;
  }

  get lengths(): VPKTree {
    return this.#lengths;
  }
}

export {
  VPK,
  BitStream,
  VPK_COMPRESSION_TYPE_UNKNOWN,
  VPK_COMPRESSION_TYPE_ONE_SAMPLE,
  VPK_COMPRESSION_TYPE_TWO_SAMPLE,
};
export type { ValidVPKHeader, InvalidVPKHeader, VPKHeader };
