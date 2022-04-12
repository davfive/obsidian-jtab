import {basename} from 'path'
import {spawnSync} from 'child_process'
import { readFileSync, writeFileSync } from "fs"
import simpleGit from 'simple-git'

const readFile = f => JSON.parse(readFileSync(f, "utf8"))
const writeFile = (f, json) => writeFileSync(f, JSON.stringify(json, null, "\t"))

const commitVersion = (newVersion, commitMsg) => {
    try {
        spawnSync('npm', ['install']) // Update package-lock.json

        simpleGit()
            .add(['package.json', 'package-lock.json', 'manifest.json', 'versions.json'])
            .commit(commitMsg)
            .addTag(newVersion)
    }
    catch (e) { console.error(e) }
}

const tagExists = async newVersion => await simpleGit.tags().includes(newVersion)

const usage = msg => {
    if (msg) {
        console.error(`Error: ${msg}`)
        console.error()
    }
    const prog = process.argv.slice(0,2).map(e => basename(e)).join(' ')
    console.log(`Usage: ${prog} <major>.<minor>.<patch> [COMMIT-MESSAGE]`)
    process.exit(msg ? 1 : 0)
}

//= MAIN 
const args = process.argv.slice(2)
if (![1,2].includes(args.length)) {
    usage('Missing cmdline args')
}

const newVersion = args[0]
const commitMsg = args.length == 2 ? `${newVersion}: ${args[1]}` : newVersion

if (tagExists(newVersion)) {
    usage(`Tag '${newVersion}' already exists`)
}

const package_json = readFile('package.json')
package_json['version'] = newVersion
writeFile('package.json', package_json)

const manifest_json = readFi
le('manifest.json')
manifest_json['version'] = newVersion
writeFile('manifest.json', manifest_json)

const versions_json = readFile('versions.json')
versions_json[newVersion] = manifest_json['minAppVersion']
writeFile('versions.json', versions_json)

commitVersion(newVersion, commitMsg)

console.log(`Version ${newVersion} added successfully`)
console.log('Run the following commands to push to remote:')
console.log('  git push')
console.log(`  git push origin ${newVersion}`)