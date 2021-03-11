import { re2peg } from './re2peg';
var peg = require("pegjs");

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

  test('choice 1', () => {
    const parser = peg.generate(re2peg('/(a|ab)c/'))
    const actual = parser.parse('abc')[1]
    const expected = 'abc'
    expect(actual).toEqual(expected)
  })

  test('choice 2', () => {
    const parser = peg.generate(re2peg('/(a|ab)c/'))
    const actual = parser.parse('ac')[1]
    const expected = 'ac'
    expect(actual).toEqual(expected)
  })

  test('choice 3 - prefix then distribute', () => {
    const parser = peg.generate(re2peg('/xyz(a|ab)c/'))
    const actual = parser.parse('qqxyzabcqq')[1].join('')
    const expected = 'xyzabc'
    expect(actual).toEqual(expected)
  })

  test('choice 4 - distribute group among group', () => {
    const parser = peg.generate(re2peg('/x(a|ab)y(c|cd)z/'))
    const actual = parser.parse('qqxabycdzqq')[1].flat().join('')
    const expected = 'xabycdz'
    expect(actual).toEqual(expected)
  })

  test('choice 5 - non-capture group', () => {
    const parser = peg.generate(re2peg('/x(?:a|ab)y(?:c|cd)z/'))
    const actual = parser.parse('qqxabycdzqq')[1].flat().join('')
    const expected = 'xabycdz'
    expect(actual).toEqual(expected)
  })

  test('repetition - 0 to inf', () => {
    const parser = peg.generate(re2peg(`/a*/`))
    const actual = parser.parse('aaa')[1].join('')
    const expected = 'aaa'
    expect(actual).toEqual(expected)
  })

  test('repetition - 0 or 1', () => {
    const parser = peg.generate(re2peg(`/a?/`))
    const actual = parser.parse('a')[1]
    const expected = 'a'
    expect(actual).toEqual(expected)
  })

  test('group repetition', () => {
    const parser = peg.generate(re2peg('/(abc)+/'))
    const actual = parser.parse('abcabc')[1].join('')
    const expected = 'abcabc'
    expect(actual).toEqual(expected)
  })

  test('character class', () => {
    const parser = peg.generate(re2peg('/[0-9]/'))
    const actual = parser.parse('1')[1]
    const expected = "1"
    expect(actual).toEqual(expected)
  })

})
