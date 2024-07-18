import { fork } from "child_process";
import { appendFile } from "fs";
import path from "path";
import { Duplex } from "stream";
import { fileURLToPath } from "url";
// export { decoder, encodeMessage, getMessage, sendMessage };
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

const buffer = new ArrayBuffer(0, { maxByteLength: 1024 ** 2 });
const view = new DataView(buffer);
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const { readable } = Duplex.toWeb(process.stdin);
const { writable } = Duplex.toWeb(process.stdout);

const { exit } = process;

function encodeMessage(message) {
  return encoder.encode(JSON.stringify(message));
}

async function* getMessage() {
  let messageLength = 0;
  let readOffset = 0;
  for await (let message of readable) {
    if (buffer.byteLength === 0) {
      buffer.resize(4);
      for (let i = 0; i < 4; i++) {
        view.setUint8(i, message[i]);
      }
      messageLength = view.getUint32(0, true);
      message = message.subarray(4);
      buffer.resize(0);
    }
    buffer.resize(buffer.byteLength + message.length);
    for (let i = 0; i < message.length; i++, readOffset++) {
      view.setUint8(readOffset, message[i]);
    }

    if (buffer.byteLength === messageLength) {
      yield new Uint8Array(buffer);
      messageLength = 0;
      readOffset = 0;
      buffer.resize(0);
    }
  }
}

async function sendMessage(message) {
  await new Blob([
    new Uint8Array(new Uint32Array([message.length]).buffer),
    message,
  ])
    .stream()
    .pipeTo(writable, { preventClose: true });
}

const childPath = path.join(
  fileURLToPath(import.meta.url),
  "../child_adam_extension.mjs"
);
const subProcess = fork(childPath);

subProcess.on("message", (message) => {
  appendFile("message", message, () => {});
});

try {
  for await (const message of getMessage()) {
    await sendMessage(encodeMessage("node echo " + decoder.decode(message)));
  }
} catch (e) {
  exit();
}
