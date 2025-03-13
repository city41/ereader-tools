import { MarkCommand } from "./MarkCommandSetGenerator";
declare function markCommandsToSvg(markCommands: MarkCommand[], svgShape: "circle" | "square", dotGap: number): Promise<string>;
export { markCommandsToSvg };
