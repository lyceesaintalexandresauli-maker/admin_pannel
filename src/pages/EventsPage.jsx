import { useEffect, useMemo, useRef, useState } from "react";
import { mediaUrl } from "../api/client";
import { eventsAPI } from "../api/services";
import Seo from "../components/Seo";
import { fetchAllEventsFromSupabase } from "../api/supabaseEvents";
import { isSupabaseConfigured } from "../supabase";
import "./EventsPage.css";

const toLocalDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getEventVideoUrl = (event) => {
  if (!event) return null;
  return event.video_url || event.video_path || event.video || event.media_url || null;
};
const getEventAudioUrl = (event) => event?.audio_url || event?.audio_path || event?.audio || null;

const normalizeEventType = (value) => String(value || "General").trim().replace(/\s+/g, " ");

function EventTypeDropdown({ value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const allOptions = [{ value: "all", label: "All event types" }, ...options.map((option) => ({ value: option, label: option }))];
  const selectedOption = allOptions.find((option) => option.value === value) || allOptions[0];

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const focusOption = (direction) => {
    setIsOpen(true);
    window.requestAnimationFrame(() => {
      const items = rootRef.current?.querySelectorAll('[role="option"]');
      if (!items?.length) return;
      (direction === "last" ? items[items.length - 1] : items[0]).focus();
    });
  };

  const handleOptionKeyDown = (event, index) => {
    const items = rootRef.current?.querySelectorAll('[role="option"]');
    if (!items?.length) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = event.key === "ArrowDown"
        ? (index + 1) % items.length
        : (index - 1 + items.length) % items.length;
      items[nextIndex].focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      items[event.key === "Home" ? 0 : items.length - 1].focus();
    }
  };

  return (
    <div className={`events-type-select${isOpen ? " is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="events-filter-display events-type-trigger"
        aria-label="Filter events by type"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="events-type-options"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            focusOption("first");
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            focusOption("last");
          }
        }}
      >
        <span>{selectedOption.label}</span>
        <i className="bi bi-chevron-down" aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="events-type-options" id="events-type-options" role="listbox" aria-label="Event types">
          {allOptions.map((option, index) => (
            <button
              type="button"
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className="events-type-option"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const getYoutubeEmbedUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) {
      const videoId = url.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      const shortCode = url.pathname.match(/\/shorts\/(.+)/)?.[1];
      if (shortCode) return `https://www.youtube.com/embed/${shortCode}`;
    }
    if (url.hostname.includes("vimeo.com")) {
      const match = url.pathname.match(/\/(\d+)/);
      if (match) return `https://player.vimeo.com/video/${match[1]}`;
    }
  } catch {
    return null;
  }
  return null;
};

