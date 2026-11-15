import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const script = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const url = "https://example.org/long-link";

function setup(clipboard, legacyCopy) {
  const fields = new Map();
  const document = {
    execCommand: legacyCopy,
    querySelector(selector) {
      const field = {
        hidden: true,
        addEventListener(event, handler) { this[event] = handler; },
        focus() { document.activeElement = this; },
        select() {},
        setSelectionRange(start, end) { this.selection = [start, end]; }
      };
      fields.set(selector, field);
      return field;
    }
  };
  runInNewContext(script, { document, navigator: { clipboard }, window: { setTimeout() {} } });
  fields.get("[data-result-url]").href = url;
  return { fields, document, click: () => fields.get("[data-copy]").click() };
}

test("uses the native clipboard when available", async () => {
  let copied;
  const ui = setup({ async writeText(text) { copied = text; } }, () => assert.fail());
  await ui.click();
  assert.equal(copied, url);
  assert.equal(ui.fields.get("[data-copy]").textContent, "복사됨");
});

test("HTTP copies the exact selected URL", async () => {
  const ui = setup(undefined, command => {
    assert.equal(command, "copy");
    assert.equal(ui.document.activeElement.value, url);
    assert.deepEqual(ui.document.activeElement.selection, [0, url.length]);
    return true;
  });
  await ui.click();
  assert.equal(ui.fields.get("[data-manual-copy]").hidden, true);
  assert.equal(ui.document.activeElement, ui.fields.get("[data-copy]"));
});

test("denied clipboard leaves the address selected for manual copying", async () => {
  const ui = setup({ async writeText() { throw Error("denied"); } }, () => false);
  await ui.click();
  const field = ui.fields.get("[data-manual-copy]");
  assert.equal(field.hidden, false);
  assert.equal(ui.document.activeElement, field);
  assert.deepEqual(field.selection, [0, url.length]);
  assert.match(ui.fields.get("[data-message]").textContent, /복사 메뉴/);
});
