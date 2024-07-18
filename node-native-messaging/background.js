import { io } from 'socket.io-client';

/* eslint-disable */
const socket = io("http://localhost/:5656");
// client-side
console.log(socket);
socket.on("connect", () => {
  console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});

// globalThis.name = chrome.runtime.getManifest().short_name;
// globalThis.port = chrome.runtime.connectNative(globalThis.name);
// port.onMessage.addListener((message) => console.log(message));
// port.onDisconnect.addListener((p) => console.log(chrome.runtime.lastError));
// port.postMessage("hi, child process");
// chrome.runtime.onInstalled.addListener((reason) => {});
