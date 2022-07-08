import { List, Map } from "immutable";
import Debug from "debug";
import KnuthShuffle from "knuth-shuffle";

import { MismatchError } from "./errors/mismatch-error";
import { Observation, create as createObservation } from "./observation";
import { create as createResult } from "./result";

const debug = Debug("scientist:experiment");

const isObject = (val: unknown): boolean => {
  return (
    typeof val === "object" &&
    val !== undefined &&
    val !== null &&
    !Array.isArray(val) &&
    !(val instanceof RegExp) &&
    !(val instanceof String) &&
    !(val instanceof Number)
  );
};

const isFunction = (f: unknown): boolean => {
  return typeof f === "function";
};

export class Experiment<V> {
  private beforeRunFn?: (...rest: Array<unknown>) => boolean;
  private behaviors: Map<string, (...rest: Array<unknown>) => V>;
  private cleanerFn?: (value: V) => V;
  private comparator?: (a: Observation<V>, b: Observation<V>) => boolean;
  private ignores: List<(control: V, observation: V) => boolean>;
  private runIfFn?: (...rest: Array<unknown>) => boolean;
  private savedContext: unknown;
  private savedRaiseOnMismatches: boolean;
  enabled: boolean;
  name: string;

  constructor(name = "experiment") {
    debug("constructor");
    this.name = name;
    this.enabled = true;
    this.behaviors = Map();
    this.savedContext = {};
    this.ignores = List();
    this.savedRaiseOnMismatches = false;
  }

  publish(result?: unknown): Promise<boolean> {
    debug("publish", result);
    return Promise.resolve(true);
  }

  /**
   * Define a Function to run before an experiment begins, if the experiment is
   * enabled.
   * @param {Function} fn Function to run.
   */
  beforeRun(fn: () => boolean) {
    debug("beforeRun");
    this.beforeRunFn = fn;
  }

  /**
   * Define a function to clean a value for publishing or storing.
   * @param {Function} fn Function to clean the value. Must take one argument,
   *   the value to be cleaned.
   */
  clean(fn: (value: V) => V): void {
    debug("clean");
    this.cleanerFn = fn;
  }

  /**
   * Cleans a value with a configured clean block or just returns the value.
   * @private
   * @param {Object} value Value to be cleaned.
   * @return {Object} Cleaned (if applicable) value.
   */
  cleanValue(value: V): V {
    debug("cleanValue");
    if (this.cleanerFn && isFunction(this.cleanerFn)) {
      return this.cleanerFn(value);
    } else {
      return value;
    }
  }

  /**
   * Define a function to compare two experimental values.
   * @param {Function} fn Function to compare. Must accept two arguments, the
   *   control and candidate values, and return true or false.
   */
  compare(fn: (a: Observation<V>, b: Observation<V>) => boolean): void {
    debug("compare");
    this.comparator = fn;
  }

  /**
   * Get or add to the extra experiment data.
   * @param {[Object]} context Extra data to add.
   * @return {Object} Extra experiment data.
   */
  context(context?: unknown): unknown {
    debug("context");
    if (context && isObject(context)) {
      this.savedContext = Object.assign({}, this.savedContext, context);
    }
    return this.savedContext;
  }

  /**
   * Configure experiment to ignore an observation with the given function. The
   * function takes two arguments, the control and the candidate observation
   * that do not match. If the function returns true, the mismatch is discarded.
   * @param {Function} fn Function that returns a boolean about a match.
   */
  ignore(fn: (control: V, observation: V) => boolean): void {
    debug("ignore");
    this.ignores = this.ignores.push(fn);
  }

  /**
   * Iterates through ignore functions to determine if a mismatch should be
   * ignored.
   * @private
   * @param {Object} control Control value.
   * @param {Object} candidate Candidate value that mismatches.
   * @return {boolean} Returns true if the pair should be ignored.
   */
  ignoreMismatchedObservation(
    control?: Observation<V>,
    candidate?: Observation<V>
  ): boolean {
    debug("ignoreMismatchedObservation");
    if (this.ignores.size === 0) {
      return false;
    }
    return this.ignores.some((fn) =>
      fn ? fn(control?.value as V, candidate?.value as V) : false
    );
  }

