// @flow
const isFileIgnored = require('./is-file-ignored');

/**
 * Github actions jobs can run the following steps to get a fully accurate
 * changed files list. Otherwise, we fallback to a simple diff between the
 * current and base branch, which might give false positives if the base
 * is ahead of the current branch.
 *
 *   - name: Get All Changed Files
 *     uses: jaredly/get-changed-files@absolute
 *     id: changed
 *     with:
 *       format: 'json'
 *       absolute: true
 *
 *   - uses: allenevans/set-env@v2.0.0
 *     with:
 *       ALL_CHANGED_FILES: '${{ steps.changed.outputs.added_modified }}'
 */
const getChangedFilesFromEnv = (cwd /*:string*/) /*: ?Array<string>*/ => {
    if (process.env.ALL_CHANGED_FILES) {
        const files /*: Array<string> */ = JSON.parse(process.env.ALL_CHANGED_FILES); // flow-uncovered-line
        return files.filter(path => !isFileIgnored(cwd, path));
    }
};

module.exports = getChangedFilesFromEnv;
