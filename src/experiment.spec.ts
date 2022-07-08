import { assert } from "chai";
import * as sinon from "sinon";

import * as observation from "./observation";
import { Experiment } from "./experiment";

describe("Experiment", () => {
  let experiment: Experiment<string>;

  beforeEach(() => {
    experiment = new Experiment();
  });

  describe("Constructor", () => {
    it("should default the name", () => {
      const e = new Experiment();
      assert.equal(e.name, "experiment");
    });
    it("should accept a name", () => {
      const e = new Experiment("new name");
      assert.equal(e.name, "new name");
    });
  });

  describe("publish", () => {
    it("should run and return true", () => {
      return assert.isFulfilled(experiment.publish());
    });
  });

  describe("beforeRun", () => {
    it("should set the internal beforeRun function", () => {
      const fn = sinon.stub().returns(Promise.resolve(true));
      experiment.beforeRun(fn);
      // assert.deepEqual(experiment._beforeRunFn, fn);
    });
  });

  describe("clean", () => {
    it("should set the internal cleaner function", () => {
      function fn() {
        return "true";
      }
      experiment.clean(fn);
      // assert.deepEqual(experiment._cleanerFn, fn);
    });
  });

  describe("cleanValue", () => {
    it("should return the value if no clean function", () => {
      // assert.isUndefined(experiment._cleanerFn);
      const value = "foo";
      assert.deepEqual(experiment.cleanValue(value), value);
    });

    it("should clean the value if cleaner is defined", () => {
      function fn(value: string) {
        return value + " bar";
      }
      experiment.clean(fn);
      const value = "foo";
      assert.deepEqual(experiment.cleanValue(value), value + " bar");
    });
  });

  describe("compare", () => {
    it("should set the internal comparator function", () => {
      function fn() {
        return true;
      }
      experiment.compare(fn);
      // assert.deepEqual(experiment._comparator, fn);
    });
  });

  describe("context", () => {
    it("should extend the initial context", () => {
      experiment.context({ foo: "bar" });
      // assert.deepEqual(experiment._context, { foo: "bar" });
    });

    it("should ignore it if not passed an object", () => {
      experiment.context("bar");
      // assert.deepEqual(experiment._context, {});
    });
  });

  describe("ignore", () => {
    it("should push a function onto _ignores", () => {
      function fn() {
        return true;
      }
      experiment.ignore(fn);
      // assert.deepEqual(experiment._ignores.first(), fn);
    });
  });

  describe("ignoreMismatchedObservation", () => {
    describe("with no ignore functions", () => {
      it("should return false", () => {
        assert.notOk(experiment.ignoreMismatchedObservation());
      });
    });

    describe("with ignore functions", () => {
      let fail: sinon.SinonStub;
      let pass: sinon.SinonStub;
      const control = { value: "1" } as observation.Observation<string>;
      const candidate = { value: "2" } as observation.Observation<string>;
      beforeEach(() => {
        // order is important here, because Array.prototype.some
        fail = sinon.stub().returns(false);
        pass = sinon.stub().returns(true);
        experiment.ignore(fail);
        experiment.ignore(pass);
      });

      it("should run each ignore function with the values", () => {
        experiment.ignoreMismatchedObservation(control, candidate);
        sinon.assert.calledOnce(fail);
        sinon.assert.calledWithExactly(fail, "1", "2");
        sinon.assert.calledOnce(pass);
        sinon.assert.calledWithExactly(pass, "1", "2");
      });

      it("should return true if any ignore is truthy", () => {
        assert.ok(experiment.ignoreMismatchedObservation(control, candidate));
      });

      it("should return false if no ignore is truthy", () => {
        pass.returns(false);
        assert.notOk(
          experiment.ignoreMismatchedObservation(control, candidate)
        );
      });
    });
  });

  describe("observationsAreEquivalent", () => {
    const control = { value: "1" } as observation.Observation<string>;
    const candidate = { value: "2" } as observation.Observation<string>;

    describe("with a comparator", () => {
      let fn: sinon.SinonStub;
      beforeEach(() => {
        fn = sinon.stub();
        experiment.compare(fn);
      });

      it("should call the comparator with the observations", () => {
        experiment.observationsAreEquivalent(control, candidate);
        sinon.assert.calledOnce(fn);
        sinon.assert.calledWithExactly(fn, control, candidate);
      });

      it("should return the boolean the comparator returns", () => {
        fn.returns(false);
        assert.notOk(experiment.observationsAreEquivalent(control, candidate));
        fn.returns(true);
        assert.ok(experiment.observationsAreEquivalent(control, candidate));
      });
    });

    describe("without a comparator", () => {
      it("should simply compare === the values", () => {
        assert.notOk(experiment.observationsAreEquivalent(control, candidate));
        assert.ok(experiment.observationsAreEquivalent(control, control));
      });
    });
  });

  describe("runIf", () => {
    it("should set _runIfFn", () => {
      function fn() {
        return true;
      }
      experiment.runIf(fn);
      // assert.deepEqual(experiment._runIfFn, fn);
    });
  });

  describe("runIfFuncAllows", () => {
    describe("with no fn", () => {
      it("returns true", () => {
        assert.ok(experiment.runIfFuncAllows());
      });
    });

    describe("with fn", () => {
      it("should obey the given function", () => {
        const fn = sinon.stub().returns(true);
        experiment.runIf(fn);
        assert.ok(experiment.runIfFuncAllows());
        fn.returns(false);
        assert.notOk(experiment.runIfFuncAllows());
      });
    });
  });

  describe("shouldExperimentRun", () => {
    describe("with multiple behaviors", () => {
      beforeEach(() => {
        experiment.use(() => {
          return Promise.resolve(1);
        });
        experiment.try(() => {
          return Promise.resolve(2);
        });
      });

      describe("with no fn", () => {
        it("should return true", () => {
          assert.ok(experiment.shouldExperimentRun());
        });
      });

      describe("with a fn", () => {
        it("should obey the fn", () => {
          const fn = sinon.stub().returns(true);
          experiment.runIf(fn);
          assert.ok(experiment.shouldExperimentRun());
          fn.returns(false);
          assert.notOk(experiment.shouldExperimentRun());
        });
      });
    });

    describe("with no behaviors", () => {
      describe("with no fn", () => {
        it("should return false", () => {
          assert.notOk(experiment.shouldExperimentRun());
        });
      });

      describe("with a fn", () => {
        it("should still return false", () => {
          const fn = sinon.stub().returns(true);
          experiment.runIf(fn);
          assert.notOk(experiment.shouldExperimentRun());
          fn.returns(false);
          assert.notOk(experiment.shouldExperimentRun());
        });
      });
    });

    describe("with manual not enabled", () => {
      it("should return false", () => {
        experiment.enabled = false;
        assert.notOk(experiment.shouldExperimentRun());
      });
    });
  });

  describe("raiseOnMismatches", () => {
    it("should return a boolean from _raiseOnMismatches", () => {
      assert.notOk(experiment.raiseOnMismatches());
      // experiment._raiseOnMismatches = true;
      // assert.ok(experiment.raiseOnMismatches());
    });
  });

  describe("try", () => {
    it("should default the name to candidate", () => {
      const p = function () {
        return Promise.resolve();
      };
      experiment.try(p);
      // assert.equal(experiment._behaviors.size, 1);
      // assert.deepEqual(experiment._behaviors.get("candidate"), p);
    });

    it("should throw if name added twice", () => {
      const p = function () {
        return Promise.resolve();
      };
      experiment.try(p);
      assert.throws(() => {
        experiment.try(p);
      }, /not unique/);
    });

    it("should add with the correct name to behaviors", () => {
      const p = function () {
        return Promise.resolve();
      };
      experiment.try("foo", p);
      // assert.equal(experiment._behaviors.size, 1);
      // assert.deepEqual(experiment._behaviors.get("foo"), p);
    });

    it("should throw an error if we do not give it a function", () => {
      assert.throws(() => {
        experiment.try(true as unknown as () => void);
      }, /Function.+function/);
    });
  });

  describe("use", () => {
    let tryStub: sinon.SinonStub;
    beforeEach(() => {
      tryStub = sinon.stub(Experiment.prototype, "try");
    });

    afterEach(() => {
      tryStub.restore();
    });

    it("should use try to add the control", () => {
      const p = function () {
        return Promise.resolve();
      };
      experiment.use(p);
      sinon.assert.calledOnce(tryStub);
      sinon.assert.calledWithExactly(tryStub, "control", p);
    });
  });

  describe("run", () => {
    it("should throw an error if control behavior is missing", () => {
      return assert.isRejected(experiment.run(), /control.+missing/);
    });

    describe("with behaviors", () => {
      let shouldExperimentRunStub: sinon.SinonStub;
      let publishSpy: sinon.SinonSpy;
      let controlStub: sinon.SinonStub;
      let candidateStub: sinon.SinonStub;

      beforeEach(() => {
        controlStub = sinon.stub().resolves("5");
        candidateStub = sinon.stub().resolves("6");
        experiment.use(controlStub);
        experiment.try(candidateStub);
        publishSpy = sinon.spy(experiment, "publish");
        shouldExperimentRunStub = sinon
          .stub(experiment, "shouldExperimentRun")
          .returns(true);
      });

      afterEach(() => {
        publishSpy.restore();
        shouldExperimentRunStub.restore();
      });

      it("should reject with an error if the specified control is missing", async () => {
        await assert.isRejected(experiment.run("nope"), /nope.+missing/i);
      });

      it("should check if the experiment can be run", async () => {
        await assert.isFulfilled(experiment.run());
        await sinon.assert.calledOnce(shouldExperimentRunStub);
      });

      it("should not run if the experiment should not be run", async () => {
        shouldExperimentRunStub.returns(false);
        await assert.isFulfilled(experiment.run());
        sinon.assert.called(controlStub);
        sinon.assert.notCalled(candidateStub);
      });

      describe("with a run_before function", () => {
        let before: sinon.SinonStub;
        beforeEach(() => {
          before = sinon.stub().resolves(true);
          experiment.beforeRun(before);
        });

        it("should run the before function", async () => {
          await assert.isFulfilled(experiment.run());
          sinon.assert.calledOnce(before);
        });
      });

      it("should reject if for some reason the control got lost", async () => {
        experiment = new Experiment();
        await assert.isRejected(
          experiment.run(),
          /control behavior is missing/i
        );
      });

      it("should run each of the behaviors", async () => {
        await assert.isFulfilled(experiment.run());
        sinon.assert.calledOnce(controlStub);
        sinon.assert.calledOnce(candidateStub);
      });

      it("should publish the result", async () => {
        await assert.isFulfilled(experiment.run());
        sinon.assert.calledOnce(publishSpy);
      });

      // TODO(bkendall): introduce an API to change this property.
      // describe("if raising on mismatches", () => {
      //   beforeEach(() => {
      //     experiment._raiseOnMismatches = true;
      //   });

      //   it("should throw a MismatchError if a result mismatched", () => {
      //     mockResult.mismatched.returns(true);
      //     return assert.isRejected(experiment.run(), MismatchError, "control");
      //   });

      //   it("should not throw if a result is not mismatched", () => {
      //     return assert.isFulfilled(experiment.run());
      //   });
      // });

      describe("if the control raised", () => {
        beforeEach(() => {
          experiment = new Experiment();
          experiment.use(sinon.stub().throws(new Error("no go")));
          experiment.try(sinon.stub().returns("6"));
        });

        it("should throw the exception again", async () => {
          await assert.isRejected(experiment.run(), Error, "no go");
        });
      });

      describe("on a successful control", () => {
        it("should return the control value", async () => {
          const value = experiment.run();
          await assert.isFulfilled(value);
          assert.equal(await value, "5");
        });
      });
    });
  });
});