  /**
   * Compare two observations using the configured comparator, if present.
   * @private
   * @param {Observation} control Control Observation.
   * @param {Observation} candidate Candidate Observation.
   * @return {Boolean} True if the two observations are equivalent.
   */
  observationsAreEquivalent(
    control: Observation<V>,
    candidate: Observation<V>
  ): boolean {
    debug("observationsAreEquivalent");
    if (this.comparator && isFunction(this.comparator)) {
      return this.comparator(control, candidate);
    } else {
      const sameValues = control.value === candidate.value;
      const sameException = control.exception === candidate.exception;
      return sameValues && sameException;
    }
  }

  /**
   * Run all behaviors for the experiment, observing each and publishing
   * results. Return the result of the named behavior, default "control".
   * @private
   * @param {String} name Name of the behavior to run. Default: "control"
   * @return {Object} Result of the control behavior.
   */
  async run(name = "control"): Promise<V> {
    debug("run");
    const controlFunc = this.behaviors.get(name);
    if (!isFunction(controlFunc)) {
      throw new Error(`${name} behavior is missing.`);
    }

    if (controlFunc && !this.shouldExperimentRun()) {
      return controlFunc();
    }

    if (this.beforeRunFn && isFunction(this.beforeRunFn)) {
      this.beforeRunFn();
    }

    const promises: Promise<Observation<V>>[] = [];

    const shuffle = KnuthShuffle.knuthShuffle;
    shuffle(this.behaviors.keySeq().toArray()).forEach((key) => {
      const fn = this.behaviors.get(key);
      if (!fn) {
        throw new Error("Cannot create observation without fn");
      }
      promises.push(createObservation(key, this, fn));
    });

    const observations = await Promise.all(promises);

    const control = observations.find((o) => o.name === name);
    if (!control) {
      throw new Error(`Could not find control observation (${name})`);
    }
    const result = createResult(this, observations, control);

    await this.publish(result);

    if (this.raiseOnMismatches() && result.mismatched()) {
      throw new MismatchError(name, result);
    }
    if (control.raised()) {
      throw control.exception;
    } else {
      return control.value as V;
    }
  }

  /**
   * Define a function that determines if the experiment can be run.
   * @param {Function} fn Function determining fate of experiment. Returns true
   *   or false.
   */
  runIf(fn: () => boolean): void {
    debug("runIf");
    this.runIfFn = fn;
  }

  /**
   * Does the _runIfFn allow the experiment to run?
   * @private
   * @return {Boolean} True if the _runIfFn returns true.
   */
  runIfFuncAllows(): boolean {
    debug("runIfFuncAllows");
    return this.runIfFn && isFunction(this.runIfFn) ? this.runIfFn() : true;
  }

  /**
   * Determine if the experiment should be run.
   * @return {Boolean} True if the experiment is allowed to run.
   */
  shouldExperimentRun(): boolean {
    debug("shouldExperimentRun");
    return this.behaviors.size > 1 && this.enabled && this.runIfFuncAllows();
  }

  /**
   * Determine if mismatch errors should be thrown.
   * @return {[type]} [description]
   */
  raiseOnMismatches(): boolean {
    debug("raiseOnMismatches");
    return !!this.savedRaiseOnMismatches;
  }

  // FIXME(@bkendall): I dislike this...
  try(name: string | (() => unknown), fn?: () => unknown): void {
    debug("try");
    if (typeof name === "function") {
      fn = name;
      name = "candidate";
    }
    if (this.behaviors.has(name)) {
      throw new Error(`Name (${name}) is not unique for behavior`);
    }
    if (typeof fn !== "function") {
      throw new Error(".try: Function is not a function.");
    }
    this.behaviors = this.behaviors.set(name, fn as (...rest: unknown[]) => V);
  }

  use(fn: () => unknown): void {
    debug("use");
    this.try("control", fn);
  }
}
