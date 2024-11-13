const esbuild = require('esbuild');

const isDev = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourcemap: true,
  outdir: 'dist',
  format: 'cjs',
  // splitting: true, // true for esm
  minify: !isDev,
  treeShaking: true,
  external: [],
  platform: 'browser',
  external: ['./node_modules/*'], // 忽略 node_modules 中的依赖项
  target: ['esnext'],
  logLevel: 'info',
};

async function build() {
  if (isDev) {
    // Create a context for watch mode
    const context = await esbuild.context(buildOptions);
    
    // Start watching
    await context.watch();
    console.log('Watching...');
  } else {
    // Regular build
    await esbuild.build(buildOptions);
    console.log('Build complete');
  }
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});