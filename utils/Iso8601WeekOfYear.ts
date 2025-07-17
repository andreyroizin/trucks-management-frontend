/**
 * ISO-8601 week number of the given date.
 *  - Weeks start Monday.
 *  - Week 1 is the week with the year’s first Thursday.
 */
export const getIso8601WeekOfYear = (date: Date): number => {
    // Clone and normalise to UTC midnight
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    // ISO weekday (Mon = 1 … Sun = 7)
    let isoDow = d.getUTCDay();      // Sun = 0 in JS
    if (isoDow === 0) isoDow = 7;

    // Move to the Thursday in the same week
    const thursday = new Date(d);
    thursday.setUTCDate(thursday.getUTCDate() + (4 - isoDow));

    // First Thursday of this ISO year (always 4 Jan)
    const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));

    // ISO weekday of that first Thursday
    let firstIsoDow = firstThursday.getUTCDay();
    if (firstIsoDow === 0) firstIsoDow = 7;

    // Monday of ISO week 1
    const week1Monday = new Date(firstThursday);
    week1Monday.setUTCDate(week1Monday.getUTCDate() - (firstIsoDow - 1));

    // Number of full weeks between the two Mondays
    const millisPerWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.floor((thursday.getTime() - week1Monday.getTime()) / millisPerWeek) + 1;
}
