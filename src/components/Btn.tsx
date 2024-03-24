import React from "react";
import stylex from "@stylexjs/stylex";
import { ReactSVG } from "react-svg";
import { BtnConfigs } from "../MainMenu/Menu";

export const btn = stylex.create({
  btnArea: {
    height: "46px",
    width: "46px",
    borderRadius: "50%",
    backgroundColor: {
      default: "#ffffff",
      ":hover": "#eaeaeb",
    },
  },
  selectedBtnArea: {
    backgroundColor: "#4b4f52",
  },
  selectedBtnAreaBk: {
    backgroundColor: "#eaeaeb",
  },
  verticalGap: {
    marginBottom: {
      default: "10px",
      ":last-child": "0px",
    },
  },
  horizontalGap: {
    marginRight: {
      default: "10px",
      ":last-child": "0px",
    },
  },
  selectedArrow: (isShow) => ({
    position: "absolute",
    left: "-3%",
    width: "10px",
    height: "10px",
    borderTop: "5px solid transparent",
    borderBottom: "5px solid transparent",
    borderLeft: "5px solid transparent",
    borderRight: "5px solid #80868b",
    visibility: isShow ? "visible" : "hidden",
  }),
  redCircle: {
    backgroundColor: 'red',
    borderRadius: '50%',
  },
  center: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

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
          btn.btnArea,
          selectedKey === i ? (selectedStyle ==='turnBlack' ? btn.selectedBtnArea : btn.selectedBtnAreaBk) : null,
          direction === "vertical" ? btn.verticalGap : btn.horizontalGap,
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
        <div {...stylex.props(btn.center)}>
          {btnConfigs[i].svg !== undefined ? <ReactSVG
            src={btnConfigs[i].svg}
            useRequestCache={true}
            beforeInjection={(svg) => {
              if (selectedKey === i && selectedStyle === "turnBlack") {
                svg
                .getElementsByTagName("path")[0]
                .setAttribute("fill", "#ffffff");
              }
            }} /> : <div {...stylex.props(btn.redCircle)} />}
          {needLeftArrow ? (
            <span
              {...stylex.props(
                btn.selectedArrow(btnConfigs[i].subMenu !== undefined)
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
