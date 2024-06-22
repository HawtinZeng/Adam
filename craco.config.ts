import styleXPlugin from "@stylexjs/babel-plugin";
import path from "path";
const StylexPlugin = require("@stylexjs/webpack-plugin");
module.exports = {
  babel: {
    plugins: [
      [
        styleXPlugin,
        {
          dev: true,
          // Set this to true for snapshot testing
          // default: false
          test: false,
          // Required for CSS variable support
          unstable_moduleResolution: {
            // type: 'commonJS' | 'haste'
            // default: 'commonJS'
            type: "commonJS",
            // The absolute path to the root directory of your project
            rootDir: __dirname,
          },
        },
      ],
    ],
  },
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src/"),
      test: path.resolve(__dirname, "test/"),
      components: path.resolve(__dirname, "src/components/"),
      os: false,
      child_process: false,
      worker_threads: false,
    },
    plugins: (webpackConfig, { env, paths }) => {
      return [
        // Ensure that the stylex plugin is used before Babel
        new StylexPlugin({
          filename: "styles.[contenthash].css",
          // get webpack mode and set value for devcl
          dev: env === "development",
          // Use statically generated CSS files and not runtime injected CSS.
          // Even in development.
          runtimeInjection: true,
          // optional. default: 'x'
          classNamePrefix: "adam",
          // Required for CSS variable support
          unstable_moduleResolution: {
            // type: 'commonJS' | 'haste'
            // default: 'commonJS'
            type: "commonJS",
            // The absolute path to the root directory of your project
            rootDir: __dirname,
          },
        }),
      ];
    },
  },
  typescript: {
    compilerOptions: {
      jsx: "react-jsx",
    },
  },
  eslint: {
    enable: true /* (default value) */,
    mode: "extends",
    configure: (eslintConfig, { env, paths }) => {
      eslintConfig.rules = {
        ...eslintConfig.rules,
        "@typescript-eslint/no-use-before-define": "off",
      };
      return eslintConfig;
    },
  },
};
