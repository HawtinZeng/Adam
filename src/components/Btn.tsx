import React from "react";
import stylex from "@stylexjs/stylex";
import { ReactSVG } from "react-svg";
import { selectedKeyAtomSubMenu } from "src/state/uiState";
import { useAtom } from "jotai";
import { BtnConfigs } from "src/mainMenu/menu";

export const btn = stylex.create({
  btnArea: {
    height: "46px",
    width: "46px",
    borderRadius: "50%",
    backgroundColor: {
      default: "#ffffff",
      ":hover": "#eaeaeb",
    },
    margin: "2px 0",
  },
  selectedBtnArea: {
    backgroundColor: "#4b4f52",
  },
  selectedBtnAreaGrey: {
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
  circleStyle: (hexColor: string) => ({
    height: "60%",
    width: "60%",
    borderRadius: "50%",
    backgroundColor: hexColor,
  }),
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
  direction: "vertical" | "horizontal" = "vertical",
  isSubMenu: boolean = false //or menu
) {
  const btnsMark: JSX.Element[] = [];
  const nodes: HTMLDivElement[] = [];
  const [selectedSueMenuState] = useAtom(selectedKeyAtomSubMenu);

  for (let i = 0; i < btnConfigs.length; i++) {
    btnsMark.push(
      <div
        {...stylex.props(
          btn.btnArea,
          selectedKey === i
            ? isSubMenu
              ? btn.selectedBtnAreaGrey
              : btn.selectedBtnArea
            : null,
          direction === "vertical" ? btn.verticalGap : btn.horizontalGap
        )}
        key={i}
        id="btn"
        onClick={() => {
          console.log("clicked...");
          if (selectedKey === i) {
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
          {btnConfigs[i].svg !== undefined ? (
            // feature: submenu => submenu icon
            // menu => have submenu, use submenu icon, have no submenu icon, use its icon.
            <ReactSVG
              src={
                isSubMenu
                  ? btnConfigs[i].svg
                  : btnConfigs[i].btnConfigs?.[selectedSueMenuState]?.svg ??
                    btnConfigs[i].svg
              }
              useRequestCache={true}
              beforeInjection={(svg) => {
                if (selectedKey === i && !isSubMenu) {
                  svg
                    .getElementsByTagName("path")[0]
                    .setAttribute("fill", "#ffffff");
                }
              }}
            />
          ) : (
            <div {...stylex.props(btn.circleStyle(btnConfigs[i].key))} />
          )}
          {needLeftArrow ? (
            <span
              {...stylex.props(
                btn.selectedArrow(btnConfigs[i].subMenu !== undefined)
              )}
              id="selectedArrow"
            ></span>
          ) : null}
        </div>
      </div>
    );
  }
  setBtnsRef?.(nodes);
  return btnsMark;
}
