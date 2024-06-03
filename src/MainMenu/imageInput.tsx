import x from "@stylexjs/stylex";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { ReactSVG } from "react-svg";
import { newImgElement } from "src/CoreRenderer/drawingElementsTypes";
import { cloneDeepGenId } from "src/common/utils";
import add from "src/images/svgs/addButton.svg";

const s = x.create({
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

    files.forEach((_) => {
      usedImg.set(_, false);
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
  };

  const handleMouseDown = () => {
    if (!cur) return;
    // cur
    if (!isAssignSecPt.current) {
      isAssignSecPt.current = true;
      const imgEle = cloneDeepGenId(newImgElement);
    } else {
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
  }, []);
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
        <div {...x.props(s.rootContainer)}>
          {imgs!.map((f) => {
            return (
              <div
                {...x.props(
                  s.flexContainer,
                  usedImg.get(f) ? s.greyText : null
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
