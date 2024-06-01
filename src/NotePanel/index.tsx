import { TextareaAutosize as BaseTextareaAutosize } from "@mui/base/TextareaAutosize";
import { Button, styled } from "@mui/material";
import stylex from "@stylexjs/stylex";
import { useAtom, useSetAtom } from "jotai";
import React, { useRef, useState } from "react";
import Draggable from "react-draggable";
import { DomElement } from "src/CoreRenderer/basicTypes";
import { colorConfigs } from "src/MainMenu";
import { ColorsSubPanel } from "src/PenPanel/color";
import { getComplementaryColor } from "src/Utils/color";
import {
  draggableTrans,
  menuContainer,
} from "src/components/DraggableTransparent";
import { sceneAtom } from "src/state/sceneState";
import {
  disableDrawingAtom,
  noteColorAtom,
  selectedKeyAtom,
} from "src/state/uiState";

const blue = {
  100: "#DAECFF",
  200: "#b6daff",
  400: "#3399FF",
  500: "#007FFF",
  600: "#0072E5",
  900: "#003A75",
};

const grey = {
  50: "#F3F6F9",
  100: "#E5EAF2",
  200: "#DAE2ED",
  300: "#C7D0DD",
  400: "#B0B8C4",
  500: "#9DA8B7",
  600: "#6B7A90",
  700: "#434D5B",
  800: "#303740",
  900: "#1C2025",
};
const noteStyles = stylex.create({
  container: {
    width: "300px",
    minHeight: "150px",
    backgroundColor: "#ffffff",
    userSelect: "none",
  },
  head: {
    height: "55px",
    lineHeight: "55px",
    fontSize: "20px",
    display: "flex",
    justifyContent: "space-between",
  },
  body: {
    marginBottom: "10px",
  },
  textarea: {
    resize: "none",
  },
  foot: {
    height: "30px",
    lineHeight: "30px",
    textAlign: "center",
    display: "flex",
    justifyContent: "space-evenly",
    fontSize: "20px",
  },
  btn: {
    display: "inline-block",
    width: "70px",
    borderRadius: "3px",
    backgroundColor: {
      ":hover": "#eaeaeb",
    },
  },
  btnSave: {
    backgroundColor: {
      default: "#1a73e9",
      ":hover": "#4e94f2",
    },
    color: "#ffffff",
  },
});
export function NotePanel(props: {
  status?: "creating" | "sticking";
  text?: string;
  ele?: DomElement;
  color?: number;
}) {
  const { status = "creating", text = "" } = props;
  const [colorIdx, setColor] = useState(props.color ?? 5);
  const colorHex = colorConfigs[colorIdx].key;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scene, setScene] = useAtom(sceneAtom);
  const setSelectedKey = useSetAtom(selectedKeyAtom);
  const disableDrawing = useSetAtom(disableDrawingAtom);

  const customizeTextareaStyle = colorHex
    ? {
        backgroundColor: colorHex,
        color: getComplementaryColor(colorHex),
      }
    : {};
  const Textarea = styled(BaseTextareaAutosize)(
    ({ theme }) => `
    box-sizing: border-box;
    width: 100%;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    padding: 12px;
    background: ${theme.palette.mode === "dark" ? grey[900] : "#fff"};
    border: 1px solid ${theme.palette.mode === "dark" ? grey[700] : grey[200]};
    box-shadow: 0px 2px 2px ${
      theme.palette.mode === "dark" ? grey[900] : grey[50]
    };
  
    &:hover {
      border-color: ${blue[400]};
    }
    &:focus {
      outline: 0;
      border-color: ${blue[400]};
      box-shadow: 0 0 0 3px ${
        theme.palette.mode === "dark" ? blue[600] : blue[200]
      };
    }
  
    // firefox
    &:focus-visible {
      outline: 0;
    }
  `
  );
  const cancel = () => {
    setSelectedKey(-1);
  };

  const saveNote = () => {
    setSelectedKey(-1);

    scene.domElements.push({
      type: "note",
      position: { x: 0, y: 0 },
      text: textareaRef.current?.value ?? "",
      createTime: new Date(),
      color: colorIdx,
    });
    setScene({ ...scene, domElements: [...scene.domElements] });
  };

  const saveContentSticking = () => {
    if (props.ele && status === "sticking") {
      props.ele.text = textareaRef.current?.value ?? "";
      // setScene({ ...scene, domElements: [...scene.domElements] });不需要更新视图，因为textarea组件已经更新了内容
    }
  };
  console.log(`re-render: ${new Date().getTime()}`);

  return (
    <Draggable cancel="#notDraggable">
      <div
        {...stylex.props(
          noteStyles.container,
          status === "sticking"
            ? { ...menuContainer.areaBorder, ...draggableTrans.corner }
            : {}
        )}
        onMouseEnter={() => disableDrawing(true)}
        onMouseLeave={() => disableDrawing(false)}
      >
        <div {...stylex.props(noteStyles.head)}>
          &nbsp;
          {status === "sticking"
            ? props.ele!.createTime!.toLocaleString(undefined, {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "新建便签"}
          <ColorsSubPanel
            showNumber={3}
            controlledAtom={noteColorAtom}
            setColor={setColor}
            color={colorIdx}
          />
        </div>
        <div {...stylex.props(noteStyles.body)} id="notDraggable">
          <Textarea
            ref={textareaRef}
            aria-label="minimum height"
            placeholder="请输入文字"
            minRows="5"
            id="btn"
            {...stylex.props(noteStyles.textarea)}
            style={customizeTextareaStyle}
            defaultValue={text}
            onBlur={saveContentSticking}
          />
        </div>
        {status === "creating" && (
          <div {...stylex.props(noteStyles.foot)}>
            <Button variant="outlined" size="large" onClick={cancel}>
              取消
            </Button>
            <Button variant="contained" size="large" onClick={saveNote}>
              保存
            </Button>
          </div>
        )}
      </div>
    </Draggable>
  );
}
