// @flow

const getBaseRef = async (head /*:string*/ = 'HEAD') => {
    return `refs/remotes/origin/${process.env.GITHUB_BASE_REF}`;
};

module.exports = getBaseRef;
