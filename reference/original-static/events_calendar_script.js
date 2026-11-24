window.addEventListener('load', () => {
  const eventsPageContentHolder = document.querySelector('.events-calendar-page-content');
  if (typeof eventsPageContentHolder === 'undefined' || !eventsPageContentHolder || eventsPageContentHolder === null) return;

  const pinboardAgendaContainer = document.getElementById('pinboardAgendaContainer');
  const calendarContainer = document.getElementById('calendarContainer');
  const pinBtn = document.getElementById('eventPinboardView');
  const agdBtn = document.getElementById('eventAgendaView');
  const calBtn = document.getElementById('eventCalendarView');
  const monthFilterHolder = document.querySelector('.events-months-filter-holder');
  const monthFilter = document.getElementById('monthFilter');
  const noEventsMsg = document.getElementById('noEventsMessage');
  const cards = Array.from(pinboardAgendaContainer.querySelectorAll('.event-calendar-card'));
  const defaultView = document.getElementById('calendarViewControl').dataset.defaultView || 'pinboard';
  const months = Array.from(document.querySelectorAll('.month'));
  const yearContainers = document.querySelectorAll('.year-container');
  const mediaQueryMobile = window.matchMedia('(max-width: 767px)');

  // Years rendered by PHP (current + next)
  const NOW = new Date();
  const PAGE_YEARS = [NOW.getFullYear(), NOW.getFullYear() + 1];

  // Layout Constants
  const MASONRY_COLUMN_WIDTH = 270;
  const MASONRY_GUTTER = 20;

  // Slider: include empty months?
  const INCLUDE_EMPTY_MONTHS_IN_SLIDER = false;

  let eventsMasonry;
  let currentView = defaultView;
  let visibleCards = [];

  const view_classes = {
    pinboard: 'events-pinboard-view',
    agenda: 'events-agenda-view',
    calendar: 'events-calendar-view'
  };
  const view_buttons = { pinboard: pinBtn, agenda: agdBtn, calendar: calBtn };

  // Recurrence types (case-insensitive)
  const RECUR_TYPES = new Set([
    'every', 'every week', 'every weekday', 'daily', 'custom',
    'monthly on x', 'monthly-on-x', 'monthly_on_x',
    'annually', 'yearly'
  ]);

  // ======= Modal (Pinboard + Calendar) – agenda-like layout =======
  const ecModal = document.getElementById('eventCalendarModal');
  const ecModalOverlay = ecModal?.querySelector('.event-calendar-modal-overlay');
  const ecModalClose = ecModal?.querySelector('.event-calendar-modal-close');
  const ecModalText = ecModal?.querySelector('.event-calendar-modal-text');
  const ecModalMedia = ecModal?.querySelector('.event-calendar-modal-media');
  let lastTriggerEl = null;
  let ecIsAnimating = false;
  let pinboardAgendaAbortControler = null;

  function onDialogTransitionEnd(dialogEl, cb, fallbackMs = 300) {
    let fired = false;
    const done = () => {
      if (fired) return;
      fired = true;
      dialogEl.removeEventListener('transitionend', onEnd);
      clearTimeout(timer);
      cb();
    };
    const onEnd = (e) => {
      if (e.target === dialogEl) done();
    };
    const timer = setTimeout(done, fallbackMs);
    dialogEl.addEventListener('transitionend', onEnd, { once: true });
  }

  function showModal({ imgSrc, imgAlt, bodyHTML }) {
    if (!ecModal || ecIsAnimating) return;
    ecIsAnimating = true;
    
    ecModalText.innerHTML = bodyHTML || '';

    if (imgSrc) {
      ecModalMedia.style.display = '';
      ecModalMedia.innerHTML = `<img src="${imgSrc}" alt="${imgAlt || ''}">`;
    } else {
      ecModalMedia.style.display = 'none';
      ecModalMedia.innerHTML = '';
    }

    document.body.classList.add('event-calendar-modal-open');

    ecModal.classList.remove('is-closing');
    ecModal.classList.add('is-open');
    ecModal.setAttribute('aria-hidden', 'false');

    ecModal.setAttribute('tabindex', '-1');
    ecModal?.focus({ preventScroll: true });

    requestAnimationFrame(() => { ecIsAnimating = false; });

    document.querySelectorAll("body>*:not(#eventCalendarModal)").forEach(el => el.setAttribute('inert', 'true'));
  }

  function closeModal() {
    document.querySelectorAll("body>*:not(#eventCalendarModal)").forEach(el => el.removeAttribute('inert'));
    // Restore focus
    if (lastTriggerEl) {
      try { lastTriggerEl.focus({ preventScroll: true }); } catch(e){}
    }
    if (!ecModal || ecIsAnimating) return;
    ecIsAnimating = true;

    ecModal.classList.add('is-closing');
    ecModal.classList.remove('is-open');

    const cleanup = () => {
      ecModal.setAttribute('aria-hidden', 'true');
      ecModal.classList.remove('is-closing');
      document.body.classList.remove('event-calendar-modal-open');
      ecIsAnimating = false;
    };

    const dialogEl = ecModal.querySelector('.event-calendar-modal-dialog') || ecModal;
    onDialogTransitionEnd(dialogEl, cleanup, 320);
  }

  ecModalClose?.addEventListener('click', closeModal);
  ecModalOverlay?.addEventListener('click', (e) => {
    if (e.target === ecModalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ecModal?.classList.contains('is-open')) closeModal();
  });

  function openModalFromPinboardCard(card) {
    const imgEl = card.querySelector('.event-image-holder img');
    const imgSrc = imgEl?.src || '';
    const imgAlt = imgEl?.alt || '';

    const bodyHTML = card.querySelector('.event-text-holder')?.innerHTML || '';

    showModal({ imgSrc, imgAlt, bodyHTML });
  }

  function openModalFromCalendarItem(itemEl) {
    // From calendar list item to full content via matching pinboard card by event id
    const evId = itemEl.getAttribute('data-event-id');
    const sourceCard = evId ? document.getElementById(evId) : null;

    // Image: prefer pinboard image; fallback to calendar tiny image if present
    let imgSrc = '';
    let imgAlt = '';
    const pinImg = sourceCard?.querySelector('.event-image-holder img');
    if (pinImg && pinImg.src) {
      imgSrc = pinImg.src;
      imgAlt = pinImg.alt || '';
    } else {
      const calImg = itemEl.querySelector('.ev-image img');
      if (calImg && calImg.src) {
        imgSrc = calImg.src;
        imgAlt = calImg.alt || '';
      }
    }

    const bodyHTML = sourceCard?.querySelector('.event-text-holder')?.innerHTML || '';

    showModal({ imgSrc, imgAlt, bodyHTML });
  }

  // ======= Slider state =======
  let calendarSlides = [];
  let calendarSlideIndex = 0;
  let calendarNavEl = null;
  let navKeyHandlerInstalled = false;

  // ======= Generic helpers =======
  function parseISODate(s) {
    if (!s) return null;
    const ymd = s.slice(0, 10); // 'YYYY-MM-DD'
    const [y, m, d] = ymd.split('-').map(x => parseInt(x, 10));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }
  function monthRange(year, monthIdx) {
    const start = new Date(year, monthIdx, 1);
    const end = new Date(year, monthIdx + 1, 0);
    return { start, end };
  }
  function rangesIntersect(aStart, aEnd, bStart, bEnd) {
    const ae = aEnd ? aEnd : new Date(8640000000000000);
    return (aStart <= bEnd) && (ae >= bStart);
  }
  function occursMonthlyOnXInYear(recStart, recEnd, monthIdx, year) {
    const weekday = recStart.getDay();
    const nth = Math.ceil(recStart.getDate() / 7);
    const firstOfMonth = new Date(year, monthIdx, 1);
    const firstW = firstOfMonth.getDay();
    const offset = (weekday - firstW + 7) % 7;
    const cand = new Date(year, monthIdx, 1 + offset + (nth - 1) * 7);
    if (cand.getMonth() !== monthIdx) return false;
    if (cand < recStart) return false;
    if (recEnd && cand > recEnd) return false;
    return true;
  }
  function occursAnnuallyInYear(recStart, recEnd, monthIdx, year) {
    const m = recStart.getMonth();
    const d = recStart.getDate();
    if (m !== monthIdx) return false;

    const cand = new Date(year, m, d);
    if (cand.getMonth() !== m) return false; // e.g., Feb 29 on non-leap year
    if (cand < recStart) return false;
    if (recEnd && cand > recEnd) return false;
    return true;
  }
  function recursInSelectedMonth(card, monthIdx) {
    const recType = (card.getAttribute('data-event-recurrence-type') || '').trim().toLowerCase();
    if (!RECUR_TYPES.has(recType)) return false;

    const startDate = parseISODate(card.getAttribute('data-event-start-date') || '');
    if (!startDate) return false;
    const endDateRaw = card.getAttribute('data-event-end-date') || '';
    const endDate = endDateRaw ? parseISODate(endDateRaw) : null;

    if (recType.startsWith('monthly')) {
      return PAGE_YEARS.some(y => occursMonthlyOnXInYear(startDate, endDate, monthIdx, y));
    }
    if (recType === 'annually' || recType === 'yearly') {
      return PAGE_YEARS.some(y => occursAnnuallyInYear(startDate, endDate, monthIdx, y));
    }
    return PAGE_YEARS.some(y => {
      const { start, end } = monthRange(y, monthIdx);
      return rangesIntersect(startDate, endDate, start, end);
    });
  }
  function selectedMonthKey() {
    return monthFilter.options[monthFilter.selectedIndex]?.dataset.monthOption || 'all';
  }
  function countCalendarEventsForMonthKey(monthKey) {
    if (monthKey === 'all') return calendarContainer.querySelectorAll('.calendar-day-event').length;
    let total = 0;
    const monthNodes = calendarContainer.querySelectorAll(`.month[data-month-name="${monthKey}"]`);
    monthNodes.forEach(m => { total += m.querySelectorAll('.calendar-day-event').length; });
    return total;
  }
  function updateYearHeaderVisibility() {
    yearContainers.forEach(yearEl => {
      const anyMonthVisible = Array
        .from(yearEl.querySelectorAll('.month'))
        .some(m => m.style.display !== 'none');
      const header = yearEl.querySelector('.year-header');
      yearEl.style.display = anyMonthVisible ? '' : 'none';
      if (header) header.style.display = anyMonthVisible ? '' : 'none';
    });
  }
  function isActivationKey(e) {
    return e.key === 'Enter' || e.key === ' ';
  }

  // ======= Slider helpers =======
  function collectVisibleMonths() {
    const selectedKey = selectedMonthKey();
    return Array.from(calendarContainer.querySelectorAll('.month')).filter(m => {
      const matchesFilter = (selectedKey === 'all') || (m.dataset.monthName === selectedKey);
      if (!matchesFilter) return false;
      if (INCLUDE_EMPTY_MONTHS_IN_SLIDER) return true;
      return !!m.querySelector('.calendar-day-event');
    });
  }
  function getMonthYearText(monthEl) {
    const key = (monthEl.dataset.monthName || '').trim();
    const monthPretty = key ? key.charAt(0).toUpperCase() + key.slice(1) : '';
    const anyDay = monthEl.querySelector('.day-card[data-date]')?.getAttribute('data-date');
    const year = anyDay ? anyDay.split('-')[0] : '';
    return [monthPretty, year].filter(Boolean).join(' ');
  }
  function ensureCalendarNav() {
    if (calendarNavEl) return;
    calendarNavEl = document.createElement('div');
    calendarNavEl.className = 'calendar-slider-nav';
    calendarNavEl.innerHTML = `
      <div class="slider-arrows-holder">
        <button type="button" class="cal-prev" aria-label="Previous month"><i class="fa fa-angle-left" aria-hidden="true"></i></button>
        <button type="button" class="cal-next" aria-label="Next month"><i class="fa fa-angle-right" aria-hidden="true"></i></button>
      </div>
      <div class="events-slider-text" aria-live="polite"></div>
    `;
    calendarContainer.prepend(calendarNavEl);

    const prev = calendarNavEl.querySelector('.cal-prev');
    const next = calendarNavEl.querySelector('.cal-next');

    prev.addEventListener('click', () => stepCalendarSlide(-1));
    next.addEventListener('click', () => stepCalendarSlide(1));

    if (!navKeyHandlerInstalled) {
      document.addEventListener('keydown', (e) => {
        if (currentView !== 'calendar') return;
        if (!calendarNavEl) return;
        const p = calendarNavEl.querySelector('.cal-prev');
        const n = calendarNavEl.querySelector('.cal-next');
        if (e.key === 'ArrowLeft' && p && !p.disabled) { e.preventDefault(); stepCalendarSlide(-1); }
        if (e.key === 'ArrowRight' && n && !n.disabled) { e.preventDefault(); stepCalendarSlide(1);  }
      });
      navKeyHandlerInstalled = true;
    }
  }
  function updateNavButtonStates() {
    if (!calendarNavEl) return;
    const prev = calendarNavEl.querySelector('.cal-prev');
    const next = calendarNavEl.querySelector('.cal-next');
    const n = calendarSlides.length;
    const i = calendarSlideIndex;
    const prevDisabled = (n <= 1) || (i === 0);
    const nextDisabled = (n <= 1) || (i === n - 1);
    prev.disabled = prevDisabled;
    next.disabled = nextDisabled;
    prev.setAttribute('aria-disabled', prevDisabled ? 'true' : 'false');
    prev.setAttribute('aria-hidden', prevDisabled ? 'true' : 'false');
    next.setAttribute('aria-disabled', nextDisabled ? 'true' : 'false');
    next.setAttribute('aria-hidden', nextDisabled ? 'true' : 'false');
  }
  function updateYearContainersForSlide(activeMonth) {
    yearContainers.forEach(yc => {
      const show = yc.contains(activeMonth);
      yc.style.display = show ? '' : 'none';
      const header = yc.querySelector('.year-header');
      if (header) header.style.display = show ? '' : 'none';
    });
  }
  function showCalendarSlide(idx) {
    if (!calendarSlides.length) {
      if (calendarNavEl) calendarNavEl.style.display = 'none';
      return;
    }
    calendarSlideIndex = Math.max(0, Math.min(idx, calendarSlides.length - 1));
    calendarSlides.forEach((m, i) => { m.style.display = (i === calendarSlideIndex) ? 'block' : 'none'; });
    updateYearContainersForSlide(calendarSlides[calendarSlideIndex]);
    ensureCalendarNav();
    calendarNavEl.style.display = '';
    const label = calendarNavEl.querySelector('.events-slider-text');
    const text  = getMonthYearText(calendarSlides[calendarSlideIndex]);
    label.innerHTML = `
      <div class="events-slide-number">${calendarSlideIndex + 1} / ${calendarSlides.length}</div>
      <div class="events-slider-month-year">${text}</div>
    `;
    updateNavButtonStates();
  }
  function stepCalendarSlide(delta) { showCalendarSlide(calendarSlideIndex + delta); }
  function rebuildCalendarSlider(resetIndex = true) {
    calendarSlides = collectVisibleMonths();
    if (!calendarSlides.length) {
      if (calendarNavEl) calendarNavEl.style.display = 'none';
      updateYearHeaderVisibility();
      return;
    }
    if (resetIndex) calendarSlideIndex = 0;
    ensureCalendarNav();
    calendarNavEl.style.display = '';
    showCalendarSlide(calendarSlideIndex);
  }
  function teardownCalendarSlider() {
    if (!calendarSlides.length) {
      if (calendarNavEl) calendarNavEl.style.display = 'none';
      updateYearHeaderVisibility();
      return;
    }
    calendarSlides.forEach(m => { m.style.display = 'block'; });
    calendarSlides = [];
    calendarSlideIndex = 0;
    updateYearHeaderVisibility();
    if (calendarNavEl) calendarNavEl.style.display = 'none';
  }

  // ======= Month filter enable/disable =======
  function setMonthFilterEnabled(enabled) {
    monthFilter.disabled = !enabled;
    monthFilter.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    monthFilterHolder.classList.toggle('is-disabled', !enabled);
  }

  // Show "Read more" only when the description is actually truncated (Pinboard only)
  function setupReadMoreButtons() {
    if (currentView !== 'pinboard') return;

    const cardsRoot = document.getElementById('pinboardAgendaContainer');
    if (!cardsRoot) return;

    cardsRoot.querySelectorAll('.event-info-text').forEach(desc => {
      const readMore = desc.nextElementSibling;
      if (!readMore || !readMore.classList.contains('event-read-more')) return;

      // reset first
      readMore.style.display = 'none';

      // wait a tick so layout is accurate
      requestAnimationFrame(() => {
        if (desc.scrollHeight > desc.clientHeight) {
          readMore.style.display = 'block';
        }
        layoutMasonry();
      });
    });
  }

  // ======= Views & filtering =======
  function renderFilter(monthValue) {
    let visibleCount = 0;
    visibleCards.length = 0;

    const selectedIdx = monthFilter.selectedIndex;
    const selectedOptionText = monthFilter.options[selectedIdx]?.text || 'All months';
    const selectedKey = selectedMonthKey();
    const monthIdx = monthValue === 'all' ? null : (parseInt(monthValue, 10) - 1);

    // Pinboard/Agenda cards visibility
    cards.forEach(card => {
      const startDateStr = (card.getAttribute('data-event-start-date') || '').slice(0, 10);
      const cardMonth = startDateStr.slice(5, 7);
      const recType = (card.getAttribute('data-event-recurrence-type') || '').trim().toLowerCase();
      const isRecurring = RECUR_TYPES.has(recType);

      let shouldDisplay = false;
      if (monthValue === 'all') shouldDisplay = true;
      else if (!isRecurring && cardMonth === monthValue) shouldDisplay = true;
      else if (isRecurring && monthIdx !== null) shouldDisplay = recursInSelectedMonth(card, monthIdx);

      shouldDisplay ? card.removeAttribute('aria-hidden') : card.setAttribute('aria-hidden', 'true');
      
      card.style.display = shouldDisplay ? '' : 'none';
      if (shouldDisplay) {
        visibleCount++;
        visibleCards.push(card);
      };
    });

    // Calendar months visibility (pre-slider)
    const showingAll = selectedKey === 'all';
    months.forEach(m => {
      const matchesFilter = showingAll || m.dataset.monthName === selectedKey;
      const hasEvent = !!m.querySelector('.calendar-day-event');
      m.style.display = matchesFilter && hasEvent ? 'block' : 'none';
    });

    updateYearHeaderVisibility();

    // No-events message
    if (currentView === 'calendar') {
      const totalForMonth = countCalendarEventsForMonthKey(selectedKey);
      if (totalForMonth === 0) {
        noEventsMsg.innerHTML = showingAll ? '<h2>No events available.</h2>' : `<h2>No events in ${selectedOptionText}.</h2>`;
        noEventsMsg.style.display = '';
      } else {
        noEventsMsg.style.display = 'none';
      }
    } else {
      if (visibleCount === 0) {
        noEventsMsg.innerHTML = monthValue === 'all' ? '<h2>No events available.</h2>' : `<h2>No events in ${selectedOptionText}.</h2>`;
        noEventsMsg.style.display = '';
      } else {
        noEventsMsg.style.display = 'none';
      }
    }

    layoutMasonry();
    setupReadMoreButtons();

    if (currentView === 'calendar') rebuildCalendarSlider(true);
  }

  function setCardsTabing(tabable) {
    if(tabable) {
      cards.forEach(card => {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-haspopup', 'dialog');
        card.setAttribute('aria-controls', 'eventCalendarModal');
      });
    } else {
      cards.forEach(card => {
        card.setAttribute('tabindex', '-1');
        card.removeAttribute('role');
        card.removeAttribute('aria-haspopup');
        card.removeAttribute('aria-controls');
      });
    }
  }

  function switchView(viewName) {
    currentView = viewName;

    // remove all view classes + add the one we want
    Object.values(view_classes).forEach(c => pinboardAgendaContainer.classList.remove(c));
    pinboardAgendaContainer.classList.add(view_classes[viewName]);

    // show/hide containers
    calendarContainer.style.display = (viewName === 'calendar') ? 'block' : 'none';
    pinboardAgendaContainer.style.display = (viewName === 'calendar') ? 'none' : 'block';

    // update active button
    Object.values(view_buttons).forEach(btn => {
      btn.classList.remove('active');
      btn.removeAttribute('aria-current');
    });
    view_buttons[viewName].classList.add('active');
    view_buttons[viewName].setAttribute('aria-current', 'true');

    if (viewName === 'calendar') {
      // Force 'all' and disable filter in Calendar view
      monthFilter.value = 'all';
      setMonthFilterEnabled(false);
      renderFilter('all');
      rebuildCalendarSlider(true);
    } else {
      // Re-enable for Pinboard/Agenda
      setMonthFilterEnabled(true);
      teardownCalendarSlider();
      renderFilter(monthFilter.value);
      if (viewName === 'pinboard') {
        setupReadMoreButtons();
        setCardsTabing(true);
        enablePinboardAgendaInteraction();
      } else {
        setCardsTabing(false);
        disablePinboardAgendaInteraction();
      };
    }
  }

  // ======= Masonry & media =======
  function layoutMasonry() {
    if (!eventsMasonry) {
      eventsMasonry = new Masonry(pinboardAgendaContainer, {
        itemSelector: '.event-calendar-card',
        columnWidth: MASONRY_COLUMN_WIDTH,
        gutter: MASONRY_GUTTER,
        fitWidth: true,
        horizontalOrder: true
      });
    } else {
      eventsMasonry.layout();
    }
  }
  imagesLoaded(pinboardAgendaContainer, () => {
    layoutMasonry();
    setupReadMoreButtons();
  });

  // ======= Events: controls =======
  pinBtn.addEventListener('click', () => switchView('pinboard'));
  agdBtn.addEventListener('click', () => switchView('agenda'));
  calBtn.addEventListener('click', () => switchView('calendar'));

  monthFilter.addEventListener('change', () => {
    renderFilter(monthFilter.value);
    (visibleCards[0] || noEventsMsg)?.focus();
  });

  function enablePinboardAgendaInteraction() {
    if (pinboardAgendaAbortControler) return;
    pinboardAgendaAbortControler = new AbortController();
    const { signal } = pinboardAgendaAbortControler;

    pinboardAgendaContainer.addEventListener('click', (evt) => {
      if (currentView !== 'pinboard') return;
      if (evt.target.closest('.buy-tickets-button-wcache, a[href], button[type="submit"]')) return;

      const rmBtn = evt.target.closest('.event-read-more');
      if (rmBtn) {
        const card = rmBtn.closest('.event-calendar-card');
        if (card) {
          evt.preventDefault();
          lastTriggerEl = rmBtn;
          openModalFromPinboardCard(card);
        }
        return;
      }

      const card = evt.target.closest('.event-calendar-card');
      if (!card) return;
      lastTriggerEl = card;
      openModalFromPinboardCard(card);
    }, { signal });
  }

  function disablePinboardAgendaInteraction() {
    if (pinboardAgendaAbortControler) {
      pinboardAgendaAbortControler.abort();
      pinboardAgendaAbortControler = null;
    }
  }

  // OPEN MODAL — Calendar events (.calendar-day-event pills)
  calendarContainer.addEventListener('click', (evt) => {
    if (currentView !== 'calendar') return;
    const pill = evt.target.closest('.calendar-day-event');
    if (!pill) return;
    lastTriggerEl = pill;
    openModalFromCalendarItem(pill);
  });
  
  pinboardAgendaContainer.addEventListener('keydown', (e) => {
    if (currentView !== 'pinboard') return;

    const readMoreEl = e.target.closest('.event-read-more');
    if (readMoreEl && isActivationKey(e)) {
      e.preventDefault();
      lastTriggerEl = readMoreEl;
      const card = readMoreEl.closest('.event-calendar-card');
      if (card) openModalFromPinboardCard(card);
      return;
    }

    const card = e.target.closest('.event-calendar-card');
    if (!card || e.target !== card) return;
    if (!isActivationKey(e)) return;

    e.preventDefault();
    lastTriggerEl = card;
    openModalFromPinboardCard(card);
  });

  calendarContainer.addEventListener('keydown', (e) => {
    if (currentView !== 'calendar') return;

    const pill = e.target.closest('.calendar-day-event');
    if (!pill || e.target !== pill) return;
    if (!isActivationKey(e)) return;

    e.preventDefault();
    lastTriggerEl = pill;
    openModalFromCalendarItem(pill);
  });

  function isRealMouseDevice() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (currentView === 'pinboard' && isRealMouseDevice()) card.classList.add('event-card-hovering');
    });
    card.addEventListener('mouseleave', () => {
      card.classList.remove('event-card-hovering');
    });
  });

  calendarContainer.addEventListener('mouseover', (e) => {
    if (currentView !== 'calendar' || !isRealMouseDevice()) return;
    const ev = e.target.closest('.calendar-day-event');
    if (!ev) return;

    // prevent false positives when moving inside the same item
    const from = e.relatedTarget && e.relatedTarget.closest('.calendar-day-event');
    if (from === ev) return;

    ev.classList.add('calendar-event-hovering');
  });

  calendarContainer.addEventListener('mouseout', (e) => {
    if (currentView !== 'calendar' || !isRealMouseDevice()) return;
    const ev = e.target.closest('.calendar-day-event');
    if (!ev) return;

    // ignore when staying within the same item
    const to = e.relatedTarget && e.relatedTarget.closest('.calendar-day-event');
    if (to === ev) return;

    ev.classList.remove('calendar-event-hovering');
  });

  let resizeTimeout;
  window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(setupReadMoreButtons, 200);
  });

  mediaQueryMobile.addEventListener('change', () => {
    if(mediaQueryMobile.matches && currentView === "agenda") switchView('pinboard');
  });

  // Mark past/current days in calendar grid (includes empty-day-card)
  (function markDays() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;

    document.querySelectorAll('.day-card[data-date], .empty-day-card[data-date]').forEach(el => {
      const d = el.getAttribute('data-date');
      if (!d) return;
      if (d < today) {
        el.classList.add('day-passed');
      } else if (d === today && el.classList.contains('day-card')) {
        el.classList.add('current-day');
      }
    });
  })();

  // Initial view
  (function init() {
    switchView(defaultView);
    if(mediaQueryMobile.matches && currentView === 'agenda') switchView('pinboard');
    enablePinboardAgendaInteraction();
  })();
});