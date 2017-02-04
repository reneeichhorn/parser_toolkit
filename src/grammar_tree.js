'use strict';

const tree = {
  children: [],
};

const registry = {};

const _insert = (rule, name, destination) => {
  const tokens = rule.split(' ');

  if (tokens.length == 1) {
    destination.push({
      token: rule,
      children: [],
      handlers: [name],
    });
    return;
  }

  let exist = null;
  destination.map((node, index) => {
    if (node.token == tokens[0]) {
      exist = index;
    }
  });

  if (exist !== null) {
    destination[exist].handlers.push(name);
    _insert(tokens.splice(1).join(' '), name, destination[exist].children);
  } else {
    const node = {
      token: tokens[0],
      children: [],
      handlers: [name],
    };

    _insert(tokens.splice(1).join(' '), name, node.children);
    destination.push(node);
  }
};

module.exports = {
  addGrammar(rule, name) {
    registry[name] = rule;
    _insert(rule, name, tree.children);
  },

  log() {
    console.log(JSON.stringify(tree, null, 2));
  },

  createTokenBuilder(tokens) {
    return {

      build() {
        const output = { name: 'PROGRAM', children: []};
        this.buildDeep(0, output.children, tree.children);
        return output;
      },

      buildDeep(index, current, currentTree, preChildren) {
        if (typeof preChildren === 'undefined') {
          preChildren = [];
        }

        if (index >= tokens.length) {
          return;
        }

        let outputIndex = index;

        let token = tokens[index].token;
        console.log(index, token);

        currentTree.map(rule => {
          if (rule.token == '...') {
            const output = { name: rule.handlers[0], children: [], tokens: [] };
            const newIndex = this.buildDeep(index, output.children, tree.children);

            const children = output.children;
            output.children = [];

            if (children.length > 0) {
              console.log('jump from', index, 'to', newIndex);
              outputIndex = this.buildDeep(newIndex, current, rule.children, children);
            }

            return;
          }

          if (rule.token == token) {
            if (rule.handlers.length == 1) {
              current.tokens.push(tokens[index]);

              let ruleTokens = registry[rule.handlers[0]].split(' ');
              let lastToken = ruleTokens[ruleTokens.length - 1];

              if (token == lastToken) {
                current.push({
                  name: rule.handlers[0],
                  children: preChildren,
                  tokens: [],
                });

                outputIndex = this.buildDeep(index + 1, current, tree.children);
                return;
              }
            }

            outputIndex = this.buildDeep(index + 1, current, rule.children);
          }
        });

        return outputIndex;
      },

    };
  },
};
