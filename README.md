# Parser Toolkit
A parser toolkit written in node that simplifies parsing of custom formats

## Motivation
Parsing of custom syntax forms that you created is usually not so easy and is a mess.
Parser Toolkit simplyifies the parsing process by allowing you to define keywords, tokens and grammar rules.

## Features
- Tokens defined by a regex
- Tokens defined by a keyword
- Tokens defined by a special character
- Gramamatical rules that allows to parse even very complex languages for instance
-- Human readable grammatic definition
-- Optionals
-- Lists with optionals seperator


## Example
Imagine you have following file that you want to parse.
```
integer = 1
floating_point = 0.5
string = 'abc'
```
Our dummy grammar defintion is:
```
IDENTIFIER EQUALS INTEGER|FLOAT|STRING
```
First thing to do is to create a new plugin that extends the parser
```
const Plugin = parserToolkit.createPlugin({
  name: 'ConfigPlugin',
});
parserToolkit.registerPlugin(Plugin);
```
Next up is the defintion our used tokens
```
const IDENTIFIER = Plugin.createToken({
  name: 'identifier',
  expression: /^[a-zA-Z_]+[a-zA-Z_0-9]*$/,
});
const EQUALS = Plugin.createToken({
  name: 'equals',
  expression: '=',
});
const INT = Plugin.createToken({
  name: 'integer',
  expression: /^[0-9]+$/,
});
const FLOAT = Plugin.createToken({
  name: 'float',
  expression: /^[0-9]+\.[0-9]*$/,
});
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
});
```


## Documentation
`parserToolkit.onDebugLog((msg) => console.log(msg));`
Adds a callback for debug logs

`parserToolkit.onErrorLog((msg) => console.log(msg));`
Adds a callback for error logs


*NOTE:* See examples folder to see more complex examples



## ToDo
- Refactoring & beauty up the code
- More beautiful definition
- Fix namespacing
