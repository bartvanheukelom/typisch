import {Brand} from "./types";

declare const brandIso8601: unique symbol;
export type Iso8601 = Brand<string, typeof brandIso8601>;

declare const brandIsoDate: unique symbol;
export type IsoDate = Brand<`${number}-${number}-${number}`, typeof brandIsoDate>;

export const iso8601 = {

    datePattern: /^[0-9]{4}-[0-1][0-9]-[0-3][0-9]$/,
    tsPattern: /^[0-9]{4}-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9](?:\.[0-9]{3})?(?:Z|[+-][0-2][0-9]:[0-5][0-9])$/,

    now: () =>
        iso8601.from(new Date()),
    today: () =>
        iso8601.from(new Date()).slice(0, 10) as IsoDate,

    from: (date: Date) =>
        date.toISOString() as Iso8601,
    fromUnix: (unixTs: number) =>
        iso8601.from(new Date(unixTs * 1_000)),

    parse(ts: Iso8601): Date {
        const d = new Date(ts);
        if (d.toString() == "Invalid Date") {
            throw new Error(`Invalid ISO 8601 timestamp: ${JSON.stringify(ts)}`);
        }
        return d;
    },

}
