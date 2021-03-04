import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'

const col1style = "col-4 description"
const col2style = "col-8 font-weight-light font-italic font-sm description"

export default function Info(props) {
  return (
    <Container className="mx-3">
      <Row className="">
        <Col className={`${col1style}`}>rule</Col>
        <Col className={`${col2style}`}>match a parsing expression of a rule recursively</Col>

        <Col className={`${col1style}`}>expression</Col> <Col className={`${col2style}`}>match an expression</Col>
        <Col className={`${col1style}`}>expression1 expression2 ... expressionN</Col>
        <Col className={`${col2style}`}>match a sequence of expressions</Col>
        <Col className={`${col1style}`}>expression1 / expression2 / ... / expressionN</Col>
        <Col className={`${col2style}`}>try to match each expression in order until one matches (no backtracking)</Col>

        <Col className={`${col1style}`}>
          "literal" or 'literal'
        </Col>
        <Col className={`${col2style}`}>
          match exact literal string
        </Col>
        <Col className={`${col1style}`}>
          .
        </Col>
        <Col className={`${col2style}`}>
          match exactly one character
        </Col>
        <Col className={`${col1style}`}>( expression )</Col>
        <Col className={`${col2style}`}>match a subexpression</Col>
        <Col className={`${col1style}`}>expression *</Col>
        <Col className={`${col2style}`}>match zero or more repetitions of the expression</Col>
        <Col className={`${col1style}`}>expression +</Col>
        <Col className={`${col2style}`}>match one or more repetitions of the expression</Col>
        <Col className={`${col1style}`}>expression ?</Col>
        <Col className={`${col2style}`}>match one or zero repetitions of the expression</Col>
        <Col className={`${col1style}`}>[characters]</Col>
        <Col className={`${col2style}`}>match one character from a character class e.g., [a-zA-Z0-9], [abc123]</Col>

      </Row>
    </Container>
  )
}