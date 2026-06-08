import Script from "next/script";

import type { PublicSiteSettings } from "@/lib/site-settings";

type SiteAnalyticsProps = {
  settings: PublicSiteSettings;
};

const gtmSnippet = (containerId: string) => `
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','${containerId}');
`;

const ga4Snippet = (measurementId: string) => `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');
`;

export function SiteAnalytics({ settings }: SiteAnalyticsProps) {
  if (
    !settings.analyticsEnabled ||
    settings.cookieConsentRequired ||
    (!settings.ga4MeasurementId && !settings.googleTagManagerId)
  ) {
    return null;
  }

  return (
    <>
      {settings.googleTagManagerId ? (
        <Script
          id="irhal-gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: gtmSnippet(settings.googleTagManagerId),
          }}
        />
      ) : null}
      {settings.ga4MeasurementId ? (
        <>
          <Script
            id="irhal-ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.ga4MeasurementId}`}
            strategy="afterInteractive"
          />
          <Script
            id="irhal-ga4"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: ga4Snippet(settings.ga4MeasurementId),
            }}
          />
        </>
      ) : null}
    </>
  );
}

export function GoogleTagManagerNoScript({ settings }: SiteAnalyticsProps) {
  if (
    !settings.analyticsEnabled ||
    settings.cookieConsentRequired ||
    !settings.googleTagManagerId
  ) {
    return null;
  }

  return (
    <noscript>
      <iframe
        height="0"
        src={`https://www.googletagmanager.com/ns.html?id=${settings.googleTagManagerId}`}
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
        width="0"
      />
    </noscript>
  );
}
