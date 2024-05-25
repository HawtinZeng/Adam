import { TypedArray } from "src/CoreRenderer/utilsTypes";

export function sumArray(arr: TypedArray, stride: number) {
  let sum = 0,
    length = arr.length,
    half = Math.floor(length / 2);
  let i: number = 0;
  for (i = 0; i < half; i++) {
    if ((i + 1) % stride === 0) {
      sum += arr[i] + arr[length - i + stride - 2];
    }
  }

  if (length % 2) {
    sum += arr[half];
  }
  return sum;
}
