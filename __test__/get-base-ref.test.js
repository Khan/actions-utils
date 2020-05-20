// @-flow

const { validateBaseRef } = require('../get-base-ref');

describe('validateBaseRef', () => {
    it('should accept HEAD', () => {
        expect(validateBaseRef('HEAD')).toEqual('HEAD');
    });
    it('should translate a remote branch', () => {
        expect(validateBaseRef('an-example-remote-branch')).toEqual(
            `refs/remotes/origin/an-example-remote-branch`,
        );
    });

    // When running on github, use what's in here, otherwise it was failing as it was
    // seeing `master` as a remote branch,
    const { GITHUB_BASE_REF } = process.env;
    if (GITHUB_BASE_REF) {
        it('should accept a local branch', () => {
            expect(validateBaseRef(GITHUB_BASE_REF)).toEqual(GITHUB_BASE_REF);
        });
    } else {
        it('should accept a local branch', () => {
            expect(validateBaseRef('master')).toEqual('master');
        });
    }
});
