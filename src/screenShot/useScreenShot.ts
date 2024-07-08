import { useAtomValue } from "jotai";
import { useRef } from "react";
import { bgCanvasAtom } from "src/state/uiState";

export function useScreenShot() {
  const bg = useAtomValue(bgCanvasAtom)!;
  const status = useRef<"pending" | "ending">("ending");

  async function startScreenShot() {
    if (status.current === "pending") return;
    status.current = "pending";

    const ctx = bg?.getContext("2d")!;
    if (!ctx) return;
    const source = (window as any).sourceId;
    if (source) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          // @ts-ignore
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: source,
            minWidth: bg!.width,
            minHeight: bg!.height,
          },
        },
      });

      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      const img = await imageCapture.grabFrame();

      ctx.drawImage(img, 0, 0, bg.width, bg.height);
    }
  }

  function terminateScreenShot() {
    if (status.current === "ending") return;
    status.current = "ending";

    const ctx = bg?.getContext("2d")!;
    if (!ctx) return;
    ctx.clearRect(0, 0, bg.width, bg.height);
  }

  return { startScreenShot, terminateScreenShot };
}
