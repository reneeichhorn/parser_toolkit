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

    const t3 = plugin.createToken({
        name: 't3',
        expression: 'xxxx',
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
            return children.bar.alias;
        }
    }).get();

    const g3 = plugin.createGrammar({
        root: false,
        name: 'g3',
        grammar: `${t3} #_${t2}:optional_#`,
        parsed(tokens, children) {
            return tokens.optional.alias;
        }
    }).get();

    const h1 = plugin.createHolder({
        name: 'h1',
        filter(f) {
            return f.name.indexOf('g3') !== -1;
        },
        maxElements: 1,
    }).get();

    const g4 = plugin.createGrammar({
        name: 'g4',
        grammar: `#_${t3}_# #_${t3}_# ${h1}:holder`,
        parsed(tokens, children) {
            return children.holder.parse();
        }
    }).get();

    test('should allow alias for token', () => {
        assert.equal('foo', parser.parse('\n\n+++\n\n')[0]);
    });

    test('should allow alias for children', () => {
        assert.equal('bar', parser.parse('\n\n---+++\n\n')[0]);
    });

    test('should allow optional alias for children', () => {
        assert.equal('optional', parser.parse('\n\nxxxxxxxx---\n\n')[0]);
    });
});
