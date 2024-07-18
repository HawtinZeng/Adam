import { io } from "socket.io-client";

console.log("hello123");
const socket = io("http://localhost:5555", { transports: ["websocket"] });

socket.on("connect", () => {
  console.log("connected from client"); // x8WIv7-mJelg7on_ALbx
});

socket.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});
// globalThis.name = chrome.runtime.getManifest().short_name;
// globalThis.port = chrome.runtime.connectNative(globalThis.name);
// port.onMessage.addListener((message) => console.log(message));
// port.onDisconnect.addListener((p) => console.log(chrome.runtime.lastError));
// port.postMessage("hi, child process");
// chrome.runtime.onInstalled.addListener((reason) => {});
