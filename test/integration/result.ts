import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const assert = chai.assert;

import * as sinon from "sinon";

import Experiment from "../../src/experiment";

import Result from "../../src/result";

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

function clone(o: any): any {
  return Object.assign({}, o);
}

describe("Result", function () {
  it("should return equivalent results regardless of order", function () {
    const o1 = [clone(mockObservationOne), clone(mockObservationTwo)];
    const resultOne = new Result(mockExperiment, o1, o1[0]);
    const o2 = [clone(mockObservationTwo), clone(mockObservationOne)];
    const resultTwo = new Result(mockExperiment, o2, o2[1]);

    assert.ok(resultOne.mismatched());
    assert.ok(resultTwo.mismatched());
  });
});
