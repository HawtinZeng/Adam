import { io } from "socket.io-client";

const socket = io("http://localhost:5555", { transports: ["websocket"] });
socket.on("connect", () => {
  console.log("connected from client from background process");
  socket.emit("testLatency", `sent @${new Date().getTime()} from backgroundts`);
});

chrome.tabs.onCreated.addListener(function (tab) {
  socket.emit("activeBrowserTab", tab.id);
});

chrome.tabs.onActivated.addListener(function (tabInfo) {
  socket.emit("activeBrowserTab", tabInfo.tabId);
});
