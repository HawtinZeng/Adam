export class Point {
  x: number;
  y: number;
  z?: number;
  constructor(x = 0, y = 0, z?) {
    this.x = x;
    this.y = y;
    if (z !== undefined) this.z = z;
  }
}
