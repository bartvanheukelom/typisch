import React, {useMemo, useRef, useState} from "react";

export function useUpdater() {

    const ucRef = useRef<number>()
    const [updateCount, setUpdateCount] = useState(0);

    return {
        update() {
            setUpdateCount((ucRef.current || 0) + 1);
        },
        count: updateCount,
    };

}
