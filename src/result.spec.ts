import { assert } from "chai";
import * as sinon from "sinon";

import { Experiment } from "./experiment";
import { Observation } from "./observation";
import { Result, create as createResult } from "./result";

describe("Result", () => {
  let result: Result<unknown>;
  let evaluateCandidatesStub: sinon.SinonStub;
  const mockContext = { zip: "zap" };
  const mockExperiment = new Experiment<unknown>("foobar");
  sinon.stub(mockExperiment, "context").returns(mockContext);
  const mockObservations: Observation<unknown>[] = [
    new Observation("control", mockExperiment, () => false),
    new Observation("candidate", mockExperiment, () => false),
  ];
  const mockControl = new Observation("control", mockExperiment, () => false);
  let timers: sinon.SinonFakeTimers;

  beforeEach(() => {
    timers = sinon.useFakeTimers();
    evaluateCandidatesStub = sinon.stub(Result.prototype, "evaluateCandidates");
  });

  afterEach(() => {
    timers.restore();
    evaluateCandidatesStub.restore();
  });

  describe("create", () => {
    it("should return a new Result", () => {
      const r = createResult(mockExperiment, mockObservations, mockControl);
      assert.instanceOf(r, Result);
    });
  });

  describe("context", () => {
    it("should return the experiment context", () => {
      result = createResult(mockExperiment, mockObservations, mockControl);
      assert.deepEqual(result.context(), mockExperiment.context());
      assert.deepEqual(result.context(), mockContext);
    });
  });

  describe("experimentName", () => {
    it("should return the experiment name", () => {
      result = createResult(mockExperiment, mockObservations, mockControl);
      assert.deepEqual(result.experimentName(), "foobar");
    });
  });

  describe("matched", () => {
    it("should return true if all of the results matched", () => {
      result = createResult(mockExperiment, mockObservations, mockControl);
      assert.ok(result.matched());
    });

    // describe("with mismatched results", () => {
    //   beforeEach(() => {
    //     result = createResult(mockExperiment, mockObservations, mockControl);
    //     result._mismatched = result._mismatched.push(
    //       new Observation("??", mockExperiment, () => false)
    //     );
    //   });

    //   it("should return false", () => {
    //     assert.notOk(result.matched());
    //   });
    // });
  });

  describe("mismatched", () => {
    beforeEach(() => {
      result = createResult(mockExperiment, mockObservations, mockControl);
    });

    // describe("with mismatched candidates", () => {
    //   beforeEach(() => {
    //     result._mismatched = result._mismatched.push(
    //       new Observation("??", mockExperiment, () => false)
    //     );
    //   });

    //   it("should return true", () => {
    //     assert.ok(result.mismatched());
    //   });
    // });

    describe("with no mismatched candidates", () => {
      it("should return false", () => {
        assert.notOk(result.mismatched());
      });
    });
  });

  describe("ignored", () => {
    beforeEach(() => {
      result = createResult(mockExperiment, mockObservations, mockControl);
    });

    describe("with no ignored candidates", () => {
      it("should return false", () => {
        assert.notOk(result.ignored());
      });
    });

    // describe("with ignored candidates", () => {
    //   beforeEach(() => {
    //     result._ignored = result._ignored.push(
    //       new Observation("??", mockExperiment, () => false)
    //     );
    //   });

    //   it("should return true", () => {
    //     assert.ok(result.ignored());
    //   });
    // });
  });

  describe("evaluateCandidates", () => {
    beforeEach(() => {
      evaluateCandidatesStub.restore();
    });
    afterEach(() => {
      evaluateCandidatesStub = sinon.stub(
        Result.prototype,
        "evaluateCandidates"
      );
    });

    // describe("should collect all equivalent observations", () => {
    //   beforeEach(() => {
    //     mockExperiment.observationsAreEquivalent = sinon.stub().returns(true);
    //     result = createResult(mockExperiment, mockObservations, mockControl);
    //   });

    //   it("should leave _mismatched empty", () => {
    //     assert.equal(result._mismatched.size, 0);
    //   });

    //   it("should not ignore any", () => {
    //     assert.equal(result._ignored.size, 0);
    //   });
    // });

    // describe("should collect all mismatched observations", () => {
    //   beforeEach(() => {
    //     mockExperiment.observationsAreEquivalent = sinon.stub().returns(false);
    //     mockExperiment.ignoreMismatchedObservation = sinon
    //       .stub()
    //       .returns(false);
    //     result = createResult(mockExperiment, mockObservations, mockControl);
    //   });

    //   it("should populate _mismatched", () => {
    //     assert.equal(result._mismatched.size, 1);
    //     assert.deepEqual(
    //       result._mismatched.first(),
    //       new Observation("candidate", mockExperiment, () => true)
    //     );
    //   });

    //   it("should not ignore any", () => {
    //     assert.equal(result._ignored.size, 0);
    //   });
    // });

    // describe("should collect all mismatched and ignored observations", () => {
    //   beforeEach(() => {
    //     mockExperiment.observationsAreEquivalent = sinon.stub().returns(false);
    //     mockExperiment.ignoreMismatchedObservation = sinon.stub().returns(true);
    //     result = createResult(mockExperiment, mockObservations, mockControl);
    //   });

    //   it("should not populate _mismatched (goes to ignored)", () => {
    //     assert.equal(result._mismatched.size, 0);
    //   });

    //   it("should ignore them as well", () => {
    //     assert.equal(result._ignored.size, 1);
    //     assert.deepEqual(
    //       result._ignored.first(),
    //       new Observation("candidate", mockExperiment, () => false)
    //     );
    //   });
    // });
  });
});
