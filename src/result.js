/* @flow */

import Debug from 'debug'
import hasProperties from '101/has-properties'
import { List } from 'immutable'

import Experiment from './experiment'
import Observation from './observation'

const debug = Debug('scientist:result')

class Result {
  _ignored: List<Observation>;
  _mismatched: List<Observation>;
  candidates: List<Observation>;
  control: Observation;
  experiment: Experiment;
  observations: Array<Observation>;

  constructor (
    experiment: Experiment,
    observations: Array<Observation>,
    control: Observation
  ) {
    debug('constructor')
    this.experiment = experiment
    this.observations = observations
    this.control = control

    this.candidates = List(observations)
    this.candidates = this.candidates.filterNot(hasProperties({ name: 'control' }))

    this._mismatched = List()
    this._ignored = List()

    this.evaluate_candidates()
  }

  /**
   * Create a new Result.
   * @param {Experiment} experiment Experiment to which this result belongs.
   * @param {Array<Observation>} observations Array of Observations in execution
   *   order.
   * @param {Observation} control Observation of the control.
   * @return {Result} New Result.
   */
  static create (
    experiment: Experiment,
    observations: Array<Observation>,
    control: Observation
  ) {
    debug('create')
    return new Result(experiment, observations, control)
  }

  /**
   * Get the Experiment's context.
   * @return {Object} Experiment's context.
   */
  context (): Object {
    debug('context')
    return this.experiment.context()
  }

  /**
   * Get the Experiment's name.
   * @return {String} Experiment's name.
   */
  experiment_name (): string {
    debug('experiment_name')
    return this.experiment.name
  }

  /**
   * Was the result a match between all behaviors?
   * @return {Boolean} Returns true if all the results are equivalent.
   */
  matched (): boolean {
    debug('matched')
    return this._mismatched.size === 0 && !this.ignored()
  }

  /**
   * Were there mismatches in the behaviors?
   * @return {Boolean} Returns true if there were mismatched behaviors.
   */
  mismatched (): boolean {
    debug('mismatched')
    return this._mismatched.size > 0
  }

  /**
   * Were there any mismatches that were ignored?
   * @return {Boolean} Returns true if there were any ignored mismatches.
   */
  ignored (): boolean {
    debug('ignored')
    return this._ignored.size > 0
  }

  /**
   * Look through the candidates to find mismatched and ignored results. Sets
   * ._mismatched and ._ignored with appropriate candidates.
   * @private
   */
  evaluate_candidates () {
    let mismatched = this.candidates.filter((candidate) => {
      return !this.experiment.observations_are_equivalent(this.control, candidate)
    })

    mismatched.forEach((candidate) => {
      if (this.experiment.ignore_mismatched_observation(this.control, candidate)) {
        this._ignored = this._ignored.push(candidate)
      } else {
        this._mismatched = this._mismatched.push(candidate)
      }
    })
  }
}

export default Result
