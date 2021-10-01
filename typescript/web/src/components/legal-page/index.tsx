import { Box } from "@chakra-ui/react";
import * as React from "react";
import { useEffect } from "react";

import { NavBar } from "../website/Navbar/NavBar";

import { Footer } from "../website/Footer/Footer";
import { Meta } from "../meta";
import { ServiceWorkerManagerBackground } from "../service-worker-manager";
import { CookieBanner } from "../cookie-banner";

const Iubenda = ({
  policyId,
  pageName,
  title,
}: {
  policyId: string;
  pageName: string;
  title: string;
}) => {
  useEffect(() => {
    const s = document.createElement("script");
    const tag = document.getElementsByTagName("script")[0];

    s.src = "https://cdn.iubenda.com/iubenda.js";

    tag?.parentNode?.insertBefore(s, tag);
  }, []);
  const iubendaPath = (() => {
    if (pageName === "terms-and-conditions") {
      return `terms-and-conditions/${policyId}`;
    }
    if (pageName === "cookie-policy") {
      return `privacy-policy/${policyId}/cookie-policy`;
    }
    if (pageName === "privacy-policy") {
      return `privacy-policy/${policyId}`;
    }
    return "";
  })();
  return (
    <a
      href={`https://www.iubenda.com/${iubendaPath}`}
      className="iubenda-nostyle no-brand iubenda-noiframe iubenda-embed iubenda-noiframe iub-body-embed"
      title={title}
    >
      {title}
    </a>
  );
};

export default function LegalPage({ pageName }: { pageName: string }) {
  const title = (() => {
    if (pageName === "terms-and-conditions") {
      return "Terms and conditions";
    }
    if (pageName === "cookie-policy") {
      return "Cookie policy";
    }
    if (pageName === "privacy-policy") {
      return "Privacy policy";
    }
    return "";
  })();
  return (
    <>
      <ServiceWorkerManagerBackground />
      <Meta title={`LabelFlow | ${title}`} />
      <CookieBanner />
      <Box minH="640px">
        <NavBar />
        <Box maxW="3xl" margin="auto" textAlign="justify">
          <Iubenda policyId="14507147" pageName={pageName} title={title} />
        </Box>
        <Footer />
      </Box>
    </>
  );
}
