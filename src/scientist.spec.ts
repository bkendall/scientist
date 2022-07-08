import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const assert = chai.assert;

import { Experiment } from "./experiment";

import { Scientist } from "./scientist";

class MyExp<T> extends Experiment<T> {
  constructor(name: string) {
    super(name);
  }
}

describe("Scientist", () => {
  it("should expose a .science method", () => {
    const s = new Scientist();
    assert.ok(s.science);
  });

  describe(".science", () => {
    it("should return an experiment", () => {
      const s = new Scientist();
      assert.instanceOf(s.science("test"), Experiment);
    });

    it.skip("should be able to replace the experiment", () => {
      const s = new Scientist();
      assert.instanceOf(s.science("test", { Experiment: MyExp }), MyExp);
    });
  });
});
