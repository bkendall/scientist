import { assert } from "chai";

import * as sinon from "sinon";

import { Experiment, Result } from "../../src";
import { Observation } from "../../src/observation";

const mockExperiment = new Experiment<unknown>();
sinon.stub(mockExperiment, "observationsAreEquivalent").returns(false);
sinon.stub(mockExperiment, "ignoreMismatchedObservation").returns(false);

const mockObservationOne = {
  name: "control",
  value: 4,
};
const mockObservationTwo = {
  name: "candidate",
  value: 5,
};

function clone(o: unknown): unknown {
  return Object.assign({}, o);
}

describe("Result", () => {
  it("should return equivalent results regardless of order", () => {
    const o1 = [
      clone(mockObservationOne),
      clone(mockObservationTwo),
    ] as Observation<unknown>[];
    const resultOne = new Result(mockExperiment, o1, o1[0]);
    const o2 = [
      clone(mockObservationTwo),
      clone(mockObservationOne),
    ] as Observation<unknown>[];
    const resultTwo = new Result(mockExperiment, o2, o2[1]);

    assert.ok(resultOne.mismatched());
    assert.ok(resultTwo.mismatched());
  });
});
