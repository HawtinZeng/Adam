import { useEffect, useState } from "react";
export const useKeyboard = () => {
  const [currentKeyboard, setCurrentKeyboard] = useState("");
  // press one keybaord key
  const assignKey = (e: KeyboardEvent) => {
    setCurrentKeyboard(e.key);
  };

  const unAssignKey = (e: KeyboardEvent) => {
    setCurrentKeyboard("");
  };
  // const log = () => console.log(currentKeyboard);
  useEffect(() => {
    window.addEventListener("keydown", assignKey);
    window.addEventListener("keyup", unAssignKey);
    // window.addEventListener("mousemove", log);
    return () => {
      window.removeEventListener("keydown", assignKey);
      window.removeEventListener("keyup", unAssignKey);
      // window.removeEventListener("mousemove", log);
    };
  }, [unAssignKey, assignKey, currentKeyboard]);
  return [currentKeyboard, setCurrentKeyboard];
};
