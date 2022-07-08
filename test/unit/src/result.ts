import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const assert = chai.assert;

import * as sinon from "sinon";
import Experiment from "../../../src/experiment";
import Observation from "../../../src/observation";

import Result, { create as createResult } from "../../../src/result";

describe("Result", function () {
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

  beforeEach(function () {
    timers = sinon.useFakeTimers();
    evaluateCandidatesStub = sinon.stub(Result.prototype, "evaluateCandidates");
  });

  afterEach(function () {
    timers.restore();
    evaluateCandidatesStub.restore();
  });

  describe("create", function () {
    it("should return a new Result", function () {
      const r = createResult(mockExperiment, mockObservations, mockControl);
      assert.instanceOf(r, Result);
    });
  });

  describe("context", function () {
    it("should return the experiment context", function () {
      result = createResult(mockExperiment, mockObservations, mockControl);
      assert.deepEqual(result.context(), mockExperiment.context());
      assert.deepEqual(result.context(), mockContext);
    });
  });

  describe("experimentName", function () {
    it("should return the experiment name", function () {
      result = createResult(mockExperiment, mockObservations, mockControl);
      assert.deepEqual(result.experimentName(), "foobar");
    });
  });

  describe("matched", function () {
    it("should return true if all of the results matched", function () {
      result = createResult(mockExperiment, mockObservations, mockControl);
      assert.ok(result.matched());
    });

    describe("with mismatched results", function () {
      beforeEach(function () {
        result = createResult(mockExperiment, mockObservations, mockControl);
        result._mismatched = result._mismatched.push(
          new Observation("??", mockExperiment, () => false)
        );
      });

      it("should return false", function () {
        assert.notOk(result.matched());
      });
    });
  });

  describe("mismatched", function () {
    beforeEach(function () {
      result = createResult(mockExperiment, mockObservations, mockControl);
    });

    describe("with mismatched candidates", function () {
      beforeEach(function () {
        result._mismatched = result._mismatched.push(
          new Observation("??", mockExperiment, () => false)
        );
      });

      it("should return true", function () {
        assert.ok(result.mismatched());
      });
    });

    describe("with no mismatched candidates", function () {
      it("should return false", function () {
        assert.notOk(result.mismatched());
      });
    });
  });

  describe("ignored", function () {
    beforeEach(function () {
      result = createResult(mockExperiment, mockObservations, mockControl);
    });

    describe("with no ignored candidates", function () {
      it("should return false", function () {
        assert.notOk(result.ignored());
      });
    });

    describe("with ignored candidates", function () {
      beforeEach(function () {
        result._ignored = result._ignored.push(
          new Observation("??", mockExperiment, () => false)
        );
      });

      it("should return true", function () {
        assert.ok(result.ignored());
      });
    });
  });

  describe("evaluateCandidates", function () {
    beforeEach(function () {
      evaluateCandidatesStub.restore();
    });
    afterEach(function () {
      evaluateCandidatesStub = sinon.stub(
        Result.prototype,
        "evaluateCandidates"
      );
    });

    describe("should collect all equivalent observations", function () {
      beforeEach(function () {
        mockExperiment.observationsAreEquivalent = sinon.stub().returns(true);
        result = createResult(mockExperiment, mockObservations, mockControl);
      });

      it("should leave _mismatched empty", function () {
        assert.equal(result._mismatched.size, 0);
      });

      it("should not ignore any", function () {
        assert.equal(result._ignored.size, 0);
      });
    });

    describe("should collect all mismatched observations", function () {
      beforeEach(function () {
        mockExperiment.observationsAreEquivalent = sinon.stub().returns(false);
        mockExperiment.ignoreMismatchedObservation = sinon
          .stub()
          .returns(false);
        result = createResult(mockExperiment, mockObservations, mockControl);
      });

      it.skip("should populate _mismatched", function () {
        assert.equal(result._mismatched.size, 1);
        assert.deepEqual(
          result._mismatched.first(),
          new Observation("candidate", mockExperiment, () => true)
        );
      });

      it("should not ignore any", function () {
        assert.equal(result._ignored.size, 0);
      });
    });

    describe("should collect all mismatched and ignored observations", function () {
      beforeEach(function () {
        mockExperiment.observationsAreEquivalent = sinon.stub().returns(false);
        mockExperiment.ignoreMismatchedObservation = sinon.stub().returns(true);
        result = createResult(mockExperiment, mockObservations, mockControl);
      });

      it("should not populate _mismatched (goes to ignored)", function () {
        assert.equal(result._mismatched.size, 0);
      });

      it.skip("should ignore them as well", function () {
        assert.equal(result._ignored.size, 1);
        assert.deepEqual(
          result._ignored.first(),
          new Observation("candidate", mockExperiment, () => false)
        );
      });
    });
  });
});
