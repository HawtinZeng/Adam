import { throttle } from "lodash";
import { io } from "socket.io-client";
import { ElementRect } from "../../commonModule/types";
import { ScrollListener } from "./scrollListener";

const socket = io("http://localhost:5555", { transports: ["websocket"] });
socket.on("connect", () => {
  console.log("connected from client");
  socket.emit("testLatency", `sent @${new Date().getTime()}`);
});
const latency = 0;
const scrollerListener = new ScrollListener(5); // PUT IT INTO SETTINGS

function emitScroll(e: Event) {
  const scrollingElement: ElementRect = {
    width: 0,
    height: 0,
    offsetX: 0,
    offsetY: 0,
    topPadding: 0,
    scrollTop: 0,
    scrollHeight: 0,
  };

  const trigger = e.target;

  if (trigger instanceof Document) {
    scrollingElement.width = window.innerWidth;
    scrollingElement.height = window.innerHeight;

    scrollingElement.offsetX = window.screenLeft + 8; // screenLeft is not on the left border of the window, but has a gap of 8.
    scrollingElement.offsetY =
      window.screenTop + (window.outerHeight - window.innerHeight);

    scrollingElement.scrollTop = (trigger as any)?.scrollingElement.scrollTop;
    scrollingElement.scrollHeight = (
      trigger as any
    )?.scrollingElement.scrollHeight;
  } else if (trigger instanceof Element) {
    const rect = trigger.getBoundingClientRect();
    scrollingElement.width = rect.width;
    scrollingElement.height = rect.height;
    scrollingElement.offsetX = rect.left + window.screenLeft + 8;
    scrollingElement.offsetY =
      rect.top + window.screenTop + window.outerHeight - window.innerHeight;
    scrollingElement.scrollTop = (trigger as any)?.scrollTop;
    scrollingElement.scrollHeight = (trigger as any)?.scrollHeight;
  }
  scrollingElement.topPadding = window.outerHeight - window.innerHeight;
  socket.emit("scrollElement", JSON.stringify(scrollingElement));
}
const throttledScrollEmitter = throttle(emitScroll, latency);
scrollerListener.addListenerTo(document, throttledScrollEmitter);

scrollerListener.scrollables.forEach((scrollable) => {
  emitScroll({ target: scrollable } as unknown as Event);
});
// globalThis.name = chrome.runtime.getManifest().short_name;
// globalThis.port = chrome.runtime.connectNative(globalThis.name);
// port.onMessage.addListener((message) => console.log(message));
// port.onDisconnect.addListener((p) => console.log(chrome.runtime.lastError));
// port.postMessage("hi, child process");
// chrome.runtime.onInstalled.addListener((reason) => {});