function EventVideoPlayer({ event, className }) {
  const videoUrl = getEventVideoUrl(event);
  if (!videoUrl) return null;

  const embedUrl = getYoutubeEmbedUrl(videoUrl);
  if (embedUrl) {
    return (
      <div className={className}>
        <iframe
          src={embedUrl}
          title={`${event.title} video`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <video
      className="event-card-video"
      controls
      playsInline
      preload="metadata"
      poster={(event.image_data || event.image_path) ? ((event.image_data || event.image_path).startsWith("data:") ? (event.image_data || event.image_path) : mediaUrl(event.image_data || event.image_path)) : undefined}
      src={mediaUrl(videoUrl)}
    >
      Your browser does not support video playback.
    </video>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    let alive = true;
    let loadingRequest = false;
    let hasLoaded = false;
    const loadEvents = async () => {
      if (loadingRequest) return;
      loadingRequest = true;
      let nextEvents;
      try {
        if (!hasLoaded && alive) setLoading(true);
        if (isSupabaseConfigured()) {
          nextEvents = await fetchAllEventsFromSupabase();
        } else {
          const res = await eventsAPI.getAll();
          nextEvents = res.data || [];
        }
      } catch (err) {
        console.error("Error loading events:", err);
        if (!hasLoaded && alive) setError(err.response?.data?.error || "Failed to load events");
      } finally {
        if (!hasLoaded && alive) setLoading(false);
        hasLoaded = true;
        loadingRequest = false;
      }
      if (alive && typeof nextEvents !== "undefined") {
        // Browser-only events are additive: keep all existing API/Supabase records intact.
        let localEvents = [];
        try { localEvents = JSON.parse(window.localStorage.getItem("school_frontend_events_v1") || "[]"); } catch { localEvents = []; }
        const localIds = new Set(localEvents.map((event) => String(event.id)));
        setEvents([...localEvents, ...(nextEvents || []).filter((event) => !localIds.has(String(event.id)))]);
        setError(null);
      }
    };
    loadEvents();
    const refreshTimer = window.setInterval(loadEvents, 20000);
    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") loadEvents();
    };
    document.addEventListener("visibilitychange", refreshOnReturn);
    return () => {
      alive = false;
      window.clearInterval(refreshTimer);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, []);

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (filterDate) {
      filtered = filtered.filter((event) => {
        const date = new Date(event.date || event.created_at);
        return !Number.isNaN(date.getTime()) && toLocalDateValue(date) === filterDate;
      });
    }

    if (eventTypeFilter !== "all") {
      filtered = filtered.filter((event) => normalizeEventType(event.category) === normalizeEventType(eventTypeFilter));
    }

    if (mediaFilter === "videos") {
      filtered = filtered.filter((event) => Boolean(getEventVideoUrl(event)));
    } else if (mediaFilter === "audio") {
      filtered = filtered.filter((event) => Boolean(getEventAudioUrl(event)));
    } else if (mediaFilter === "images") {
      filtered = filtered.filter((event) => Boolean(event.image_path) && !getEventVideoUrl(event));
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.created_at).getTime();
      const dateB = new Date(b.date || b.created_at).getTime();
      return dateB - dateA;
    });
    return filtered;
  }, [events, filterDate, eventTypeFilter, mediaFilter]);

  const eventTypes = [...new Map(events.map((event) => {
    const category = normalizeEventType(event.category);
    return [category.toLocaleLowerCase(), category];
  })).values()].sort((a, b) => a.localeCompare(b));

  const formatEventDate = (dateStr) => {
    if (!dateStr) return "No date";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const today = new Date();
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const monthLabel = calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const monthDays = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const monthOffset = new Date(calendarYear, calendarMonthIndex, 1).getDay();
  const eventDays = new Map();
  events.forEach((event) => {
    const date = new Date(event.date || event.created_at);
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== calendarYear || date.getMonth() !== calendarMonthIndex) return;
    eventDays.set(date.getDate(), [...(eventDays.get(date.getDate()) || []), event]);
  });
  const changeCalendarMonth = (offset) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };
  const selectCalendarDay = (day) => {
    const selectedDate = new Date(calendarYear, calendarMonthIndex, day);
    const value = toLocalDateValue(selectedDate);
    setFilterDate((current) => current === value ? "" : value);
  };
  const upcomingEvents = [...events]
    .filter((event) => {
      const date = new Date(event.date || event.created_at);
      return !Number.isNaN(date.getTime()) && date >= new Date(new Date().setHours(0, 0, 0, 0));
    })
    .sort((a, b) => new Date(a.date || a.created_at) - new Date(b.date || b.created_at))
    .slice(0, 6);
  const activeFilterLabels = [
    eventTypeFilter !== "all" ? eventTypeFilter : null,
    mediaFilter !== "all" ? ({ videos: "Videos", audio: "Audio", images: "Images" }[mediaFilter]) : null,
    filterDate ? formatEventDate(filterDate) : null,
  ].filter(Boolean);
  const eventListHeading = filterDate
    ? `Events on ${formatEventDate(filterDate)}`
    : eventTypeFilter !== "all"
      ? `${eventTypeFilter} Events`
      : mediaFilter !== "all"
        ? `${mediaFilter === "videos" ? "Video" : mediaFilter === "audio" ? "Audio" : "Image"} Events`
        : "All Events";
  const activeFilterDescription = activeFilterLabels.join(" and ");

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedEvent(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <main className="main">
      <Seo
        title="Events"
        description="Discover upcoming and recent school events, activities, and celebrations at Lycee Saint Alexandre Sauli de Muhura."
        path="/events"
      />
      {selectedEvent && <div className="events-detail-overlay" role="presentation" onClick={() => setSelectedEvent(null)}>
        <article className="events-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="event-detail-title" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="events-detail-close" aria-label="Close event details" onClick={() => setSelectedEvent(null)}><i className="bi bi-x-lg" /></button>
          <div className="events-detail-image-wrap">
            {(() => {
              const videoUrl = getEventVideoUrl(selectedEvent);
              if (videoUrl) return <EventVideoPlayer event={selectedEvent} className="events-detail-video-wrap" />;
              if (selectedEvent.image_path) {
                return <img src={mediaUrl(selectedEvent.image_path)} alt={selectedEvent.title} />;
              }
              return <div className="events-detail-image-empty"><i className="bi bi-calendar-event" /></div>;
            })()}
            <span className="events-detail-category">{selectedEvent.category || "School event"}</span>
          </div>
          <div className="events-detail-content">
            <span className="events-detail-eyebrow"><i className="bi bi-stars" /> SCHOOL COMMUNITY</span>
            <h2 id="event-detail-title">{selectedEvent.title}</h2>
            <div className="events-detail-meta"><span><i className="bi bi-calendar-event" />{formatEventDate(selectedEvent.date || selectedEvent.created_at)}</span><span><i className="bi bi-geo-alt-fill" />{selectedEvent.location || "School grounds"}</span>{selectedEvent.time && <span><i className="bi bi-clock-fill" />{selectedEvent.time}</span>}</div>
            <p>{selectedEvent.description || "Join the school community for this special event."}</p>
            {getEventVideoUrl(selectedEvent) && <div className="events-video-tag"><i className="bi bi-play-circle-fill" /> Video event</div>}
            {getEventAudioUrl(selectedEvent) && <div className="events-audio-player"><span><i className="bi bi-soundwave" /> Event audio</span><audio controls preload="metadata" src={mediaUrl(getEventAudioUrl(selectedEvent))}>Your browser does not support audio playback.</audio></div>}
            {selectedEvent.registration_link && <a className="events-detail-register" href={selectedEvent.registration_link} target="_blank" rel="noopener noreferrer">Learn more <i className="bi bi-arrow-up-right" /></a>}
          </div>
        </article>
      </div>}
      <section className="events-page container-fluid px-3 px-lg-4 pb-5" data-aos="fade-up">
        <div className="events-hero">
          <div className="events-hero-copy">
            <span className="events-kicker">Lycee Saint Alexandre Sauli de Muhura</span>
            <h1>Events</h1>
            <p>Stay updated with the latest school activities, celebrations, and important events at Lycee Saint Alexandre Sauli De Muhura.</p>
          </div>
        </div>
        <div className="events-filter-bar" aria-label="Filter events">
          <label className="events-filter-field active-filter"><span><i className="bi bi-calendar-event" /> Select date</span><input className="events-filter-display active-display" type="date" value={filterDate} onChange={(event) => { const value = event.target.value; setFilterDate(value); if (value) { const [year, month] = value.split("-").map(Number); setCalendarMonth(new Date(year, month - 1, 1)); } }} aria-label="Search events by date" /></label>
          <div className="events-filter-field active-filter"><span><i className="bi bi-funnel-fill" /> Event Type</span><EventTypeDropdown value={eventTypeFilter} options={eventTypes} onChange={setEventTypeFilter} /></div>
          <label className="events-filter-field active-filter"><span><i className="bi bi-tag-fill" /> Media</span><select className="events-filter-display active-display" value={mediaFilter} onChange={(event) => setMediaFilter(event.target.value)} aria-label="Filter events by media"><option value="all">All media</option><option value="videos">Videos</option><option value="audio">Audio</option><option value="images">Images</option></select></label>
          <div className="events-search-field active-filter"><span><i className="bi bi-info-circle" /> Browse events</span><div className="events-filter-display active-display">Use the calendar to choose a day</div></div>
          <button type="button" className="events-search-button active-button" onClick={() => { setFilterDate(""); setEventTypeFilter("all"); setMediaFilter("all"); }}><i className="bi bi-arrow-counterclockwise" /> Clear filters</button>
        </div>
        <div className="events-layout">
          <div>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {loading && <div className="alert alert-light" role="status">Fetching latest events...</div>}
            <div className="events-list-heading"><div><h2><i className="bi bi-calendar2-week-fill" /> {eventListHeading}</h2><p>Showing {filteredEvents.length} event{filteredEvents.length === 1 ? "" : "s"}{activeFilterDescription ? ` matching ${activeFilterDescription}` : " from Lycee Saint Alexandre Sauli De Muhura"}.</p></div></div>
            <div className="events-grid">
              {filteredEvents.map((event) => {
                const eventDate = new Date(event.date || event.created_at);
                const hasVideo = Boolean(getEventVideoUrl(event));
                return <article className="event-card" key={event.id}>
                  <div className={`event-image-button${hasVideo ? " has-event-video" : ""}`} aria-label={event.title}>
                    {hasVideo
                      ? <EventVideoPlayer event={event} className="event-card-video-wrap" />
                      : event.image_path
                        ? <img src={(event.image_data || event.image_path || "").startsWith("data:") ? (event.image_data || event.image_path) : mediaUrl(event.image_data || event.image_path)} alt={event.title} loading="lazy" decoding="async" />
                        : <span className="event-image-placeholder"><i className={`bi ${getEventAudioUrl(event) ? "bi-soundwave" : "bi-calendar-event"}`} /></span>}
                    <span className="event-date-badge"><b>{Number.isNaN(eventDate.getTime()) ? "-" : String(eventDate.getDate()).padStart(2, "0")}</b><small>{Number.isNaN(eventDate.getTime()) ? "Date" : eventDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</small></span>
                    <span className="event-category">{event.category || "General"}</span>
                  </div>
                  <div className="event-card-content">
                    <h2>{event.title}</h2>
                    <p>{event.description?.slice(0, 145)}{event.description?.length > 145 ? "..." : ""}</p>
                    <div className="event-meta"><span><i className="bi bi-calendar3" />{formatEventDate(event.date || event.created_at)}</span>{event.location && <span><i className="bi bi-geo-alt" />{event.location}</span>}</div>
                    <button type="button" className="event-details" onClick={() => setSelectedEvent(event)}>View details <i className="bi bi-arrow-right" /></button>
                  </div>
                </article>;
              })}
              {!loading && filteredEvents.length === 0 && (
                <div className="events-empty" aria-live="polite">
                  <i className="bi bi-calendar2-x" aria-hidden="true" />
                  <p>
                    {activeFilterDescription
                      ? `No events match the selected filters: ${activeFilterDescription}.`
                      : "There are no events to display right now."}
                  </p>
                  {activeFilterDescription && <small>Try another filter combination or use Clear filters above.</small>}
                </div>
              )}
            </div>
          </div>
          <aside className="events-sidebar">
            <section className="events-side-panel">
              <div className="events-panel-title events-calendar-heading">
                <h2><i className="bi bi-calendar3" /> Event Calendar</h2>
                <div className="events-month-controls">
                  <button type="button" aria-label="Previous month" title="Previous month" onClick={() => changeCalendarMonth(-1)}><i className="bi bi-chevron-left" /></button>
                  <span>{monthLabel}</span>
                  <button type="button" aria-label="Next month" title="Next month" onClick={() => changeCalendarMonth(1)}><i className="bi bi-chevron-right" /></button>
                </div>
              </div>
              <div className="events-weekdays">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <b key={day}>{day}</b>)}</div>
              <div className="events-calendar">
                {Array.from({ length: monthOffset }, (_, i) => <span className="calendar-empty" key={`blank-${calendarYear}-${calendarMonthIndex}-${i}`} />)}
                {Array.from({ length: monthDays }, (_, i) => {
                  const day = i + 1;
                  const dateValue = toLocalDateValue(new Date(calendarYear, calendarMonthIndex, day));
                  const hasEvents = eventDays.has(day);
                  const isToday = day === today.getDate() && calendarMonthIndex === today.getMonth() && calendarYear === today.getFullYear();
                  const isSelected = filterDate === dateValue;
                  return <button type="button" key={dateValue} className={`calendar-day ${isToday ? "today" : ""} ${hasEvents ? "has-event" : ""} ${isSelected ? "selected" : ""}`} onClick={() => selectCalendarDay(day)} aria-label={`${monthLabel} ${day}${hasEvents ? `, ${eventDays.get(day).length} event${eventDays.get(day).length === 1 ? "" : "s"}` : ""}`} aria-pressed={isSelected} title={hasEvents ? `${eventDays.get(day).length} event${eventDays.get(day).length === 1 ? "" : "s"}` : "Filter by this date"}>
                    {day}{hasEvents && <i className="calendar-event-dot" />}
                  </button>;
                })}
              </div>
              {filterDate && <button type="button" className="events-clear-date" onClick={() => setFilterDate("")}>Clear selected date</button>}
            </section>
            <section className="events-side-panel quick-events">
              <div className="events-panel-title"><h2><i className="bi bi-calendar2-check-fill" /> Upcoming Events</h2><span>Coming up next</span></div>
              {upcomingEvents.length ? upcomingEvents.map((event) => <div className="quick-event" key={event.id}><span className="quick-date">{new Date(event.date || event.created_at).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</span><span className="quick-event-info"><b>{event.title}</b><small><i className="bi bi-clock" /> {event.time || "Date to be announced"}</small><small><i className="bi bi-geo-alt-fill" /> {event.location || "School grounds"}</small></span><i className="bi bi-chevron-right" /></div>) : <p className="events-no-quick">No upcoming events are scheduled yet.</p>}
            </section>
            <div className="events-quote"><i className="bi bi-quote" /><p>Together we build a brighter future through education.</p><small>- Lycee Saint Alexandre Sauli de Muhura</small></div>
          </aside>
        </div>
      </section>
    </main>
  );
}
