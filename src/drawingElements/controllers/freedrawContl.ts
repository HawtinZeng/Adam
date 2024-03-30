import { DrawingType } from "src/coreRenderer/drawingElementsTypes";
import { BaseContl } from "src/drawingElements/controllers/baseContl";

class FreedrawCon extends BaseContl{
  type: string = DrawingType.freeDraw;
  setup() {
    const tesetVal = 1;

    return tesetVal;
  }
  clearSetup() {

  }
  onMousedown() {

  }
  onMousemove() {

  }
  onMouseup() {

  }
}
export const freedrawCon = new FreedrawCon();