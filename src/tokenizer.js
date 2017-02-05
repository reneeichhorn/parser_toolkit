"use strict";

const chalk = require('chalk');

module.exports = (grammar) => {
  let tokens = [];
  let tokenReg = {};
  let wrappers = [];
  let wrapper_state = null;

  tokens.push({
    name: 'Whitespace',
    expression: /^ +$/,
  });

  tokens.push({
    name: 'Newline',
    expression: /^\n$/,
  });

  tokens.push({
    name: 'NewlineR',
    expression: /^\r$/,
  });

  tokens.push({
    name: 'Tab',
    expression: /^\t$/,
  });

  return {
    add_token(options) {
      tokens.push(options);
      tokenReg[options.name] = options;
    },

    add_wrapper(options) {
      wrappers.push(options);
    },

    find_reserved() {
      // get all non-regex tokens
      const keywords = tokens.filter(token => typeof token.expression === 'string');
      const expressingTokens = tokens.filter(token => typeof token.expression !== 'string');

      const remove = [];

      keywords.map(keyword => {
        expressingTokens.map(expressingToken => {
          if (expressingToken.expression.test(keyword.expression)) {
            if (typeof expressingToken.reserved === 'undefined') {
              expressingToken.reserved = {};
            }

            expressingToken.reserved[keyword.expression] = keyword;
            remove.push(keyword.name);
          }
        });
      });

      tokens = tokens.filter(token => remove.indexOf(token.name) == -1);

      //console.log(JSON.stringify(tokens, null, 2));
    },

    findNextToken(text, position, token) {
      if (typeof token.expression !== 'string') {
        console.error(chalk.red('Only strong expressions are supported for wrappers at the moment!'));
        console.error(token);
      }

      let subString = text.substr(position);
      let index = subString.indexOf(token.expression);
      if (index === -1) {
        return null;
      }

      return {
        end: position + index,
      };
    },

    checkWrapperState(text, target, start) {
      if (wrapper_state.foundToken) {
        let obj = {
          jump: wrapper_state.foundToken[0].end,
        };
        let removed = 0;
        for (let i = target.length - 1; i >= 0; i--) {
          if (removed == wrapper_state.possible[0].start.length) {
            break;
          }
          if (target[i].name == 'Newline' || target[i].name == 'Whitespace' || target[i].name == 'Tab') {
            target.splice(i, 1);
            continue;
          } else {
            target.splice(i, 1);
            removed++;
            continue;
          }
        };
        target.push({
          name: wrapper_state.foundToken[0].name,
          value: text.substring(wrapper_state.start + 1, wrapper_state.foundToken[0].end),
        });
        wrapper_state.foundToken = undefined;
        return obj;
      }
      return false;
    },

    checkWrapper(text, position, latestToken, target) {
      if (latestToken.name == 'Whitespace' || latestToken.name == 'Tab' || latestToken.name == 'Newline') {
        return;
      }

      // if in wrapper mode ignore everything
      if (wrapper_state.wrapper_mode == true) {
        let found = [];

        for (var i = 0; i < wrapper_state.possible[0].end.length; i++) {
          const foundToken = this.findNextToken(text, position, tokenReg[wrapper_state.possible[0].end[i]]);

          if (foundToken == null) {
            console.error(chalk.red(`Wrapper did start but did not find end: ${wrapper_state.possible[0].name}`));
            process.exit()
            return;
          }

          found.push({
            end: foundToken.end,
            name: wrapper_state.possible[0].name
          });
        }

        wrapper_state.foundToken = found;
        wrapper_state.wrapper_mode = false;
      }

      let foundEnd = false;
      let found = false;
      const newPossible = [];

      // look for
      wrapper_state.possible.map(wrapper => {
        if (wrapper.start[wrapper_state.index] == latestToken.name) {
          newPossible.push(wrapper);

          // end of beginning
          if (wrapper.start.length == wrapper_state.index + 1) {
            foundEnd = true;
          } else {
            found = true;
          }

          if (wrapper_state.index == 0) {
            wrapper_state.start = position;
          }
        }
      });

      // update wrapper state
      wrapper_state.wrapper_mode = foundEnd;
      if (found) {
        wrapper_state.possible = newPossible;
        wrapper_state.index++;
      } else {
        wrapper_state.possible = wrappers;
        wrapper_state.index = 0;
      }
    },

    tokenize(text) {
      wrapper_state = {
        index: 0,
        possible: wrappers,
      };

      let foundTokens = [];
      let possible = tokens;

      let index = 1;
      let start = 0;

      let expandMode = false;
      let expand = null;

      while (true) {
        if (index >= text.length) break;
        if (start >= text.length) break;

        const part = text.substring(start, index);
        let newPossible = [];
        let strong = false;

        const check_state = this.checkWrapperState(text, foundTokens, index);
        if (check_state !== false) {
          index = check_state.jump + 1;
          start = check_state.jump + 2;
          continue;
        }

        possible.map(rule => {
          if (typeof rule.expression === 'string') {
            const short = rule.expression.substr(0, part.length);
            if (part == rule.expression) {
              strong = true;
              newPossible.push(rule);
            }
          } else {
            if (rule.expression.test(part)) {
              newPossible.push(rule);
            }
          }
        });

        // if a strong expression matches, kick out all regular expressions
        if (strong) {
          newPossible = newPossible.filter(rule => {
            return typeof rule.expression === 'string';
          });
        }

        if (newPossible.length == 0) {
          if (expandMode) {
            let clone = Object.assign({}, expand);
            clone.value = part.substring(0, part.length - 1);

            if (typeof clone.reserved !== 'undefined') {
              if (typeof clone.reserved[clone.value] !== 'undefined') {
                clone = clone.reserved[clone.value];
              }
            }

            if (typeof clone.reserved !== 'undefined') {
              delete clone.reserved;
            }

            if (typeof clone.transform !== 'undefined') {
              clone.transform();
            }

            this.checkWrapper(text, index, clone, foundTokens);
            if (!wrapper_state.wrapper_mode) {
              foundTokens.push(clone);
              //console.log(clone);
            }

            start = index - 1;
            expandMode = false;
            continue;
          }
        } else if (newPossible.length == 1) {
          if (typeof newPossible[0].expression !== 'string') {
            expandMode = true;
            expand = newPossible[0];

            index++;
            continue;
          } else {
            // check for other matching tokens
            let others = possible.filter(rule => {
              if (rule.expression == newPossible[0].expression) {
                return false;
              }

              if (typeof rule.expression === 'string') {
                return rule.expression.startsWith(part);
              }
              return false;
            });

            if (others.length == 0) {
              // none others found
              possible = tokens;
              start = index;
              //index++;
              this.checkWrapper(text, index, newPossible[0], foundTokens);
              if (!wrapper_state.wrapper_mode) {
                foundTokens.push(newPossible[0]);
              }
            } else {
              // found other tokens that could be possible
              console.log('found multiple possible tokens', others);

              // check if others make sense
              let new_index = index + 1;

              while (true) {
                if (new_index >= text.length) break;

                const new_part = text.substring(start, new_index);
                let extending = false;
                let done = false;
                let doneObj = null;

                others.map(other => {
                  if (new_part == other.expression) {
                    done = true;
                    doneObj = other;
                  } else if (other.expression.startsWith(new_part)) {
                    extending = true;
                  }
                });

                if (!extending && !done) {
                  possible = tokens;
                  start = index;

                  foundTokens.push(newPossible[0]);
                  break;
                } else if (done) {
                  foundTokens.push(doneObj);
                  index = new_index;
                  start = new_index;
                  break;
                }
              }
            }
          }
        }

        index++;
      }

      return foundTokens;

    },
  };
};