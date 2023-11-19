const reset = "\x1b[0m"
const yellow = (msg: string) => `\x1b[33m${msg}${reset}`;

// overriding log to also print timestamps
const oldCons = console.log
console.log = (msg, params) => {
    oldCons(yellow(`[${new Date().toLocaleString('de-DE')}]`), ...[msg, ...(params ?? [])])
}
export const prefixLog = (prefix: string) => (msg: string) => console.log(`[${prefix}] ${msg}`)