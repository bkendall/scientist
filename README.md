# Scientist

<!-- [![Coverage Status](https://img.shields.io/coveralls/Runnable/scientist/master.svg?style=flat-square)](https://coveralls.io/github/Runnable/scientist?branch=master) -->

[![NPM Version](https://img.shields.io/npm/v/node-scientist.svg?style=flat-square)](https://www.npmjs.com/package/node-scientist)

A Javascript library for carefully refactoring critical paths. Influenced heavily from [github/scientist](https://github.com/github/scientist).

Scientist is built with and accepts Promises (or Functions that return Promises) in any experiment.

## How to Science!

Here's a quick and dirty example of how to Science!

```typescript
import { Experiment } from "node-scientist";

const experiment = new Experiment<boolean>("getData");
// use: the control. value will be returned by `.run`.
experiment.use(async () => {
  return await Promise.resolve(true);
});
// try: the candidate. value will be reported in `.publish`.
experiment.try(async () => {
  return await new Promise((resolve) => setTimeout(() => resolve(true), 10));
});
// run: run the experiment.
experiment.run().then((result) => {
  // result === true, from `.use`.
  console.log(result);
});
```

<!-- ## Science within Models

```javascript
var Scientist = require('node-scientist')

function MyModel () {}
util.inherits(MyModel, Scientist)

MyModel.prototype.myMethod = function (cb) {
  var experiment = this.science('myMethod', { Experiment: MyExperiment })
  // use: the control. value will be returned by `.run`
  experiment.use(function () { return Promise.resolve().delay(10).return(7) })
  // try: the candidate. value will be reported in `.publish`.
  experiment.try(function () { return Promise.resolve().delay(5).throw(new Error('foo')) })
  // run: run the experiment.
  // NOTE: bluebird allows `.asCallback`, which can help in models w/ callbacks.
  experiment.run().asCallback(cb)
}

var m = new MyModel()
m.myMethod(function (err, value) {
  // err === undefined, candidate error is not passed through.
  // value === 7, from `.use`.
})
``` -->

## Publishing Results

A very simple publisher that will print results to the screen.

```typescript
import { Experiment, Result } from "../src";

class MyExperiment<V> extends Experiment<V> {
  constructor(name: string) {
    super(name);
  }

  /**
   * Publisher function. Takes a result, must return a Promise.
   * @param {Result} result Result object from Scientist.
   * @return {Promise} Promise resolved when publishing is done.
   */
  async publish(result: Result<V>) {
    const control = result.observations.find((o) => o.name === "control");
    const candidate = result.observations.find((o) => o.name === "candidate");
    if (!control) {
      console.error("Could not find control.");
      return false;
    }
    if (!candidate) {
      console.error("Could not find candidate.");
      return false;
    }
    console.log("Results:");
    console.log(
      "Correctness (were the candidates correct?):",
      !result.mismatched() ? "yes" : "no"
    );
    console.log("Values (control, candidate):", control.value, candidate.value);
    console.log("Candidate Time:", candidate.duration);
    console.log("Control Time:", control.duration);
    console.log(
      "Improvement Time (+larger is better):",
      (control.duration || 0) - (candidate.duration || 0)
    );
    return Promise.resolve(true);
  }
}
```

This publisher is used like so:

```typescript
// as the first case, with just an Experiment:
const experiment = new MyExperiment("foobar");
```

<!-- ```typescript
// if you want to include the Scientist in the model:
SomeModel.prototype.myMethod = function (cb) {
  var experiment = this.science('myMethod', { Experiment: MyExperiment })
  // and continue with the experiment...
}
``` -->
