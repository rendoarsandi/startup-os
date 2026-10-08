declare module '#runtime-env' {
  export function getRuntimeEnv(): import('./server/env').AppEnv
}
