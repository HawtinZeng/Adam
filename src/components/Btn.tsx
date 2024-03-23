import React from "react";
import stylex from "@stylexjs/stylex";
import { ReactSVG } from "react-svg";
import { BtnConfigs, menuStyles } from "./Menu";

export function Btn(
  setSelectedKey: React.Dispatch<React.SetStateAction<number>>,
  selectedKey: number,
  btnConfigs: BtnConfigs,
  setBtnsRef?: (node: HTMLDivElement[]) => void,
  setHoveredKey?: React.Dispatch<React.SetStateAction<number>>,
  needLeftArrow = false,
  direction: 'vertical' | 'horizontal' = 'vertical'
) {
  const btnsMark: JSX.Element[] = [];
  const nodes: HTMLDivElement[] = [];
  for (let i = 0; i < btnConfigs.length; i++) {
    btnsMark.push(
      <div
        {...stylex.props(
          menuStyles.btnArea,
          selectedKey === i ? menuStyles.selectedBtnArea : null,
          direction === "vertical" ? menuStyles.verticalGap : menuStyles.horizontalGap,
        )}
        key={i}
        id="btn"
        onClick={() => {
          setSelectedKey(i);
        }}
        onMouseEnter={() => {
          setHoveredKey && setHoveredKey(i);
        }}
        ref={(node) => node && nodes && nodes.push(node)}
      >
        <div {...stylex.props(menuStyles.center)}>
          <ReactSVG
            src={btnConfigs[i].svg}
            useRequestCache={true}
            beforeInjection={(svg) => {
              if (selectedKey === i) {
                svg
                  .getElementsByTagName("path")[0]
                  .setAttribute("fill", "#ffffff");
              }
            }} />
          {needLeftArrow ? (
            <span
              {...stylex.props(
                menuStyles.selectedArrow(btnConfigs[i].subMenu !== undefined)
              )}
              id="selectedArrow"
            ></span>) : null}
        </div>
      </div>
    );
  }
  setBtnsRef?.(nodes);
  return btnsMark;
}
