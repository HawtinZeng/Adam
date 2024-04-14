import React, { useEffect, useRef, useState } from "react";
import { Btn } from "src/components/Btn";
import { DraggableTransparent } from "src/components/DraggableTransparent";
import { Point } from "src/utils/data/geometry";
import { AStrokeOptions } from "src/coreRenderer/basicTypes";

export type BtnConfigs = Array<{
  label: string;
  svg?: any;
  key: string;
  subMenu?: JSX.Element;
  btnConfigs?: BtnConfigs;
  strokeOptions?: AStrokeOptions;
  needBorder?: boolean;
  needPadding?: boolean;
}>;
export function Menu(props: {
  btnConfigs: BtnConfigs;
  setParentHoverKey: ((k: number) => void) | null;
  setParentSelectedKey: ((k: number) => void) | null;
  setBtnsRef: (node: HTMLDivElement[]) => void;
  onDrag?: () => void;
}) {
  const { setParentSelectedKey, setParentHoverKey, setBtnsRef, onDrag } = props;
  const [selectedKey, setSelectedKey] = useState(-1);
  const [hoveredKey, setHoveredKey] = useState(-1);
  const [defaultPosition, setDefaultPosition] = useState(new Point());
  const menuRef = useRef<HTMLElement>(null);

  const { btnConfigs } = props;
  const btnsMark = Btn(
    setSelectedKey,
    selectedKey,
    btnConfigs,
    setBtnsRef,
    setHoveredKey,
    true
  );
  useEffect(() => {
    setParentSelectedKey?.(selectedKey);
  }, [selectedKey]);
  useEffect(() => setParentHoverKey?.(hoveredKey), [hoveredKey]);
  useEffect(() => {
    const eleWid = menuRef.current?.clientWidth ?? 0;
    const eleHei = menuRef.current?.clientHeight ?? 0;
    setDefaultPosition(
      new Point(
        window.innerWidth - eleWid - 20,
        window.innerHeight / 2 - eleHei / 2
      )
    );
  }, []);

  return (
    <DraggableTransparent
      defaultPosition={defaultPosition}
      ref={menuRef}
      key={JSON.stringify(defaultPosition)}
      onDrag={onDrag}
    >
      {btnsMark}
    </DraggableTransparent>
  );
}
