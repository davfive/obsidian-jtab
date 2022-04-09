import { mkdirSync, readFileSync, writeFileSync } from "fs";
import * as path from "path";
import simpleGit, { CleanOptions } from 'simple-git';

const readFile = (file) => JSON.parse(readFileSync(file, "utf8"));
const writeFile = (file, json) => {
    writeFileSync(file, JSON.stringify(json, null, "\t"));
    mkdirSync(distDir, {recursive: true});
    writeFileSync(path.join(distDir, file), JSON.stringify(json, null, "\t"));
};

const files = { manifest: "manifest.json", versions: "versions.json" };
const distDir = "dist";

const manifest = readFile(files.manifest);
const targetVersion = process.env.npm_package_version;
manifest.version = targetVersion;

const versions = readFile(files.versions);
versions[targetVersion] = manifest.minAppVersion;

writeFile(files.manifest, manifest);
writeFile(files.versions, versions);

simpleGit().add(Object.values(files))
