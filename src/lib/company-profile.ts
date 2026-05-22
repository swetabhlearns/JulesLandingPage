export type CompanyProfile = {
  legalName: string;
  displayName: string;
  email: string;
  linkedInUrl: string;
  cin?: string;
  gst?: string;
  registeredAddress?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  directors: string[];
};

export const companyProfile: CompanyProfile = {
  legalName: "BKT Tactical Solutions Private Limited",
  displayName: "BKT Tactical Solutions",
  email: "info.tactical@bktcorp.com",
  linkedInUrl: "https://www.linkedin.com/company/bkt-tactical/",
  cin: "U26300JH2025PTC024324",
  registeredAddress: {
    streetAddress: "H No 1254/Z9, Ward No 27, Pee Pee Compound, Hindpiri",
    addressLocality: "Ranchi",
    addressRegion: "Jharkhand",
    postalCode: "834001",
    addressCountry: "IN",
  },
  directors: ["Atul Tripathi", "Birendra Kumar Tripathi"],
};

export const hasVerifiedLegalDetails = Boolean(
  companyProfile.cin ||
    companyProfile.gst ||
    companyProfile.registeredAddress ||
    companyProfile.directors.length,
);
