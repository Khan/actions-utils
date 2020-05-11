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
const execProm = require('./exec-prom');

const getBaseRef = async (head /*:string*/ = 'HEAD') => {
    if (process.env.GITHUB_BASE_REF) {
        return `refs/remotes/origin/${process.env.GITHUB_BASE_REF}`;
    } else {
        let { stdout: upstream } = await execProm(
            `git rev-parse --abbrev-ref '${head}@{upstream}'`,
        );
        upstream = upstream.trim();

        // if upstream is local and not empty, use that.
        if (upstream && !upstream.trim().startsWith('origin/')) {
            return `refs/heads/${upstream}`;
        }
        let { stdout: headRef } = await execProm(
            `git rev-parse --abbrev-ref ${head}`,
        );
        headRef = headRef.trim();
        for (let i = 1; i < 100; i++) {
            const { stdout } = await execProm(
                `git branch --contains ${head}~${i} --format='%(refname)'`,
            );
            let lines = stdout.split('\n').filter(Boolean);
            lines = lines.filter((line) => line !== `refs/heads/${headRef}`);

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
        }
        // If all else fails, just use upstream
        return `${head}@{upstream}`;
    }
};

module.exports = getBaseRef;
