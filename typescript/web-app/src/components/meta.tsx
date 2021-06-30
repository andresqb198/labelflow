import * as React from "react";
import { NextSeo } from "next-seo";
import Head from "next/head";

type Props = {
  title?: string;
  desc?: string;
  canonical?: string;
};

export const Meta = ({
  title = "Labelflow: The open standard platform for image labeling.",
  desc = "The fastest and simplest image labelling tool on the Internet, and it's open source!",
  canonical = "https://app.labelflow.ai/",
}: Props) => (
  <>
    <NextSeo
      title={title}
      description={desc}
      canonical={canonical}
      openGraph={{
        type: "website",
        url: canonical,
        title,
        description: desc,
        locale: "en_US",
        images: [
          {
            url: "https://app.labelflow.ai/static/img/seo-img.png",
            width: 1200,
            height: 630,
            alt: "Labelflow",
          },
          {
            url: "https://app.labelflow.ai/static/img/seo-img@5.png",
            width: 600,
            height: 315,
            alt: "Labelflow",
          },
        ],
      }}
      twitter={{
        handle: "@VLecrubier",
        site: "@VLecrubier",
        cardType: "summary_large_image",
      }}
    />
    <Head>
      <link rel="icon" href="/favicon.ico" />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="msapplication-TileColor" content="#03C3BF" />
      <meta name="theme-color" content="#03C3BF" />
      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-2MPS7JPG8D"
      />
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          
            gtag('config', 'G-2MPS7JPG8D');`,
        }}
      />

      {canonical && <link rel="canonical" href={`${canonical}`} />}
    </Head>
  </>
);