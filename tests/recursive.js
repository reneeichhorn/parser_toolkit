import ParserToolkit from '../src/lib';

import chai from 'chai';
const assert = chai.assert;

suite('Recursive Test Suite', () => {
    const parser = new ParserToolkit();

    setup(() => {
        // build example grammar
        const TOKEN1 = parser.addToken({
            name: 'token1',
            expression: 'token1',
        }).get();

        const TOKEN2 = parser.addToken({
            name: 'token2',
            expression: 'token2',
        }).get();

        const TOKEN3 = parser.addToken({
            name: 'token3',
            expression: 'token3',
        }).get();

        const TOKEN4 = parser.addToken({
            name: 'token4',
            expression: 'token4',
        }).get();

        parser.addGrammar({
            name: 'circular_child1',
            grammar: `${TOKEN1}`,
            parsed() { return { checker: 'circular_child1' }; }
        });

        parser.addGrammar({
            name: 'circular_child2',
            grammar: `${TOKEN3}`,
            parsed() { return { checker: 'circular_child2' }; }
        });

        const CIRCULAR_HOLDER = parser.addHolder({
            name: 'circular_holder',
            filter(f) {
                return true;
            },
        });

        parser.addGrammar({
            name: 'circular_root1',
            grammar: `${CIRCULAR_HOLDER} ${TOKEN2} ${CIRCULAR_HOLDER}`,
            parsed(tokens, children) {
                return {
                    checker: 'circular_root1',
                    children: [
                        children[0].parse(),
                        children[1].parse(),
                    ],
                };
            }
        });

        parser.addGrammar({
            name: 'circular_root2',
            grammar: `${CIRCULAR_HOLDER} ${TOKEN4} ${CIRCULAR_HOLDER}`,
            parsed(tokens, children) {
                return {
                    checker: 'circular_root2',
                    children: [
                        children[0].parse(),
                        children[1].parse(),
                    ],
                };
            }
        });
    });

    test('should test non-recursive #1', () => {
        const input = 'token1 token2 token3';
        const expected = {
            checker: 'circular_root1',
            children: [
                { checker: 'circular_child1' },
                { checker: 'circular_child2' },
            ],
        };

        assert.deepEqual(parser.parse(), expected);
    });

    test('should test non-recursive #2', () => {
        const input = 'token1 token4 token3';
        const expected = {
            checker: 'circular_root2',
            children: [
                { checker: 'circular_child1' },
                { checker: 'circular_child2' },
            ],
        };

        assert.deepEqual(parser.parse(), expected);
    });

    test('should test n-levels of recursions', () => {
    });
});