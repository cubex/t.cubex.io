// @ts-ignore
import base64 from 'base-64';

const typeOf = function (variable: string) {
  return typeof eval(variable);
};

const $status = document.getElementById('status') as HTMLDivElement,
  $result = document.getElementById('result') as HTMLDivElement,
  $editor = document.getElementById('editor') as HTMLTextAreaElement;

export function trim(s: string) {
  return ltrim(rtrim(s));
}

export function rtrim(s: string) {
  return s.replace(/\s+$/g, "");
}

export function ltrim(s: string) {
  return s.replace(/^\s+/g, "");
}

export function findEndString(snatch: Snatch) {
  let current = 0, nbBackslash, i;
  do {
    current = snatch.indexOf('"', current + 1);
    nbBackslash = 0;
    i = 1;
    do {
      if (snatch.substring(current - i, current - i + 1) === "\\") {
        nbBackslash = nbBackslash + 1;
        i++;
        continue;
      }
      break;
    } while (true);
    if (nbBackslash % 2 === 0) {
      break;
    }
  } while (true);
  return current;
}


function formatXml(xml: string) {
  var formatted = '';
  var reg = /(>)(<)(\/*)/g;
  xml = xml.replace(reg, '$1\r\n$2$3');
  var pad = 0;
  xml.split('\r\n').forEach(function (node, index) {
    var indent = 0;
    if (node.match(/.+<\/\w[^>]*>$/)) {
      indent = 0;
    } else if (node.match(/^<\/\w/)) {
      if (pad != 0) {
        pad -= 1;
      }
    } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
      indent = 1;
    } else {
      indent = 0;
    }

    var padding = '';
    for (var i = 0; i < pad; i++) {
      padding += '  ';
    }

    formatted += padding + node + '\r\n';
    pad += indent;
  });

  return formatted;
}

class Snatch {
  done: string;
  todo: string;
  hasError: boolean = false;

  constructor(todo: string) {
    this.done = "";
    this.todo = todo ? todo : "";
  }

  update(done: string | null = null, todo: string | undefined = undefined) {
    if (done) this.done += done;
    if (todo !== undefined) this.todo = ltrim(todo);
    return this;
  }

  swap(charNumber: number) {
    if (charNumber && this.todo.length >= charNumber) {
      this.update(this.todo.substring(0, charNumber), this.todo.substring(charNumber));
    }

    return this;
  }

  toString() {
    if (this.todo.length !== 0) {
      this.err("Text after last closing brace.", this.todo);
    }

    return this.done;
  }

  span(className: string, text: string) {
    return this.update('<span class="' + className + '">' + text + '</span>');
  }

  err(title: string, text: string) {
    this.hasError = true;
    return this.update('<span class="error" title="' + title + '">' + text + '</span>');
  }

  shift(nbOfChars: number) {
    let shifted;
    if (nbOfChars && this.todo.length >= nbOfChars) {
      shifted = this.todo.substring(0, nbOfChars);
      this.update("", this.substring(nbOfChars));
      return shifted;
    }
    return "";
  }

  indexOf(searchValue: string, fromIndex: number | undefined = undefined) {
    if (fromIndex) return this.todo.indexOf(searchValue, fromIndex);
    return this.todo.indexOf(searchValue);
  }

  substring(fromIndex: number, toIndex: number | undefined = undefined): string {
    if (toIndex) return this.todo.substring(fromIndex, toIndex);
    return this.todo.substring(fromIndex);
  }

  search(regex: { [Symbol.search](string: string): number }) {
    return this.todo.search(regex);
  }
}

class Parser {
  private str: string;

  constructor(str: string) {
    this.str = str;
  }

  parseValue(snatch: Snatch, closingBracket: string) {
    let value, j, k, length, propertyValue, type = "";

    if (snatch.search(/^(")/) === 0) {
      value = snatch.shift(findEndString(snatch) + 1);

      if (value.search(/\\u(?![\dA-Fa-f]{4})/g) !== -1) {
        return snatch.err(
          "\\u must be followed by 4 hexadecimal characters",
          value
        );
      }

      length = value.length;

      for (k = 0; k < length; k++) {
        if (value.substring(k, k + 1) == "\\") {
          if (k + 1 < length) {
            k++;
            if (
              !value.substring(k, k + 1).search(/[^"|\\\/bfnrtu]/)
            ) {
              return snatch.err("Backslash must be escaped", value);
            }
          }
        }
      }

      let base = value;
      const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
      if (base64regex.test(value.replace(/"/g, ''))) {
        try {
          value = base64.decode(value.replace(/"/g, ''));
          value = "\"" + value + "\"";
          console.log('value', value);
        } catch (e) {
        }

        // check for non ascii characters
        if (value.search(/[^ -~]/g) !== -1 && !value.startsWith("\"<?xml")) {
          value = base;
        }
      }

      if (value.startsWith("\"<?xml")) {
        try {
          value = formatXml(value.substring(1, value.length - 1));
          value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;').replace(/\n/g, '<br />');
        } catch (e) {
        }
        return snatch.span("string", value);
      }

      // remove double escaped double quotes
      value = value.replace(/\\\\"/g, '\\"');
      // remove escaped double quotes
      value = value.replace(/\\"/g, '"');

      if ((value.replace(/"/g, '').startsWith('{') || value.replace(/"/g, '').startsWith('[')) &&
        (value.replace(/"/g, '').endsWith('}') || value.replace(/"/g, '').endsWith(']'))) {
        value = value.substring(1, value.length - 1);
        value = this.parseObject(new Snatch(value));
      }

      return snatch.span("string", value);
    }

    if (snatch.search(/^\{/) === 0) {
      return this.parseObject(snatch);
    }

    if (snatch.search(/^\[/) === 0) {
      return this.parseArray(snatch);
    }

    j = snatch.search(new RegExp("(,|" + closingBracket + ")"));

    if (j === -1) {
      propertyValue = rtrim(snatch.todo);
      snatch.update("", "");
    } else {
      propertyValue = rtrim(snatch.shift(j));
    }


    try {
      type = typeOf(propertyValue);
    } catch (e) {
    }

    switch (type) {
      case "boolean":
      case "number":
        return snatch.span(type, propertyValue);
      default:
        if (propertyValue === "null") {
          return snatch.span("null", propertyValue);
        } else {
          if (propertyValue.search(/^(')/) === 0) {
            return snatch.err(
              "String must be wrapped in double quotes",
              propertyValue
            );
          }
          return snatch.err("Unknown type", propertyValue);
        }
    }
  }

  parseArray(snatch: Snatch) {
    let io = 0;

    const parseElement = (snatch: Snatch): Snatch => {
      snatch.update('<li>');
      snatch = this.parseValue(snatch, "]");

      if (snatch.substring(0, 1) === ",") {
        snatch.swap(1).update('</li>');
        return parseElement(snatch);
      }

      if (snatch.substring(0, 1) === "]") {
        return snatch.update('</li>');
      }

      return snatch.err("Comma is missing", snatch.shift(snatch.search(/([,\]])/))).update('</li>');
    }

    if (snatch.indexOf("[") === -1) {
      snatch.err("Opening square bracket is missing", snatch.todo);
      return snatch.update("", "");
    }

    snatch.shift(1);
    snatch.update('<span class="array">');
    snatch.update('<span class="toggle">[</span><ol>');

    if (snatch.indexOf("]") === 0) {
      snatch.shift(1);
      snatch.update('</ol><span class="toggle-end">]</span>');
      return snatch.update("</span>");
    }

    snatch = parseElement(snatch);
    if (snatch.indexOf("]") === -1) {
      snatch.err("Closing square bracket is missing", snatch.todo);
      snatch.update(
        '</ol><span class="toggle-end"></span>'
      );
      return snatch.update("</span>");
    }
    snatch.shift(1);
    snatch.update(
      '</ol><span class="toggle-end">]</span>'
    );
    return snatch.update("</span>");
  }

  parseObject(snatch: Snatch) {
    const parsePair = (snatch: Snatch): Snatch => {
      function parseString(snatch: Snatch) {
        let name, length, k, firstChar = snatch.substring(0, 1);
        snatch.update("");
        if (firstChar === '"') {
          name = snatch.shift(findEndString(snatch) + 1);
          if (name.search(/\\u(?![\dA-Fa-f]{4})/g) !== -1) {
            return snatch.err(
              "\\u must be followed by 4 hexadecimal characters",
              name
            );
          }
          length = name.length;

          for (k = 0; k < length; k++) {
            if (name.substring(k, k + 1) == "\\") {
              if (k + 1 < length) {
                k++;
                if (!name.substring(k, k + 1).search(/[^"\\\/bfnrtu]/)) {
                  return snatch.err("Backslash must be escaped", name);
                }
              }
            }
          }

          return snatch.update(
            '<span class="property">"<span class="p">' +
            name.substring(1, name.length - 1) +
            '</span>"</span>'
          );
        }

        name = snatch.shift(snatch.indexOf(":"));
        return snatch.err(
          "Name property must be a String wrapped in double quotes.",
          name
        );
      }

      function parseSeparator(snatch: Snatch) {
        if (snatch.substring(0, 1) !== ":") {
          snatch.err(
            "Semi-column is missing.",
            snatch.shift(snatch.indexOf(":"))
          );
        }
        return snatch.swap(1);
      }

      snatch.update("<li>");
      if (snatch.substring(0, 1) === "}") {
        return snatch.update("</li>");
      }

      snatch = parseString(snatch);
      snatch = parseSeparator(snatch);
      snatch = this.parseValue(snatch, "}");
      if (snatch.substring(0, 1) === ",") {
        snatch.swap(1).update("</li>");
        return parsePair(snatch);
      }
      if (snatch.substring(0, 1) === "}") {
        return snatch.update("</li>");
      }
      return snatch
        .err("Comma is missing", snatch.shift(snatch.indexOf("}")))
        .update("</li>");
    }

    if (snatch.indexOf("{") === -1) {
      snatch.err("Opening brace is missing", snatch.todo);
      return snatch.update("", "");
    } else {
      snatch.shift(1);
      snatch.update(
        '<span class="object"><span class="toggle">{</span><ul>'
      );
      snatch = parsePair(snatch).update("</ul>");
      if (snatch.indexOf("}") === -1) {
        snatch.err("Closing brace is missing", snatch.todo);
        return snatch.update("", "");
      }
      return snatch.span("toggle-end", snatch.shift(1));
    }
  }

  getResult() {
    const snatch = new Snatch(trim(this.str));
    let result: { html: string, valid: boolean };

    if (ltrim(this.str).substring(0, 1) === "[") {
      result = {
        html: this.parseArray(snatch).toString(),
        valid: !snatch.hasError
      }
    } else {
      if (ltrim(this.str).substring(0, 1) === "{") {
        result = {
          html: this.parseObject(snatch).toString(),
          valid: !snatch.hasError
        }
      } else {
        result = {
          html: snatch.err("JSON expression must be an object or an array.", this.str).update(null, "").toString(),
          valid: false
        }
      }
    }

    return result;
  }
}

function analyze() {
  function trim(str: string) {
    const whitespace = "[\\x20\\t\\r\\n\\f]";
    const rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g");

    return str.replace(rtrim, "");
  }

  let json = $editor.value;
  const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  if (base64regex.test(json)) {
    try {
      json = base64.decode(json);
    } catch (e) {
    }
  }

  if (trim(json) === "") {
    $result.innerHTML = "";
    $status.innerHTML = "";
    $status.classList.remove("status-error");
    return;
  }

  if (!trim(json).startsWith('{') && !trim(json).startsWith('[')) {
    $result.innerHTML = json;
    $status.innerHTML = "";
    $status.classList.remove("status-error");
    return;
  }

  $status.classList.remove("status-error");
  setTimeout(() => {
    json = json.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const result = new Parser(json).getResult();
    $result.innerHTML = result.html;
    $status.innerHTML = "";

    if (!result.valid) {
      let match = result.html.match(/<span class="error"/g);
      if (!match) return;
      $status.classList.add("status-error");
      $status.innerHTML = "<b>Invalid JSON</b>&nbsp;" + match.length + "&nbsp;error" + (match.length > 1 ? "s" : "") + "&nbsp;found";
    }
  }, 0);
}

if ($status && $result && $editor) {
  window.addEventListener('load', analyze, false);
  $editor.addEventListener('keyup', analyze, false);
  $editor.addEventListener('click', analyze, false);
}
