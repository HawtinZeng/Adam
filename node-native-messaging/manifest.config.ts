import { defineManifest } from '@crxjs/vite-plugin'
import packageJson from './package.json'
const { version } = packageJson

// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch, label = '0'] = version
  // can only contain digits, dots, or dash
  .replace(/[^\d.-]+/g, '')
  // split into version parts
  .split(/[.-]/)

export default defineManifest(async (env) => ({
  manifest_version: 3,
  name: "adam extension",
  short_name: "adam_extension",
  version: `${major}.${minor}.${patch}.${label}`,
  version_name: version,
  description: "Node.js Native Messaging host",
  content_scripts: [
    {
      js: ["src/setup.ts"],
      matches: [
        "https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns"
        // "https://*/*"
      ]
    }
  ],
  action: {
    "default_popup": "index.html"
  }
}))