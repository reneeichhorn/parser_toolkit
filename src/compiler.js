"use strict";

module.exports = () => {

  const helper = {};

  return {

    getHelper() {
      return helper;
    },

    parse(programTokens, ast, grammars) {
      helper.programTokens = programTokens;

      let result = [];

      ast.children.map(child => {
        // name
        const name = child.name.replace(/#[0-9]+/, '');

        // get tokens
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

            parse() {
              if (childchildname == 'holder') {
                return _this.parse(programTokens, {
                  name: 'child',
                  children: childchild.children,
                }, grammars);
              }

              return _this.parse(programTokens, {
                name: 'child',
                children: [childchild],
              }, grammars);
            },

          });
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
