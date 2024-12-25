import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "./tests",
  roots: ["<rootDir>/integration"],
};

export default config;
