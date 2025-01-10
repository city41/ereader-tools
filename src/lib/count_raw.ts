import { ReedSolomon } from "./ReedSolomon";

function read_next_raw(f: number[], offset: number): number[] | null {
  ReedSolomon.initialize_rs();

  const rawheader = new Array(24);

  let readOffset = offset;
  for (let i = 0; i < 24; i += 2) {
    rawheader[i] = f[readOffset];
    rawheader[i + 1] = f[readOffset + 1];
    readOffset += 2;
    readOffset += 0x66;
  }

  if (rawheader.length === 24) {
    const correct_errors_result = ReedSolomon.correct_errors(rawheader, 16);
    if (correct_errors_result >= 0) {
      let i = rawheader[4] * rawheader[7];

      if (i % 0x66 > 0) i += 0x66 - (i % 0x66);

      i /= 0x66;

      let k = i;
      i *= 0x68;

      if (i > 0xb60) {
        throw new Error(`read_next_raw: i out of bounds: ${i}`);
      }

      const rawdata = f.slice(offset, offset + i);

      if (rawdata.length !== i) {
        return null;
      }

      let j = 0;

      while (j * 12 < k) {
        for (let i = 0; i < 12 && j * 12 + i < k; i++) {
          rawdata[(j * 12 + i) * 0x68 + 0] = rawheader[i * 2 + 0];
          rawdata[(j * 12 + i) * 0x68 + 1] = rawheader[i * 2 + 1];
        }
        j++;
      }

      return rawdata;
    } else {
      return null;
    }
  } else {
    return null;
  }
}

function count_raw(f: number[]): number {
  let offset = 0;
  let count = 0;

  while (true) {
    const raw_data = read_next_raw(f, offset);
    if (!raw_data) {
      return count;
    }

    count += 1;
    offset += raw_data.length;
  }
}

export { count_raw, read_next_raw };
