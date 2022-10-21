import {Meters, MetersPerSecond, Nullable, Radians, RadiansPerSecond, Seconds} from "./types";



export type SourceOf<T> = T extends Function ? never : (T | (() => T));

export function acquire<T>(src: SourceOf<T>): T {
    return typeof src == "function" ? src() : src;
}

/**
 * Use to add type checking to a literal.
 */
export function a<T>(v: T): T {
    return v;
}

type NonNeverKeyMap<T> = {
    [K in keyof T]: T[K] extends never ? never : K;
}
type NonNeverValKeys<T> = NonNeverKeyMap<T>[keyof T];

/**
 * Construct a type with the properties of T whose _value_ type is not `never`.
 */
export type OmitNever<T> = Pick<T, NonNeverValKeys<T>>;

export type Possibly<V, T> = [V] extends [T] ? unknown : V;
export type Conditional<C, T> = C extends never ? never : T;

/**
 * `v as O`, but better:
 * - supports type inference, so you can do things like `const distance: Meters = cast(5)`
 * - catches more impossible situations:
 * ```
 * declare const cat: "cat";
 * let dog: "dog";
 * dog = cat as "dog"; // compiles
 * dog = cast(cat); // does not compile
 * ```
 */
export function cast<I extends Possibly<O, I>, O>(v: I): O {
    return v as any;
}

export function declareIs<O>(v: unknown): asserts v is O;
export function declareIs<I extends Possibly<O, I>, O>(v: I): asserts v is O & I;
export function declareIs(v: any) {}

export function declareDefined<O>(v: O | undefined | null): asserts v is Exclude<O, undefined | null> {}

/**
 * Wrapper around Object.assign that only allows source properties
 * which are in the target type, if the source is an object literal.
 *
 * Example:
 * <pre>
 *     const div = document.createElement("div");
 *
 *     // this compiles just fine:
 *     Object.assign(div.style, { positsion: "inline-block" });
 *
 *     // this results in error " 'positsion' does not exist in type 'Partial<CSSStyleDeclaration>' ":
 *     assign(div.style, { positsion: "inline-block" });
 * </pre>
 */
export function assign<T extends object>(target: T, source: Partial<T>) {
    Object.assign(target, source);
}

export function copyProp<F, T, K extends (keyof F & keyof T)>(prop: K, from: F, to: F[K] extends T[K] ? T : { _error: `F[K] does not extend T[K]` }): void {
    (to as any)[prop] = from[prop];
    // return undefined as any;
}

// export function callMethod(obj: O, method: K, args: Parameters<O[K]>): ReturnType<O[K]> {
//     obj[method].call(this, args);
// }

export function compareIndexOf<E extends readonly any[]>(vals: E, a: E[number], b: E[number]): number {
    return vals.indexOf(a) - vals.indexOf(b);
}

/**
 * Exhaustive switching tool:
 *
 * <pre>
 *     declare const bolean: true | false;
 *     switch (bolean) {
 *         case true: ...; break;
 *         case false: ...; break;
 *         // bolean is now never
 *         default: missingCase(bolean); // throws if bolean is something else at runtime.
 *     }
 *
 *     declare const superbolean: true | false | "FileNotFound";
 *     switch (superbolean) {
 *         case true: ...; break;
 *         case false: ...; break;
 *         // compile error because you forgot to handle "FileNotFound",
 *         // so superbolean is not a never.
 *         default: missingCase(superbolean);
 *     }
 * </pre>
 */
export function missingCase(name: never): never {
    throw new Error(`switch is missing case ${name} (and TS didn't catch it)`);
}

export function put<V>(obj: { [key: string]: V }, key: string, value: V) {
    if (key in obj) {
        throw new Error(`Object already has a property named '${key}'`);
    }
    obj[key] = value;
}

/**
 * Returns the value of the given property in the given object, or throws an error if the object doesn't have it.
 *
 * `undefined` and other falsy values are returned as-is, an error is only thrown if not `key in obj`.
 */
export function need<K extends string | symbol, V>(obj: { [key in K]: V }, key: K): V {
    const val = obj[key];
    if (val === undefined) {
        if (key in obj) {
            return val;
        } else {
            throw new Error(`Object has no property named '${String(key)}'`);
        }
    } else {
        return val;
    }
}

export function add<N extends number>(a: N, b: N): N {
    return (a + b) as N;
}
export function subtract<N extends number>(a: N, b: N): N {
    return (a - b) as N;
}
export function negate<N extends number>(n: N): N {
    return -n as N;
}

export function metersXSeconds(mps: MetersPerSecond, s: Seconds): Meters {
    return (mps * s) as Meters;
}
export function radiansXSeconds(rps: RadiansPerSecond, s: Seconds): Radians {
    return (rps * s) as Radians;
}


export class ObjectBuilder<T, F = any> {

    static begin<F = any>() { return new ObjectBuilder<{}, F>({}) };

    constructor(readonly current: T) {}

    to<R extends T>(converter: (i: T) => R) {
        return new ObjectBuilder<R, F>(converter(this.current));
    }

    plus<K extends keyof F, V>(key: K, factory: (i: T) => V): ObjectBuilder<T & { [k in K]: V }, F> {
        const n = { ...this.current, [key]: factory(this.current) };
        return new ObjectBuilder(cast(n));
    }

    get result(): T extends F ? F : never {
        return cast(this.current as unknown);
    }

}

export function once<V>(calc: () => V): () => V {
    let calced = false;
    let value: Nullable<V> = null;
    return () => {
        if (!calced) {
            value = calc();
            calced = true;
        }
        return value!!;
    };
}

export function onceFunc<T, PD extends { value?: () => T }>(target: any, prop: string, desc: PD): PD {
    return {
        ...desc,
        value: once(desc.value!!)
    };
}

export function errString(e: unknown): string {
    return `${(e as any)?.stack || e}`;
}

export function formatFileSize(size: number) {
    return size.toLocaleString() + " B"
}
