"use strict";

var chai = require("chai");
chai.use(require("chai-as-promised"));
var assert = chai.assert;

var util = require("util");

var Experiment = require("../../../src/experiment").default;

var Scientist = require("../../../src/scientist").default;

function MyExp(name) {
  Experiment.call(this, name);
}
util.inherits(MyExp, Experiment);

describe("Scientist", function () {
  it("should expose a .science method", function () {
    var s = new Scientist();
    assert.ok(s.science);
  });

  describe(".science", function () {
    it("should return an experiment", function () {
      var s = new Scientist();
      assert.instanceOf(s.science("test"), Experiment);
    });

    it.skip("should be able to replace the experiment", function () {
      var s = new Scientist();
      assert.instanceOf(s.science("test", { Experiment: MyExp }), MyExp);
    });
  });
});
