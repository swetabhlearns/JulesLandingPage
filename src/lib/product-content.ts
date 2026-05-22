import type { products } from "./seo-data";

type Product = (typeof products)[number];

export const toBeConfirmed = "To be confirmed";

export function productSpecRows(product: Product) {
  return [
    { label: "Payload", value: product.payload },
    { label: "Endurance", value: product.endurance },
    { label: "Airframe", value: product.configuration },
    { label: "Dimensions", value: toBeConfirmed },
    { label: "Empty weight", value: toBeConfirmed },
    { label: "Max altitude", value: toBeConfirmed },
    { label: "Wind resistance", value: toBeConfirmed },
    { label: "Battery specs", value: toBeConfirmed },
    { label: "Controller range", value: toBeConfirmed },
    { label: "IP rating", value: toBeConfirmed },
    { label: "DGCA type", value: toBeConfirmed },
  ];
}

export function productFaqItems(product: Product) {
  return [
    {
      question: `What payload can ${product.shortName} support?`,
      answer: `${product.shortName} is positioned for ${product.payload} payload-class missions. Final payload integration should be reviewed against payload dimensions, route profile, weather, reserve margin, and mission risk.`,
    },
    {
      question: `What is the expected endurance for ${product.shortName}?`,
      answer: `The current published endurance range is ${product.endurance}. Actual flight time depends on payload, batteries, route distance, altitude, wind, temperature, and operational reserve requirements.`,
    },
    {
      question: "Is DGCA approval or certification confirmed?",
      answer:
        "DGCA approval status, certification badges, type details, and other regulatory claims are shared only after supporting documents are verified for the specific configuration and deployment context.",
    },
    {
      question: "Can the platform be configured for logistics or surveillance missions?",
      answer: `${product.shortName} can be discussed for ${product.useCases.join(", ").toLowerCase()} requirements. Payload mounting, navigation, data links, and field workflow should be reviewed before a configuration is proposed.`,
    },
    {
      question: "How can buyers request pricing or a datasheet?",
      answer:
        "Share payload weight, payload dimensions, route length, operating environment, and timeline through the contact form. The team can then respond with platform direction, commercial next steps, and datasheet availability.",
    },
  ];
}
