import { useAtom } from "jotai";
import { useEffect } from "react";
import { Btn } from "src/components/Btn";
import { BtnConfigs } from "src/MainMenu/Menu";
import { settings } from "src/state/uiState";

export function SettingsPanel(props: { btnConfigs: BtnConfigs }) {
  const { btnConfigs } = props;
  const [settingState, ssettingState] = useAtom(settings);

  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settingState));
  }, [settingState]);

  return Btn(
    ssettingState,
    settingState,
    btnConfigs,
    undefined,
    undefined,
    undefined,
    "horizontal",
    false
  );
}
