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
    if (!this.enable || msg === undefined) return;
    this.logCount += 1;

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

  error(e: Error) {
    if (!this.enable || !e) return;
    this.errCount += 1;
    console.log(
      cyan(this.errCount) +
        "    |    " +
        red(e.message) +
        yellow(JSON.stringify(e)) +
        "    |    " +
        new Date().toLocaleTimeString()
    );
  }
}
