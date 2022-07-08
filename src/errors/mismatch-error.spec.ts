import { assert } from "chai";

import { MismatchError } from "./mismatch-error";

describe("MismatchError", () => {
  it("should set the message as passed to it", () => {
    const e = new MismatchError("foobar");
    assert.equal(e.message, "foobar");
  });

  it("should store a result object", () => {
    const o = { foo: "bar" };
    const e = new MismatchError("foobar", o);
    assert.deepEqual(e.result, o);
  });
});
