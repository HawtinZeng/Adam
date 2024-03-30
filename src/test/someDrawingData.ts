import { getBoundsFromPoints } from "src/common/utils";
import { SceneData } from "src/coreRenderer/basicTypes";
import { FreeDrawingType } from "src/coreRenderer/drawingElementsTypes";
import { testedPoints } from "src/test/points";

const boundingMinPt = getBoundsFromPoints(testedPoints.map(pt => {
  return {x: pt[0], y: pt[1]}
}))[0];
// take the drawn points rotation as zero
const relativeTestedPoints = testedPoints.map(pt => {
  return {x: pt[0] - boundingMinPt.x, y: pt[1] - boundingMinPt.y};
})
export const defaultScene: SceneData = {
  elements: [ {
    type: FreeDrawingType.freeDraw,
    points: relativeTestedPoints,
    strokeColor: "red",
    strokeWidth: 40,
    strokeStyle: "solid",
    fillStyle: "solid",
    opacity: 40,
    
    belongedFrame: 'defaultFrameId',
    belongedGroup: 'defaultGrp',
    
    status: 'notLocked',
    isDeleted: false,

    position: {x: boundingMinPt.x, y: boundingMinPt.y},
    rotation: 0,
  },{
    type: FreeDrawingType.freeDraw,
    points: relativeTestedPoints,
    strokeColor: "#ffffff",
    strokeWidth: 20,
    strokeStyle: "solid",
    fillStyle: "solid",
    opacity: 40,
    
    belongedFrame: 'defaultFrameId',
    belongedGroup: 'defaultGrp',
    
    status: 'notLocked',
    isDeleted: false,

    position: {x: boundingMinPt.x, y: boundingMinPt.y},
    rotation: 0,
  }
  ],
  frames: [
    {
      width: 100,
      height: 100,
      position: {x: 0, y: 0},
    
      status: 'locked',
      isDeleted: false,
    }
  ],
  options: {
    backgroundColor: "#ffffff",
    scale: 1,
  },
}