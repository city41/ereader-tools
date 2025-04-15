type MarkCommand = {
    x: number;
    y: number;
    type: "dot" | "sync";
};
declare class MarkCommandSetGenerator {
    static modtable: readonly [0, 1, 2, 18, 4, 5, 6, 22, 8, 9, 10, 20, 12, 13, 17, 16];
    addr: number[];
    raw: number[];
    flip: boolean;
    width: number;
    height: number;
    marks: MarkCommand[];
    _810mod: number[][];
    private readRaw;
    private drawDot;
    private drawSyncMarker;
    private calcAddr;
    private drawAddressBar;
    constructor(raw: number[], flip: boolean);
    init(): void;
    eightTenModulate(): void;
    generateMarks(): MarkCommand[];
}
export { MarkCommandSetGenerator };
export type { MarkCommand };
