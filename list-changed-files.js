#!/usr/bin/env node
// @flow

/**
 * A simple file that lists the files changed between the current git state
 * and the "parent" branch (see getBaseRef for what that means).
 */

// $FlowFixMe: shhhhh
require('@babel/register'); // flow-uncovered-line

const getBaseRef = require('./lib/get-base-ref');
const gitChangedFiles = require('./lib/git-changed-files');

const run = async () => {
    const files = await gitChangedFiles(await getBaseRef(), '.');
    files.forEach(file => console.log(file));
};

// flow-next-uncovered-line
run().catch(err => {
    console.error(err); // flow-uncovered-line
    process.exit(1);
});
