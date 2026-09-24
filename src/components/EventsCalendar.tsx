"use client";

import { useMemo, useState } from "react";
import type { EventItem } from "@/lib/types";
import type { CalendarYear } from "@/lib/calendar";
import {
  cardDataDate,
  cardTimeRange,
  eventMonthNames,
} from "@/lib/calendar";
import { ReservationModal } from "./ReservationModal";

type View = "pinboard" | "agenda" | "calendar";

const MONTH_OPTIONS: { value: string; option: string; label: string }[] = [
  { value: "all", option: "all", label: "All months" },
  { value: "01", option: "january", label: "January" },
  { value: "02", option: "february", label: "February" },
  { value: "03", option: "march", label: "March" },
  { value: "04", option: "april", label: "April" },
  { value: "05", option: "may", label: "May" },
  { value: "06", option: "june", label: "June" },
  { value: "07", option: "july", label: "July" },
  { value: "08", option: "august", label: "August" },
  { value: "09", option: "september", label: "September" },
  { value: "10", option: "october", label: "October" },
  { value: "11", option: "november", label: "November" },
  { value: "12", option: "december", label: "December" },
];

export function EventsCalendar({
  events,
  calendar,
}: {
  events: EventItem[];
  calendar: CalendarYear[];
}) {
  const [view, setView] = useState<View>("pinboard");
  const [monthKey, setMonthKey] = useState<string>("all"); // month name or "all"
  const [selected, setSelected] = useState<EventItem | null>(null);

  const byId = useMemo(
    () => new Map(events.map((e) => [e.id, e])),
    [events],
  );
  const monthsByEvent = useMemo(
    () => new Map(events.map((e) => [e.id, new Set(eventMonthNames(e))])),
    [events],
  );

  const cardVisible = (e: EventItem) =>
    monthKey === "all" || monthsByEvent.get(e.id)?.has(monthKey);

  const visibleCards = events.filter(cardVisible);

  // Flatten calendar months for the slider, honoring the month filter.
  const allMonths = useMemo(
    () => calendar.flatMap((y) => y.months.map((m) => ({ year: y.year, month: m }))),
    [calendar],
  );
  const sliderMonths = allMonths.filter(
    (m) =>
      (monthKey === "all" || m.month.name === monthKey) &&
      m.month.cells.some((c) => c.events.length > 0),
  );
  const [slide, setSlide] = useState(0);
  const clampedSlide = Math.min(slide, Math.max(0, sliderMonths.length - 1));
  const current = sliderMonths[clampedSlide];

  const noEvents =
    view === "calendar" ? sliderMonths.length === 0 : visibleCards.length === 0;

  const openEvent = (id: string) => {
    const e = byId.get(id);
    if (e) setSelected(e);
  };

  return (
    <div className="events-calendar-page-content">
      {/* ---- Toolbar ---- */}
      <div className="events-calendar-toolbar">
        <ul className="view-controls" data-default-view="pinboard" id="calendarViewControl">
          <li id="eventPinboardViewItem">
            <button
              className={`custom-temp-btn events-calendar-toolbar-item${view === "pinboard" ? " active" : ""}`}
              id="eventPinboardView"
              type="button"
              onClick={() => setView("pinboard")}
            >
              Pinboard <span className="visuallyhidden">view</span>
            </button>
          </li>
          <li id="eventAgendaViewItem">
            <button
              className={`custom-temp-btn events-calendar-toolbar-item${view === "agenda" ? " active" : ""}`}
              id="eventAgendaView"
              type="button"
              onClick={() => setView("agenda")}
            >
              Agenda <span className="visuallyhidden">view</span>
            </button>
          </li>
          <li id="eventCalendarViewItem">
            <button
              className={`custom-temp-btn events-calendar-toolbar-item${view === "calendar" ? " active" : ""}`}
              id="eventCalendarView"
              type="button"
              onClick={() => setView("calendar")}
            >
              Calendar <span className="visuallyhidden">view</span>
            </button>
          </li>
        </ul>
        <div className="events-months-filter-holder">
          <label className="visuallyhidden" htmlFor="monthFilter">
            Filter by month:
          </label>
          <div className="custom-temp-btn events-calendar-toolbar-item">
            <select
              className="events-calendar-toolbar-item-select"
              id="monthFilter"
              value={MONTH_OPTIONS.find((o) => o.option === monthKey)?.value ?? "all"}
              onChange={(e) => {
                const opt = MONTH_OPTIONS.find((o) => o.value === e.target.value);
                setMonthKey(opt?.option ?? "all");
                setSlide(0);
              }}
            >
              {MONTH_OPTIONS.map((o) => (
                <option key={o.value} data-month-option={o.option} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div
        className="no-events-message"
        id="noEventsMessage"
        style={{ display: noEvents ? "" : "none" }}
        tabIndex={0}
      >
        <h2>No events for this month.</h2>
      </div>

      {/* ---- Pinboard / Agenda ---- */}
      <div
        className={`events-general-holder ${view === "agenda" ? "events-agenda-view" : "events-pinboard-view"}`}
        id="pinboardAgendaContainer"
        style={{ display: view === "calendar" ? "none" : "" }}
      >
        {visibleCards.map((e) => (
          <EventCard key={e.id} event={e} onOpen={() => openEvent(e.id)} />
        ))}
      </div>

      {/* ---- Calendar ---- */}
      <div
        className="events-calendar-holder"
        id="calendarContainer"
        style={{ display: view === "calendar" ? "" : "none" }}
      >
        {sliderMonths.length > 0 && (
          <div className="calendar-slider-nav">
            <div className="slider-arrows-holder">
              <button
                type="button"
                className="cal-prev"
                aria-label="Previous month"
                disabled={clampedSlide === 0}
                onClick={() => setSlide((s) => Math.max(0, s - 1))}
              >
                <i className="fa fa-angle-left" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="cal-next"
                aria-label="Next month"
                disabled={clampedSlide >= sliderMonths.length - 1}
                onClick={() =>
                  setSlide((s) => Math.min(sliderMonths.length - 1, s + 1))
                }
              >
                <i className="fa fa-angle-right" aria-hidden="true" />
              </button>
            </div>
            <div className="events-slider-text" aria-live="polite">
              {current
                ? `${capitalize(current.month.name)} ${current.year}`
                : ""}
            </div>
          </div>
        )}
        <div className="year-container">
          {current && (
            <div
              className={`month ${current.month.name}`}
              data-month-name={current.month.name}
            >
              <div className="days-grid">
                {current.month.cells.map((cell) =>
                  !cell.inMonth ? (
                    <div
                      key={cell.date}
                      aria-hidden="true"
                      className={`empty-day-card${cell.weekend ? " weekend" : ""}`}
                      data-date={cell.date}
                      data-week-day={cell.weekDay}
                    />
                  ) : (
                    <DayCard key={cell.date} cell={cell} onOpen={openEvent} />
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ReservationModal event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function EventCard({
  event,
  onOpen,
}: {
  event: EventItem;
  onOpen: () => void;
}) {
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };
  return (
    <div
      aria-controls="eventCalendarModal"
      aria-haspopup="dialog"
      aria-label={`${event.title}. ${event.dayLabel}`}
      className={`event-calendar-card${event.imageUrl ? "" : " no-event-image"}`}
      data-event-end-date={cardDataDate(event.endDate)}
      data-event-recurrence-type={event.recurrenceType}
      data-event-start-date={cardDataDate(event.startDate)}
      data-event-start-time={event.startTime}
      id={event.id}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKey}
    >
      {event.imageUrl && (
        <div className="event-image-holder">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="img-responsive" src={event.imageUrl} />
        </div>
      )}
      <div className="event-text-holder">
        <h2>{event.title}</h2>
        <p className="event-main-text event-day">{event.dayLabel}</p>
        <div className="event-info-text">
          <p>{event.description}</p>
        </div>
        <div className="event-read-more" inert>
          Read more
        </div>
        <p className="event-main-text event-time">
          {cardTimeRange(event.startTime, event.endTime)}
        </p>
      </div>
    </div>
  );
}

function DayCard({
  cell,
  onOpen,
}: {
  cell: CalendarYear["months"][number]["cells"][number];
  onOpen: (id: string) => void;
}) {
  const hasEvents = cell.events.length > 0;
  return (
    <div
      {...(hasEvents ? {} : { "aria-hidden": "true" })}
      className={`day-card${cell.weekend ? " weekend" : ""} ${hasEvents ? "has-events" : "no-events"}`}
      data-date={cell.date}
      data-week-day={cell.weekDay}
    >
      <div className="visuallyhidden event-ada-header">{cell.adaHeader}</div>
      <div aria-hidden="true" className="event-card-header">
        <div className="day-number">{cell.dayNumber}</div>
        <div className="day-name">{cell.weekDay}</div>
      </div>
      {hasEvents ? (
        <div className="event-card-body">
          {cell.events.map((ev) => (
            <div
              key={ev.id}
              aria-controls="eventCalendarModal"
              aria-haspopup="dialog"
              className="calendar-day-event"
              data-event-id={ev.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpen(ev.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen(ev.id);
                }
              }}
            >
              <div className="ev-image">
                {ev.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" src={ev.imageUrl} />
                )}
              </div>
              <div className="ev-content">
                <span className="ev-time">{ev.time}</span>
                <span className="ev-title">{ev.title}</span>
                <span className="ev-date visuallyhidden">{ev.adaDate}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div aria-hidden="true" className="event-card-body" />
      )}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
