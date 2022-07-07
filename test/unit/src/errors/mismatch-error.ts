import * as chai from "chai";
chai.use(require("chai-as-promised"));
const assert = chai.assert;

import MismatchError from "../../../../src/errors/mismatch-error";

describe("MismatchError", function () {
  it("should set the message as passed to it", function () {
    const e = new MismatchError("foobar");
    assert.equal(e.message, "foobar");
  });

  it("should store a result object", function () {
    const o = { foo: "bar" };
    const e = new MismatchError("foobar", o);
    assert.deepEqual(e.result, o);
  });
});
