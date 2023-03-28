import React, {useEffect, useMemo, useRef, useState} from "react";


export function Clock(props: {
    tickInterval?: number;
    format?: (date: Date) => string;
}): JSX.Element {
    const [date, setDate] = useState(new Date());
    const format = props.format ?? ((d: Date) => d.toLocaleTimeString());
    useEffect(() => {
        const timer = setInterval(() => setDate(new Date()), props.tickInterval ?? 100);
        return () => clearInterval(timer);
    }, []);
    return <span>{format(date)}</span>;
}

export function useInterval(callback: () => void, immediate: boolean, period: number, deps: any[] = []) {
    useEffect(() => {
        if (immediate) {
            callback();
        }
        const timer = setInterval(callback, period);
        return () => clearInterval(timer);
    }, [callback, period, ...deps]);
}
