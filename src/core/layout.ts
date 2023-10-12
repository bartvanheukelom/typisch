
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
}): XYWH {
    const mode = o.mode ?? "contain";
    const focus: XYWH = o.focus ?? { x: 0, y: 0, w: o.objectSize.w, h: o.objectSize.h };

    const scale = mode === 'cover'
        ? Math.max(o.containerSize.w / focus.w, o.containerSize.h / focus.h)
        : Math.min(o.containerSize.w / focus.w, o.containerSize.h / focus.h);

    const x = o.containerSize.w / 2 - (focus.x + focus.w / 2) * scale;
    const y = o.containerSize.h / 2 - (focus.y + focus.h / 2) * scale;
    const w = o.objectSize.w * scale;
    const h = o.objectSize.h * scale;

    return { x, y, w, h };
}
