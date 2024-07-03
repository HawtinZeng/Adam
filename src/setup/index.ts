import { Logger } from "src/devTools/logger";
// import workerpool from "workerpool";

// export let coreThreadPool: Pool;
export let logger: Logger;
function setup() {
  // coreThreadPool = workerpool.pool({
  //   workerType: "web",
  //   maxWorkers: 10,
  // });
  logger = new Logger();
}

setup();
