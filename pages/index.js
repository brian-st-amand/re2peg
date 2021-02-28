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
    console.log('Disjunction', node)
  }

  visitAlternative(node) {
    console.log('Alternative', node)
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
    console.log('re:', re)
    const regexpParser = new RegExpParser()
    const regExpAst = regexpParser.pattern(re)
    const myVisitor = new MyRegExpVisitor()
    console.log('myVisitor',myVisitor)
    const p = myVisitor.visitPattern(regExpAst)
    // console.log('myVisitor.x',myVisitor.x)
    // return myVisitor.x
    return 'root = ' + r(p)
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
        console.log('node after delete quantifier:', oldNode)
        return `${r(oldNode, '')} ${r(newNode, '')}`
      }
      return `${value}{${node.quantifier.atLeast},${node.quantifier.atMost}}`
    } else {
      console.error('node doesn\'t have quantifier, quantifier fn called incorrectly')
    }
    return ''
  }

  const r = (node, continuation = '') => {
    console.log(`r called for ${node?.type} with continuation: ${continuation} and node:`, node)
    if (!node) return continuation
    switch (node.type) {
      case 'Pattern':
        return r(node.value, continuation)
      case 'Disjunction':
        // can have 1 to n, need to group 
        // this case is not really a disjunction just a concat 
        if (node.value.length === 1) return r(node.value[0], continuation)

        const arr = [...node.value]
        console.log('arr',arr)

        // for 2 or more its a reduction
        return arr.map((curr) => {
          console.log('disjunction map curr', curr)
          return r(curr, '')
        }).join(' / ')

      case 'Alternative': // concatenation
        return node.value.reduce((acc, curr) => {
          console.log('alternative reducer acc:', acc)
          console.log('alternative reducer curr:', curr)
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
        console.log('regex',regex)
        const charClass = regex.substring(node.loc.begin, node.loc.end)
        console.log('charClass',charClass)

        // renderQuantifier(node) : ''} `
        // const value = ` ( ${r(node.value, continuation)} ) `
        const setValue = ` ${charClass} `

        if (node.quantifier) {
          return renderQuantifier(node, setValue)
        }
        return setValue

        // return ` ${charClass}${(node.quantifier) ? renderQuantifier(node) : ''} `
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
