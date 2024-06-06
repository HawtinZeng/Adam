export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

export type TransformHandleDirection =
  | "n"
  | "s"
  | "w"
  | "e"
  | "nw"
  | "ne"
  | "sw"
  | "se";

export type TransformHandleType = TransformHandleDirection | "rotation";
export type Bounds = readonly [
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
];
export type TransformHandle = Bounds;
export type TransformHandles = Partial<{
  [T in TransformHandleType]: TransformHandle;
}>;
