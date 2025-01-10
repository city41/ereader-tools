import {
  MarkCommand,
  MarkCommandSetGenerator,
} from "./MarkCommandSetGenerator";
import { count_raw, read_next_raw } from "./count_raw";

function rawToMarkCommands(rawfile: number[]): MarkCommand[][] {
  const num_raw = count_raw(rawfile);
  let offset = 0;
  const markCommandSets: MarkCommand[][] = [];

  for (let i = 0; i < num_raw; i++) {
    let raw = read_next_raw(rawfile, offset);

    if (!raw) {
      throw new Error("raw unexpectedly null");
    }

    offset += raw.length;

    const markCommandSetGenerator = new MarkCommandSetGenerator(raw);

    markCommandSetGenerator.init();
    markCommandSetGenerator.eightTenModulate();
    const marks = markCommandSetGenerator.generateMarks();

    markCommandSets.push(marks);
  }

  return markCommandSets;
}

export { rawToMarkCommands };
