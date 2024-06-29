import { useEffect, useState } from "react";
export const useKeyboard = () => {
  const [currentKeyboard, setCurrentKeyboard] = useState("");

  const assignKey = (e: KeyboardEvent) => {
    setCurrentKeyboard(e.key);
  };

  const unAssignKey = (e: KeyboardEvent) => {
    if (e.key === currentKeyboard) setCurrentKeyboard("");
  };
  useEffect(() => {
    window.addEventListener("keydown", assignKey);
    window.addEventListener("keyup", unAssignKey);
    return () => {
      window.removeEventListener("keydown", assignKey);
      window.removeEventListener("keyup", unAssignKey);
    };
  }, []);
  return [currentKeyboard, setCurrentKeyboard];
};
