import { List } from "immutable";
import Debug from "debug";

import { Experiment } from "./experiment.js";
import { Observation } from "./observation.js";

const debug = Debug("scientist:result");

/**
 * Create a new Result.
 * @param {Experiment} experiment Experiment to which this result belongs.
 * @param {Array<Observation>} observations Array of Observations in execution
 *   order.
 * @param {Observation} control Observation of the control.
 * @return {Result} New Result.
 */
export function create<V>(
  experiment: Experiment<V>,
  observations: Array<Observation<V>>,
  control: Observation<V>,
): Result<V> {
  debug("create");
  return new Result(experiment, observations, control);
}

export class Result<V> {
  private ignoredList: List<Observation<V>>;
  private mismatchedList: List<Observation<V>>;
  candidates: List<Observation<V>>;
  control: Observation<V>;
  experiment: Experiment<V>;
  observations: Array<Observation<V>>;

  constructor(
    experiment: Experiment<V>,
    observations: Array<Observation<V>>,
    control: Observation<V>,
  ) {
    debug("constructor");
    this.experiment = experiment;
    this.observations = observations;
    this.control = control;

    this.candidates = List(observations);
    this.candidates = List(
      this.candidates.filterNot((c) => c?.name === "control"),
    );

    this.mismatchedList = List();
    this.ignoredList = List();

    this.evaluateCandidates();
  }

  /**
   * Get the Experiment's context.
   * @return {Object} Experiment's context.
   */
  context(): unknown {
    debug("context");
    return this.experiment.context();
  }

  /**
   * Get the Experiment's name.
   * @return {String} Experiment's name.
   */
  experimentName(): string {
    debug("experimentName");
    return this.experiment.name;
  }

  /**
   * Was the result a match between all behaviors?
   * @return {Boolean} Returns true if all the results are equivalent.
   */
  matched(): boolean {
    debug("matched");
    return this.mismatchedList.size === 0 && !this.ignored();
  }

  /**
   * Were there mismatches in the behaviors?
   * @return {Boolean} Returns true if there were mismatched behaviors.
   */
  mismatched(): boolean {
    debug("mismatched");
    return this.mismatchedList.size > 0;
  }

  /**
   * Were there any mismatches that were ignored?
   * @return {Boolean} Returns true if there were any ignored mismatches.
   */
  ignored(): boolean {
    debug("ignored");
    return this.ignoredList.size > 0;
  }

  /**
   * Look through the candidates to find mismatched and ignored results. Sets
   * ._mismatched and ._ignored with appropriate candidates.
   * @private
   */
  evaluateCandidates(): void {
    const mismatched = this.candidates.filter((candidate) => {
      return (
        candidate &&
        !this.experiment.observationsAreEquivalent(this.control, candidate)
      );
    });

    mismatched.forEach((candidate) => {
      const ignore = this.experiment.ignoreMismatchedObservation(
        this.control,
        candidate,
      );
      if (ignore) {
        this.ignoredList = this.ignoredList.push(candidate);
      } else {
        this.mismatchedList = this.mismatchedList.push(candidate);
      }
    });
  }
}
