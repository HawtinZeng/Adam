import { io } from "socket.io-client";

const socket = io("http://localhost:5555", { transports: ["websocket"] });
socket.on("connect", () => {
  console.log("connected from client from background process");
  socket.emit("testLatency", `sent @${new Date().getTime()} from backgroundts`);
});

socket.on("queryActiveTabId", async () => {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  socket.emit("deliverActiveTabId", tab?.id);
});

chrome.tabs.onCreated.addListener(function (tab) {
  socket.emit("activeBrowserTab", tab.id);
});

chrome.tabs.onActivated.addListener(function (tabInfo) {
  socket.emit("activeBrowserTab", tabInfo.tabId);
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCurrentTab") {
    let queryOptions = { active: true, currentWindow: true };
    chrome.tabs.query(queryOptions).then((tab) => {
      chrome.tabs.getZoom().then((zoomValue) => {
        sendResponse({ tabId: tab[0]?.id, zoomValue });
      });
    });
    return true;
  }
});
chrome.tabs.onZoomChange.addListener((zoomInfo) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0])
      chrome.tabs.sendMessage(tabs[0].id!, {
        type: "zoom",
        data: zoomInfo,
        tabId: tabs[0].id!,
      });
  });
});
