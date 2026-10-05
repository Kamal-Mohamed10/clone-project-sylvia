"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { findCitedMenuItems, menuHref } from "@/lib/menu";
import { findCitedDrinkItems, type DrinkItem } from "@/lib/drinks";

/**
 * Sylvia's Concierge chat widget: a floating launcher + slide-up panel, mounted
 * site-wide from the root layout. Talks to /api/chat (AI SDK default transport).
 *
 * All styling is scoped under #sylvias-concierge and applied via inline styles /
 * an id-prefixed <style> block so it can't collide with the vendored clone CSS
 * (which loads last and wins class/element ties).
 */

// The site's real nav-toggle pair, from the per-domain custom.css override
// (loaded last in layout.tsx, above): #331F52 deep purple / #F5C552 gold,
// used as an alternating bg/text pair for active nav states.
const PURPLE = "#331F52";
const GOLD_ACCENT = "#F5C552";
const INK = "#1a1a1a";

const SUGGESTIONS = [
  "What's on special today?",
  "Do you have steak?",
  "Book a table for 4 this Friday at 7pm",
  "Check a reservation",
];

function messageText(parts: { type: string }[]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

// The chat bubble is plain text (no markdown/link rendering), so a page-link
// mention in a reply (e.g. "/cater") isn't clickable on its own — surface it
// as a real link card instead, the same way a cited dish gets one.
const PAGE_LINKS = [
  { path: "/cater", label: "View Catering & Large-Party Menu →" },
  { path: "/drinks", label: "View Full Drink Menu →" },
];

function findMentionedPageLinks(text: string): typeof PAGE_LINKS {
  return PAGE_LINKS.filter((p) =>
    new RegExp(`\\${p.path}(?:[\\s.,)]|$)`).test(text),
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop, setMessages } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = status === "submitted" || status === "streaming";
  const lastIsUser = messages[messages.length - 1]?.role === "user";
  const showTyping = busy && lastIsUser;

  // Demo convenience: wipe the conversation back to the empty state (and its
  // starter suggestion chips) without reloading the whole page.
  function resetChat() {
    stop();
    setMessages([]);
    setInput("");
  }

  // Keep the latest message in view as content streams in.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, showTyping]);

  // Focus the input when the panel opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div id="sylvias-concierge">
      <style>{scopedCss}</style>

      {open && <div className="sc-backdrop" aria-hidden="true" />}

      {open && (
        <section className="sc-panel" role="dialog" aria-label="Sylvia's Concierge chat">
          <button
            type="button"
            className="sc-reload"
            aria-label="Restart conversation"
            title="Restart conversation"
            onClick={resetChat}
          >
            ⟳
          </button>

          <button
            type="button"
            className="sc-close"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          >
            ×
          </button>

          <div className="sc-heading">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="sc-heading-portrait" src="/sylvia-portrait.png" alt="Sylvia" />
            <div>
              <div className="sc-title">Sylvia&apos;s Concierge</div>
              <div className="sc-subtitle">Menu, specials &amp; table booking</div>
            </div>
          </div>

          <div className="sc-messages" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="sc-empty">
                <p className="sc-empty-lead">
                  Hi! I&apos;m your digital host. Ask me about the menu, drinks,
                  specials, or events — or book a table right here.
                </p>
                <div className="sc-suggests">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="sc-suggest"
                      onClick={() => submit(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const text = messageText(m.parts);
                if (!text) return null; // skip tool-only steps
                // Only card dishes/drinks that have a photo — every shown card has a pic + link.
                const cited =
                  m.role === "assistant" ? findCitedMenuItems(text).filter((i) => i.image) : [];
                const citedDrinks: DrinkItem[] =
                  m.role === "assistant" ? findCitedDrinkItems(text).filter((d) => d.image) : [];
                const mentionedLinks =
                  m.role === "assistant" ? findMentionedPageLinks(text) : [];
                return (
                  <div key={m.id} className="sc-msg">
                    <div className={`sc-row sc-${m.role}`}>
                      <div className="sc-bubble">{text}</div>
                    </div>
                    {(cited.length > 0 || citedDrinks.length > 0) && (
                      <div className="sc-cards">
                        {cited.map((item) => (
                          // Client-side nav (not a hard <a>) so this widget — mounted
                          // once in the root layout — never unmounts, and the
                          // conversation survives the trip to the menu page.
                          <Link
                            key={item.slug}
                            className="sc-card"
                            href={menuHref(item)}
                            title={`View ${item.name} on the menu`}
                          >
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img className="sc-card-img" src={item.image} alt={item.name} />
                            ) : (
                              <span className="sc-card-img sc-card-noimg" aria-hidden="true">🍽️</span>
                            )}
                            <span className="sc-card-name">{item.name}</span>
                            {item.price > 0 && <span className="sc-card-price">${item.price}</span>}
                          </Link>
                        ))}
                        {citedDrinks.map((item) => (
                          // Drinks have no individual page — every card points at the
                          // full drink menu, same client-side-nav reasoning as above.
                          <Link
                            key={item.slug}
                            className="sc-card"
                            href="/drinks"
                            title={`View ${item.name} on the drink menu`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img className="sc-card-img" src={item.image} alt={item.name} />
                            <span className="sc-card-name">{item.name}</span>
                            {item.price != null && item.price > 0 && (
                              <span className="sc-card-price">${item.price}</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                    {mentionedLinks.map((link) => (
                      // Same client-side-nav reasoning as the dish cards above.
                      <Link key={link.path} className="sc-cta" href={link.path}>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                );
              })
            )}
            {showTyping && (
              <div className="sc-row sc-assistant">
                <div className="sc-bubble sc-typing" aria-label="Concierge is typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            {status === "error" && (
              <div className="sc-row sc-assistant">
                <div className="sc-bubble sc-error">
                  Sorry — something went wrong. Please try again, or call us at
                  (212) 996-0660.
                </div>
              </div>
            )}
          </div>

          <form
            className="sc-inputbar"
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
          >
            <input
              ref={inputRef}
              className="sc-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or book a table…"
              aria-label="Message Sylvia's Concierge"
              autoComplete="off"
            />
            <button
              type="submit"
              className="sc-send"
              disabled={busy || input.trim() === ""}
              aria-label="Send message"
            >
              Send
            </button>
          </form>
        </section>
      )}

      {!open && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sc-launcher-avatar" src="/sylvia-portrait.png" alt="" aria-hidden="true" />

          <button
            type="button"
            className="sc-launcher"
            aria-label="Open Sylvia's Concierge"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <span>
              Let&apos;s
              <br />
              chat!
            </span>
          </button>
        </>
      )}
    </div>
  );
}

const scopedCss = `
#sylvias-concierge { position: fixed; z-index: 2147483000; }
#sylvias-concierge * { box-sizing: border-box; }

/* Same column as .sc-panel (right:20px, same width), reaching ~6px into
   the navbar's bottom edge (--nav-bottom, kept live by NavScroll — the nav
   shrinks on scroll, so a fixed px guess drifts out of sync with it) down
   to the page bottom — just the strip above/below/behind the panel, not
   the whole page. Light touch: you can still make out shapes, just not
   read them. */
#sylvias-concierge .sc-backdrop {
  position: fixed; top: calc(var(--nav-bottom, 140px) - 6px); right: 20px; bottom: 0;
  width: min(380px, calc(100vw - 40px));
  background: rgba(20,14,10,.22);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  pointer-events: none;
  animation: sc-fade .18s ease-out;
}
@keyframes sc-fade { from { opacity: 0; } to { opacity: 1; } }

/* Purple/gold is the site's real nav-toggle pair (custom.css), not the
   sylvias.css orange — used here so the launcher reads as "site chrome",
   not a bolted-on widget. */
/* The launcher itself is the speech bubble: a circle with a small tail. */
#sylvias-concierge .sc-launcher {
  position: fixed; right: 20px; bottom: 80px;
  width: 72px; height: 60px; padding: 0;
  /* A full circle (border-radius: 50%) curves away from its bounding box
     near the corners, so a tail anchored there floats with a visible gap.
     A rounded square keeps flat edges near the corner for the tail to
     actually touch. */
  border: 1px solid ${GOLD_ACCENT}; border-radius: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: ${PURPLE}; color: ${GOLD_ACCENT};
  font-family: inherit;
  box-shadow: 0 6px 20px rgba(0,0,0,.28);
}
/* "Chat with us" has to fit the fixed box without growing it — one word
   per line (forced via <br/>, not width-based wrapping) so it can run a
   bigger, readable size instead of shrinking to fit one line. */
#sylvias-concierge .sc-launcher span {
  font-size: 12.5px; font-weight: 700; line-height: 1.3; letter-spacing: .2px;
  text-align: center;
}
/* Tail is two stacked triangles: a larger gold one (the "border") behind a
   smaller purple one (the fill), offset by the circle's border width. */
#sylvias-concierge .sc-launcher::before {
  content: ""; position: absolute; right: 11px; bottom: -8px;
  width: 0; height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 9px solid ${GOLD_ACCENT};
}
#sylvias-concierge .sc-launcher::after {
  content: ""; position: absolute; right: 12px; bottom: -6px;
  width: 0; height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 8px solid ${PURPLE};
}
#sylvias-concierge .sc-launcher:hover { background: ${GOLD_ACCENT}; color: ${PURPLE}; }
#sylvias-concierge .sc-launcher:hover::after { border-top-color: ${GOLD_ACCENT}; }
#sylvias-concierge .sc-launcher:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }

/* Centered under the bubble (bubble spans right:20-92, center at 56). */
#sylvias-concierge .sc-launcher-avatar {
  position: fixed; right: 30px; bottom: 20px;
  width: 52px; height: 52px; border-radius: 50%; object-fit: cover;
  border: 2px solid ${PURPLE}; box-shadow: 0 6px 20px rgba(0,0,0,.28);
}

#sylvias-concierge .sc-panel {
  /* The launcher bubble + avatar are hidden while open (see JSX), so there's
     no need to leave room for them here — drop back to the screen edge. */
  position: fixed; right: 20px; bottom: 20px;
  width: min(380px, calc(100vw - 40px));
  /* The fixed navbar reserves 160px at the top of the page (see .pagecontent
     padding-top in sylvias.css) — but this panel is position:fixed too, so
     it won't respect that on its own. Cap height at 100vh minus the 20px
     bottom offset, minus the navbar's real 160px, minus a 20px gap so the
     panel clears the navbar by the same margin it keeps from the bottom. */
  height: min(560px, calc(100vh - 185px));
  display: flex; flex-direction: column;
  background: #fff; color: ${INK};
  border-radius: 14px; overflow: hidden;
  box-shadow: 0 12px 40px rgba(0,0,0,.35);
  font-family: inherit;
  animation: sc-rise .18s ease-out;
}
@keyframes sc-rise { from { transform: translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }

/* Transparent header: no colored bar. Close button floats over the top-right; the
   title/subtitle live at the top of the chat area (scroll with the conversation). */
#sylvias-concierge .sc-close {
  position: absolute; top: 8px; right: 8px; z-index: 5;
  width: 38px; height: 38px; border-radius: 50%; border: none; cursor: pointer;
  font-size: 22px; line-height: 38px; color: ${INK};
  background: rgba(255,255,255,.75); backdrop-filter: blur(3px);
}
#sylvias-concierge .sc-close:hover { background: rgba(240,240,240,.95); }
/* Same floating style as .sc-close, one slot to its left. */
#sylvias-concierge .sc-reload {
  position: absolute; top: 8px; right: 50px; z-index: 5;
  width: 38px; height: 38px; border-radius: 50%; border: none; cursor: pointer;
  font-size: 18px; line-height: 38px; color: ${INK};
  background: rgba(255,255,255,.75); backdrop-filter: blur(3px);
}
#sylvias-concierge .sc-reload:hover { background: rgba(240,240,240,.95); }
/* Sits outside .sc-messages so it stays put while messages scroll under it. */
#sylvias-concierge .sc-heading {
  flex: 0 0 auto;
  display: flex; align-items: center; gap: 10px;
  padding: 16px 44px 12px 16px; border-bottom: 1px solid #eee;
}
#sylvias-concierge .sc-heading-portrait {
  width: 40px; height: 40px; border-radius: 50%; object-fit: cover;
  border: 2px solid ${PURPLE}; flex: 0 0 auto;
}
#sylvias-concierge .sc-title { font-size: 17px; font-weight: 700; color: ${INK}; }
#sylvias-concierge .sc-subtitle { font-size: 12px; color: #666; margin-top: 2px; }

#sylvias-concierge .sc-messages {
  flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px;
}
#sylvias-concierge .sc-empty-lead { font-size: 14px; line-height: 1.5; margin: 0 0 14px; }
#sylvias-concierge .sc-suggests { display: flex; flex-direction: column; gap: 8px; }
#sylvias-concierge .sc-suggest {
  text-align: left; padding: 11px 13px; border: 1px solid ${PURPLE};
  background: #fff; color: ${INK}; border-radius: 10px; cursor: pointer;
  font-size: 13.5px; font-family: inherit; min-height: 44px;
  transition: background .15s ease, box-shadow .15s ease, transform .15s ease;
}
#sylvias-concierge .sc-suggest:hover {
  background: ${PURPLE}; color: #fff;
  box-shadow: 0 3px 10px rgba(0,0,0,.18); transform: translateY(-1px);
}

#sylvias-concierge .sc-msg { display: flex; flex-direction: column; gap: 8px; }
#sylvias-concierge .sc-row { display: flex; }
#sylvias-concierge .sc-user { justify-content: flex-end; }
#sylvias-concierge .sc-assistant { justify-content: flex-start; }

/* Menu-item thumbnail cards under a reply that names a dish. */
#sylvias-concierge .sc-cards { display: flex; gap: 8px; overflow-x: auto; padding: 2px 1px 4px; }
#sylvias-concierge .sc-card { flex: 0 0 auto; width: 128px; text-decoration: none; color: ${INK};
  border: 1px solid #eee; border-radius: 12px; background: #fff; overflow: hidden; }
#sylvias-concierge .sc-card:hover { border-color: ${PURPLE}; box-shadow: 0 2px 10px rgba(0,0,0,.12); }
#sylvias-concierge .sc-card-img { display: block; width: 100%; height: 76px; object-fit: cover; background: #f2f2f2; }
#sylvias-concierge .sc-card-noimg { display: flex; align-items: center; justify-content: center; font-size: 28px; }
#sylvias-concierge .sc-card-name { display: block; font-size: 12px; line-height: 1.3; padding: 6px 8px 0; font-weight: 600; }
#sylvias-concierge .sc-card-price { display: block; font-size: 12px; color: ${PURPLE}; font-weight: 700; padding: 2px 8px 8px; }

/* Link card under a reply that points the guest to a real page (e.g. /cater) —
   plain chat text can't be clicked, so a reply mentioning one gets this. */
#sylvias-concierge .sc-cta {
  display: inline-block; align-self: flex-start; margin-top: 2px;
  padding: 9px 14px; border: 1px solid ${PURPLE}; border-radius: 10px;
  background: #fff; color: ${PURPLE}; text-decoration: none;
  font-size: 13px; font-weight: 700;
  transition: background .15s ease, color .15s ease;
}
#sylvias-concierge .sc-cta:hover { background: ${PURPLE}; color: #fff; }
#sylvias-concierge .sc-bubble {
  max-width: 82%; padding: 10px 13px; border-radius: 14px;
  font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word;
}
#sylvias-concierge .sc-user .sc-bubble { background: ${PURPLE}; color: #fff; border-bottom-right-radius: 4px; }
#sylvias-concierge .sc-assistant .sc-bubble { background: #f2f2f2; color: ${INK}; border-bottom-left-radius: 4px; }
#sylvias-concierge .sc-error { background: #fbe3d8 !important; color: #7a2e12 !important; }

#sylvias-concierge .sc-typing { display: inline-flex; gap: 4px; align-items: center; }
#sylvias-concierge .sc-typing span {
  width: 7px; height: 7px; border-radius: 50%; background: ${PURPLE};
  animation: sc-blink 1.2s infinite ease-in-out;
}
#sylvias-concierge .sc-typing span:nth-child(2) { animation-delay: .2s; }
#sylvias-concierge .sc-typing span:nth-child(3) { animation-delay: .4s; }
@keyframes sc-blink { 0%, 80%, 100% { opacity: .3; } 40% { opacity: 1; } }

#sylvias-concierge .sc-inputbar {
  display: flex; gap: 8px; padding: 12px; border-top: 1px solid #eee; background: #fff;
}
#sylvias-concierge .sc-input {
  flex: 1; min-height: 44px; padding: 0 13px; border: 1px solid ${PURPLE};
  border-radius: 10px; font-size: 14px; font-family: inherit; color: ${INK}; background: #fff;
}
#sylvias-concierge .sc-input:focus-visible { outline: 2px solid ${PURPLE}; outline-offset: 0; border-color: ${PURPLE}; }
#sylvias-concierge .sc-send {
  min-height: 44px; padding: 0 18px; border: none; border-radius: 10px; cursor: pointer;
  background: ${PURPLE}; color: #fff; font-size: 14px; font-weight: 700; font-family: inherit;
  text-transform: uppercase; letter-spacing: .04em;
}
#sylvias-concierge .sc-send:disabled { opacity: .5; cursor: not-allowed; }
#sylvias-concierge .sc-send:not(:disabled):hover { filter: brightness(1.08); }

@media (prefers-reduced-motion: reduce) {
  #sylvias-concierge .sc-panel { animation: none; }
  #sylvias-concierge .sc-typing span { animation: none; }
}
`;
