import React, {useEffect, useMemo, useRef, useState} from "react";
import {acquire, SourceOf} from "../core/utils";

export function useUpdater() {

    const [updateCount, setUpdateCount] = useState(0);

    const ucRef = useRef<number>();
    ucRef.current = updateCount;

    return {
        update() {
            setUpdateCount((ucRef.current || 0) + 1);
        },
        count: updateCount,
    };

}

/**
 * Hook to declare a state variable that resets to its initial value when any of the dependencies change.
 */
export function useResettingState<T>(initial: T, deps: any[]): [T, (v: T) => void] {
    // TODO add manual reset function, either as 3rd prop or return an object instead of array
    const vs = useState(initial);
    useEffect(() => {
        if (vs[0] != initial) {
            vs[1](initial);
        }
    }, deps);
    return vs;
}

/**
 * Logs a message when the component mounts and unmounts.
 */
export function useMountLogger(name: string) {
    useEffect(() => {
        console.log(`${name} mounting`);
        return () => console.log(`${name} unmounting`);
    }, []);
}

/**
 * State that is loaded from local storage, and saved to local storage when it changes.
 * A local deserialized copy is kept in memory and used for subsequent reads.
 * External changes to the stored value are not detected.
 */
export function useLocalStorage<T>(key: string, initialValue: SourceOf<T>): [v: T, setter: (a: T) => void] {
    const [memVal, setMemVal] = useState<T>(() => {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : acquire(initialValue);
    });
    return [memVal, (v: T) => {
        localStorage.setItem(key, JSON.stringify(v));
        setMemVal(v);
    }];
}
