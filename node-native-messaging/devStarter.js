import { exec } from "child_process";
import chokidar from "chokidar";
chokidar.watch("./src/background.ts").on("all", (event, path) => {
  exec("nr build");
});
