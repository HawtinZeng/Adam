import { io } from "socket.io-client";
import { ScrollListener } from "./scrollListener";

declare global {
  interface Window {
    scrollerListener: ScrollListener;
  }
}

const socket = io("http://localhost:5555", { transports: ["websocket"] });

const scrollerListener = new ScrollListener(15); // PUT IT INTO SETTINGS

function emitScroll(e: Event) {
  chrome.runtime.sendMessage(
    { action: "getCurrentTab" },
    (res: { tabId: number; zoomValue: number }) => {
      if (res.tabId === undefined) return;
      const id = res.tabId.toString();
      const zoomValue = res.zoomValue;
      socket.emit(
        "scrollElement",
        JSON.stringify(
          scrollerListener.getElementArea(e.target as Element, id, zoomValue)
        )
      );
    }
  );
}

function emitSizeChange(borderSize: ResizeObserverEntry["borderBoxSize"]) {
  socket.emit("onBoundsChanged", JSON.stringify(borderSize));
}

scrollerListener.addScrollListenerTo(document, emitScroll);

scrollerListener.addSizeChangeLister(emitSizeChange);

chrome.runtime.sendMessage(
  { action: "getCurrentTab" },
  (res: { tabId: number }) => {
    if (res.tabId === undefined) return;
    const id = res.tabId.toString();
    tabId = id;
  }
);

socket.on("initializeAreaFromNode2Chrome", () => {
  chrome.runtime.sendMessage(
    { action: "getCurrentTab" },
    (res: { tabId: number; zoomValue: number }) => {
      if (res.tabId === undefined) return;
      const id = res.tabId.toString();

      if (id === tabId) {
        const zoomValue = res.zoomValue;

        socket.emit(
          "initializeArea",
          JSON.stringify(scrollerListener.getAllAreas(id, zoomValue))
        );
      }
    }
  );
});

let tabId: string;

socket.on("connect", () => {
  socket.emit("testLatency", `sent @${new Date().getTime()}`);
  chrome.runtime.sendMessage(
    { action: "getCurrentTab" },
    (res: { tabId: number; zoomValue: number }) => {
      if (res.tabId === undefined) return;
      const id = res.tabId.toString();
      const zoomValue = res.zoomValue;

      socket.emit(
        "initializeArea",
        JSON.stringify(scrollerListener.getAllAreas(id, zoomValue))
      );
    }
  );
});
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === "zoom") {
    socket.emit(
      "initializeArea",
      JSON.stringify(
        scrollerListener.getAllAreas(
          message.data.tabId + "",
          message.data.newZoomFactor
        )
      )
    );
  }
});
