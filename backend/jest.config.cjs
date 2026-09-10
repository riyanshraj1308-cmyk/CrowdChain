module.exports = {
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/test/api/**/*.test.js"],
  setupFiles: ["<rootDir>/test/api/setupEnv.js"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
