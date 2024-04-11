const prefix = "\x1b[",
  reset = "\x1b[0m";
const yellow = (msg: string) => `${prefix}33m${msg}${reset}`;
const red = (msg: string) => `${prefix}91m${msg}${reset}`;

// overriding logs to also print timestamps
const oldConsoleInfo = console.info,
  oldConsoleError = console.error;
console.info = (msg, ...params) => {
  oldConsoleInfo(
    yellow(`[${new Date().toLocaleString("de-DE")}]`),
    ...[msg, ...(params ?? [])]
  );
};
console.error = (msg, ...params) => {
  oldConsoleError(
    yellow(`[${new Date().toLocaleString("de-DE")}]`),
    ...[red(msg), ...(params ?? [])]
  );
};
export const prefixLog = (prefix: string) => (msg: string) =>
  console.info(`[${prefix}] ${msg}`);
