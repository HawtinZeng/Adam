/**
Common color command: 
  console.log('\x1b[31mThis is red text.\x1b[0m'); // Red color
  console.log('\x1b[33mThis is yellow text.\x1b[0m'); // Yellow color
  console.log('\x1b[36mThis is cyan text.\x1b[0m'); // Cyan color
 */

const yellow = (msg: string | number | Object) => `\x1b[33m${msg}\x1b[0m`;
const cyan = (msg: string | number | Object) => `\x1b[36m${msg}\x1b[0m`;
const red = (msg: string | number | Object) => `\x1b[31m${msg}\x1b[0m`;
export class Logger {
  enable: boolean = true;
  logCount: number = 0;
  errCount: number = 0;

  log(msg: string | Object | undefined, color: string = "yellow") {
    if (msg === undefined) msg = "undefined";
    if (!this.enable) return;
    this.logCount += 1;
    if (msg instanceof Object) {
      msg = JSON.stringify(msg);
    }

    if (color === "red") {
      console.log(
        cyan(this.logCount) +
          "    |    " +
          red(msg) +
          "    |    " +
          new Date().toLocaleTimeString()
      );
      return;
    }

    console.log(
      cyan(this.logCount) +
        "    |    " +
        yellow(msg) +
        "    |    " +
        new Date().toLocaleTimeString()
    );
  }

  logOnly(msg: string | Object | undefined, color: string = "yellow") {
    console.clear();
    this.log(msg, color);
    const originalLog = console.log;
    console.log = () => {};
    setTimeout(() => {
      console.log = originalLog;
    }, 0);
  }

  error(errMsg: Error | string) {
    if (!this.enable || !errMsg) return;

    this.errCount += 1;
    if (errMsg instanceof Error) {
      errMsg = errMsg.message;
    }

    console.log(
      cyan(this.errCount) +
        "    |    " +
        red(errMsg) +
        "    |    " +
        new Date().toLocaleTimeString()
    );
  }
}
export const loggerIns = new Logger();
