import { throttle } from "lodash";
import { io } from "socket.io-client";
import { ElementRect } from "../../common/types";
import { ScrollListener } from "./scrollListener";

const socket = io("http://localhost:5555", { transports: ["websocket"] });
socket.on("connect", () => {
  console.log("connected from client"); // x8WIv7-mJelg7on_ALbx
  socket.emit("testLatency", `sent @${new Date().getTime()}`);
});

const scrollerListener = new ScrollListener(5); // PUT IT INTO SETTINGS
const throttledScrollEmitter = throttle(function emitScroll(e: Event) {
  const scrollingElement: ElementRect = {
    width: 0,
    height: 0,
    offsetX: 0,
    offsetY: 0,
  };

  const trigger = e.target;
  if (trigger instanceof Document) {
    scrollingElement.width = window.outerWidth;
    scrollingElement.height = window.outerHeight;
    scrollingElement.offsetX = window.screenLeft;
    scrollingElement.offsetY = window.screenTop;
  } else if (trigger instanceof Element) {
    const rect = trigger.getBoundingClientRect();
    scrollingElement.width = rect.width;
    scrollingElement.height = rect.height;
    scrollingElement.offsetX = rect.left + window.screenLeft;
    scrollingElement.offsetY =
      rect.top + window.screenTop + window.outerHeight - window.innerHeight;
  }
  socket.emit("scrollElement", JSON.stringify(scrollingElement));
}, 50);
scrollerListener.addListenerTo(document, throttledScrollEmitter);

// globalThis.name = chrome.runtime.getManifest().short_name;
// globalThis.port = chrome.runtime.connectNative(globalThis.name);
// port.onMessage.addListener((message) => console.log(message));
// port.onDisconnect.addListener((p) => console.log(chrome.runtime.lastError));
// port.postMessage("hi, child process");
// chrome.runtime.onInstalled.addListener((reason) => {});
