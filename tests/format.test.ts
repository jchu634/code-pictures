import assert from "node:assert/strict";
import { test } from "node:test";
import { canFormat, formatCode } from "../src/format.ts";

test("formats each supported language with the browser plugins", async () => {
  const snippets = [
    {
      language: "typescript",
      input: "const count:number=1",
      output: "const count: number = 1;\n",
    },
    {
      language: "tsx",
      input: "const view=<div>Hi</div>",
      output: "const view = <div>Hi</div>;\n",
    },
    {
      language: "javascript",
      input: "function hello(){return 'hi'}",
      output: 'function hello() {\n  return "hi";\n}\n',
    },
    {
      language: "json",
      input: '{"a":1,"b":[2,3]}',
      output: '{ "a": 1, "b": [2, 3] }\n',
    },
    {
      language: "html",
      input: "<div><p>Hello</p></div>",
      output: "<div><p>Hello</p></div>\n",
    },
    {
      language: "css",
      input: "a{color:red;margin:0}",
      output: "a {\n  color: red;\n  margin: 0;\n}\n",
    },
  ];
  for (const { language, input, output } of snippets) {
    assert.ok(canFormat(language));
    const formatted = await formatCode(input, language);
    assert.equal(formatted, output, language);
    assert.equal(await formatCode(formatted, language), formatted, language);
  }
});

test("invalid code rejects instead of returning a replacement", async () => {
  await assert.rejects(formatCode("const =", "typescript"));
  await assert.rejects(formatCode('{"a":}', "json"));
});

test("unsupported languages are explicitly unavailable", async () => {
  for (const language of ["c", "cpp", "python", "rust", "go", "bash", "text"]) {
    assert.equal(canFormat(language), false);
    await assert.rejects(formatCode("unchanged", language), /not available/);
  }
});
