import { io } from "socket.io-client";
import { ScrollListener } from "./scrollListener";

declare global {
  interface Window {
    scrollerListener: ScrollListener;
  }
}

const socket = io("http://localhost:5555", { transports: ["websocket"] });

socket.on("connect", () => {
  socket.emit("testLatency", `sent @${new Date().getTime()}`);
});
const scrollerListener = new ScrollListener(15); // PUT IT INTO SETTINGS

function emitScroll(e: Event) {
  chrome.runtime.sendMessage(
    { action: "getCurrentTab" },
    (res: { tabId: number }) => {
      const id = res.tabId.toString();
      socket.emit(
        "scrollElement",
        JSON.stringify(scrollerListener.getElementArea(e.target as Element, id))
      );
    }
  );
}

function emitSizeChange(borderSize: ResizeObserverEntry["borderBoxSize"]) {
  socket.emit("onBoundsChanged", JSON.stringify(borderSize));
}

scrollerListener.addScrollListenerTo(document, emitScroll);

scrollerListener.addSizeChangeLister(emitSizeChange);
