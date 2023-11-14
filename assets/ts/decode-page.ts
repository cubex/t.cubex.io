// @ts-nocheck
import JSONFormatter from 'json-formatter-js/dist/json-formatter.esm.js';
import base64 from 'base-64';

let src = document.getElementById('editor');
let output = document.getElementById('result');

if (src || output) {
  src.onchange = render;
  src.onpaste = () => setTimeout(render, 100);

  render();
}

function render() {
  // @ts-ignore
  let jsnVal = src.value;
  try {
    jsnVal = base64.decode(jsnVal);
  } catch (e) {
  }

  if (jsnVal === '') {
    return
  }

  let jsnDec = null;
  try {
    jsnDec = JSON.parse(jsnVal)
    const formatter = new JSONFormatter(jsnDec);
    output.innerHTML = ''
    output.appendChild(formatter.render());
    formatter.openAtDepth(100);
  } catch (e) {
    output.innerHTML = e
  }
}
