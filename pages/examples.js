import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'

const examples = [
  {title: 'independent_match', regex: '/abc/'},
  {title: 'dependent_match', regex: '/^abc$/'},
  {title: 'choice', regex: '/(a|ab)c/'},
  {title: 'repetition - 0 to inf', regex: '/a*/'},
  {title: 'repetition - 1 to inf', regex: '/a+/'},
  {title: 'repetition - 0 or 1', regex: '/a?/'},
  {title: 'group repetition', regex: '/(abc)+/'},
  {title: 'character class', regex: '/[0-9]/'}
]

export default function Examples(props) {
  return (
    <Container className="mx-3">
      <Row className="mx-1 mb-3">
        <Col className="col-4">name</Col>
        <Col className="col-8">regex</Col>
      </Row>
      {examples.map(e => (
        <Row className="mx-1" key={e.title}>
          <Col className="col-4">{e.title}</Col>
          <Col className="col-8">
            <div className="d-flex">
              <form className="pb-3">
                <div className="input-group">
                  <input type="text" readOnly value={e.regex} />
                </div>
              </form>
              <div className="">
                <button className="btn btn-dark" type="button" id="copy-button"
                    data-toggle="tooltip" data-placement="button"
                    title="Use Regex" onClick={() => props.useExample(e.regex)}>
                  Try it
                    <style jsx>{`
                      .btn {
                        line-height: 16px;
                        font-size: 14px;
                        margin-left: 10px;
                      }
                    `}</style>
                </button>
              </div>
            </div>
          </Col>
        </Row>
      ))}
    </Container>
  )
}
