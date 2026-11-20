import Head from "next/head";
import { useEffect } from "react";
import "../styles/design-system.css";
import "../styles/design-system-2026.css";
import "../styles/toeic-ui-2026.css";
import "../styles/pastel-glass-2026.css";

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if (reg && typeof reg.update === "function") reg.update().catch(() => {});
        })
        .catch(() => {});
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="application-name" content="GrammarPro.io.vn" />
        <meta name="theme-color" content="#06b6d4" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="GrammarPro.io.vn" />
        <meta property="og:image" content="/og-grammarpro.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/og-grammarpro.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Text:wght@400;500;700&family=Google+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Anti-Flicker theme script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('grammar_theme');
                  var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
                  var isLight = saved ? saved === 'light' : prefersLight;
                  document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
                  document.documentElement.style.backgroundColor = isLight ? '#f3f6fb' : '#090d16';
                } catch (e) {}
              })();
            `,
          }}
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
