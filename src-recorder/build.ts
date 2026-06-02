import * as esbuild from "esbuild";

const DIR = new URL(".", import.meta.url).pathname;

await esbuild.build({
  entryPoints: [DIR + "main.ts"],
  outfile: DIR + "../src/static/recorder.js",
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
});

await esbuild.stop();
