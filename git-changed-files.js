// @flow
const execProm = require('./exec-prom');
const path = require('path');
const fs = require('fs');
const minimatch = require('minimatch');

const getIgnoredPatterns = (fileContents) => {
    return fileContents
        .split('\n')
        .map((line) => {
            if (line.startsWith('#')) {
                return null;
            }
            if (line.startsWith('"')) {
                throw new Error('Quoted patterns not yet supported, sorry');
            }
            if (!line.trim()) {
                return null;
            }
            const [pattern, ...attributes] = line.trim().split(' ');
            if (
                attributes.includes('binary') ||
                attributes.inludes('linguist-generated=true')
            ) {
                return pattern;
            }
            return null;
        })
        .filter(Boolean);
};

const ignoredPatternsByDirectory = {};
const isFileIgnored = (workingDirectory, file) => {
    // If it's outside of the "working directory", we ignore it
    if (!file.startsWith(workingDirectory)) {
        return true;
    }
    let dir = path.dirname(file);
    let name = path.basename(file);
    while (dir.startsWith(workingDirectory)) {
        if (!ignoredPatternsByDirectory[dir]) {
            const attributes = path.join(dir, '.gitattributes');
            if (fs.existsSync(attributes)) {
                ignoredPatternsByDirectory[dir] = getIgnoredPatterns(
                    fs.readFileSync(attributes, 'utf8'),
                );
            } else {
                ignoredPatternsByDirectory[dir] = [];
            }
        }
        for (const pattern of ignoredPatternsByDirectory[dir]) {
            if (minimatch(name, pattern)) {
                return true;
            }
        }
        name = path.join(path.basename(dir), name);
        dir = path.dirname(dir);
    }
    return false;
};

/**
 * This lists the files that have changed when compared to `base` (a git ref),
 * limited to the files that are a descendent of `cwd`.
 */
const gitChangedFiles = async (
    base /*:string*/,
    cwd /*:string*/,
) /*: Promise<Array<string>>*/ => {
    cwd = path.resolve(cwd);
    const { stdout } = await execProm(
        `git diff --name-only ${base} --relative`,
        { cwd, encoding: 'utf8', rejectOnError: true },
    );
    return (
        stdout
            .split('\n')
            .filter(Boolean)
            .map((name) => path.join(cwd, name))
            // Filter out paths that were deleted
            .filter((path) => fs.existsSync(path))
            .filter((path) => !isFileIgnored(cwd, path))
    );
};

module.exports = gitChangedFiles;
