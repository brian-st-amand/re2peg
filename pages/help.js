import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'

export default function Help(props) {
  return (
    <Container className="mx-3 my-5">
      <Row className="mx-1 mb-3">
        <Col className="col-1"></Col>
        <Col className="col-6">
          <p>
            Type a JavaScript-compatible regex into the text field. Your PEG will appear in the text area below.
          </p>
          <p>
            As your grammar grows in length, move segments into new rules. You can create as many rules as you want, which provides readibility for even the most complex grammars.
          </p>
          <p>
            Test your PEG (using JavaScript) here: <a href="https://pegjs.org/online">https://pegjs.org/online</a>
          </p>
          <p>
            All major languages have their own PEG implementations. The grammar will be identical to the one seen here, but sometimes the delimitors for characters/strings will vary.
          </p>
        </Col>
        <Col className="col-5"> </Col>
      </Row>
    </Container>
  )
}
