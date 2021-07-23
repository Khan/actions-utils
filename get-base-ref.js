// @flow
/**
 * This is used to determine what the "base" branch for the current work is.
 *
 * - If the `GITHUB_BASE_REF` env variable is present, then we're running
 *   under Github Actions, and we can just use that. If this is being run
 *   locally, then it's a bit more tricky to determine the "base" for this
 *   branch.
 * - If this branch hasn't yet been pushed to github (e.g. the "upstream" is
 *   something local), then use the upstream.
 * - Otherwise, go back through the commits until we find a commit that is part
 *   of another branch, that's either master, develop, or a feature/ branch.
 *   TODO(jared): Consider using the github pull-request API (if we're online)
 *   to determine the base branch.
 */
const {execSync, spawnSync} = require('child_process');

const checkRef = (ref) => spawnSync('git', ['rev-parse', ref]).status === 0;

const validateBaseRef = (baseRef /*:string*/) => {
    // It's locally accessible!
    if (checkRef(baseRef)) {
        return baseRef;
    }
    // If it's not locally accessible, then it's probably a remote branch
    const remote = `refs/remotes/origin/${baseRef}`;
    if (checkRef(remote)) {
        return remote;
    }

    // Otherwise return null - no valid ref provided
    return null;
};

const getBaseRef = (head /*:string*/ = 'HEAD') => {
    const {GITHUB_BASE_REF} = process.env;
    if (GITHUB_BASE_REF) {
        return validateBaseRef(GITHUB_BASE_REF);
    } else {
        let upstream = execSync(
            `git rev-parse --abbrev-ref '${head}@{upstream}'`,
            {encoding: 'utf8'},
        );
        upstream = upstream.trim();

        // if upstream is local and not empty, use that.
        if (upstream && !upstream.trim().startsWith('origin/')) {
            return `refs/heads/${upstream}`;
        }
        let headRef = execSync(`git rev-parse --abbrev-ref ${head}`, {
            encoding: 'utf8',
        });
        headRef = headRef.trim();
        for (let i = 1; i < 100; i++) {
            try {
                const stdout = execSync(
                    `git branch --contains ${head}~${i} --format='%(refname)'`,
                    {encoding: 'utf8'},
                );
                let lines = stdout.split('\n').filter(Boolean);
                lines = lines.filter(
                    (line) => line !== `refs/heads/${headRef}`,
                );

                // Note (Lilli): When running our actions locally, we want to be a little more
                // aggressive in choosing a baseRef, going back to a shared commit on only `develop`,
                // `master`, feature or release branches, so that we can cover more commits. In case,
                // say, I create a bunch of experimental, first-attempt, throw-away branches that
                // share commits higher in my stack...
                for (const line of lines) {
                    if (
                        line === 'refs/heads/develop' ||
                        line === 'refs/heads/master' ||
                        line.startsWith('refs/heads/feature/') ||
                        line.startsWith('refs/heads/release/')
                    ) {
                        return line;
                    }
                }
            } catch {
                // Ran out of history, probably
                return null;
            }
        }
        // We couldn't find it
        return null;
    }
};

// Multiple action microservices might encounter this, so give them a canned message to print.
// Logging from inside this lib didn't seem to make it to the GitHub Actions console, so I'll
// just pass the string back for them to log.
const cannedGithubErrorMessage = () => {
    const {GITHUB_BASE_REF} = process.env;

    return GITHUB_BASE_REF
        ? `No valid base ref given. Found \`${GITHUB_BASE_REF}\`, but \`${GITHUB_BASE_REF}\` does not ` +
                `appear to be a valid branch. Perhaps this is coming from a GitHub pull-request that ` +
                `you reparented, and the old parent no longer exists. This is a bug on GitHub; unless ` +
                `push a new commit, the old base ref won't update. You can try solving this by: \n` +
                `\t1. Merging the new base branch into your pull-request and re-running your checks.\n` +
                `\t2. Rebasing the new base branch into your pull-request and re-running your checks.\n` +
                `\t3. Creating and pushing an empty commit (e.g., \`$ git commit -am 'Trigger checks' && git push\`).`
        : `No valid base ref given. The envar \`GITHUB_BASE_REF\` was null and no other base ref could ` +
                `be determined.`;
};

module.exports = getBaseRef;
module.exports.validateBaseRef = validateBaseRef;
module.exports.cannedGithubErrorMessage = cannedGithubErrorMessage;
