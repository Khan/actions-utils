// @flow
const execProm = require('./exec-prom');
const path = require('path');
const fs = require('fs');
const minimatch = require('minimatch'); // flow-uncovered-line

// ok
const getIgnoredPatterns = (fileContents /*: string*/) => {
    return fileContents
        .split('\n')
        .map(line => {
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
            if (attributes.includes('binary') || attributes.includes('linguist-generated=true')) {
                return pattern;
            }
            return null;
        })
        .filter(Boolean);
};

const ignoredPatternsByDirectory /*: {[key: string]: Array<string>}*/ = {};
const isFileIgnored = (workingDirectory /*: string*/, file /*: string*/) => {
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
            // flow-next-uncovered-line
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
 * It also respects '.gitattributes', filtering out files that have been marked
 * as "binary" or "linguist-generated=true".
 */
const gitChangedFiles = async (base /*:string*/, cwd /*:string*/) /*: Promise<Array<string>>*/ => {
    cwd = path.resolve(cwd);

    // Github actions jobs can run the following steps to get a fully accurate
    // changed files list. Otherwise, we fallback to a simple diff between the
    // current and base branch, which might give false positives if the base
    // is ahead of the current branch.
    //
    //   - name: Get All Changed Files
    //     uses: jaredly/get-changed-files@absolute
    //     id: changed
    //     with:
    //       format: 'json'
    //       absolute: true
    //
    //   - uses: allenevans/set-env@v2.0.0
    //     with:
    //       ALL_CHANGED_FILES: '${{ steps.changed.outputs.added_modified }}'
    //
    if (process.env.ALL_CHANGED_FILES) {
        const files /*: Array<string> */ = JSON.parse(process.env.ALL_CHANGED_FILES); // flow-uncovered-line
        return files.filter(path => !isFileIgnored(cwd, path));
    }

    const {stdout} = await execProm(`git diff --name-only ${base} --relative`, {
        cwd,
        encoding: 'utf8',
        rejectOnError: true,
    });
    return (
        stdout
            .split('\n')
            .filter(Boolean)
            .map(name => path.join(cwd, name))
            // Filter out paths that were deleted
            .filter((path /*: string*/) => fs.existsSync(path))
            .filter((path /*: string*/) => !isFileIgnored(cwd, path))
    );
};

module.exports = gitChangedFiles;
