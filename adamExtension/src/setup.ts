import { io } from "socket.io-client";
import { ElementRect } from "../../commonModule/types";
import { ScrollListener } from "./scrollListener";

declare global {
  interface Window {
    scrollerListener: ScrollListener;
  }
}

const socket = io("http://localhost:5555", { transports: ["websocket"] });
socket.on("connect", () => {
  console.log("connected from client");
  socket.emit("testLatency", `sent @${new Date().getTime()}`);
});
const latency = 0;
const scrollerListener = new ScrollListener(15); // PUT IT INTO SETTINGS

function emitScroll(e: Event) {
  console.log(e.target);
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
    scrollingElement.width = window.outerWidth;
    scrollingElement.height = window.innerHeight;

    scrollingElement.offsetX = window.screenLeft; // screenLeft is not on the left border of the window, but has a gap of 8.
    scrollingElement.offsetY =
      window.screenTop + (window.outerHeight - window.innerHeight);

    scrollingElement.scrollTop = (trigger as any)?.scrollingElement.scrollTop;
    scrollingElement.scrollHeight = (
      trigger as any
    )?.scrollingElement.scrollHeight;
  } else if (trigger instanceof Element) {
    const rect = trigger.getBoundingClientRect(); // have conflicts with https://leetcode.com/problems/maximum-score-from-grid-operations/solutions/5512718/clean-java-recursive-dp/ and https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
    scrollingElement.width = rect.width;
    scrollingElement.height = rect.height;
    scrollingElement.offsetX = rect.left + window.screenLeft;
    scrollingElement.offsetY =
      rect.top + window.screenTop + window.outerHeight - window.innerHeight;
    scrollingElement.scrollTop = (trigger as any)?.scrollTop;
    scrollingElement.scrollHeight = (trigger as any)?.scrollHeight;
  }
  scrollingElement.topPadding = window.outerHeight - window.innerHeight;
  socket.emit("scrollElement", JSON.stringify(scrollingElement));
}
scrollerListener.addListenerTo(document, emitScroll);
