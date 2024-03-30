export type Point = {
  x: number;
  y: number;
}
export type Degree = number;
export type DrawingElement = {
  type: string;
  points: Point[];
  id: string;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: "solid" | "dashed";
  fillStyle: "solid" | "hachuo" | "cross-hatch";
  opacity: number;
  
  belongedFrame: string;
  belongedGroup: string;
  
  status: 'locked' | 'notLocked';

  isDeleted: boolean;

  position: Point;
  rotation: Degree;
}
export type FrameData = {
  width: number;
  height: number;
  position: Point;

  status: 'locked' | 'notLocked';

  isDeleted: boolean;
}

export type SceneOptions = {
  backgroundColor?: string
  scale: number;
}
export type Bounds = [number, number, number, number] // [minX, minY, maxX, maxY];