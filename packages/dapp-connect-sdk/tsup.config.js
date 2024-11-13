import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ["src/index.ts"],
  // dts: true, // ts 代码不严格，存在 error 时无法使用
  splitting: true,
  sourcemap: true,
  clean: true,
  format: ["esm", "cjs"],
  treeshake: true,
  legacyOutput: true,
  minify: false,
  bundle: true,
  external: [], // 将 node_modules 包含在打包中
  noExternal: [/(.*)/],
});
