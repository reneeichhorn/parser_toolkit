'use strict';

const EventEmitter = require('events');
const fs = require('fs');
const Sync = require('sync');
const linereader = require('readline');
const _ = require('lodash');
const grammarReg = require('./grammar')();
const tokenizer = require('./tokenizer')(grammarReg);
const compiler = require('./compiler')();
const workflow = require('./workflow');

const grammars = {};
const tokens = [];
const plugins = {};
const holders = {};

const e = new EventEmitter();

class Library {
  /*loadFromString(s) {
    const s = new stream.Readable();
    s._read = function noop() {}; // redundant? see update below
    s.push(s);
    s.push(null);
    return s;
  }*/

  logDebug(msg) {
    e.emit('logDebug', msg);
  }

  on(ev, cb) {
    e.on(ev, cb);
  }

  tokenize(code) {
    let input = code;
    tokenizer.find_reserved();

    this.logDebug('\ntokenizing! waiting..\n');

    let programTokens = tokenizer.tokenize(input);
    let filtered = programTokens.filter(token => {
      return !(token.name == 'Newline' ||
         token.name == 'Whitespace' ||
         token.name == 'Tab' ||
         token.name == 'NewlineR' );
    });

    this.logDebug(JSON.stringify(filtered, null, 2));

    return filtered;
  }

  parse(code) {
    const filtered = this.tokenize(code);
    this.logDebug(filtered);

    this.logDebug('generating ast! waiting..\n');
    let builder = grammarReg.createTokenBuilder(filtered, holders);
    let ruleTree = builder.build();
    this.logDebug(builder.getLog());
    //console.log(builder.getLog());
    this.logDebug(JSON.stringify(ruleTree, null, 2));

    this.logDebug('generate object tree! waiting..\n');
    let objectTree = compiler.parse(filtered, ruleTree, grammars);
    this.logDebug(JSON.stringify(objectTree, null, 2));

    return objectTree;
  }

  compile(code) {
    const objtree = this.parse(code);

    this.logDebug('translating code! waiting..\n');

    let transpiledCode = compiler.compile(objtree);
    return transpiledCode;
  } 

  createPlugin(options) {
    const self = this;
    this.logDebug(`Plugin '${options.name}' registered`);

    const thisObjects = {};
    const thisGrammars = {};
    const thisHolders = {};
    const thisTokens = {};
    const thisWrappers = {};

    return {
      instantiateObject(name, options) {
        const obj = new thisObjects[name](options);
        obj.type = name;

        return obj;
      },

      registerObject(name, classobject) {
        thisObjects[name] = classobject;
      },

      createGrammar(options) {
        self.logDebug(`\tGrammar '${options.name}' registered`);
        grammars[options.name] = options;

        const grammar = {
          get(name) {
            return `-G${options.name}-`;
          },
        };

        thisGrammars[options.name] = options;
        thisGrammars[options.name].obj = grammar;

        grammarReg.register(options);
        return grammar;
      },

      createHolder(options) {
        self.logDebug(`\tHolder '${options.name}' registered`);

        let obj = {
          get() {
            return `-H${options.name}-`;
          },

          extend(new_options) {
            return _.extend({}, options, new_options);
          }
        };

        holders[options.name] = options;
        thisHolders[options.name] = options;
        thisHolders[options.name].obj = obj;

        return obj;
      },

      createWrapper(options) {
        self.logDebug(`\tWrapper '${options.name}' registered`);
        
        thisWrappers[options.name] = options;
        grammarReg.registerWrapper(options);
        tokenizer.add_wrapper(options);
      },

      createToken(options) {
        self.logDebug(`\tToken '${options.name}' registered for '${options.expression}'`);

        let alreadyExists = false;
        let existing = {};
        let name = options.name;

        tokens.map(token => {
          if (token.expression == options.expression) {
            console.log(`\t\tAlready exists`);
            alreadyExists = true;
            existing = token;
            name = token.name;
          }
        });

        if (!alreadyExists) {
          tokens.push(options);
          tokenizer.add_token(options);
        }

        const token = {
          get() {
            return `${name}`;
          }
        };

        thisTokens[options.name] = options;
        thisTokens[options.name].obj = token;

        return token;
      },
    };

    plugins[name] = plugin;
    return plugin;
  };
};

Library.Workflows = workflow;

module.exports = Library;