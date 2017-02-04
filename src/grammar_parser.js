'use strict';

const nextPowerOfTwo = x => Math.ceil(Math.log(x) / Math.log(2));

const getGrammarPossibilities = grammar => {
  const regex = /#_[a-zA-Z\s\-]*_#/gi;
  const optionals = [];
  const result = [];

  while (true) {
    const r = regex.exec(grammar)
    if (r == null) {
      break;
    }

    optionals.push(r[0]);
  }

  const bits = Math.pow(2, nextPowerOfTwo(optionals.length));
  const possibilities = Math.pow(2, bits);

  for (var i = 0; i < possibilities; i++) {
    const set = [];

    for (var j = 0; j < optionals.length; j++) {
      const mask = 1 << j;
      set.push(!!(i & mask));
    }

    let new_grammar = grammar;
    for (var j = 0; j < set.length; j++) {
      if (set[j]) {
        new_grammar = new_grammar.replace(optionals[j], '');
      }
    }
    result.push(new_grammar.replace(/[#_]+/g, ''));
  }
  return result;
};

module.exports = {
  getAll: getGrammarPossibilities,
}