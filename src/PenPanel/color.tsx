import { useAtom } from "jotai";
import React from "react";
import { Btn } from "src/components/Btn";
import { colorConfigs, mainMenu } from "src/MainMenu";
import { colorAtom } from "src/state/uiState";
import stylex from "@stylexjs/stylex";

export function ColorsSubPanel() {
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
