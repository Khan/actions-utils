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
    it('should accempt a local branch', () => {
        expect(validateBaseRef('master')).toEqual('master');
    });
});
