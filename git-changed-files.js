// @flow
const execProm = require('./exec-prom');
const path = require('path');
const fs = require('fs');
const isFileIgnored = require('./is-file-ignored');
const getChangedFilesFromEnv = require('./get-changed-files-from-env');

/**
 * This lists the files that have changed when compared to `base` (a git ref),
 * limited to the files that are a descendent of `cwd`.
 * It also respects '.gitattributes', filtering out files that have been marked
 * as "binary" or "linguist-generated=true".
 */
const gitChangedFiles = async (base /*:string*/, cwd /*:string*/) /*: Promise<Array<string>>*/ => {
    cwd = path.resolve(cwd);

    const fromEnv = getChangedFilesFromEnv(cwd);
    if (fromEnv) {
        return fromEnv;
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
