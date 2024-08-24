interface PromiseConstructor {
  withResolvers: <T>() => {
    promise: Promise<T>;
    reject:  typeof Promise.reject<T>;
    resolve: typeof Promise.resolve<T>;
  }
}

interface ErrorConstructor {
  new (message?: string, options?: { cause?: unknown })
}

