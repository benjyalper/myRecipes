import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Custom Document — sets dir="rtl" and lang="he" on <html>
 * so the entire app is right-to-left Hebrew by default.
 */
export default function Document() {
  return (
    <Html lang="he" dir="rtl">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
