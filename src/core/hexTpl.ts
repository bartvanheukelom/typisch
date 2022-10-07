
export type Hex1 = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "a" | "b" | "c" | "d" | "e" | "f";
export type Hex2 = `${Hex1}${Hex1}`;
export type Hex4 = `${Hex2}${Hex2}`;

// nice try, but doesn't work because it resolves to a union type of all possible values,
// which becomes too large from Hex8 on
// export type Hex8 = `${Hex4}${Hex4}`;
// export type Hex16 = `${Hex8}${Hex8}`;
// export type Hex32 = `${Hex16}${Hex16}`;
// export type Hex64 = `${Hex32}${Hex32}`;

// so now these just serve for documentation, and may be appropriately constrained in the future
export type Hex8 = string;
export type Hex16 = string;
export type Hex32 = string;
export type Hex64 = string;

// common lengths (and examples for how to make any length)
export type Hex12 = `${Hex8}${Hex4}`;
