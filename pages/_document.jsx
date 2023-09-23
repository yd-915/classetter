import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="manifest" />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/images/apple-touch-icon.png"
          />
          <meta name="theme-color" content="#fff" />
          <meta
            name="description"
            content="AstraTuition - Your New Favorite STEM Diary"
          />
          <meta
            property="og:title"
            content="AstraTuition - Your New Favorite STEM Diary"
          />
          <meta property="og:image" content="/images/logo.png" />
          <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
