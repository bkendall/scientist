import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const assert = chai.assert;

import * as sinon from "sinon";

import { Observation } from "./observation";
import { Experiment } from "./experiment";

describe("Experiment", function () {
  let experiment: Experiment<string>;

  beforeEach(function () {
    experiment = new Experiment();
  });

  describe("Constructor", function () {
    it("should default the name", function () {
      const e = new Experiment();
      assert.equal(e.name, "experiment");
    });
    it("should accept a name", function () {
      const e = new Experiment("new name");
      assert.equal(e.name, "new name");
    });
  });

  describe("publish", function () {
    it("should run and return true", function () {
      return assert.isFulfilled(experiment.publish());
    });
  });

  describe("beforeRun", function () {
    it("should set the internal beforeRun function", function () {
      const fn = sinon.stub().returns(Promise.resolve(true));
      experiment.beforeRun(fn);
      // assert.deepEqual(experiment._beforeRunFn, fn);
    });
  });

  describe("clean", function () {
    it("should set the internal cleaner function", function () {
      function fn() {
        return "true";
      }
      experiment.clean(fn);
      // assert.deepEqual(experiment._cleanerFn, fn);
    });
  });

  describe("cleanValue", function () {
    it("should return the value if no clean function", function () {
      // assert.isUndefined(experiment._cleanerFn);
      const value = "foo";
      assert.deepEqual(experiment.cleanValue(value), value);
    });

    it("should clean the value if cleaner is defined", function () {
      function fn(value: string) {
        return value + " bar";
      }
      experiment.clean(fn);
      const value = "foo";
      assert.deepEqual(experiment.cleanValue(value), value + " bar");
    });
  });

  describe("compare", function () {
    it("should set the internal comparator function", function () {
      function fn() {
        return true;
      }
      experiment.compare(fn);
      // assert.deepEqual(experiment._comparator, fn);
    });
  });

  describe("context", function () {
    it("should extend the initial context", function () {
      experiment.context({ foo: "bar" });
      // assert.deepEqual(experiment._context, { foo: "bar" });
    });

    it("should ignore it if not passed an object", function () {
      experiment.context("bar");
      // assert.deepEqual(experiment._context, {});
    });
  });

  describe("ignore", function () {
    it("should push a function onto _ignores", function () {
      function fn() {
        return true;
      }
      experiment.ignore(fn);
      // assert.deepEqual(experiment._ignores.first(), fn);
    });
  });

  describe("ignoreMismatchedObservation", function () {
    describe("with no ignore functions", function () {
      it("should return false", function () {
        assert.notOk(experiment.ignoreMismatchedObservation());
      });
    });

    describe("with ignore functions", function () {
      let fail: sinon.SinonStub;
      let pass: sinon.SinonStub;
      const control = { value: "1" } as Observation<string>;
      const candidate = { value: "2" } as Observation<string>;
      beforeEach(function () {
        // order is important here, because Array.prototype.some
        fail = sinon.stub().returns(false);
        pass = sinon.stub().returns(true);
        experiment.ignore(fail);
        experiment.ignore(pass);
      });

      it("should run each ignore function with the values", function () {
        experiment.ignoreMismatchedObservation(control, candidate);
        sinon.assert.calledOnce(fail);
        sinon.assert.calledWithExactly(fail, "1", "2");
        sinon.assert.calledOnce(pass);
        sinon.assert.calledWithExactly(pass, "1", "2");
      });

      it("should return true if any ignore is truthy", function () {
        assert.ok(experiment.ignoreMismatchedObservation(control, candidate));
      });

      it("should return false if no ignore is truthy", function () {
        pass.returns(false);
        assert.notOk(
          experiment.ignoreMismatchedObservation(control, candidate)
        );
      });
    });
  });

  describe("observationsAreEquivalent", function () {
    const control = { value: "1" } as Observation<string>;
    const candidate = { value: "2" } as Observation<string>;

    describe("with a comparator", function () {
      let fn: sinon.SinonStub;
      beforeEach(function () {
        fn = sinon.stub();
        experiment.compare(fn);
      });

      it("should call the comparator with the observations", function () {
        experiment.observationsAreEquivalent(control, candidate);
        sinon.assert.calledOnce(fn);
        sinon.assert.calledWithExactly(fn, control, candidate);
      });

      it("should return the boolean the comparator returns", function () {
        fn.returns(false);
        assert.notOk(experiment.observationsAreEquivalent(control, candidate));
        fn.returns(true);
        assert.ok(experiment.observationsAreEquivalent(control, candidate));
      });
    });

    describe("without a comparator", function () {
      it("should simply compare === the values", function () {
        assert.notOk(experiment.observationsAreEquivalent(control, candidate));
        assert.ok(experiment.observationsAreEquivalent(control, control));
      });
    });
  });

  describe("runIf", function () {
    it("should set _runIfFn", function () {
      function fn() {
        return true;
      }
      experiment.runIf(fn);
      // assert.deepEqual(experiment._runIfFn, fn);
    });
  });

  describe("runIfFuncAllows", function () {
    describe("with no fn", function () {
      it("returns true", function () {
        assert.ok(experiment.runIfFuncAllows());
      });
    });

    describe("with fn", function () {
      it("should obey the given function", function () {
        const fn = sinon.stub().returns(true);
        experiment.runIf(fn);
        assert.ok(experiment.runIfFuncAllows());
        fn.returns(false);
        assert.notOk(experiment.runIfFuncAllows());
      });
    });
  });

  describe("shouldExperimentRun", function () {
    describe("with multiple behaviors", function () {
      beforeEach(function () {
        experiment.use(function () {
          return Promise.resolve(1);
        });
        experiment.try(function () {
          return Promise.resolve(2);
        });
      });

      describe("with no fn", function () {
        it("should return true", function () {
          assert.ok(experiment.shouldExperimentRun());
        });
      });

      describe("with a fn", function () {
        it("should obey the fn", function () {
          const fn = sinon.stub().returns(true);
          experiment.runIf(fn);
          assert.ok(experiment.shouldExperimentRun());
          fn.returns(false);
          assert.notOk(experiment.shouldExperimentRun());
        });
      });
    });

    describe("with no behaviors", function () {
      describe("with no fn", function () {
        it("should return false", function () {
          assert.notOk(experiment.shouldExperimentRun());
        });
      });

      describe("with a fn", function () {
        it("should still return false", function () {
          const fn = sinon.stub().returns(true);
          experiment.runIf(fn);
          assert.notOk(experiment.shouldExperimentRun());
          fn.returns(false);
          assert.notOk(experiment.shouldExperimentRun());
        });
      });
    });

    describe("with manual not enabled", function () {
      it("should return false", function () {
        experiment.enabled = false;
        assert.notOk(experiment.shouldExperimentRun());
      });
    });
  });

  describe("raiseOnMismatches", function () {
    it("should return a boolean from _raiseOnMismatches", function () {
      assert.notOk(experiment.raiseOnMismatches());
      // experiment._raiseOnMismatches = true;
      // assert.ok(experiment.raiseOnMismatches());
    });
  });

  describe("try", function () {
    it("should default the name to candidate", function () {
      const p = function () {
        return Promise.resolve();
      };
      experiment.try(p);
      // assert.equal(experiment._behaviors.size, 1);
      // assert.deepEqual(experiment._behaviors.get("candidate"), p);
    });

    it("should throw if name added twice", function () {
      const p = function () {
        return Promise.resolve();
      };
      experiment.try(p);
      assert.throws(function () {
        experiment.try(p);
      }, /not unique/);
    });

    it("should add with the correct name to behaviors", function () {
      const p = function () {
        return Promise.resolve();
      };
      experiment.try("foo", p);
      // assert.equal(experiment._behaviors.size, 1);
      // assert.deepEqual(experiment._behaviors.get("foo"), p);
    });

    it("should throw an error if we do not give it a function", function () {
      assert.throws(function () {
        experiment.try(true as unknown as () => void);
      }, /Function.+function/);
    });
  });

  describe("use", function () {
    let tryStub: sinon.SinonStub;
    beforeEach(function () {
      tryStub = sinon.stub(Experiment.prototype, "try");
    });

    afterEach(function () {
      tryStub.restore();
    });

    it("should use try to add the control", function () {
      const p = function () {
        return Promise.resolve();
      };
      experiment.use(p);
      sinon.assert.calledOnce(tryStub);
      sinon.assert.calledWithExactly(tryStub, "control", p);
    });
  });

  // describe("run", function () {
  //   it("should throw an error if control behavior is missing", function () {
  //     return assert.isRejected(experiment.run(), Error, /control.+missing/);
  //   });

  //   describe("with behaviors", function () {
  //     let observations: Observation<any>[];
  //     const mockResult = {};
  //     beforeEach(function () {
  //       observations = [];
  //       experiment.use(sinon.stub().returns(Promise.resolve(5))); // control
  //       experiment.try(sinon.stub().returns(Promise.resolve(6))); // candidate
  //       sinon
  //         .stub(Experiment.prototype, "publish")
  //         .returns(Promise.resolve(true));
  //       sinon.stub(Experiment.prototype, "shouldExperimentRun").returns(true);
  //       sinon.stub(Observation, "create", function (key, experiment, fn) {
  //         let e;
  //         return Promise.resolve()
  //           .then(function () {
  //             return fn();
  //           })
  //           .catch(function (err) {
  //             e = err;
  //           })
  //           .then(function (value) {
  //             const o = {
  //               raised: sinon.stub().returns(!!e),
  //               name: key,
  //               value: value,
  //               exception: e,
  //             };
  //             observations.push(o);
  //             return o;
  //           });
  //       });
  //       mockResult.mismatched = sinon.stub().returns(false);
  //       sinon.stub(Result, "create").returns(mockResult);
  //       sinon.spy(KnuthShuffle, "knuthShuffle");
  //     });

  //     afterEach(function () {
  //       Experiment.prototype.publish.restore();
  //       Experiment.prototype.shouldExperimentRun.restore();
  //       createObservation.restore();
  //       createResult.restore();
  //       KnuthShuffle.knuthShuffle.restore();
  //     });

  //     it("should reject with an error if the specified control is missing", function () {
  //       return assert.isRejected(
  //         experiment.run("nope"),
  //         Error,
  //         /nope.+missing/i
  //       );
  //     });

  //     it("should check if the experiment can be run", function () {
  //       return assert.isFulfilled(experiment.run()).then(function () {
  //         sinon.assert.calledOnce(Experiment.prototype.shouldExperimentRun);
  //       });
  //     });

  //     it("should not run if the experiment should not be run", function () {
  //       Experiment.prototype.shouldExperimentRun.returns(false);
  //       return assert.isFulfilled(experiment.run()).then(function () {
  //         sinon.assert.notCalled(KnuthShuffle.knuthShuffle);
  //       });
  //     });

  //     describe("with a run_before function", function () {
  //       let before;
  //       beforeEach(function () {
  //         before = sinon.stub().returns(Promise.resolve(true));
  //         experiment.beforeRun(before);
  //       });

  //       it("should run the before function", function () {
  //         return assert.isFulfilled(experiment.run()).then(function () {
  //           sinon.assert.calledOnce(before);
  //         });
  //       });
  //     });

  //     it("should shuffle the behaviors before running them", function () {
  //       return assert.isFulfilled(experiment.run()).then(function () {
  //         sinon.assert.calledOnce(KnuthShuffle.knuthShuffle);
  //         // the keys will be in a random order, so have to check this way
  //         const keys = KnuthShuffle.knuthShuffle.firstCall.args[0];
  //         assert.lengthOf(keys, 2);
  //         assert.include(keys, "control");
  //         assert.include(keys, "candidate");
  //       });
  //     });

  //     it("should create observations for each behavior", function () {
  //       return assert.isFulfilled(experiment.run()).then(function () {
  //         sinon.assert.calledTwice(createObservation);
  //         sinon.assert.calledWithExactly(
  //           createObservation,
  //           "control",
  //           experiment,
  //           experiment._behaviors.get("control")
  //         );
  //         sinon.assert.calledWithExactly(
  //           createObservation,
  //           "candidate",
  //           experiment,
  //           experiment._behaviors.get("candidate")
  //         );
  //       });
  //     });

  //     it("should reject if for some reason the control got lost", function () {
  //       KnuthShuffle.knuthShuffle.restore();
  //       sinon.stub(KnuthShuffle, "knuthShuffle").returns([]);
  //       return assert.isRejected(
  //         experiment.run(),
  //         Error,
  //         /could not find control observation/i
  //       );
  //     });

  //     it("should run each of the behaviors", function () {
  //       return assert.isFulfilled(experiment.run()).then(function () {
  //         sinon.assert.calledOnce(experiment._behaviors.get("control"));
  //         sinon.assert.calledOnce(experiment._behaviors.get("candidate"));
  //       });
  //     });

  //     it("should create a result object with the observations", function () {
  //       return assert.isFulfilled(experiment.run()).then(function () {
  //         const control = observations.find((c) => c.name === "control");
  //         sinon.assert.calledOnce(createResult);
  //         sinon.assert.calledWithExactly(
  //           createResult,
  //           experiment,
  //           observations,
  //           control
  //         );
  //       });
  //     });

  //     it("should publish the result", function () {
  //       return assert.isFulfilled(experiment.run()).then(function () {
  //         sinon.assert.calledOnce(Experiment.prototype.publish);
  //         sinon.assert.calledWithExactly(
  //           Experiment.prototype.publish,
  //           mockResult
  //         );
  //       });
  //     });

  //     describe("if raising on mismatches", function () {
  //       beforeEach(function () {
  //         experiment._raiseOnMismatches = true;
  //       });

  //       it("should throw a MismatchError if a result mismatched", function () {
  //         mockResult.mismatched.returns(true);
  //         return assert.isRejected(experiment.run(), MismatchError, "control");
  //       });

  //       it("should not throw if a result is not mismatched", function () {
  //         return assert.isFulfilled(experiment.run());
  //       });
  //     });

  //     describe("if the control raised", function () {
  //       beforeEach(function () {
  //         const error = new Error("ponos");
  //         experiment._behaviors = experiment._behaviors.set(
  //           "control",
  //           sinon.stub().returns(Promise.reject(error))
  //         );
  //       });

  //       it("should throw the exception again", function () {
  //         return assert.isRejected(experiment.run(), Error, "ponos");
  //       });
  //     });

  //     describe("on a successful control", function () {
  //       it("should return the control value", function () {
  //         return assert.isFulfilled(experiment.run()).then(function (value) {
  //           assert.equal(value, 5);
  //         });
  //       });
  //     });
  //   });
  // });
});
