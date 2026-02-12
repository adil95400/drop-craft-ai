import { Helmet } from 'react-helmet-async';

/**
 * Google Search Console verification + Google Analytics (gtag.js)
 * Uses VITE_ env vars so values are embedded at build time.
 */
export const GoogleTracking = () => {
  const siteVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION;
  const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  return (
    <Helmet>
      {siteVerification && (
        <meta name="google-site-verification" content={siteVerification} />
      )}
      {gaMeasurementId && (
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} />
      )}
      {gaMeasurementId && (
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaMeasurementId}');
        `}</script>
      )}
    </Helmet>
  );
};
