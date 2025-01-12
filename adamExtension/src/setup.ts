import { io } from "socket.io-client";
import { ScrollListener } from "./scrollListener";

declare global {
  interface Window {
    scrollerListener: ScrollListener;
  }
}

const socket = io("http://localhost:5555", { transports: ["websocket"] });
socket.on("connect", () => {
  chrome.runtime.sendMessage(
    { action: "getCurrentTab" },
    (res: { tabId: string }) => {
      if (res.tabId) {
        socket.emit(
          "initializeArea",
          [...scrollerListener.scrollables].map((ele: any) =>
            scrollerListener.getElementArea(ele as Element, res.tabId)
          )
        );
      }
    }
  );

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
  console.log(borderSize);
  socket.emit("onBoundsChanged", JSON.stringify(borderSize));
}

scrollerListener.addScrollListenerTo(document, emitScroll);

scrollerListener.addSizeChangeLister(emitSizeChange);
