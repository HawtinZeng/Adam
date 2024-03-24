import React from "react";
import stylex from "@stylexjs/stylex";
import { ReactSVG } from "react-svg";
import { BtnConfigs, menuStyles } from "../MainMenu/Menu";

export function Btn(
  setSelectedKey: React.Dispatch<React.SetStateAction<number>>,
  selectedKey: number,
  btnConfigs: BtnConfigs,
  setBtnsRef?: (node: HTMLDivElement[]) => void,
  setHoveredKey?: React.Dispatch<React.SetStateAction<number>>,
  needLeftArrow = false,
  direction: 'vertical' | 'horizontal' = 'vertical',
  selectedStyle: 'turnBlack' | 'trunGrey' = 'turnBlack',
) {
  const btnsMark: JSX.Element[] = [];
  const nodes: HTMLDivElement[] = [];
  for (let i = 0; i < btnConfigs.length; i++) {
    btnsMark.push(
      <div
        {...stylex.props(
          menuStyles.btnArea,
          selectedKey === i ? (selectedStyle ==='turnBlack' ? menuStyles.selectedBtnArea : menuStyles.selectedBtnAreaBk) : null,
          direction === "vertical" ? menuStyles.verticalGap : menuStyles.horizontalGap,
        )}
        key={i}
        id="btn"
        onClick={() => {
          if (selectedKey === i){
            setSelectedKey(-1);
          } else {
            setSelectedKey(i);
          }
        }}
        onMouseEnter={() => {
          setHoveredKey && setHoveredKey(i);
        }}
        ref={(node) => node && nodes && nodes.push(node)}
      >
        <div {...stylex.props(menuStyles.center)}>
          {btnConfigs[i].svg !== undefined ? <ReactSVG
            src={btnConfigs[i].svg}
            useRequestCache={true}
            beforeInjection={(svg) => {
              if (selectedKey === i && selectedStyle === "turnBlack") {
                svg
                .getElementsByTagName("path")[0]
                .setAttribute("fill", "#ffffff");
              }
            }} /> : <div {...stylex.props(menuStyles.redCircle)} />}
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
