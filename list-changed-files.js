#!/usr/bin/env node
// @flow

/**
 * A simple file that lists the files changed between the current git state
 * and the "parent" branch (see getBaseRef for what that means).
 */

// $FlowFixMe: shhhhh
require('@babel/register'); // flow-uncovered-line

const getBaseRef = require('./get-base-ref');
const gitChangedFiles = require('./git-changed-files');

const run = async () => {
    const baseRef = await getBaseRef();

    // Note (Lilli): If baseRef is null for any reason, use `master` as opposed to failing the check silently
    const files = await gitChangedFiles(baseRef ?? 'master', '.');
    files.forEach(file => console.log(file));

};

// flow-next-uncovered-line
run().catch(err => {
    console.error(err); // flow-uncovered-line
    process.exit(1);
});
