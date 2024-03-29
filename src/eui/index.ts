import {typischCoreNop} from "@typisch/core";
import {typischReactNop} from "@typisch/react";

typischCoreNop();
typischReactNop();

/**
 * Does nothing, can be used as an early detector for import / module resolution issues.
 */
export function typischEuiNop() {}
