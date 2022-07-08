import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const assert = chai.assert;

import Experiment from "../../../src/experiment";

import Scientist from "../../../src/scientist";

class MyExp<T> extends Experiment<T> {
  constructor(name: string) {
    super(name);
  }
}

describe("Scientist", function () {
  it("should expose a .science method", function () {
    const s = new Scientist();
    assert.ok(s.science);
  });

  describe(".science", function () {
    it("should return an experiment", function () {
      const s = new Scientist();
      assert.instanceOf(s.science("test"), Experiment);
    });

    it.skip("should be able to replace the experiment", function () {
      const s = new Scientist();
      assert.instanceOf(s.science("test", { Experiment: MyExp }), MyExp);
    });
  });
});
