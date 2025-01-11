import stylex from "@stylexjs/stylex";
import { useAtom } from "jotai";
import React, { MouseEvent } from "react";
import { ReactSVG } from "react-svg";
import { BtnConfigs } from "src/MainMenu/Menu";
import { subMenuIdx } from "src/state/uiState";

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
  setSelectedKey: React.Dispatch<React.SetStateAction<number | boolean[]>>,
  selectedKey: number | boolean[],
  btnConfigs: BtnConfigs,
  setBtnsRef?: (node: HTMLDivElement[]) => void,
  setHoveredKey?: React.Dispatch<React.SetStateAction<number>>,
  needLeftArrow = false,
  direction: "vertical" | "horizontal" = "vertical",
  isSubMenu: boolean = false //or menu
) {
  const btnsMark: JSX.Element[] = [];
  const nodes: HTMLDivElement[] = [];
  const [selectedSueMenuState] = useAtom(subMenuIdx);

  function stateStyle(i: number) {
    if (Array.isArray(selectedKey)) {
      return selectedKey[i] ? btn.selectedBtnArea : null;
    } else {
      return selectedKey === i
        ? isSubMenu
          ? btn.selectedBtnAreaGrey
          : btn.selectedBtnArea
        : null;
    }
  }

  for (let i = 0; i < btnConfigs.length; i++) {
    btnsMark.push(
      <div
        {...stylex.props(
          btn.btnArea,
          stateStyle(i),
          direction === "vertical" ? btn.verticalGap : btn.horizontalGap
        )}
        key={i}
        id="btn"
        onMouseDown={(e: MouseEvent) => {
          if (Array.isArray(selectedKey)) {
            const arr = selectedKey as boolean[];
            arr[i] = !arr[i];
            setSelectedKey([...arr]);
          } else {
            if (selectedKey === i) {
              setSelectedKey(-1);
            } else {
              setSelectedKey(i);
            }
          }
          e.preventDefault();
        }} // onMouseDown 比 onClick要更加灵敏，我们点击的时候会出现mouseDown上，然后迅速移走，再mouseUp
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
                  : (selectedKey === i
                      ? btnConfigs[i].btnConfigs?.[selectedSueMenuState]?.svg
                      : undefined) ?? btnConfigs[i].svg
              }
              useRequestCache={true}
              beforeInjection={(svg) => {
                if ((selectedKey === i || selectedKey[i]) && !isSubMenu) {
                  let path = svg.getElementsByTagName("path")[0];
                  if (path === undefined) {
                    path = svg.getElementsByTagName("rect")[0];
                  }

                  if (path.getAttribute("stroke")) {
                    path.setAttribute("stroke", "#ffffff");
                  } else {
                    path.setAttribute("fill", "#ffffff");
                  }
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
