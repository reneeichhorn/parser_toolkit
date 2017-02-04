'use strict';

const parser = require('./grammar_parser');
const chalk = require('chalk');

module.exports = () => {

  const tree = {
    type: 'program',
    handlers: {},
  };
  const treeArr = [];

  const registry = {};
  const registryArr = [];
  const wrappers = [];

  const _insert = (rule, name, destination) => {
    const tokens = rule.split(/\s+/);

    if (tokens.length == 1) {
      destination[tokens[0]] = [{
        type: 'grammar',
        name: name,
        isEnd: true,
        handlers: {},
      }];
      return;
    }

    let exist = null;
    exist == typeof destination[tokens[0]] !== 'undefined';

    if (exist !== null) {
      //destination[exist].handlers[rule] = (name);
      _insert(tokens.splice(1).join(' '), name, destination[exist].handlers);
    } else {
      const node = {
        type: 'grammar',
        name: name,
        isEnd: false,
        token: tokens[0],
        handlers: {},
      };

      _insert(tokens.splice(1).join(' '), name, node.handlers);

      if (typeof destination[tokens[0]] === 'undefined') {
        destination[tokens[0]] = [];
      }

      destination[tokens[0]].push(node);
    }
  };

  const parseGrammarDefinition = options => {
    let target = tree.handlers;
    let targetArr = treeArr;
    if (typeof options.root !== 'undefined' && !options.root) {
      const sub = {
        type: 'grammar',
        handlers: {},
      };
      target = sub.handlers;
      targetArr = registryArr;

      registry[options.name] = sub;
    }

    if (options.grammar.indexOf('#_') == -1) {
      targetArr.push({
        name: options.name,
        tokens: options.grammar
          .split(' ')
          .filter(obj => obj != '\n' && obj != '')
          .map(obj => obj.replace(/\n/g, '')),
      });
      _insert(options.grammar, options.name, target);
      return;
    }

    const possibilities = parser.getAll(options.grammar);

    for (var i = 0; i < possibilities.length; i++) {
      targetArr.push({
        name: options.name + '#' + i,
        tokens: possibilities[i].split(' ')
          .filter(obj => obj != '\n' && obj != '')
          .map(obj => obj.replace(/\n/g, '')),
      });
      _insert(possibilities[i], options.name + '#' + i, target);
    }
  };

  return {
    registerWrapper(options) {
      wrappers.push(options);
    },
    register(options) {
      parseGrammarDefinition(options);
    },
    print() {
      /*console.log('Tree:');
       console.log(JSON.stringify(tree, null, 2));
       console.log('\nRegistry:');
       console.log(JSON.stringify(registry, null, 2));*/

      console.log('TreeArr:');
      console.log(JSON.stringify(treeArr, null, 2));
      console.log('\nRegistryArr:');
      console.log(JSON.stringify(registryArr, null, 2));
    },
    createTokenBuilder(tokens, holders) {
      return {

        build() {
          return this.findFittingAll(0, treeArr);
        },

        findFittingAll(tokenIndex, grammars) {
          const result = {
            name: 'program',
            children: [],
          };

          while (true) {
            let child = this.findFitting(tokenIndex, grammars);

            if (typeof child.end == 'undefined') break;

            result.children.push(child);
            tokenIndex = child.end;
          }

          return result;
        },

        findFitting(tokenIndex, grammars) {
          const result = {
            start: tokenIndex,
            children: [],
          };

          grammars.map(grammar => {
            if (typeof result.end !== 'undefined') return;

            console.log(chalk.red('start checking', grammar.name));

            let grammarTokenPointer = 0;
            let tokenPointer = tokenIndex;

            let isCorrect = true;
            let cause = '';

            while (true) {
              if ((tokenPointer) >= tokens.length) {
                if (result.start == tokenPointer) {
                  isCorrect = false;
                  cause = 'End of stream';
                }
                //isCorrect = false;
                //cause = 'Token end reached';
                break;
              } else if (grammarTokenPointer >= grammar.tokens.length) {
                //isCorrect = false;
                //cause = 'Grammar end reached';
                break;
              }

              console.log(tokenPointer, tokens[tokenPointer].name, grammar.tokens[grammarTokenPointer].replace(/:[a-zA-Z]+/, ''));

              if (grammar.tokens[grammarTokenPointer] == '-SELF-') {
                let name = grammar.name.replace(/#[0-9]+/, '');
                grammar.tokens[grammarTokenPointer] = `-G${name}`;
              }

              if (grammar.tokens[grammarTokenPointer].replace(/:[a-zA-Z0-9]+/, '') == tokens[tokenPointer].name) {
                if (grammar.tokens[grammarTokenPointer].indexOf(':') !== -1) {
                  let regex = /:[a-zA-Z]+/;
                  tokens[tokenPointer].alias = regex.exec(grammar.tokens[grammarTokenPointer])[0].substr(1);
                }
              } else if (grammar.tokens[grammarTokenPointer].startsWith('-G')) {
                console.log('go deeper');
                let grammarName = grammar.tokens[grammarTokenPointer].substr(2, grammar.tokens[grammarTokenPointer].length - 3);
                let found = this.findFitting(tokenPointer,
                  registryArr.filter(g => g.name.startsWith(grammarName)));
                console.log('go higher');

                if (typeof found.end !== 'undefined') {
                  tokenPointer = found.end - 1;
                  result.children.push(found);
                } else {
                  isCorrect = false;
                  cause = 'sub gramma not found, ' + JSON.stringify(found);
                }
              } else if (grammar.tokens[grammarTokenPointer].startsWith('-H')) {
                let realname = grammar.tokens[grammarTokenPointer].substr(2, grammar.tokens[grammarTokenPointer].length - 3);
                let targetGrammars = treeArr.concat(registryArr).filter(holders[realname].filter);
                console.log('go deeper (holder)');
                let found = this.findFittingAll(tokenPointer, targetGrammars);
                console.log('go higher (holder)');

                if (found.children.length > 0) {
                  found.name = 'holder';
                  found.realname = realname;

                  result.children.push(found);
                  tokenPointer = found.children[found.children.length - 1].end - 1;
                } else {
                  isCorrect = false;
                  cause = 'holder filter did not apply';
                }
              } else {
                isCorrect = false;
                cause = 'unexpected token \'' + tokens[tokenPointer].name + '\'';
              }

              tokenPointer++;
              grammarTokenPointer++;

              if (!isCorrect) {
                break;
              }
            }

            if (isCorrect) {
              result.end = tokenPointer;
              result.name = grammar.name;
            } else {
              result.children.pop();
              console.log(chalk.red('was incorrect', grammar.name, 'cause: ', cause));
            }
          });

          return result;
        },

      };
    },
  };
};