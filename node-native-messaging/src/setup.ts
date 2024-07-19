import { io } from "socket.io-client";
import { ScrollListener } from "./scrollListener";
import { throttle } from "lodash";
import { ElementRect } from "../../common/types";

const socket = io("http://localhost:5555", { transports: ["websocket"] });
socket.on("connect", () => {
  console.log("connected from client"); // x8WIv7-mJelg7on_ALbx
  socket.emit('testLatency', `sent @${new Date().getTime()}`)
});

const scrollerListener = new ScrollListener(3);
const throttledScrollEmitter = throttle(  function emitScroll(e: Event) {
  const scrollingElement: ElementRect = {width: 0, height: 0, offsetX: 0, offsetY: 0}
  
  const trigger = e.target;
  if (trigger  instanceof Document) {
    scrollingElement.width = window.innerWidth;
    scrollingElement.height = window.innerHeight;
    scrollingElement.offsetX = window.screenLeft;
    scrollingElement.offsetY = window.screenTop;
  } else if (trigger instanceof Element) {
    const rect = trigger.getBoundingClientRect();
    scrollingElement.width = rect.width;
    scrollingElement.height = rect.height;
    scrollingElement.offsetX = rect.left + window.screenLeft;
    scrollingElement.offsetY = rect.top + window.screenTop;
  }
  console.log(`sent: ${JSON.stringify(scrollingElement)}`)
  socket.emit('scrollElement', JSON.stringify(scrollingElement))
}, 50);
scrollerListener.addListenerTo(document, throttledScrollEmitter);

// globalThis.name = chrome.runtime.getManifest().short_name;
// globalThis.port = chrome.runtime.connectNative(globalThis.name);
// port.onMessage.addListener((message) => console.log(message));
// port.onDisconnect.addListener((p) => console.log(chrome.runtime.lastError));
// port.postMessage("hi, child process");
// chrome.runtime.onInstalled.addListener((reason) => {});
