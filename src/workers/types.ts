export type Worker<I = unknown, O = unknown> = (payload: I) => O | Promise<O>
