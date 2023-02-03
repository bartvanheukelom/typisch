
// ======================= META ============================== //

export type Writable<T> = {
    -readonly [P in keyof T]: T[P];
};

/**
 * Make properties of T whose keys are in the union K required.
 */
export type Require<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type Brand<K, T> = K & { __brand: T }
export type Brand2<K, T> = K & { __brand2: T }
// TODO doesn't work if K is a union type
export function brand<B, V>(v: V): B extends Brand<infer K, infer T> ? (V & K extends never ? unknown : B) : unknown {
    return v as any;
}

export type ValueOf<T> = T[keyof T];
export type Arg<F extends (...args: any) => any> = Parameters<F>[0]
export type MethodArg<I, F extends keyof I> = I[F] extends (...args: any) => any ? Parameters<I[F]>[0] : never;
export type Promised<T> = Promise<Awaited<T>>;
export type Nullable<T> = T | null;
export type AsyncReturnType<T extends (...args: any) => any> = Awaited<ReturnType<T>>;

export type JsonElement = null | boolean | string | number | JsonObject | JsonArray;
export type JsonObject = { readonly [key: string]: JsonElement };
export type JsonArray = JsonElement[];

/**
 * Use this alias for `any` when you "temporarily" need it to make something work _right now_,
 * but it can and should be replaced with a better type SoonTM.
 */
export type DirtyAny = any;

// ===================== GENERIC ============================ //

// SI units
export type Milliseconds = Brand<number, 'SI:ms'>;
export type Seconds = Brand<number, 'SI:s'>;
export type Meters = Brand<number, 'SI:m'>;
export type Newton = Brand<number, 'SI:N'>;
export type NewtonSecond = Brand<number, 'SI:Ns'>;
export type Degrees = Brand<number, 'SI:degrees'>;
export type Radians = Brand<number, 'SI:radians'>;

// export type XPerY<X, Y> - TODO something like this
export type MetersPerSecond = Brand<number, 'SI:m/s'>
export type RadiansPerSecond = Brand<number, 'SI:radians/s'>


/**
 * Number usually (but not always) in the range [0, 1] that represents some fraction
 * of another quantity.
 */
export type Fraction = Brand<number, 'math/fraction'>

export type Pair<V> = [a: V, b: V];

// 123e4567-e89b-12d3-a456-426614174000
// TODO 1. hex strings; 2. of exact length;
// type HexChar = "0123456789abcdef"[number]; - sadly doesn't work
export type UuidTemplate = `${string}-${string}-${string}-${string}-${string}`;
declare const brandUuid: unique symbol;
export type Uuid = Brand<UuidTemplate, typeof brandUuid>;

declare const brandEpochMs: unique symbol;
export type EpochMs = Milliseconds & { [brandEpochMs]: typeof brandEpochMs };
