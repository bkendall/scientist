import { assert } from "chai";
import * as sinon from "sinon";

import { Experiment } from "./experiment.js";
import { Observation, create as createObservation } from "./observation.js";

describe("Observation", () => {
  const mockExperiment = new Experiment();
  let testFn: sinon.SinonStub;

  beforeEach(() => {
    testFn = sinon.stub().returns(5);
    mockExperiment.cleanValue = sinon.stub().returnsArg(0);
  });

  describe("create", () => {
    it("should return a promse resolving in an observation", () => {
      function runThis() {
        return Promise.resolve().then(testFn);
      }
      return assert
        .isFulfilled(createObservation("foo", mockExperiment, runThis))
        .then((observation) => {
          assert.instanceOf(observation, Observation);
        });
    });

    it("should run the given test function", () => {
      function runThis() {
        return Promise.resolve().then(testFn);
      }
      return assert
        .isFulfilled(createObservation("foo", mockExperiment, runThis))
        .then(() => {
          sinon.assert.calledOnce(testFn);
        });
    });

    it("should record the value", () => {
      function runThis() {
        return Promise.resolve().then(testFn);
      }
      const o = createObservation("foo", mockExperiment, runThis);
      return assert.isFulfilled(o);
      // .then(function (observation) {
      //   assert.equal(observation.value, 5);
      // });
    });

    it("should record a duration", () => {
      function runThis() {
        return new Promise((resolve) => {
          setTimeout(resolve, 5);
        });
      }
      return assert.isFulfilled(
        createObservation("foo", mockExperiment, runThis),
      );
      // .then(function (observation) {
      //   assert.isAbove(observation.duration, 4);
      // });
    });

    it("should record an exception, if thrown", () => {
      const error = new Error("foobar");
      function runThis() {
        return Promise.reject(error);
      }
      return assert.isFulfilled(
        createObservation("foo", mockExperiment, runThis),
      );
      // .then(function (observation) {
      //   assert.equal(observation.exception, error);
      // });
    });
  });

  describe("cleanedValue", () => {
    it("should clean the stored value", () => {
      function runThis() {
        return Promise.resolve().then(testFn);
      }
      return assert.isFulfilled(
        createObservation("foo", mockExperiment, runThis),
      );
      // .then(function (observation) {
      //   const value = observation.cleanedValue();
      //   assert.equal(value, 5);
      //   sinon.assert.calledOnce(mockExperiment.cleanValue);
      //   sinon.assert.calledWith(mockExperiment.cleanValue, 5);
      // });
    });

    it("should return undfined if no value", () => {
      function runThis() {
        return Promise.resolve().then(testFn);
      }
      return assert.isFulfilled(
        createObservation("foo", mockExperiment, runThis),
      );
      // .then(function (observation) {
      //   delete observation.value;
      //   var value = observation.cleanedValue();
      //   assert.equal(value, undefined);
      //   sinon.assert.notCalled(mockExperiment.cleanValue);
      // });
    });
  });

  describe("raised", () => {
    it("should return true if there was an exception", () => {
      const error = new Error("foobar");
      function runThis() {
        return Promise.reject(error);
      }
      return assert.isFulfilled(
        createObservation("foo", mockExperiment, runThis),
      );
      // .then(function (observation) {
      //   assert.equal(observation.raised(), true);
      // });
    });

    it("should return false if there was no exception", () => {
      function runThis() {
        return Promise.resolve(5);
      }
      return assert.isFulfilled(
        createObservation("foo", mockExperiment, runThis),
      );
      // .then(function (observation) {
      //   assert.equal(observation.raised(), false);
      // });
    });
  });

  describe("equivalent_to", () => {
    let observation: Observation<unknown>;
    let equalObservation: Observation<unknown>;
    let notEqualObservation: Observation<unknown>;
    let throwsObservation: Observation<unknown>;
    let equalThrowsObservation: Observation<unknown>;
    let notEqualThrowsObservation: Observation<unknown>;
    const error = new Error("foobar");
    const otherError = new Error("asdf");

    beforeEach(() => {
      return Promise.resolve()
        .then(() => {
          function runThis() {
            return Promise.resolve(5);
          }
          return createObservation("foo", mockExperiment, runThis).then((o) => {
            observation = o;
          });
        })
        .then(() => {
          function runThis() {
            return Promise.resolve(5);
          }
          return createObservation("bar", mockExperiment, runThis).then((o) => {
            equalObservation = o;
          });
        })
        .then(() => {
          function runThis() {
            return Promise.resolve(6);
          }
          return createObservation("baz", mockExperiment, runThis).then((o) => {
            notEqualObservation = o;
          });
        })
        .then(() => {
          function runThis() {
            return Promise.reject(error);
          }
          return createObservation("nope", mockExperiment, runThis).then(
            (o) => {
              throwsObservation = o;
            },
          );
        })
        .then(() => {
          function runThis() {
            return Promise.reject(error);
          }
          return createObservation("alsono", mockExperiment, runThis).then(
            (o) => {
              equalThrowsObservation = o;
            },
          );
        })
        .then(() => {
          function runThis() {
            return Promise.reject(otherError);
          }
          return createObservation("nonono", mockExperiment, runThis).then(
            (o) => {
              notEqualThrowsObservation = o;
            },
          );
        });
    });

    it("should return false if passed not an Observation", () => {
      assert.notOk(
        observation.equivalentTo({} as Observation<unknown>),
        "object is invalid",
      );
      assert.notOk(
        observation.equivalentTo("foo" as unknown as Observation<unknown>),
        "string is invalid",
      );
      assert.notOk(
        observation.equivalentTo(4 as unknown as Observation<unknown>),
        "number is invalid",
      );
    });

    describe("with no exceptions", () => {
      it("should return true if compared with equivalent Observation value", () => {
        assert.ok(observation.equivalentTo(observation), "equal to self");
        assert.ok(
          observation.equivalentTo(equalObservation),
          "equal to equivalent",
        );
      });

      it("should return false if compared with non equivalent Observation value", () => {
        assert.notOk(
          observation.equivalentTo(notEqualObservation),
          "not equal to other",
        );
      });
    });

    describe("when exceptions are thrown", () => {
      it("should return true if compared with equivalent Observation error", () => {
        assert.ok(
          throwsObservation.equivalentTo(throwsObservation),
          "equal to self",
        );
        assert.ok(
          throwsObservation.equivalentTo(equalThrowsObservation),
          "equal to equivalent",
        );
      });

      it("should return false if compared with non equivalent Observation error", () => {
        assert.notOk(
          throwsObservation.equivalentTo(notEqualThrowsObservation),
          "not equal to other",
        );
      });

      it("should return false if compared with Observation with no error", () => {
        assert.notOk(
          observation.equivalentTo(throwsObservation),
          "not equal to error",
        );
        assert.notOk(
          throwsObservation.equivalentTo(observation),
          "not equal to valid",
        );
      });
    });

    describe("when a comparator function is passed", () => {
      it("should use the comparator to compare the values", () => {
        const compare = sinon.stub().returns(true);
        assert.ok(
          observation.equivalentTo(notEqualObservation, compare),
          "equal when forced",
        );
      });
    });
  });
});
