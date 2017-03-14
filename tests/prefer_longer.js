import ParserToolkit from '../src/lib';

import chai from 'chai';
const assert = chai.assert;

suite('Prefer Longer Test Suite', () => {
    const parser = new ParserToolkit();
    const plugin =parser.createPlugin({ name: 'preferLongerSuite' });

    const t1 = plugin.createToken({
        name: 'dollarToken',
        expression: '$$',
    }).get();

    const t2 = plugin.createToken({
        name: 'hashtagToken',
        expression: '##',
    }).get();

    const shorter = plugin.createGrammar({
        name: 'shorter',
        grammar: `${t1} ${t2}`,
        parsed(tokens) {
            return 'shorter';
        }
    }).get();

    const longer = plugin.createGrammar({
        name: 'longer',
        grammar: `${t1} ${t2} ${t1} ${t2}`,
        parsed(tokens) {
            return 'longer';
        }
    }).get();

    test('should parse longer grammar', () => {
        assert.equal('longer', parser.parse('\n\n$$##$$##\n\n')[0]);
    });

    test('should parse shorter grammar', () => {
        assert.equal('shorter', parser.parse('\n\n$$##\n\n')[0]);
    });
});
