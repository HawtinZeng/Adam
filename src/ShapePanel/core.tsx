import { useAtom } from "jotai";
import { BtnConfigs } from "src/MainMenu/Menu";
import { Btn } from "src/components/Btn";
import { selectedKeyAtomSubMenu } from "src/state/uiState";

export function ShapePanel(props: { btnConfigs: BtnConfigs }) {
  const { btnConfigs } = props;

  const [selectedKey, setSelectedKey] = useAtom(selectedKeyAtomSubMenu);

  return Btn(
    setSelectedKey,
    selectedKey,
    btnConfigs,
    undefined,
    undefined,
    undefined,
    "horizontal",
    true
  );
}
