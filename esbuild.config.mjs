import esbuild from "esbuild";
import process from "process";
import builtins from 'builtin-modules'
import {sassPlugin} from 'esbuild-sass-plugin'

const banner  = `/* Obsidian jTab Community plugin: https://github.com/davfive/obsidian-jtab */`;

const prod = (process.argv[2] === 'production');

esbuild.build({
	// Have to do this separately or it'll create subfolders in build
	banner: { js: banner, css: banner },
	entryPoints: ['assets/scss/styles.scss'],
	bundle: true,
	loader: { ".scss": "css" },
	minify: prod ? true : false,
	outdir: 'build',
	plugins: [sassPlugin({type: 'css',})],
}).catch(() => process.exit(1));


esbuild.build({
	banner: {
		js: banner,
	},
	entryPoints: ['src/main.ts'],
	bundle: true,
	external: [
		'obsidian',
		'electron',
		...builtins],
	format: 'cjs',
	loader: {
		'.svg': 'text'
	},
	watch: !prod,
	target: 'es2016',
	logLevel: "info",
	minify: prod ? true : false,
	sourcemap: prod ? false : 'inline',
	treeShaking: true,
	outdir: 'build',
}).catch(() => process.exit(1));
