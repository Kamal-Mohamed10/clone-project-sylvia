import type { Metadata } from "next";
import { HEAD_INLINE_CSS } from "@/lib/chrome";
import "./globals.css";

const CDN = "https://static.spotapps.co/web/sylviasrestaurant--com";

/** Every stylesheet the original Sylvia's page loads, in source order. */
const STYLESHEETS = [
  `${CDN}/lib/bootstrap/css/bootstrap.min.css`,
  `${CDN}/lib/custom-scrollbar/jquery.mCustomScrollbar.css`,
  "https://addtocalendar.com/atc/1.5/atc-style-blue.css",
  `${CDN}/lib/font-awesome-4.7.0/css/font-awesome.min.css`,
  `${CDN}/lib/hover_css/css/hover-min.css`,
  `${CDN}/lib/owlcarousel/owl.carousel.min.css`,
  `${CDN}/lib/owlcarousel/owl.theme.default.min.css`,
  "https://static.spotapps.co/web-lib/leaflet/leaflet@1.3.1/dist/leaflet.css",
  "/vendor/sylvias.css", // == css/style.css?version2, vendored
  `${CDN}/css/bottom_navigation_v1.css`,
  // NOTE: the original clone references css/custom.css as a relative path that
  // 404s locally, so it never applies — cards/toolbar stay dark. We match that.
  `${CDN}/lib/icons_font/css/social_icons.css`,
  `${CDN}/lib/twitter_x_font_icon/css/twitter_x.css`,
];

export const metadata: Metadata = {
  title: "Events · Sylvia's Restaurant",
  description:
    "Events at Sylvia's, the Queen of Soul Food in Harlem since 1962. Reserve your table.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        {STYLESHEETS.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        {/* Original inline <style> blocks (includes the events background image). */}
        <style dangerouslySetInnerHTML={{ __html: HEAD_INLINE_CSS }} />
      </head>
      {/* Body classes match the original — the events stylesheet is scoped
          under .events-calendar / .events-container / .events-background. */}
      <body className="drink-menu events-container events-background events-calendar">
        {children}
      </body>
    </html>
  );
}
