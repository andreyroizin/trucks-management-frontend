import dayjs from "dayjs";

export const DutchHolidays: Map<string, string> = new Map([
    ["2022-01-01", "Nieuwjaarsdag"],
    ["2022-04-18", "2e Paasdag"],
    ["2022-04-27", "Koningsdag"],
    ["2022-05-26", "Hemelvaart"],
    ["2022-06-06", "2e Pinksterdag"],
    ["2022-12-26", "2e Kerstdag"],

    ["2023-01-01", "Nieuwjaarsdag"],
    ["2023-04-09", "2e Paasdag"],
    ["2023-04-27", "Koningsdag"],
    ["2023-05-18", "Hemelvaart"],
    ["2023-12-25", "1e kerstdag"],
    ["2023-12-26", "2e Kerstdag"],

    ["2024-01-01", "Nieuwjaarsdag"],
    ["2024-04-01", "2e Paasdag"],
    ["2024-04-27", "Koningsdag"],
    ["2024-05-09", "Hemelvaart"],
    ["2024-05-20", "2e Pinksterdag"],
    ["2024-12-26", "2e Kerstdag"],

    ["2025-01-01", "Nieuwjaarsdag"],
    ["2025-04-21", "2e Paasdag"],
    ["2025-04-26", "Koningsdag"],
    ["2025-05-05", "bevrijdingsdag"],
    ["2025-05-29", "Hemelvaart"],
    ["2025-06-09", "2e Pinksterdag"],
    ["2025-12-26", "2e Kerstdag"],

    ["2026-01-01", "Nieuwjaarsdag"],
    ["2026-04-06", "2e Paasdag"],
    ["2026-04-27", "Koningsdag"],
    ["2026-05-14", "Hemelvaart"],
    ["2026-05-25", "2e Pinksterdag"],
    ["2026-12-26", "2e Kerstdag"],

    ["2027-01-01", "Nieuwjaarsdag"],
    ["2027-03-29", "2e Paasdag"],
    ["2027-04-27", "Koningsdag"],
    ["2027-06-06", "Hemelvaart"],
    ["2027-12-26", "2e Kerstdag"],

    ["2028-01-01", "Nieuwjaarsdag"],
    ["2028-04-17", "2e Paasdag"],
    ["2028-04-27", "Koningsdag"],
    ["2028-05-25", "Hemelvaart"],
    ["2028-06-05", "2e Pinksterdag"],
    ["2028-12-26", "2e Kerstdag"],
]);

export const isHolidayDayjs = (date: dayjs.Dayjs): boolean => {
    const isoDate = date.format("YYYY-MM-DD");
    return DutchHolidays.has(isoDate);
};

export const isHolidayDate = (date: Date): boolean => {
    const isoDate = date.toISOString().split("T")[0];
    return DutchHolidays.has(isoDate);
};
