import React from "react";

export interface OrganizationJsonLdProps {
  url?: string;
  name?: string;
  logo?: string;
  description?: string;
}

export function OrganizationJsonLd({
  url = "https://perfectpic.in",
  name = "PerfectPic",
  logo = "https://perfectpic.in/logo.svg",
  description = "India's premier custom photobook platform. Archival lay-flat albums, non-tearable paper, and HD print fidelity delivered nationwide.",
}: OrganizationJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    legalName: "PerfectPic Photobooks",
    url,
    logo,
    description,
    sameAs: [
      "https://www.instagram.com/perfectpic.in",
      "https://www.facebook.com/perfectpic.in",
      "https://twitter.com/perfectpic_in",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "Customer Support",
        email: "care@perfectpic.in",
        availableLanguage: ["English", "Hindi"],
        areaServed: "IN",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PerfectPic",
    url: "https://perfectpic.in",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://perfectpic.in/templates?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function PhotobookProductJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "PerfectPic Premium Custom Lay-Flat Photobook",
    image: [
      "https://perfectpic.in/og-image.png",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
    ],
    description:
      "Custom premium lay-flat photobook printed on non-tearable archival paper with HD color reproduction. Seamless panoramic spreads without center gutter loss.",
    brand: {
      "@type": "Brand",
      name: "PerfectPic",
    },
    category: "Photo Albums & Photobooks",
    offers: {
      "@type": "AggregateOffer",
      url: "https://perfectpic.in/configure",
      priceCurrency: "INR",
      lowPrice: "1999",
      highPrice: "2999",
      offerCount: "16",
      priceValidUntil: "2026-12-31",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "1420",
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export interface FaqItem {
  q: string;
  a: string;
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbsJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
