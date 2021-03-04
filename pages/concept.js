import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'

const style = "col-8 font-weight-light font-italic font-sm description"

export default function Concept(props) {
  return (
    <Container className={`mx-3 my-4 ${style}`}>
      <Row className="mx-1 mb-3">
        <Col className="col-1"></Col>
        <Col className="col-11">
<p>Parsing Expression Grammars (PEGs) are grammars optimized for use with computers. Unlike traditional grammars, which came from the field of linguistics, PEGs are always unambiguous. This means they are not suitable for representing natural language, where ambiguity is a fact of life, but they are perfect for use with computers where ambiguity is undesirable.</p>
<p>Users of PEGs have found that, once you get the hang of them, you can express very complex programs with great clarity and brevity. They are a joy to maintain: you can return to your PEG specification months later and it’s easy to edit with confidence.</p>
<p>Adding complexity to your PEG scales linearly, you never reach a point where you’re buried and the whole thing becomes too dense to think about or modify.</p>
<p>Regexes, on the other hand, become unmanageable very quickly. The best practice with regexes is to keep them short and simple -- don’t get carried away -- and avoid special operators like look-behind. You also want to minimize capture groups and transformations. Doing more than one transformation is usually too much. Stringing together multiple regexes, one after the other, is always hard to follow.</p>

<p>Regexes have been embedded everywhere in our software and they are a common roadblock and source of bugs. A small regex has a tendency to grow into a large multi-line regex, which is performing the same task as a parser or compiler, but in a less maintainable, harder to understand way.</p>
<p>PEGs can be used as a replacement for any regex, whether simple or complex. PEGs also make performance guarantees that Regexes don’t for the same functionality. For example, HTTP multiplexers will have regex checkers that attempt to find “unsafe” regex operators that can destroy your application’s performance. The need for additional checker software is additional complexity that could be avoided by using a better grammar.</p>

<p>
Complex regexes:
  <li>Hide subtle bugs that sometimes are never found for years</li>
  <li>Difficult to modify without introducing new bugs</li>
  <li>Difficult to add functionality to without an exponential increase in complexity</li>
  <li>Require substantial testing</li>
  <li>Threaten to destroy the performance of your application if you use advanced features</li>
  <li>Vary greatly between implementations due to their origin in ambiguous grammars</li>
</p>

<p>Having said that, while PEGs guarantee linear time complexity, since they rely on memoization they can be memory inefficient in the worst case. Before using PEGs in production at scale in something like an HTTP server, this limitation would need to be thoroughly evaluated. PEGs are still a novel technology and should not be blindly adopted.</p>
<p>This regex to PEG converter (re2peg) allows developers to take a regex and see what it looks like as a PEG. This is primarily meant as a learning tool to accelerate and encourage adoption of PEGs, and to learn about the concept for fun.</p>

<p>A <a href="https://pegjs.org/online">2009 paper</a> detailed an algorithm for converting Regexes to PEGs. Some of this application made use of this paper.</p>

<p>The <a href="https://pegjs.org/online">the original PEG paper</a> from Brian Ford is a great read that explains all the details about PEGs.</p>

        </Col>
      </Row>
    </Container>
  )
}
