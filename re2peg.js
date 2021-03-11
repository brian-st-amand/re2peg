import { RegExpParser, BaseRegExpVisitor } from 'regexp-to-ast'
import cloneDeep from 'clone-deep'

class MyRegExpVisitor extends BaseRegExpVisitor {
  visitPattern(node) {
    // console.log('Pattern', node)
    return node
  }
}

export const re2peg = (regex) => {
  const regexpParser = new RegExpParser()
  const regExpAst = regexpParser.pattern(regex)
  const myVisitor = new MyRegExpVisitor()
  const pattern = myVisitor.visitPattern(regExpAst)

  // an alternative that begins/ends with anchors it's a dependent match, otherwise it's an independent match
  // this is a special case
  // a pattern that DOES NOT begin/end with anchors is an independent match
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

  const flat = arrOfAlternatives.reduce((acc, curr) => [...acc, curr], [])

  const rootRuleName = 'root'
  let out = `${rootRuleName} = `
  const firstType = flat[0].value[0].type
  const lastType =
    flat[flat.length - 1].value[flat[flat.length - 1].value.length - 1].type

  const hasIndependentMatch = !(
    firstType === 'StartAnchor' && lastType === 'EndAnchor'
  )

  const independentMatchRuleName = 'independent_match'

  if (firstType === 'StartAnchor') {
    arrOfAlternatives[0].value[0].type = 'StartAnchorDependentMatch'
  } else {
    // add ind match stuff at front of root rule
    out += `(!${independentMatchRuleName} .)*`
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
  return cleanupString(out + outer(pattern, '', regex))
}

const cleanupString = (str) => str.replace(/ +/g, ' ').trim()

export const renderQuantifier = (node, value = '') => {
  // console.log('renderQuantifier node:', node)
  if (node.quantifier) {
    if (node.quantifier.atLeast === 0 && node.quantifier.atMost === Infinity)
      return `${value}*`
    if (node.quantifier.atLeast === 1 && node.quantifier.atMost === Infinity)
      return `${value}+`
    if (node.quantifier.atLeast === 0 && node.quantifier.atMost === 1)
      return `${value}?`
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
      return `${outer(oldNode, '', re)} ${outer(newNode, '', re)}`
    }
    return `${value}{${node.quantifier.atLeast},${node.quantifier.atMost}}`
  }
  return ''
}

