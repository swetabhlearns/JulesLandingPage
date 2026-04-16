const siteUrl = "https://bkttactical.com";

function absoluteUrl(path: string) {
  return new URL(path, siteUrl).href;
}

function breadcrumb(items: Array<{ name: string; path: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function homeSchema() {
  return [
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/#webpage`,
      url: siteUrl,
      name: "BKT Tactical Solutions | Elevating Aerial Intelligence",
      description: "BKT Tactical Solutions Private Limited delivers reliable tactical, drone, and technology-led solutions with a focus on precision, sustainability, and Make in India.",
      isPartOf: { "@id": `${siteUrl}#website` },
      about: { "@id": `${siteUrl}#organization` },
    },
  ];
}

export function aboutSchema() {
  return [
    {
      "@type": "AboutPage",
      "@id": `${siteUrl}/about/#webpage`,
      url: absoluteUrl("/about/"),
      name: "About Us | BKT Tactical Solutions",
      description: "Learn about BKT Tactical Solutions Private Limited, including its mission, vision, evolution, and leadership in tactical and drone solutions.",
      isPartOf: { "@id": `${siteUrl}#website` },
      about: { "@id": `${siteUrl}#organization` },
    },
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "About Us", path: "/about/" },
    ]),
  ];
}

export function contactSchema() {
  return [
    {
      "@type": "ContactPage",
      "@id": `${siteUrl}/contact/#webpage`,
      url: absoluteUrl("/contact/"),
      name: "Contact Us | BKT Tactical Solutions",
      description: "Contact BKT Tactical Solutions Private Limited for partnerships, inquiries, and project discussions across tactical and technical needs.",
      isPartOf: { "@id": `${siteUrl}#website` },
      about: { "@id": `${siteUrl}#organization` },
      mainEntity: {
        "@type": "ContactPoint",
        contactType: "business inquiries",
        email: "info.tactical@bktcorp.com",
        telephone: "+1-800-555-0199",
        availableLanguage: ["en"],
      },
    },
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact/" },
    ]),
  ];
}

export function careersSchema() {
  return [
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/careers/#webpage`,
      url: absoluteUrl("/careers/"),
      name: "Careers | BKT Tactical Solutions",
      description: "Explore careers at BKT Tactical Solutions Private Limited and learn about the culture, benefits, and openings.",
      isPartOf: { "@id": `${siteUrl}#website` },
      about: { "@id": `${siteUrl}#organization` },
    },
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "Careers", path: "/careers/" },
    ]),
  ];
}
