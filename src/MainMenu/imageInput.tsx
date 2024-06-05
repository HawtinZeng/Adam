import x from "@stylexjs/stylex";
import { useAtom } from "jotai";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { ReactSVG } from "react-svg";
import { newImgElement } from "src/CoreRenderer/drawingElementsTypes";
import { cloneDeepGenId } from "src/common/utils";
import { UpdatingElement } from "src/drawingElements/data/scene";
import add from "src/images/svgs/addButton.svg";
import { sceneAtom } from "src/state/sceneState";
import { canvasAtom } from "src/state/uiState";

const st = x.create({
  rootContainer: {
    display: "flex",
    maxWidth: "300px",
    flexWrap: "wrap",
  },
  flexContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  greyText: {
    color: "grey",
  },
});
export function ImageInput() {
  const [imgs, setImgs] = useState<File[] | null>(null);
  const [usedImg, setusedImg] = useState<Map<File, boolean>>(new Map());
  const [cur, setCur] = useState<File | null>(null);
  const isAssignSecPt = useRef(false);
  const [s, ss] = useAtom(sceneAtom);
  const htmlImgs = useRef<WeakMap<File, HTMLImageElement>>(new WeakMap());
  const [cvsEle] = useAtom(canvasAtom);

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target) return;
    const fileList = (event.target as HTMLInputElement).files;

    if (!fileList) return;
    const files: File[] = [];
    new Array(fileList.length).fill(0).forEach((_, idx) => {
      const f = fileList.item(idx);
      if (!f) return;
      files.push(f);
    });
    setImgs(files);
    setCur(files[0] ?? null);

    files.forEach((imgFile) => {
      usedImg.set(imgFile, false);
      const imgEl = new Image();
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const img = new Image();
        if (!event.target?.result) return;
        imgEl.src = event.target.result as string;
        htmlImgs.current.set(imgFile, imgEl);
      };
      reader.readAsDataURL(imgFile);
    });
    setusedImg(new Map([...usedImg]));
  }
  const i = useRef<null | HTMLInputElement>(null);
  const excuted = useRef(false);

  const updateDraggableItemPos = (e: MouseEvent) => {
    if (!excuted.current) return;
    const len = document.getElementsByClassName("draggable").length;
    const el = document.getElementsByClassName("draggable")[
      len - 1
    ] as HTMLElement;
    if (el) {
      el.style.left = e.clientX + 30 + "px";
      el.style.top = e.clientY + 30 + "px";
    }

    const updating = s.updatingElements[0];
    if (updating && isAssignSecPt.current && cur) {
      const fPt = updating.ele.points[0];
      const scaledW = e.clientX - fPt.x;
      const img = htmlImgs.current.get(cur);
      if (!img) return;
      updating.ele.scale = { x: scaledW / img.width, y: scaledW / img.width };

      ss({ ...s });
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!cur) return;
    if (!isAssignSecPt.current) {
      isAssignSecPt.current = true;
      const imgEle = cloneDeepGenId(newImgElement);
      imgEle.points[0] = { x: e.clientX, y: e.clientY };
      imgEle.image = htmlImgs.current.get(cur);

      const updating: UpdatingElement = {
        type: "scale",
        ele: imgEle,
        oriImageData: cvsEle!
          .getContext("2d")!
          .getImageData(0, 0, cvsEle!.width, cvsEle!.height),
      };
      s.updatingElements[0] = updating;
      ss({ ...s });
    } else {
      isAssignSecPt.current = false;
      s.elements.push(s.updatingElements[0].ele);
      ss({ ...s });
      s.updatingElements.length = 0;
    }
  };
  useEffect(() => {
    if (!excuted.current) {
      i.current!.click();
      excuted.current = true;
    }
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", updateDraggableItemPos);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", updateDraggableItemPos);
    };
  }, [cur, s]);
  return (
    <>
      {!cur && <span>选择图片中...</span>}
      <input
        type="file"
        ref={i}
        accept="image/*"
        onChange={handleFileSelect}
        multiple
        style={{ display: "none" }}
      ></input>
      {imgs?.length ?? -1 > 0 ? (
        <div {...x.props(st.rootContainer)}>
          {imgs!.map((f) => {
            return (
              <div
                {...x.props(
                  st.flexContainer,
                  usedImg.get(f) ? st.greyText : null
                )}
                key={f.name}
              >
                <span
                  style={{
                    maxWidth: "90px",
                    textWrap: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginRight: "5px",
                  }}
                >{`${f.name}`}</span>
                <span>{`${Math.round(f.size / 1024)}KB`}</span>
                {cur === f && <ReactSVG src={add} />}
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