export const outer = (node, continuation = '', regex) => {
  const inner = (node, continuation = '') => {
    // console.log(`TYPE: ${node?.type}\nCONT: ${continuation}\nNODE:`, node)

    if (!node) {
      return continuation
    }

    switch (node.type) {
      case 'Pattern':
        return inner(node.value, continuation)
      case 'Disjunction':
        // can have 1 to n children
        // n=1 is not really a disjunction, it's a concat
        if (node.value.length === 1) return inner(node.value[0], continuation)
        const arr = [...node.value]
        // n>1
        return arr.map((curr) => inner(curr, '')).join(' / ')
      case 'Alternative':
        // Find first group node under the alternative that meets criteria:
        //   Group > Disjunction > 2 or more operands
        // append the after-group continuation to each operand of the disjunction
        // after-group continuation is r(node.value[1...n])
        // resubmit for processing

        const get1stTransformableGroupIndex = () => {
          // checking against node.value.length - 1 because if group is last node, then it's not xformable
          // we intentionally skip checking the last node in the array, since
          // the last node in the array is never xformable
          for (let i = 0; i < node.value.length - 1; i++) {
            const childGroup = node.value[i]
            const isChildGroup = childGroup?.type === 'Group'
            const grandChildDisjunction = node.value[i].value
            const isGrandchildDisjunction = grandChildDisjunction?.type === 'Disjunction'
            const disjunctionOperands = grandChildDisjunction?.value
            const hasMultipleDisjunctionOperands = disjunctionOperands?.length > 1
            if (isChildGroup && isGrandchildDisjunction && hasMultipleDisjunctionOperands) return i
          }

          return -1
        }

        // TODO: change this away from mutating node
        const distributeContinuationIntoGroupWithIndex = groupIndex => {
          // append every element from groupIndex..n in the alternative node to
          // the xformable group, then delete those elements from the
          // alternative node

          const deleted = cloneDeep(node.value.splice(groupIndex + 1, node.value.length - groupIndex + 1))
          // iterate over the disjunction's array of alternatives, add cont to each alternative's value
          // redistribute groupIndex..n children among arms of the disjunction
          node.value[groupIndex].value.value.forEach((altNode) => {
              altNode.value.push(...cloneDeep(deleted))
            }
          )

        }

        const firstTransformableGroupIndex = get1stTransformableGroupIndex()

        if (firstTransformableGroupIndex >= 0) {
          distributeContinuationIntoGroupWithIndex(firstTransformableGroupIndex)
          // resubmit node for processing, now post-group elements folded into the first group
          return inner(node, continuation)
        }

        // define character delimiters at the alternative (or parent?) level, not the character level
        // if prev node isn't character or doesn't exist, insert ' delim
        // if curr node is character and next node isn't character or doesn't exist, insert ' delim

        const hasQuantifier = (node) => !!node.quantifier
        const isCharNode = (node) => node.type === 'Character'

        const isStartOfString = (curr, index, arr) => {
          // to be the start of a string, it must be
          // 1. a character node
          if (!isCharNode(curr)) return false
          // and one of:
          // 2. start of array
          if (index === 0) return true
          // 3. the element behind it is not a character node
          if (!isCharNode(arr[index - 1])) return true
          // 4. has a quantifier, which means it is always the start of a
          // string, because quantifiers never apply to strings (only groups and
          // characters)
          if (hasQuantifier(curr)) return true
          // 5. the prev element is a character node with a quantifier, which is
          // always an end of string, so this is the start of a string
          if (hasQuantifier(arr[index - 1])) return true
          // otherwise, it's NOT the start of a string
          return false
        }

        const isEndOfString = (curr, index, arr) => {
          if (!isCharNode(curr)) return false
          // to be the end of the string, it must be one of
          // 1. a character node and the last element in the array
          if (arr.length === index + 1) return true
          // 2. a character node with a quantifier is always also the end of a string
          if (hasQuantifier(curr)) return true
          // 3. a character node and the next node is NOT a character node
          if (!isCharNode(arr[index + 1])) return true
          // 4. a character node and the next node has a quantifier, which is always an end of string
          if (hasQuantifier(arr[index + 1])) return true
          // otherwise, it's NOT the end of a string
          return false
        }

        let acc = ''
        node.value.forEach((curr, index, arr) => {
          acc += `${isStartOfString(curr, index, arr) ? "'" : ''}${inner(
            curr,
            '',
          )}${isEndOfString(curr, index, arr) ? "'" : ''}${renderQuantifier(
            curr,
          )}`
        })
        return acc
      case 'Character':
        const charValue = `${inner(undefined, String.fromCharCode(node.value))}`
        return charValue
      case 'Group':
        const groupValue = ` ( ${inner(node.value, continuation)} ) `
        return groupValue
      case 'Set':
        return ` ${regex.substring(node.loc.begin, node.loc.end)} `
      // anchors that aren't at the start/end of input match before or after the
      // newline, but for pegs this is the same
      case 'StartAnchor':
        return "'\\n'"
      case 'EndAnchor':
        return "'\\n'"
      // anchors at the start/end of input are treated as a special case by regex semantics (dependent matches)
      // they are deleted here because they have already been dealt with before
      // this function was called, the node types marked as "Dependent Match"
      case 'StartAnchorDependentMatch':
        return ''
      case 'EndAnchorDependentMatch':
        return ''
    }
  }
  return inner(node, continuation)
}
