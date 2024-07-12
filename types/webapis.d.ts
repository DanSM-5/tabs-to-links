interface PromiseConstructor {
  withResolvers: <T>() => {
    promise: Promise<T>;
    reject: Promise.reject;
    resolve: Promise.resolve<T>;
  }
}

interface ErrorConstructor {
  new (message?: string, options?: { cause?: unknown })
}