import ParserToolkit from '../src/lib';

import chai from 'chai';
const assert = chai.assert;

suite('Alias Test Suite', () => {
    const parser = new ParserToolkit();

    const plugin = parser.createPlugin({
        name: 'TestCaseAlias',
    });
    const t = plugin.createToken({
        name: 't',
        expression: '+++',
    }).get();

    const t2 = plugin.createToken({
        name: 't2',
        expression: '---',
    }).get();

    const g = plugin.createGrammar({
        name: 'g',
        grammar: `${t}:foo`,
        parsed(tokens) {
            return tokens.foo.alias;
        }
    }).get();

    const g1 = plugin.createGrammar({
        root: false,
        name: 'g1',
        grammar: `${t}:foo`,
        parsed(tokens) {
            return tokens.foo.alias;
        }
    }).get();

    const g2 = plugin.createGrammar({
        name: 'g2',
        grammar: `${t2} ${g1}:bar`,
        parsed(tokens, children) {
            return children.bar[0].alias;
        }
    }).get();

    test('should allow alias for token', () => {
        assert.equal('foo', parser.parse('\n\n+++\n\n')[0]);
    });

    test('should allow alias for children', () => {
        assert.equal('bar', parser.parse('\n\n---+++\n\n')[0]);
    });
});
