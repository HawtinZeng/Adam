import { useEffect, useState } from "react";
export const useKeyboard = (): [string, string, () => void] => {
  const [currentKeyboard, setCurrentKeyboard] = useState("");
  const [lastKey, setLastKey] = useState("");
  // press one keybaord key
  const assignKey = (e: KeyboardEvent) => {
    setCurrentKeyboard(e.key);
  };

  const unAssignKey = (e: KeyboardEvent) => {
    setLastKey(currentKeyboard);
    setCurrentKeyboard("");
  };

  const clearLastKey = () => {
    setLastKey("");
  };
  useEffect(() => {
    window.addEventListener("keydown", assignKey);
    window.addEventListener("keyup", unAssignKey);
    return () => {
      window.removeEventListener("keydown", assignKey);
      window.removeEventListener("keyup", unAssignKey);
    };
  }, [unAssignKey, assignKey, currentKeyboard]);
  return [currentKeyboard, lastKey, clearLastKey];
};
