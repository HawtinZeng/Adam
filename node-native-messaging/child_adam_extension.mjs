import { appendFile, unlink } from "fs";

process.on("message", (d) => {
  unlink("msg.txt", () => {
    appendFile("msg.txt", d, () => {});
  });
});
// appendFile("ipc", JSON.stringify(ipc), () => {});
// ipc.config.retry = 1500;
// ipc.config.networkPort = 1500;
// ipc.connectToNet("adam-electron-main", function () {
//   ipc.of["adam-electron-main"].on("connect", function () {
//     ipc.log("## connected to adam-electron-main ##", ipc.config.delay);
//     ipc.of["adam-electron-main"].emit(
//       "message",
//       "hello from adam extension" + "\n" + new Date().getTime()
//     );
//   });
//   ipc.of["adam-electron-main"].on("disconnect", function () {
//     ipc.log("disconnected from adam-electron-main");
//   });
//   ipc.of["adam-electron-main"].on("message", function (data) {
//     ipc.log("got a message from adam-electron-main : ", data);
//   });
// });
