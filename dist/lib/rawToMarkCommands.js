"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawToMarkCommands = rawToMarkCommands;
const MarkCommandSetGenerator_1 = require("./MarkCommandSetGenerator");
const count_raw_1 = require("./count_raw");
function rawToMarkCommands(rawfile) {
    const num_raw = (0, count_raw_1.count_raw)(rawfile);
    let offset = 0;
    const markCommandSets = [];
    for (let i = 0; i < num_raw; i++) {
        let raw = (0, count_raw_1.read_next_raw)(rawfile, offset);
        if (!raw) {
            throw new Error("raw unexpectedly null");
        }
        offset += raw.length;
        const markCommandSetGenerator = new MarkCommandSetGenerator_1.MarkCommandSetGenerator(raw);
        markCommandSetGenerator.init();
        markCommandSetGenerator.eightTenModulate();
        const marks = markCommandSetGenerator.generateMarks();
        markCommandSets.push(marks);
    }
    return markCommandSets;
}
//# sourceMappingURL=rawToMarkCommands.js.map