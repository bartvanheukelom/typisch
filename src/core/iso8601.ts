import {Brand} from "./types";

declare const brandIso8601: unique symbol;
export type Iso8601 = Brand<string, typeof brandIso8601>;

export const iso8601 = {
    now: () =>
        iso8601.from(new Date()),
    from: (date: Date) =>
        date.toISOString() as Iso8601,
    fromUnix: (unixTs: number) =>
        iso8601.from(new Date(unixTs * 1_000)),
    parse: (ts: Iso8601) =>
        new Date(ts),
}
