import React, {useMemo, useRef, useState} from "react";

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
