import React, {JSX, useLayoutEffect, useRef, useState} from "react";
import {WH, XYWH} from "@typisch/core/layout";
import {fitObject, ObjectFitMode} from "../core/layout";


/**
 * Renders an object within a container, adjusting its size and position based on specified parameters.
 */
export function ObjectViewer(props: {

    /**
     * Native size of the object to be rendered. E.g. `{ w: 1920, h: 1080 }` for an HD video.
     */
    objectSize: WH;
    /**
     * Focus rectangle that should be contained in / cover the viewer. In object coordinates.
     * E.g. { x: 960, y: 0, w: 960, h: 1080 } to focus on the right half of a 1920x1080 video.
     */
    focus?: XYWH;

    mode?: ObjectFitMode;

    /**
     * Callback that renders the object. Must be rendered at a specific size which is passed as a parameter.
     *
     * Example: `({w, h}) => <img src="..." width={w} height={h} />`.
     *
     * Translating to the correct position is handled by the ObjectViewer, however.
     */
    objectRender: (o: WH) => JSX.Element;

    /**
     * Extra styles for the container div.
     */
    containerStyle?: React.CSSProperties;

}) {

    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerSize, setContainerSize] = useState<WH>({ w: 0, h: 0 });

    // hook to measure the size of the container
    // TODO useMeasure
    useLayoutEffect(() => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            setContainerSize({ w: width, h: height });
        }
    }, []);

    const fit = containerSize.w > 0 && containerSize.h > 0 && fitObject({
        objectSize: props.objectSize,
        containerSize: containerSize,
        focus: props.focus,
        mode: props.mode,
    });

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                backgroundColor: "#000011",
                overflow: "hidden",
                ...props.containerStyle,
            }}
        >
            {fit && <div style={{
                position: "absolute",
                left: fit.x,
                top: fit.y,
            }}>
                {props.objectRender({ w: fit.w, h: fit.h })}
            </div>}
        </div>
    );
}
