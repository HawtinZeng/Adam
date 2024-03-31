import { atom } from "jotai";
import { atomEffect } from "jotai-effect";
import { menuConfigs } from "src/mainMenu";
export const selectedKeyAtom = atom(-1);
export const selectedKeyAtomSueMenu = atom(-1);

export const selectedKeyEffectAtom = atomEffect((get, set) => {
  // runs on mount or whenever someAtom changes
  const value = get(selectedKeyAtom);
});

export const selectedKeyEffectAtomSubMenu = atomEffect((get, set) => {
  // runs on mount or whenever someAtom changes
  const value = get(selectedKeyAtomSueMenu);
  const controller =
    menuConfigs[get(selectedKeyAtom)]?.btnConfigs?.[value]?.controller;
  if (controller) {
    controller.setup();
  }
});
