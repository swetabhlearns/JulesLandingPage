function pickLinkText(path) {
  switch (path) {
    case "/products/":
      return "heavy payload UAV platforms";
    case "/solutions/":
      return "drone logistics workflows";
    case "/compliance/":
      return "compliance guidance";
    case "/about/":
      return "about BKT Tactical Solutions";
    case "/contact/":
      return "contact the team";
    default:
      return path.replace(/^\/+|\/+$/g, "").replace(/-/g, " ");
  }
}

function scoreTarget(path, text) {
  const haystack = String(text ?? "").toLowerCase();
  const rules = {
    "/products/": ["heavy payload", "payload", "platform", "airframe", "trishul", "lift"],
    "/solutions/": ["logistics", "delivery", "tactical", "surveillance", "mission", "deployment", "response", "agriculture", "mapping"],
    "/compliance/": ["compliance", "dgca", "rules", "license", "regulation", "regulatory", "approval", "certification"],
    "/about/": ["make in india", "manufacturer", "company", "brand", "indigenous", "drone", "uav", "india", "industry", "ecosystem"],
    "/contact/": ["contact", "quote", "procurement", "buy", "evaluate", "compare", "supplier"],
  };

  const terms = rules[path] ?? [];
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

export function selectInternalLinks(profile, opportunity, maxLinks = 2) {
  const targets = Array.isArray(profile?.internalLinkTargets) ? profile.internalLinkTargets : [];
  const lane = opportunity?.contentLane;
  const searchableText = [
    opportunity?.query,
    opportunity?.intent,
    opportunity?.reasons?.join(" "),
    opportunity?.title,
    opportunity?.description,
  ]
    .filter(Boolean)
    .join(" ");

  const scored = targets
    .map((path) => ({
      path,
      label: pickLinkText(path),
      score:
        scoreTarget(path, searchableText) +
        (lane === "product_solution" && path === "/products/" ? 3 : 0) +
        (lane === "product_solution" && path === "/solutions/" ? 2 : 0) +
        (lane === "trend_industry" && path === "/about/" ? 2 : 0) +
        (lane === "general_education" && path === "/compliance/" && /rules|dgca|license|regulat/i.test(searchableText) ? 2 : 0) +
        (lane === "general_education" && path === "/products/" ? -2 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));

  const picked = scored.filter((item) => item.score > 0).slice(0, maxLinks);
  if (picked.length) return picked;

  return targets.slice(0, maxLinks).map((path) => ({
    path,
    label: pickLinkText(path),
    score: 0,
  }));
}

function buildLinkSentence(links) {
  if (!links.length) return "";
  if (links.length === 1) {
    const [link] = links;
    return `For related context, review our <a href="${link.path}">${link.label}</a> page.`;
  }

  const [first, second] = links;
  return `For related context, review our <a href="${first.path}">${first.label}</a> and <a href="${second.path}">${second.label}</a> pages.`;
}

export function injectInternalLinks({ intro, sections, faq }, profile, opportunity) {
  const internalLinks = selectInternalLinks(profile, opportunity);
  const linkSentence = buildLinkSentence(internalLinks);

  const nextIntro = [String(intro ?? "").trim(), linkSentence ? `<p>${linkSentence}</p>` : ""]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  const nextSections = Array.isArray(sections)
    ? sections.map((section) => ({
        heading: String(section.heading ?? "").trim(),
        body: String(section.body ?? "").trim(),
      }))
    : [];

  if (linkSentence && nextSections.length) {
    const lastIndex = nextSections.length - 1;
    nextSections[lastIndex] = {
      ...nextSections[lastIndex],
      body: [nextSections[lastIndex].body, `<p>${linkSentence}</p>`].filter(Boolean).join("\n\n"),
    };
  }

  const nextFaq = Array.isArray(faq)
    ? faq.map((item) => ({
        question: String(item.question ?? "").trim(),
        answer: String(item.answer ?? "").trim(),
      }))
    : [];

  return {
    intro: nextIntro,
    sections: nextSections,
    faq: nextFaq,
    internalLinks,
  };
}
