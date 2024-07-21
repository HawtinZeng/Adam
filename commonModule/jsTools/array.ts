// in-place deleting
export function deleteBasedOnIdx(target: any[], indices: number[]) {
  indices.forEach((i) => {
    target[i] = target[i + 1];
  });
}
