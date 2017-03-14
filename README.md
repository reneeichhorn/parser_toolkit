# Parser Toolkit
A parser toolkit written in node that simplifies parsing of custom formats
```js
npm i --save auruss/parser_toolkit
const parserToolkit = require('parser-toolkit');
```

# ToC
- [Parser Toolkit](#parser-toolkit)
  * [Motivation](#motivation)
  * [Features](#features)
  * [Example](#example)
  * [Documentation](#documentation)
  * [ToDo](#todo)

## Motivation
Parsing of custom syntax forms that you created is usually not so easy and is a mess.
Parser Toolkit simplyifies the parsing process by allowing you to define keywords, tokens and grammar rules.

## Features
- Advanced tokenizer
  * Tokens defined by a regex
  * Tokens defined by a keyword
  * Tokens defined by a special character
- Gramamatical rules that allows to parse even very complex languages for instance
  * Human readable grammatic definition
  * Optionals
  * Lists with optionals seperator
  * Precedence
  * Prefer longer grammar
- Compiler / Transpiler
  * Recursively compiles all objects

# How complex can it get?
As complex as you like. C++ is considered to be a hard language for parsers.
I accepted this challenge and created a full c++ parser using Parser Toolkit.
See https://github.com/Auruss/extended-cpp

## Example
Imagine you have following file that you want to parse.
```js
Options {
  integer = 1
  floating_point = 0.5
  string = 'abc'
}
```
Our dummy grammar defintion is:
```
IDENTIFIER EQUALS INTEGER|FLOAT|STRING
```
First thing to do is to create a new plugin that extends the parser
```js
const Plugin = parserToolkit.createPlugin({
  name: 'ConfigPlugin',
});
parserToolkit.registerPlugin(Plugin);
```
Next up is the defintion our used tokens
```js
const IDENTIFIER = Plugin.createToken({
  name: 'identifier',
  expression: /^[a-zA-Z_]+[a-zA-Z_0-9]*$/,
}).get();
const EQUALS = Plugin.createToken({
  name: 'equals',
  expression: '=',
}).get();
const OPT = Plugin.createToken({
  name: 'options',
  expression: 'Options',
}).get();
const BO = Plugin.createToken({
  name: 'options',
  expression: 'Options',
}).get();
const BE = Plugin.createToken({
  name: 'options',
  expression: 'Options',
}).get();
const INT = Plugin.createToken({
  name: 'integer',
  expression: /^[0-9]+$/,
}).get();
const FLOAT = Plugin.createToken({
  name: 'float',
  expression: /^[0-9]+\.[0-9]*$/,
}).get();
const STRING = Plugin.createToken({
  name: 'string',
  expression: /^'.*'$/,

  // lets remove ' from beginning and the end and allow some escape keys
  transform() {
      this.value = this.value
        .substr(1, this.value.length - 2)
        .replace('\\n', '\n')
        .replace('\\t', '\t');
  },
}).get();
```
The last thing todo is to finally define the grammatic rules.
```js
// this is how our object should look like in the end
class Options {
  constructor(options) {
    this.options = {};
    
    options.options.forEach(option => {
      this.options[option.key] = option.value;
    });
  }
  
  get(key) {
    return this.options[key];
  }
}
Plugin.createObject('Options', Options);

// a holder is basically a list with an filter
// this holder can 'hold' anything
const CONTENT = Plugin.createHolder({
  name: 'OptionHolder',
  filter: () => true,
}).get();

// grammar for entries
Plugin.createGrammar({
  name: 'FloatOption',
  grammar: `${IDENTIFIER}:key ${EQUALS} ${FLOAT}:value`,
  parsed(tokens) { 
    return { key: tokens.key, value: tokens:value }
  }
});
Plugin.createGrammar({
  name: 'IntOption',
  grammar: `${IDENTIFIER}:key ${EQUALS} ${INT}:value`,
  parsed(tokens) { 
    return { key: tokens.key, value: tokens:value }
  }
});
Plugin.createGrammar({
  name: 'StringOption',
  grammar: `${IDENTIFIER}:key ${EQUALS} ${STRING}:value`,
  parsed(tokens) { 
    return { key: tokens.key, value: tokens:value }
  }
});

// grammar for root element
Plugin.createGrammar({
  name: 'OptionsGrammar',
  grammar: `${OPT} ${BO} ${CONTENT} ${BC}`,
  parsed(tokens, children) {
    return Plugin.instantiateObject('Options', {
      options: children[0].parse(),
    });
  }
});
```

Now lets parse our test file:
```js
parserToolkit.parse('...')[0].get('floating_point');
// note that index 0 is our root element.
// well actually we could have multiple "Option { .. } " blocks with 
//  our current defintion :)
```

## Documentation
`parserToolkit.parse(code)`
Parses the given code and returns an object tree


`parserToolkit.compile(code)`
Parses & recursively compiles the given code


`parserToolkit.tokenize(code)`
Only tokenizes the input and returns an array of parsed tokens.


`parserToolkit.onDebugLog((msg) => console.log(msg));`
Adds a callback for debug logs


`parserToolkit.onErrorLog((msg) => console.log(msg));`
Adds a callback for error logs


*NOTE:* See examples folder to see more complex examples



## ToDo
- Unit tests!!!!
- Refactoring & beauty up the code
- More beautiful definition
- Fix namespacing
- Custom root level parent
