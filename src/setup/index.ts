import { Logger } from "src/devTools/logger";
import workerpool from "workerpool";
import Pool from "workerpool/types/Pool";

export let coreThreadPool: Pool;
export let logger: Logger;
export function setup() {
  coreThreadPool = workerpool.pool({
    workerType: "web",
    maxWorkers: 10,
  });
  logger = new Logger();
}
