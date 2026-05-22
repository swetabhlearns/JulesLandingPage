import test from "node:test";
import assert from "node:assert/strict";
import { businessProfile } from "../src/business-profile.js";
import { selectInternalLinks } from "../src/internal-linking.js";

test("general education topics avoid forced product links when a better context page fits", () => {
  const links = selectInternalLinks(businessProfile, {
    query: "drone rules india explained",
    intent: "informational",
    contentLane: "general_education",
    reasons: ["DGCA drone rules and responsible drone operation in India"],
  });

  assert.equal(links[0].path, "/compliance/");
});

test("product and solution topics retain conversion-oriented internal links", () => {
  const links = selectInternalLinks(businessProfile, {
    query: "heavy payload drones india",
    intent: "commercial",
    contentLane: "product_solution",
    reasons: ["Payload platform evaluation for Indian UAV buyers"],
  });

  assert.equal(links[0].path, "/products/");
});
