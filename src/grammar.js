'use strict';

const parser = require('./grammar_parser');
const TokenStateHandler = require('./token_state');
const ParserLogger = require('./parser_logger');

// @TODO REFACTOR: console.log everywhere...
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
    // @TODO REFACTOR: supposed to be an assign isn't it???!!
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
      const tokenStateManager = new TokenStateHandler();
      const logger = new ParserLogger();

      return {
        build() {
          return this.findFittingAll(0, treeArr);
        },

        getLog() {
          return logger.toString();
        },

        /**
         * Searches for grammars til token end or as soon as grammars are no longer applying
         **/
        findFittingAll(tokenIndex, grammars, max = 0) {
          const result = {
            name: 'program',
            children: [],
          };

          let n = 0;
          while (true) {
            let child = this.findFitting(tokenIndex, grammars);

            if (typeof child.end == 'undefined') break;

            result.children.push(child);
            tokenIndex = child.end;
            n++;

            if (max != 0 && n == max) break;
          }

          return result;
        },

        /**
         * Looks for the best fitting grammar
         */
        findFitting(tokenIndex, grammars) {
          const result = {
            start: tokenIndex,
            children: [],
          };

          grammars.map(grammar => {
            // if grammar is not good / therefore blocked or in processing we don't need to check it at this point.
            if (!tokenStateManager.getState(result.start, grammar.name).isGood()) {
              // recheck again for more detailed logging
              if (tokenStateManager.getState(result.start, grammar.name).isProcessing()) {
                logger.writeLine(`ignoring ${grammar.name} at ${result.start}: cause state is processing..`);
              } else {
                logger.writeLine(`ignoring ${grammar.name} at ${result.start}: cause state is blocked..`);
              }
              return;
            }

            // @TODO REFACTOR:
            // when result.end is not undefined it means the grammar was found already
            // why is a completed grammar passed here though?
            // The loop should just break in that case. Investigation needed..
            if (typeof result.end !== 'undefined') return;

            // grammar is now being processed, no need to recheck it again on a higher level
            tokenStateManager.getState(result.start, grammar.name).setProcessing();
            logger.writeLine(`${grammar.name} at ${result.start}: now processing..`);
            logger.writeLine('start checking ' + grammar.name);

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

              logger.writeLine(`${tokenPointer} '${tokens[tokenPointer].name}' '${grammar.tokens[grammarTokenPointer].replace(/:[a-zA-Z]+/, '')}'`);

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
                logger.nextLevel();

                // removes -G from the beginning, and cuts of :alias
                let grammarName = grammar.tokens[grammarTokenPointer]
                    .replace(/:[a-zA-Z0-9]+/, '');
                grammarName = grammarName.substr(2, grammarName.length - 3);

                let found = this.findFitting(tokenPointer,
                  registryArr.filter(g => g.name.startsWith(grammarName)));
                logger.previousLevel();

                // if alias available save it for later
                if (grammar.tokens[grammarTokenPointer].indexOf(':') !== -1) {
                  let regex = /:[a-zA-Z]+/;
                  found.alias = regex.exec(grammar.tokens[grammarTokenPointer])[0].substr(1);
                }

                if (typeof found.end !== 'undefined') {
                  tokenPointer = found.end - 1;
                  result.children.push(found);
                } else {
                  isCorrect = false;
                  cause = 'sub gramma not found, ' + JSON.stringify(found);
                }
              } else if (grammar.tokens[grammarTokenPointer].startsWith('-H')) {
                // parse out -H  and :alias to get actual holder name
                let realname = grammar.tokens[grammarTokenPointer]
                    .replace(/:[a-zA-Z0-9]+/, '');
                realname = realname.substr(2, realname.length - 3);

                // ask holder for a list of available grammars
                let targetGrammars = treeArr.concat(registryArr).filter(holders[realname].filter);

                //logger.writeLine('go deeper (holder)');
                logger.nextLevel();

                let found = this.findFittingAll(
                    tokenPointer,
                    targetGrammars,
                    typeof holders[realname].maxElements !== 'undefined' ? holders[realname].maxElements : 0);

                logger.previousLevel();
                //logger.writeLine('go higher (holder)');

                if (found.children.length > 0) {
                  found.name = 'holder';
                  found.realname = realname;
                  found.precedence = holders[realname].precedence;

                  // if alias available save it for later
                  if (grammar.tokens[grammarTokenPointer].indexOf(':') !== -1) {
                    let regex = /:[a-zA-Z]+/;
                    found.alias = regex.exec(grammar.tokens[grammarTokenPointer])[0].substr(1);
                  }

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
              // reset state -> grammar is once again fine
              tokenStateManager.getState(result.start, grammar.name).reset();
              logger.writeLine(`${grammar.name} at ${result.start}: now good again..`);

              result.end = tokenPointer;
              result.name = grammar.name;
            } else {
              result.children.pop();

              // mark this grammar as blocked since we know it doesn't fit
              // makes it easier to skip it later and avoid duplicated checks
              tokenStateManager.getState(result.start, grammar.name).setBlocked();
              logger.writeLine(`${grammar.name} at ${result.start}: now blocked..`);

              logger.writeLine(`was incorrect: ${grammar.name} cause: ${cause}`);
            }
          });

          return result;
        },

      };
    },
  };
};
