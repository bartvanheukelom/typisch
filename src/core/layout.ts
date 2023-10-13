
export interface XY {
    x: number;
    y: number;
}

export interface WH {
    w: number;
    h: number;
}

export interface XYWH extends XY, WH { }


export function tupleToXYWH(t: [x: number, y: number, w: number, h: number]): XYWH {
    const [x, y, w, h] = t;
    return { x, y, w, h };
}
export function xywhToTuple(xywh: XYWH): [x: number, y: number, w: number, h: number] {
    const { x, y, w, h } = xywh;
    return [x, y, w, h];
}


/**
 * contain: scale the object to fit fully inside the container, preserving aspect ratio
 * cover: scale the object to completely cover the container, preserving aspect ratio
 */
export type ObjectFitMode = "contain" | "cover";

export interface ObjectPosition {
    x?: LinearPosition;
    y?: LinearPosition;
}

export interface LinearPositionInput {
    objectSize: number;
    containerSize: number;
    scale: number;
}
export type LinearPositionFunction = (i: LinearPositionInput) => number;
export type LinearPosition =
    | "start" | "left" | "top"  // equivalent
    | "end" | "right" | "bottom"
    | "center" | "middle"

    // from start
    // | number  // 0-1
    // | `${number}%` - TODO, how to handle object > container?
    | `${number}px`
    // TODO convenient equivalent for "from end"

    | ((i: LinearPositionInput) => number);


export function linearPositionFunction(pos: LinearPosition): LinearPositionFunction {
    if (typeof pos === "function") return pos;
    // if (typeof pos === "number") return () => pos;
    if (pos.endsWith("px")) {
        const px = parseFloat(pos.substring(0, pos.length - 2));
        return (i) => px;
    }
    switch (pos) {
        case "start":
        case "left":
        case "top":
            return () => 0;
        case "end":
        case "right":
        case "bottom":
            return (i) => i.containerSize - i.objectSize;
        case "center":
        case "middle":
            return (i) => (i.containerSize - i.objectSize) / 2;
    }
    throw new Error(`Invalid position: ${pos}`);
}


/**
 * Calculate the bounding box for an object so that the focus rectangle (in object coordinates)
 * is centered in the container and scaled to exactly fit or cover the container.
 * If no focus is provided, the whole object will be used as the focus.
 *
 * @param o - Object with objectSize, containerSize, focus and mode properties.
 * @returns The bounding box for the object in container coordinates.
 */
export function fitObject(o: {
    objectSize: WH;
    containerSize: WH;
    focus?: XYWH;
    mode?: ObjectFitMode;
    position?: ObjectPosition;
}): XYWH {
    const mode = o.mode ?? "contain";
    const focus: XYWH = o.focus ?? { x: 0, y: 0, w: o.objectSize.w, h: o.objectSize.h };

    const scale = mode === 'cover'
        ? Math.max(o.containerSize.w / focus.w, o.containerSize.h / focus.h)
        : Math.min(o.containerSize.w / focus.w, o.containerSize.h / focus.h);

    const scaleSize = {
        w: o.objectSize.w * scale,
        h: o.objectSize.h * scale,
    }

    const xpos = o.position?.x ?? "center";
    const xfpos = linearPositionFunction(xpos);
    const fx = xfpos({ objectSize: focus.w * scale, containerSize: o.containerSize.w, scale });
    const x = fx - focus.x * scale;

    const ypos = o.position?.y ?? "center";
    const yfpos = linearPositionFunction(ypos);
    const fy = yfpos({ objectSize: focus.h * scale, containerSize: o.containerSize.h, scale });
    const y = fy - focus.y * scale;

    return { x, y, ...scaleSize };

}
