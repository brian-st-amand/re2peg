import Head from 'next/head';
import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import styles from '../styles/Home.module.css';
import Examples from './examples';
import Info from './info';
import Help from './help';
import Concept from './concept';
import { re2peg } from '../re2peg';

export default function Home() {
  const [regex, setRegex] = useState('');
  const [peg, setPeg] = useState('');
  const [show, setShow] = useState(false);
  const [modalContent, setModalContent] = useState({ title: 'first', body: 'first' });

  const useExample = (re) => {
    document.getElementById('regexInput').value = re;
    setShow(false);
    setRegex(re);
    setPeg(re2peg(re));
  };

  const handleClose = () => {
    setShow(false);
  };

  const handleShow = () => {
    setShow(true);
  };

  const submitRegex = () => {
    const re = document.getElementById('regexInput').value;
    setRegex(re);
    setPeg(re2peg(re));
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Regex to PEG</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>

        <>
          <Modal show={show} onHide={handleClose}>
            <Modal.Header className="w-100" closeButton>
              <Modal.Title>{modalContent.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="w-100">{modalContent.body}</Modal.Body>
            <Modal.Footer />
          </Modal>
        </>

        <h1 className={styles.title}>
          regex to peg
        </h1>

        <form onSubmit={(e) => e.preventDefault()} className="d-flex m-5">
          <input type="text" className="form-control mx-1" id="regexInput" placeholder="/regex/" />
          <button type="submit" className="btn btn-secondary" onClick={submitRegex}>Submit</button>
        </form>

        <p className={styles.description}>
          {regex || (<br />)}
        </p>

        <div className="form-group">
          <textarea readOnly rows="12" cols="90" className="form-control mx-1" id="peg" value={peg} />
        </div>

      </main>

      <footer className={`${styles.footer}`}>

        <Button
          variant="btn-link"
          onClick={() => {
            setModalContent({ title: 'PEGs: Better than Regex', body: <Concept /> });
            handleShow();
          }}
        >
          Concept
        </Button>

        <Button
          variant="btn-link"
          onClick={() => {
            setModalContent({ title: 'Examples', body: <Examples useExample={useExample} /> });
            handleShow();
          }}
        >
          Examples
        </Button>

        <Button
          variant="btn-link"
          onClick={() => {
            setModalContent({ title: 'PEG Syntax', body: <Info /> });
            handleShow();
          }}
        >
          Syntax
        </Button>

        <Button
          variant="btn-link"
          onClick={() => {
            setModalContent({ title: 'All about PEGs', body: <Help /> });
            handleShow();
          }}
        >
          Help
        </Button>

        <Button variant="btn-link">
          <a href="https://github.com/brian-st-amand/re2peg" variant="btn-link">
            Source
          </a>
          <style jsx>
            {`
            a {
              text-decoration: none;
              color: #212529 !important;
            }
          `}
          </style>
        </Button>

      </footer>
    </div>
  );
}
