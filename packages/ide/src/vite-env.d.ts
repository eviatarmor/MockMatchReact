/** Vite worker constructor imports (`?worker`). Kept local so ide need not depend on vite types. */
declare module "*?worker" {
  const workerConstructor: {
    new (options?: { name?: string }): Worker
  }
  export default workerConstructor
}
