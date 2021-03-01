import Head from 'next/head'
import styles from '../styles/Home.module.css'
import React, { useState } from 'react'
import { RegExpParser, BaseRegExpVisitor } from 'regexp-to-ast'
import cloneDeep from 'clone-deep'

// Override the visitor methods to add your logic.
class MyRegExpVisitor extends BaseRegExpVisitor {
  constructor() {
    super()
    this.x = ''
  }

  visitFlags(node) {
    console.log('Flags', node)
  }

  visitDisjunction(node) {
  }

  visitAlternative(node) {
  }

  // Assertion
  visitStartAnchor(node) {
    console.log('StartAnchor', node)
  }

  visitEndAnchor(node) {
    console.log('EndAnchor', node)
  }

  visitWordBoundary(node) {
    console.log('WordBoundary', node)
  }

  visitNonWordBoundary(node) {
    console.log('NonWordBoundary', node)
  }

  visitLookahead(node) {
    console.log('Lookahead', node)
  }

  visitNegativeLookahead(node) {
    console.log('NegativeLookahead', node)
  }

  // atoms
  visitCharacter(node) {
    console.log('Character', node)
    return node
  }

  visitSet(node) {
    console.log('Set', node)
    return node
  }

  visitGroup(node) {
    console.log('Group', node)
    return node
  }

  visitGroupBackReference(node) {
    console.log('GroupBackReference', node)
    return node
  }

  visitQuantifier(node) {
    console.log('Quantifier', node)
    return node
  }

  visitPattern(node) {
    console.log('Pattern', node)
    return node
  }
}

export default function Home() {
  const [regex, setRegex] = useState('');
  const [peg, setPeg] = useState('');

  const re2peg = (re) => {
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

  const renderQuantifier = (node, value) => {
    if (node.quantifier) {
      if (node.quantifier.atLeast === 0 && node.quantifier.atMost === Infinity) return `${value}*`
      if (node.quantifier.atLeast === 1 && node.quantifier.atMost === Infinity) return `${value}+`
      if (node.quantifier.atLeast === 0 && node.quantifier.atMost === 1) return `${value}?`
      if (node.quantifier.atMost === Infinity) {
        const newNode = cloneDeep(node)
        newNode.quantifier.atLeast -= 1
        const oldNode = cloneDeep(node)
        delete oldNode.quantifier
        return `${r(oldNode, '')} ${r(newNode, '')}`
      }
      return `${value}{${node.quantifier.atLeast},${node.quantifier.atMost}}`
    } else {
      console.error('node doesn\'t have quantifier, quantifier fn called incorrectly')
    }
    return ''
  }

  const r = (node, continuation = '') => {
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

        // this treats alternative as concat
        return node.value.reduce((acc, curr) => {
          return acc + r(curr, '')
        },'')
      case 'Character':
        // ast doesn't have a concept of string, so need to introduce that later so we arent just using chars
        const charValue = `'${r(undefined, String.fromCharCode(node.value))}'`
        if (node.quantifier) {
          return renderQuantifier(node, charValue)
        }
        return charValue
      case 'Group':
        const groupValue = ` ( ${r(node.value, continuation)} ) `
        if (node.quantifier) {
          return renderQuantifier(node, groupValue)
        }
        return groupValue
      case 'Set':
        const charClass = regex.substring(node.loc.begin, node.loc.end)

        const setValue = ` ${charClass} `

        if (node.quantifier) {
          return renderQuantifier(node, setValue)
        }
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

  const abc = () => {
    const re = document.getElementById('regexInput').value
    setRegex(re)
    setPeg(re2peg(re))
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Regex to PEG</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          regex to peg
        </h1>

        <form onSubmit={e => e.preventDefault()} className="d-flex m-5">
          <input type="text" className="form-control mx-1" id="regexInput" placeholder="/regex/"/>
          <button type="submit" className="btn btn-secondary" onClick={abc}>Submit</button>
        </form>

        <p className={styles.description}>
          {regex || (<br/>)}
        </p>

        <div className="form-group">
          <textarea readOnly rows="12" cols="90" className="form-control mx-1" id="peg" value={peg}/>
        </div>
      </main>

      <footer className={styles.footer}>
      </footer>
    </div>
  )
}
