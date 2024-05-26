import stylex from "@stylexjs/stylex";
import { useAtom } from "jotai";
import React from "react";
import { colorConfigs, mainMenu } from "src/MainMenu";
import { Btn } from "src/components/Btn";
import { colorAtom } from "src/state/uiState";

export function ColorsSubPanel(props: { showNumber?: number }) {
  //仅显示后showNumber个
  const [selectedKey, setSelectedKey] = useAtom(colorAtom);

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
  const { showNumber } = props;
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
