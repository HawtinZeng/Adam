import { useAtom } from "jotai";
import { Btn } from "src/components/Btn";
import { BtnConfigs } from "src/MainMenu/Menu";
import { settings } from "src/state/uiState";

export function SettingsPanel(props: { btnConfigs: BtnConfigs }) {
  const { btnConfigs } = props;
  const [settingState, ssettingState] = useAtom(settings);

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
