"use strict";

const Precedence = require('./precedence');

module.exports = () => {

  const helper = {};

  return {

    getHelper() {
      return helper;
    },

    // @TODO Refactor:
    // Looks way to complex and messy for what it does
    // should only handle the root and give parse function to children
    parse(programTokens, ast, grammars) {
      helper.programTokens = programTokens;

      let result = [];

      ast.children.map(child => {
        // name
        const name = child.name.replace(/#[0-9]+/, '');

        // get tokens
        console.log('22222', child);
        const tokens = programTokens.slice(child.start, child.end);
        tokens.forEach(token => {
          if (typeof token.alias !== 'undefined') {
            tokens[token.alias] = token;
          }
        });

        // get tokens of children
        let sub = [];
        child.children.map(childchild => {
          let _this = this;
          let childchildname = childchild.name.replace(/#[0-9]+/, '');

          sub.push({
            name: childchildname,
            real: childchild.realname,
            alias: childchild.alias,

            parse() {
              if (childchildname == 'holder') {
                let res = _this.parse(programTokens, {
                  name: 'child',
                  children: childchild.children,
                }, grammars);

                if (typeof childchild.precedence !== 'undefined') {
                  let precedence = new Precedence(childchild.precedence);
                  return res.map(entry => precedence.apply(entry));
                  //return res;
                }
                return res;
              }

              return _this.parse(programTokens, {
                name: 'child',
                children: [childchild],
              }, grammars);
            },

          });
        });

        // add alias to parser
        sub.forEach(s => {
          if (typeof s.alias !== 'undefined') {
            sub[s.alias] = s;
          }
        });

        // generate code
        result.push(grammars[name].parsed(tokens, sub));
      });

      return result;
    },

    update(objectTree, hooks) {

    },

    compile(objectTree, ast, grammars, meta) {
      let code = '';

      objectTree.map(child => {
        code += child.compile();
      });

      return code;
    },

  };
};
