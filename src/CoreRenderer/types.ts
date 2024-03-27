type Point = {
  x: number;
  y: number;
}
type Degree = number;
type DrawingElement = {
  type: string;
  points: Point[];

  strokeColor: string;
  strokeWidth: number;
  strokeStyle: "solid" | "dashed";
  fillStyle: "solid" | "hachuo" | "cross-hatch";
  opacity: number;
  
  belongedFrame: string;
  belongedGroup: string;
  
  isDeleted: boolean;

  position: Point;
  rotation: Degree;
}
type FrameData = {

}

type SceneOptions = {
  backgroundColor?: string
  scale: number;
}
type SceneData = {
  elements: DrawingElement[];
  frames: FrameData[];
  options: SceneOptions;
}