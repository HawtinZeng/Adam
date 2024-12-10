const styleXPlugin = require("@stylexjs/babel-plugin");
const path = require("path");
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
    configure: (webpackConfig, { env, paths }) => {
      // Find the index of the ModuleScopePlugin
      // const scopePluginIndex = webpackConfig.resolve.plugins.findIndex(
      //   (plugin) =>
      //     plugin.constructor && plugin.constructor.name === "ModuleScopePlugin"
      // );

      // // Remove the ModuleScopePlugin to allow resolving browser-compatible modules
      // if (scopePluginIndex !== -1) {
      //   webpackConfig.resolve.plugins.splice(scopePluginIndex, 1);
      // }

      // Configure fallback for specific modules (replace with your needs)
      webpackConfig.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      };

      return webpackConfig;
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
  devServer: {
    static: {
      directory: path.join(__dirname, "public"),
    },
    compress: true,
    port: 9000,
    client: {
      overlay: false,
    },
  },
};
