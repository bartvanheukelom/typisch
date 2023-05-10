import {Dispatch, SetStateAction} from "react";

/**
 * Stuple: State Tuple.
 */
export type Stuple<S> = [S, Dispatch<SetStateAction<S>>];
