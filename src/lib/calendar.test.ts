import { describe, it, expect } from "vitest";
import {
  buildCalendar,
  calendarEventTime,
  cardTimeRange,
  eventMonthNames,
  fullAdaDate,
} from "./calendar";
import { SEED_EVENTS } from "./seed-data";

const NOW = new Date(2026, 8, 24); // Sep 24 2026 (matches the source scrape)

describe("time formatting", () => {
  it("calendarEventTime drops :00 and uses lowercase am/pm", () => {
    expect(calendarEventTime("12:30", "16:00")).toBe("12:30pm-4pm");
    expect(calendarEventTime("11:00", "20:00")).toBe("11am-8pm");
    expect(calendarEventTime("11:00", null)).toBe("11am");
  });
  it("cardTimeRange keeps :MM with 2-digit hour and uppercase AM/PM", () => {
    expect(cardTimeRange("11:00", "22:00")).toBe("11:00 AM - 10:00 PM");
    expect(cardTimeRange("12:30", "16:00")).toBe("12:30 PM - 04:00 PM");
    expect(cardTimeRange("11:00", "20:00")).toBe("11:00 AM - 08:00 PM");
  });
});

describe("fullAdaDate", () => {
  it("formats with weekday and ordinal", () => {
    expect(fullAdaDate("2026-09-06")).toBe("Sunday, September 6th, 2026");
    expect(fullAdaDate("2026-11-03")).toBe("Tuesday, November 3rd, 2026");
  });
});

describe("eventMonthNames", () => {
  it("spans the recurring range for the gospel brunch", () => {
    const gospel = SEED_EVENTS.find((e) => e.slug === "gospel-brunch")!;
    const months = eventMonthNames(gospel);
    expect(months).toEqual(
      expect.arrayContaining([
        "august",
        "september",
        "october",
        "november",
        "december",
        "january",
        "february",
      ]),
    );
  });
  it("is a single month for one-off events", () => {
    const dessert = SEED_EVENTS.find((e) => e.slug === "national-dessert-day")!;
    expect(eventMonthNames(dessert)).toEqual(["october"]);
  });
});

describe("buildCalendar", () => {
  const years = buildCalendar(SEED_EVENTS, NOW);

  it("runs from the current month through December of next year", () => {
    expect(years[0].year).toBe(2026);
    expect(years[0].months[0].name).toBe("september");
    const lastYear = years[years.length - 1];
    expect(lastYear.year).toBe(2027);
    expect(lastYear.months[lastYear.months.length - 1].name).toBe("december");
  });

  const sept = years[0].months.find((m) => m.name === "september")!;
  const cell = (date: string) => sept.cells.find((c) => c.date === date)!;

  it("places the recurring gospel brunch on each September Sunday", () => {
    for (const d of ["2026-09-06", "2026-09-13", "2026-09-20", "2026-09-27"]) {
      const c = cell(d);
      expect(c.events.length).toBeGreaterThanOrEqual(1);
      expect(c.events.some((e) => e.title.includes("Gospel"))).toBe(true);
      expect(c.events[0].time).toBe("12:30pm-4pm");
    }
  });

  it("places a one-off event on its single date", () => {
    const beer = cell("2026-09-28");
    expect(beer.events.map((e) => e.title)).toContain("National Drink Beer Day");
    expect(cell("2026-09-29").events).toHaveLength(0);
  });

  it("marks weekends and days from adjacent months", () => {
    expect(cell("2026-09-05").weekend).toBe(true); // Saturday
    const leading = sept.cells[0];
    expect(leading.inMonth).toBe(false); // Aug day filling the first week
  });
});
