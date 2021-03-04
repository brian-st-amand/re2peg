import { RegExpParser, BaseRegExpVisitor } from 'regexp-to-ast'
import cloneDeep from 'clone-deep'

class MyRegExpVisitor extends BaseRegExpVisitor {
  visitPattern(node) {
    console.log('Pattern', node)
    return node
  }
}

  export const re2peg = (re) => {
    const regexpParser = new RegExpParser()
    const regExpAst = regexpParser.pattern(re)
    const myVisitor = new MyRegExpVisitor()
    const pattern = myVisitor.visitPattern(regExpAst)

    // an alternative that begins/ends with anchors it's a dependent match, otherwise it's an independent match
    // this is a special case
    // an pattern that DOES NOT begin/end with anchors is an independent match
    // and needs to be wrapped appropriately

    // the first disjunction node's value will contain one or more alternatives,
    // which need to be flattened. If the first alternative is start anchor,
    // then we don't add the !ind clause at start of peg. If the last
    // alternative is end anchor, then we don't add !ind clause at end of peg.
    // If both are missing, it's an independent match

    // an alternative that begins/ends with anchors is a dependent match
    // an alternative that DOES NOT begin/end with anchors is an independent match
    // in regex:
    //   ^ can either be start of input or AFTER \n (without consuming anything)
    //   $ can either be end of input or BEFORE \n (without consuming anything)
    // a dependent match where the anchors represent start/end of input (rather than newline) translates fairly directly 
    // e.g., /^abc$/ -> 'abc'
    // converting an independenent match to a peg requires explicitly mentioning
    // the delimiters, which in regex are implied to be anything other than the
    // match itself. PEGs make this explicit
    // 
    //  Since pegs are multiline by default, $ needs to be converted to either match the end of the input OR a newline
    //   which really just means putting \n? at the end of the root rule
    // ^ becomes \n?
    // $ becomes \n?
    // LACK of ^ at start of input becomes a root delimiter root = (!ind_match .) rest (!ind_match .) 
  
    const arrOfAlternatives = pattern.value.value

    const flat = arrOfAlternatives.reduce((acc, curr) => {
      return [ ...acc, curr ]
    },[])
    
    const rootRuleName = 'root'
    let out = `${rootRuleName} = `
    const firstType = flat[0].value[0].type
    const lastType = flat[flat.length - 1].value[flat[flat.length - 1].value.length - 1].type

    const hasIndependentMatch = !(firstType === 'StartAnchor' && lastType === 'EndAnchor')

    const independentMatchRuleName = 'independent_match'

    if (firstType === 'StartAnchor') {
      arrOfAlternatives[0].value[0].type = 'StartAnchorDependentMatch'
    } else {
      // add ind match stuff at front of root rule
      out += `(!${independentMatchRuleName} .)*`
      // arrOfAlternatives[0].value[0].type = 'StartAnchorIndependentMatch'
    }

    if (hasIndependentMatch) out += ` ${independentMatchRuleName} `

    if (lastType === 'EndAnchor') {
      const lastAlt = arrOfAlternatives[arrOfAlternatives.length - 1]
      lastAlt.value[lastAlt.value.length - 1].type = 'EndAnchorDependentMatch'
    } else {
      // add match stuff at end of root rule
      out += ' .*'
    }
    // ind match rule needed
    if (hasIndependentMatch) out += `\n${independentMatchRuleName} = `
    return out + r(pattern)
  }

  export const renderQuantifier = (node, value = '') => {
    console.log('renderQuantifier node:',node)
    if (node.quantifier) {
      if (node.quantifier.atLeast === 0 && node.quantifier.atMost === Infinity) return `${value}*`
      if (node.quantifier.atLeast === 1 && node.quantifier.atMost === Infinity) return `${value}+`
      if (node.quantifier.atLeast === 0 && node.quantifier.atMost === 1) return `${value}?`
      if (node.quantifier.atMost === Infinity) {
        const newNode = cloneDeep(node)
        newNode.quantifier.atLeast -= 1
        const oldNode = cloneDeep(node)
        delete oldNode.quantifier
        // instead of just returning the string, its better to modify the AST
        // and separate the printing from the restructuring. This makes it much
        // easier to deal with all ast changes e.g. string detection,
        // disjunction modification
        // since this render function is intended to be a print function I guess we can detect strings here
        return `${r(oldNode, '')} ${r(newNode, '')}`
      }
      return `${value}{${node.quantifier.atLeast},${node.quantifier.atMost}}`
    }
    return ''
  }

  export const r = (node, continuation = '') => {
    console.log(`TYPE: ${node?.type}\nCONT: ${continuation}\nNODE:`, node)

    if (!node) {
      return continuation
    }

    switch (node.type) {
      case 'Pattern':
        return r(node.value, continuation)
      case 'Disjunction':
        // can have 1 to n children
        // n=1 is not really a disjunction, it's a concat 
        if (node.value.length === 1) return r(node.value[0], continuation)
        const arr = [...node.value]
        // n>1
        return arr.map((curr) => r(curr, '')).join(' / ')
      case 'Alternative':
        // Group > Disjunction > 2 or more operands
        // Need to append the after-group continuation to each operand of the disjunction
        // after-group continuation is r(node.value[1...n])

        // base case is DOES NOT have multiple children
        const hasMultipleChildren = node.value.length > 1
        const childGroup = node.value[0]
        const isChildGroup = childGroup?.type === 'Group' 
        const grandChildDisjunction = node.value[0].value
        const isGrandchildDisjunction = grandChildDisjunction?.type === 'Disjunction' 
        const disjunctionOperands = grandChildDisjunction?.value
        const hasMultipleDisjunctionOperands = disjunctionOperands?.length > 1
        if (hasMultipleChildren && isChildGroup && isGrandchildDisjunction && hasMultipleDisjunctionOperands) {
          // for each element (alternative) in node.value[0].value, append everything else in node.value to node.value[0].value[i]

          // save 2...n elements
          let oldNodeValue = [...node.value]
          oldNodeValue.shift()

          // xform ast so alternative has 1 child (just first child) deleting 2...n elements
          node.value = [node.value[0]]

          // iterate over the disjunction's array of alternatives, add cont to each alternative's value
          // redistribute 2..n children among arms of the disjunction
          grandChildDisjunction.value.forEach(altNode => altNode.value.push(...oldNodeValue))

          // resubmit node for processing, now with only 1 child 
          return r(node, continuation)
        }

        // define character delimitors at the alternative (or parent?) level, not the character level
        // if prev node isn't character or doesn't exist, insert ' delim
        // if curr node is character and next node isn't character or doesn't exist, insert ' delim

        const hasQuantifier = node => !!node.quantifier
        const isCharNode = node => node.type === 'Character'

        const isStartOfString = (curr, index, arr) => {
          // to be the start of a string, it must be
          // 1. a character node
          if (!isCharNode(curr)) return false
          // and one of:
          // 2. start of array
          if (index === 0) return true
          // 3. the element behind it is not a character node
          if (!isCharNode(arr[index-1])) return true
          // 4. has a quantifier, which means it is always the start of a
          // string, because quantifiers never apply to strings (only groups and
          // characters) 
          if (hasQuantifier(curr)) return true
          // 5. the prev element is a character node with a quantifier, which is
          // always an end of string, so this is the start of a string
          if (hasQuantifier(arr[index-1])) return true
          // otherwise, it's NOT the start of a string
          return false
        }

        const isEndOfString = (curr, index, arr) => {
          if (!isCharNode(curr)) return false
          // to be the end of the string, it must be one of
          // 1. a character node and the last element in the array
          if (arr.length === index+1) return true
          // 2. a character node with a quantifier is always also the end of a string
          if (hasQuantifier(curr)) return true
          // 3. a character node and the next node is NOT a character node
          if (!isCharNode(arr[index+1])) return true
          // otherwise, it's NOT the end of a string
          // 4. a character node and the next node has a quantifier, which is always an end of string
          if (hasQuantifier(arr[index+1])) return true
          return false
        }

        let acc = ''
        node.value.forEach((curr, index, arr) => {
          acc += `${isStartOfString(curr, index, arr) ? `'` : ``}${r(curr, '')}${isEndOfString(curr, index, arr) ? `'` : ``}${renderQuantifier(curr)}`
        })
        return acc
      case 'Character':
        // ast doesn't have a concept of string, so need to introduce that later so we arent just using chars
        // const charValue = `'${r(undefined, String.fromCharCode(node.value))}'`
        const charValue = `${r(undefined, String.fromCharCode(node.value))}`
        return charValue
      case 'Group':
        const groupValue = ` ( ${r(node.value, continuation)} ) `
        return groupValue
      case 'Set':
        const charClass = regex.substring(node.loc.begin, node.loc.end)
        const setValue = ` ${charClass} `
        return setValue
      // anchors that aren't at the start/end of input match before or after the
      // newline, but for pegs this is the same
      case 'StartAnchor':
        return (node, `'\\n'? `)
      case 'EndAnchor':
        return (node, `'\\n'? `)
      // anchors at the start/end of input are treated as a special case by regex semantics (dependent matches)
      // they are deleted here because they have already been dealt with before
      // this function was called, the node types marked as "Dependent Match"
      case 'StartAnchorDependentMatch':
        return (undefined, '')
      case 'EndAnchorDependentMatch':
        return (undefined, '')
    }
  }