declare module 'gun' {
  export interface GunInstance {
    get(key: string): GunInstance;
    put(data: unknown): GunInstance;
    on?(cb: (data: unknown, key?: string) => void): void;
    map?(): GunInstance;
  }
  function Gun(opts?: { peers?: string[] }): GunInstance;
  export default Gun;
}
