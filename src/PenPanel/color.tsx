import stylex from "@stylexjs/stylex";
import { Atom, useAtom } from "jotai";
import { isNil } from "lodash";
import React from "react";
import { colorConfigs, mainMenu } from "src/MainMenu";
import { Btn } from "src/components/Btn";

export function ColorsSubPanel(props: {
  showNumber?: number;
  controlledAtom?: Atom<number>;
  setColor?: React.Dispatch<React.SetStateAction<number>>;
  color?: number;
}) {
  const { showNumber, controlledAtom, setColor, color } = props;
  //仅显示后showNumber个
  let selectedKey, setSelectedKey;
  if (controlledAtom)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    [selectedKey, setSelectedKey] = useAtom(controlledAtom);

  if (!isNil(setColor) && !isNil(color)) {
    selectedKey = color;
    setSelectedKey = setColor;
  }

  const btns = Btn(
    setSelectedKey,
    selectedKey,
    colorConfigs,
    undefined,
    undefined,
    undefined,
    "horizontal",
    true
  );
  if (showNumber !== undefined) {
    btns.splice(0, showNumber);
  }
  const len = btns.length,
    grpNums = Math.max(Math.ceil(len / 3), 0),
    grps = new Array(grpNums);
  btns.forEach((btn, idx) => {
    const targetGrp = Math.max(Math.floor(idx / 3), 0);
    if (grps[targetGrp] === undefined) {
      grps[targetGrp] = [btn];
    } else {
      grps[targetGrp].push(btn);
    }
  });
  const grpsTemplate = grps.map((grp, idx) => (
    <div {...stylex.props(mainMenu.onelineFlex)} key={idx}>
      {grp}
    </div>
  ));

  return <div {...stylex.props(mainMenu.multilineLayout)}>{grpsTemplate}</div>;
}
