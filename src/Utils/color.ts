export function getComplementaryColor(hex) {
  // Remove # symbol if present
  const color = hex.startsWith("#") ? hex.slice(1) : hex;

  // Convert hex to RGB values (assumes 6 digit hex)
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Calculate complementary color using bitwise XOR with white
  const complementaryR = (0xff - r).toString(16).padStart(2, "0");
  const complementaryG = (0xff - g).toString(16).padStart(2, "0");
  const complementaryB = (0xff - b).toString(16).padStart(2, "0");

  // Combine back into hex code
  return `#${complementaryR}${complementaryG}${complementaryB}`;
}
