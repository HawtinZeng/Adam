/**
Common color command: 
  console.log('\x1b[31mThis is red text.\x1b[0m'); // Red color
  console.log('\x1b[33mThis is yellow text.\x1b[0m'); // Yellow color
  console.log('\x1b[36mThis is cyan text.\x1b[0m'); // Cyan color
 */
declare global {
  interface Window {
    logger: Logger;
  }
}

const yellow = (msg: string | number | Object) => `\x1b[33m${msg}\x1b[0m`;
const cyan = (msg: string | number | Object) => `\x1b[36m${msg}\x1b[0m`;
export class Logger {
  enable: boolean = true;
  logCount: number = 0;

  log(msg: string | Object) {
    if (!this.enable) return;

    console.log(
      cyan(++this.logCount) +
        "    |    " +
        yellow(msg) +
        "    |    " +
        new Date().toLocaleTimeString()
    );
  }
}
