type CardType = "z80" | "gba" | "nes";
type CardRegion = "us" | "jpn" | "jpn+";
declare function createSavFile(binary: number[], type: CardType, region: CardRegion, name: string): number[];
export { createSavFile };
