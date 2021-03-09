import { re2peg } from './re2peg';
var peg = require("pegjs");

describe('re2peg by string', () => {
  test('independent match', () => {
    const expected = `root = (!independent_match .)* independent_match .*
independent_match = 'abc'`
    const actual = re2peg('/abc/')
    expect(actual).toEqual(expected);
  });

  test('dependent match', () => {
    const expected = `root = 'abc'`
    const actual = re2peg('/^abc$/')
    expect(actual).toEqual(expected);
  });

  test('choice', () => {
    const expected = `root = (!independent_match .)* independent_match .*
independent_match = ( 'ac' / 'abc' )`
    const actual = re2peg('/(a|ab)c/')
    expect(actual).toEqual(expected);
  });

  test('repetition - 0 to inf', () => {
    const expected = `root = (!independent_match .)* independent_match .*
independent_match = 'a'*`
    const actual = re2peg(`/a*/`)
    expect(actual).toEqual(expected);
  });

  test('repetition - 1 to inf', () => {
    const expected = `root = (!independent_match .)* independent_match .*
independent_match = 'a'+`
    const actual = re2peg('/a+/')
    expect(actual).toEqual(expected);
  });

  test('repetition - 0 or 1', () => {
    const expected = `root = (!independent_match .)* independent_match .*
independent_match = 'a'?`
    const actual = re2peg('/a?/')
    expect(actual).toEqual(expected);
  });

  test('group repetition', () => {
    const expected = `root = (!independent_match .)* independent_match .*
independent_match = ( 'abc' ) +`
    const actual = re2peg('/(abc)+/')
    expect(actual).toEqual(expected);
  });

  test('character class', () => {
    const expected = `root = (!independent_match .)* independent_match .*
independent_match = [0-9]`
    const actual = re2peg('/[0-9]/')
    expect(actual).toEqual(expected);
  });

});

describe('re2peg by peg functionality', () => {

  test('independent match 1', () => {
    const parser = peg.generate(re2peg('/abc/'))
    const actual = parser.parse('abc')
    const expected = [ [], 'abc', [] ]
    expect(actual).toEqual(expected)
  })

  test('independent match 2', () => {
    const parser = peg.generate(re2peg('/abc/'))
    const actual = parser.parse('zzzabcxxx')[1]
    const expected = 'abc'
    expect(actual).toEqual(expected)
  })

  test('independent match 3', () => {
    const parser = peg.generate(re2peg('/abc/'))
    expect(() => parser.parse('z')).toThrow()
  })

  test('dependent match 1', () => {
    const parser = peg.generate(re2peg('/^abc$/'))
    const actual = parser.parse('abc')
    const expected = 'abc'
    expect(actual).toEqual(expected)
  })

  test('dependent match 2', () => {
    const parser = peg.generate(re2peg('/^abc$/'))
    expect(() => parser.parse('zzzabczzz')).toThrow()
  })

  test('choice', () => {
    const parser = peg.generate(re2peg('/(a|ab)c/'))
    const actual = parser.parse('abc')[1]
    const expected = 'abc'
    expect(actual).toEqual(expected)
  })

})
