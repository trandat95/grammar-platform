import Head from "next/head";
import { useEffect } from "react";

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Anti-Flicker theme script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('grammar_theme');
                  var isLight = saved === 'light';
                  document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
                  document.documentElement.style.backgroundColor = isLight ? '#f8fafc' : '#09090b';
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
