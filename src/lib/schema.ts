import { insights, products, siteUrl, solutions } from "./seo-data";

type BreadcrumbItem = {
  name: string;
  path: string;
};

function absoluteUrl(path: string) {
  return new URL(path, siteUrl).href;
}

function breadcrumb(items: BreadcrumbItem[]) {
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

function webPage(type: string, path: string, name: string, description: string) {
  return {
    "@type": type,
    "@id": `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name,
    description,
    isPartOf: { "@id": `${siteUrl}#website` },
    about: { "@id": `${siteUrl}#organization` },
  };
}

export function homeSchema() {
  return [
    webPage(
      "WebPage",
      "/",
      "Heavy Payload UAV Manufacturer India | BKT Tactical Solutions",
      "BKT Tactical Solutions develops heavy payload UAV platforms, drone logistics support, RTK navigation workflows, and tactical deployment capability in India.",
    ),
    {
      "@type": "ItemList",
      name: "Trishul Series Heavy Payload UAV Platforms",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(product.path),
        name: product.name,
      })),
    },
  ];
}

export function aboutSchema() {
  return [
    webPage(
      "AboutPage",
      "/about/",
      "Drone & Tactical Solutions Company India | BKT Tactical",
      "Learn about BKT Tactical Solutions Private Limited, an Indian drone and tactical solutions company focused on heavy payload UAVs, field deployment, and Make in India capability.",
    ),
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "About Us", path: "/about/" },
    ]),
  ];
}

export function productsSchema() {
  return [
    webPage(
      "CollectionPage",
      "/products/",
      "Heavy Payload UAV Products | BKT Tactical",
      "Explore the Trishul Series heavy payload UAV platforms for 10kg, 16kg, and 30kg payload operations in India.",
    ),
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "Products", path: "/products/" },
    ]),
  ];
}

export function productSchema(slug: string) {
  const product = products.find((item) => item.slug === slug);
  if (!product) return [];

  return [
    webPage("Product", product.path, product.title, product.description),
    {
      "@type": "Product",
      "@id": `${absoluteUrl(product.path)}#product`,
      name: product.name,
      description: product.description,
      brand: {
        "@type": "Brand",
        name: "BKT Tactical Solutions",
      },
      manufacturer: {
        "@id": `${siteUrl}#organization`,
      },
      category: "Heavy Payload UAV",
      additionalProperty: [
        { "@type": "PropertyValue", name: "Payload", value: product.payload },
        { "@type": "PropertyValue", name: "Endurance", value: product.endurance },
        { "@type": "PropertyValue", name: "Configuration", value: product.configuration },
      ],
    },
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "Products", path: "/products/" },
      { name: product.shortName, path: product.path },
    ]),
  ];
}

export function solutionsSchema() {
  return [
    webPage(
      "CollectionPage",
      "/solutions/",
      "Drone Logistics & Tactical UAV Solutions India | BKT Tactical",
      "Explore UAV solutions for drone logistics, tactical surveillance, emergency response, precision agriculture, and field deployment in India.",
    ),
    {
      "@type": "ItemList",
      name: "BKT Tactical UAV Solutions",
      itemListElement: solutions.map((solution, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: solution.name,
        description: solution.description,
      })),
    },
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "Solutions", path: "/solutions/" },
    ]),
  ];
}

export function complianceSchema() {
  return [
    webPage(
      "WebPage",
      "/compliance/",
      "Drone Compliance & Make in India UAV Readiness | BKT Tactical",
      "Review BKT Tactical's approach to responsible UAV development, Make in India capability, DGCA-aware operations, and verified compliance disclosures.",
    ),
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "Compliance", path: "/compliance/" },
    ]),
  ];
}

export function insightsSchema() {
  return [
    webPage(
      "CollectionPage",
      "/insights/",
      "Drone Insights India | Heavy Payload UAV Guides | BKT Tactical",
      "Read practical insights on heavy payload drones, RTK navigation, Make in India UAV manufacturing, and emergency response drone logistics.",
    ),
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "Insights", path: "/insights/" },
    ]),
  ];
}

export function articleSchema(slug: string) {
  const article = insights.find((item) => item.slug === slug);
  if (!article) return [];

  return [
    webPage("Article", article.path, article.title, article.description),
    {
      "@type": "Article",
      "@id": `${absoluteUrl(article.path)}#article`,
      headline: article.title,
      description: article.description,
      url: absoluteUrl(article.path),
      author: {
        "@id": `${siteUrl}#organization`,
      },
      publisher: {
        "@id": `${siteUrl}#organization`,
      },
      mainEntityOfPage: {
        "@id": `${absoluteUrl(article.path)}#webpage`,
      },
    },
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "Insights", path: "/insights/" },
      { name: article.category, path: article.path },
    ]),
  ];
}

export function contactSchema() {
  return [
    {
      ...webPage(
        "ContactPage",
        "/contact/",
        "Contact BKT Tactical | UAV & Drone Solutions Enquiries",
        "Contact BKT Tactical Solutions for heavy payload UAV, drone logistics, tactical deployment, and custom drone solution enquiries in India.",
      ),
      mainEntity: {
        "@type": "ContactPoint",
        contactType: "business enquiries",
        email: "info.tactical@bktcorp.com",
        availableLanguage: ["en"],
        areaServed: "IN",
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
    webPage(
      "WebPage",
      "/careers/",
      "Careers at BKT Tactical | Drone & Defence Tech Jobs India",
      "Explore UAV engineering, embedded systems, manufacturing, operations, supply chain, and field support career paths at BKT Tactical Solutions in India.",
    ),
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "Careers", path: "/careers/" },
    ]),
  ];
}
