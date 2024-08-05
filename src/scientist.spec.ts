import { assert } from "chai";

import { Experiment } from "./experiment.js";
import { Scientist } from "./scientist.js";

class MyExp<T> extends Experiment<T> {
  constructor(name: string) {
    super(name);
  }
}

describe("Scientist", () => {
  it("should expose a .science method", () => {
    const s = new Scientist();
    assert.isFunction(s.science); // eslint-disable-line @typescript-eslint/unbound-method
  });

  describe(".science", () => {
    it("should return an experiment", () => {
      const s = new Scientist();
      assert.instanceOf(s.science("test"), Experiment);
    });

    it("should be able to replace the experiment", () => {
      const s = new Scientist();
      assert.instanceOf(s.science("test", { Experiment: MyExp }), MyExp);
    });
  });
});
