class MismatchError<T> extends Error {
  result?: T;

  constructor(message: string, result?: T) {
    super(message);
    this.result = result;
  }
}

export default MismatchError;
