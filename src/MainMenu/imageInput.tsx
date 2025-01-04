import x from "@stylexjs/stylex";
import { Box, Circle, Point, Polygon, Vector } from "@zenghawtin/graph2d";
import { useAtom } from "jotai";
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ReactSVG } from "react-svg";
import { debugArrow } from "src/App";
import { drawCircle, getTriangle } from "src/CoreRenderer/DrawCanvas/core";
import { DrawingElement } from "src/CoreRenderer/basicTypes";
import {
  ArrowShapeElement,
  CircleShapeElement,
  DrawingType,
  FreeDrawing,
  ImageElement,
  RectangleShapeElement,
  newImgElement,
} from "src/CoreRenderer/drawingElementsTemplate";
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
  } else if (ele.type === DrawingType.arrow) {
    const arrow = ele as ArrowShapeElement;
    const endPt = {
      x: arrow.points[1].x + arrow.position.x,
      y: arrow.points[1].y + arrow.position.y,
    };
    console.log(arrow.rotation);

    const [endPos, startPos] = [
      {
        x: arrow.points[1].x + arrow.position.x,
        y: arrow.points[1].y + arrow.position.y,
      },
      {
        x: arrow.points[0].x + arrow.position.x,
        y: arrow.points[0].y + arrow.position.y,
      },
    ];

    const lineVec = new Vector(endPos.x - startPos.x, endPos.y - startPos.y);
    const verticalToBottom = new Vector(0, 1);
    const rotation = lineVec.invert().angleTo(verticalToBottom);
    const [v1x, v1y, v2x, v2y, v3x, v3y] = getTriangle(
      endPt.x,
      endPt.y,
      arrow.strokeWidth * 4,
      -rotation
    );

    const halfThickness = arrow.strokeWidth / 2;
    const downVec = lineVec.normalize().rotate90CCW();
    const upVec = lineVec.normalize().rotate90CW();
    const realDVec = downVec.scale(halfThickness, halfThickness);
    const realUVec = upVec.scale(halfThickness, halfThickness);

    const pol = new Polygon([
      new Point(v3x, v3y),
      new Point(v1x, v1y),
      new Point(endPos.x + realUVec.x, endPos.y + realUVec.y),
      new Point(startPos.x + realUVec.x, startPos.y + realUVec.y),
      new Point(startPos.x + realDVec.x, startPos.y + realDVec.y),
      new Point(endPos.x + realDVec.x, endPos.y + realDVec.y),
      new Point(v2x, v2y),
    ]);
    if (debugArrow)
      [...pol.vertices].forEach((v) => {
        drawCircle(null, new Circle(v, 10));
      });
    return pol;
  } else if (ele.type === DrawingType.freeDraw) {
    const free = ele as FreeDrawing;
    const pos = free.position;

    const worldBoundary = free.oriBoundary[0]
      .translate(new Vector(pos.x, pos.y))
      .translate(new Vector(-free.scaleOrigin.x, -free.scaleOrigin.y))
      .scale(free.scale.x, free.scale.y)
      .translate(new Vector(free.scaleOrigin.x, free.scaleOrigin.y))
      .rotate(
        ele.rotation,
        new Point(free.rotateOrigin.x, free.rotateOrigin.y)
      );

    return worldBoundary;
  }
}

export function getCenter(free: FreeDrawing) {
  const pos = free.position;

  const centerWorld = free.oriBoundary[0].box.center
    .translate(new Vector(pos.x, pos.y))
    .translate(new Vector(-free.scaleOrigin.x, -free.scaleOrigin.y))
    .scale(free.scale.x, free.scale.y)
    .translate(new Vector(free.scaleOrigin.x, free.scaleOrigin.y))
    .rotate(free.rotation, new Point(free.rotateOrigin.x, free.rotateOrigin.y));

  return centerWorld;
}

export function getExcludeBoundaryPoly(ele: DrawingElement) {
  if (ele.type === DrawingType.freeDraw) {
    const free = ele as FreeDrawing;
    const ori = free.oriexcludeArea;

    return ori.map((pol) => {
      const tranPol = pol.translate(
        new Vector(free.position.x, free.position.y)
      );

      return tranPol.rotate(ele.rotation, free.rotateOrigin);
    });
  }
}
