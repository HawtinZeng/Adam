import x from "@stylexjs/stylex";
import { Box, Polygon } from "@zenghawtin/graph2d";
import { useAtom } from "jotai";
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ReactSVG } from "react-svg";
import { DrawingElement } from "src/CoreRenderer/basicTypes";
import {
  CircleShapeElement,
  DrawingType,
  ImageElement,
  RectangleShapeElement,
  newImgElement,
} from "src/CoreRenderer/drawingElementsTypes";
import { cloneDeepGenId } from "src/common/utils";
import { UpdatingElement } from "src/drawingElements/data/scene";
import add from "src/images/svgs/addButton.svg";
import { sceneAtom } from "src/state/sceneState";
import { canvasAtom, selectedKeyAtom } from "src/state/uiState";

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
  const [cur, setCur] = useState<number>(-1);
  const isAssignSecPt = useRef(false);
  const [s, ss] = useAtom(sceneAtom);
  const htmlImgs = useRef<WeakMap<File, HTMLImageElement>>(new WeakMap());
  const [cvsEle] = useAtom(canvasAtom);
  const fileListRef = useRef<File[]>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedKey, setSelectedKey] = useAtom(selectedKeyAtom);

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
    setCur(0);
    fileListRef.current = files;

    files.forEach((imgFile) => {
      usedImg.set(imgFile, false);
      const imgEl = new Image();
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
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

  const updateDraggableItemPos = useCallback(
    (e: MouseEvent) => {
      if (!excuted.current) return;
      const len = document.getElementsByClassName("draggable").length;
      const el = document.getElementsByClassName("draggable")[
        len - 1
      ] as HTMLElement;
      if (el) {
        el.style.left = e.clientX + 15 + "px";
        el.style.top = e.clientY + 15 + "px";
      }

      const updating = s.updatingElements[0];
      if (updating && isAssignSecPt.current && fileListRef.current?.[cur]) {
        const fPt = updating.ele.points[0];
        const scaledW = e.clientX - fPt.x;
        const scaledH = e.clientY - fPt.y;

        const img = htmlImgs.current.get(fileListRef.current?.[cur]);

        if (!img) return;
        updating.ele.scale = {
          x: scaledW / img.width,
          y: Math.abs(scaledW / img.width) * Math.sign(scaledH / img.height),
        };

        ss({ ...s });
      }
    },
    [s, ss, isAssignSecPt, fileListRef, cur]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!fileListRef.current?.[cur]) return;
      if (!isAssignSecPt.current) {
        isAssignSecPt.current = true;
        const imgEle = cloneDeepGenId(newImgElement);
        imgEle.points[0] = { x: e.clientX, y: e.clientY };
        imgEle.position = { x: e.clientX, y: e.clientY };

        imgEle.image = htmlImgs.current.get(fileListRef.current?.[cur]);
        imgEle.width = imgEle.image!.width;
        imgEle.height = imgEle.image!.height;

        const updating: UpdatingElement = {
          type: "addImg",
          ele: imgEle,
          oriImageData: cvsEle!
            .getContext("2d", { willReadFrequently: true })!
            .getImageData(0, 0, cvsEle!.width, cvsEle!.height),
        };
        s.updatingElements[0] = updating;
      } else {
        isAssignSecPt.current = false;
        const img = s.updatingElements[0].ele as ImageElement;

        img.boundary[0] = getBoundryPoly(img)!;
        img.rotateOrigin = img.boundary[0].box.center;

        s.elements.push(img);
        s.updatingElements.length = 0;

        setCur(cur + 1);
        if (
          fileListRef.current?.length &&
          cur + 1 >= fileListRef.current?.length
        ) {
          setSelectedKey(2); // arrow select tool.
        }
      }
    },
    [cur, cvsEle, s.updatingElements, s.elements, setSelectedKey]
  );

  useEffect(() => {
    i.current!.addEventListener("cancel", () => {
      setSelectedKey(-1);
    });
  }, [setSelectedKey]);

  useEffect(() => {
    if (selectedKey === 4) {
      if (!excuted.current) {
        i.current!.click();
        excuted.current = true;
      }
    }
  }, [selectedKey]);

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
  }, [handleMouseDown, updateDraggableItemPos]);

  return (
    <>
      {cur === -1 && <span>选择图片中...</span>}
      <input
        type="file"
        ref={i}
        accept="image/*"
        onChange={handleFileSelect}
        multiple
        style={{ display: "none" }}
      />
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
                {fileListRef.current?.[cur] === f && <ReactSVG src={add} />}
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}

export function getBoundryPoly(ele: DrawingElement) {
  let bbx: Box = new Box();
  if (ele.type === DrawingType.img || ele.type === DrawingType.rectangle) {
    const ensureTypeEle = ele as ImageElement | RectangleShapeElement;
    const pos = ensureTypeEle.position;

    bbx = new Box(
      pos.x,
      pos.y,
      pos.x + ensureTypeEle.width * ensureTypeEle.scale.x,
      pos.y + ensureTypeEle.height * ensureTypeEle.scale.y
    );
    return new Polygon(bbx).rotate(ele.rotation, bbx.center);
  } else if (ele.type === DrawingType.circle) {
    const circle = ele as CircleShapeElement;
    const pos = circle.position;

    bbx = new Box(
      pos.x,
      pos.y,
      pos.x + circle.radius * 2 * circle.scale.x,
      pos.y + circle.radius * 2 * circle.scale.y
    );
    return new Polygon(bbx).rotate(ele.rotation, bbx.center);
  }
}
