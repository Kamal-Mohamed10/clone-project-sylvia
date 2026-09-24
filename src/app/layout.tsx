import type { Metadata } from "next";
import "./globals.css";

const CDN = "https://static.spotapps.co/web/sylviasrestaurant--com";

export const metadata: Metadata = {
  title: "Events · Sylvia's Restaurant",
  description:
    "Events at Sylvia's, the Queen of Soul Food in Harlem since 1962. Reserve your table.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        {/* Same stylesheets the original Sylvia's site loads, so the events
            page renders identically. Order matches the source. */}
        <link
          rel="stylesheet"
          href={`${CDN}/lib/bootstrap/css/bootstrap.min.css`}
        />
        <link
          rel="stylesheet"
          href={`${CDN}/lib/font-awesome-4.7.0/css/font-awesome.min.css`}
        />
        {/* Sylvia's own stylesheet, vendored locally (== style.css?version2). */}
        <link rel="stylesheet" href="/vendor/sylvias.css" />
      </head>
      {/* Body classes match Sylvia's events page — the entire events
          stylesheet is scoped under `.events-calendar` / `.events-container`. */}
      <body className="drink-menu events-container events-background events-calendar">
        {children}
      </body>
    </html>
  );
}
