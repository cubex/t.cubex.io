// @ts-ignore
import base64 from 'base-64';

import "./ts/json-parser";

import "./index.scss";


const $status = document.getElementById('encode-status') as HTMLDivElement,
  $result = document.getElementById('encode-result') as HTMLDivElement,
  $editor = document.getElementById('encode-editor') as HTMLTextAreaElement;


function analyze() {
  // encode string into base 64
  const str = $editor.value;

  if (str) {
    $result.innerHTML = base64.encode(str);
  }
}


if ($status && $result && $editor) {
  window.addEventListener('load', analyze, false);
  $editor.addEventListener('keyup', analyze, false);
  $editor.addEventListener('click', analyze, false);
}
