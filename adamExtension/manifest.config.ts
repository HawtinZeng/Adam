import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "./package.json";
const { version } = packageJson;

// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch, label = "0"] = version
  // can only contain digits, dots, or dash
  .replace(/[^\d.-]+/g, "")
  // split into version parts
  .split(/[.-]/);

export default defineManifest(async (env) => ({
  manifest_version: 3,
  name: "adamExtension",
  short_name: "adamExtension",
  version: `${major}.${minor}.${patch}.${label}`,
  version_name: version,
  description: "Listen for window change event",
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  content_scripts: [
    {
      js: ["src/setup.ts"],
      matches: ["https://*/*"],
    },
  ],
  action: {
    default_popup: "index.html",
  },
  permissions: ["tabs", "activeTab"],
}));
