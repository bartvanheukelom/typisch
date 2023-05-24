
/**
 * Stuple: State Tuple.
 */
export type Stuple<S> = [S, (s: S) => void];
