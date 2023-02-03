import React, {useEffect, useMemo, useRef, useState} from "react";

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
