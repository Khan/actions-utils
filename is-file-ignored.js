// @flow
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

module.exports = isFileIgnored;
