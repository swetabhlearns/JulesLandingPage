export const siteUrl = "https://bkttactical.com";

export const lastmod = "2026-05-13";

export const products = [
  {
    slug: "trishul-10kg",
    name: "Trishul 10kg Heavy Payload UAV",
    shortName: "Trishul 10kg",
    title: "Trishul 10kg Heavy Payload UAV India | BKT Tactical",
    description:
      "Explore the Trishul 10kg heavy payload UAV for agile logistics, surveillance, RTK navigation, and autonomous missions in India.",
    payload: "10 kg",
    endurance: "25 - 40 minutes",
    configuration: "Hexacopter with X6+ Motor",
    useCases: ["Light logistics", "Surveillance support", "Rapid field deployment"],
    features: ["RTK navigation", "Autonomous mission stack", "Modular payload bay", "Fail-safe systems"],
    path: "/products/trishul-10kg/",
  },
  {
    slug: "trishul-16kg",
    name: "Trishul 16kg Heavy Payload UAV",
    shortName: "Trishul 16kg",
    title: "Trishul 16kg Tactical Payload UAV India | BKT Tactical",
    description:
      "Review the Trishul 16kg UAV platform for tactical payload integration, drone logistics, RTK navigation, and reliable field operations.",
    payload: "16 kg",
    endurance: "30 - 50 minutes",
    configuration: "Hexacopter with X8+ Motor",
    useCases: ["Tactical payload integration", "Drone logistics", "Industrial field support"],
    features: ["RTK navigation", "Encrypted datalink", "Mission-ready avionics", "Modular maintenance"],
    path: "/products/trishul-16kg/",
  },
  {
    slug: "trishul-30kg",
    name: "Trishul 30kg Heavy Lift Drone",
    shortName: "Trishul 30kg",
    title: "Trishul 30kg Heavy Lift Drone India | BKT Tactical",
    description:
      "Learn about the Trishul 30kg heavy lift drone for emergency response, heavy logistics, autonomous missions, and high-capacity UAV operations.",
    payload: "30 kg",
    endurance: "45 - 60 minutes",
    configuration: "Quadcopter with X11+ Motor",
    useCases: ["Heavy logistics", "Emergency response", "High-capacity payload delivery"],
    features: ["High-capacity airframe", "RTK navigation", "Autonomous route support", "Layered safety systems"],
    path: "/products/trishul-30kg/",
  },
] as const;

export const solutions = [
  {
    name: "Drone Logistics",
    description:
      "Heavy payload UAV support for point-to-point delivery, remote-area supply movement, and time-sensitive logistics planning.",
  },
  {
    name: "Tactical Surveillance",
    description:
      "Mission-ready aerial systems for situational awareness, field observation, and secure operational planning.",
  },
  {
    name: "Emergency Response",
    description:
      "Rapid deployment drone support for relief logistics, medical payload movement, and response coordination.",
  },
  {
    name: "Precision Agriculture",
    description:
      "UAV platforms adaptable for field monitoring, payload delivery, and high-accuracy navigation workflows.",
  },
] as const;

export const insights = [
  {
    slug: "heavy-payload-drones-india",
    title: "Heavy Payload Drones In India: Where 10kg, 16kg, And 30kg UAVs Fit",
    description:
      "A practical guide to heavy payload drones in India, including UAV payload classes, endurance tradeoffs, and mission planning considerations.",
    path: "/insights/heavy-payload-drones-india/",
    category: "Heavy Payload UAVs",
    intro:
      "Heavy payload drones create value when the mission requires more than aerial imaging. They support logistics, emergency response, tactical payloads, and remote operations where payload capacity and reliability matter together.",
    sections: [
      {
        heading: "Payload class should follow mission risk",
        body: "A 10kg UAV suits agile logistics and lighter field missions. A 16kg platform gives more room for tactical payload integration. A 30kg heavy lift drone is better suited to larger logistics and emergency response use cases where the airframe must handle higher load margins.",
      },
      {
        heading: "Endurance matters after payload is attached",
        body: "Advertised flight time is less useful than endurance under payload. Operators should evaluate lift system, battery profile, route length, weather, and reserve margin before selecting a platform.",
      },
      {
        heading: "Indian operating conditions need rugged planning",
        body: "Heat, dust, wind, terrain, and limited landing zones can all affect UAV operations in India. Heavy payload platforms should be assessed for maintenance access, fail-safe behavior, and deployment workflow.",
      },
    ],
  },
  {
    slug: "rtk-navigation-for-uav-missions",
    title: "RTK Navigation For UAV Missions: Why Accuracy Matters",
    description:
      "Understand how RTK navigation improves UAV mission accuracy for logistics, surveying, field operations, and autonomous drone routes.",
    path: "/insights/rtk-navigation-for-uav-missions/",
    category: "Navigation",
    intro:
      "RTK navigation improves UAV mission repeatability by reducing positioning error. For heavy payload drones, that accuracy supports safer route planning, controlled landing, and precise deployment workflows.",
    sections: [
      {
        heading: "RTK reduces positioning uncertainty",
        body: "Standard GPS can drift enough to affect landing and mission repeatability. RTK improves positional accuracy by using correction data, making it useful for high-precision UAV operations.",
      },
      {
        heading: "Accuracy supports autonomous operations",
        body: "Autonomous routes depend on predictable positioning. RTK helps mission planners define tighter corridors, repeat routes, and improve confidence in field execution.",
      },
      {
        heading: "Payload missions need more margin",
        body: "A heavy payload UAV has more operational consequence than a lightweight camera drone. Better navigation helps reduce ambiguity during takeoff, waypoint movement, and landing phases.",
      },
    ],
  },
  {
    slug: "make-in-india-drone-manufacturing",
    title: "Make In India Drone Manufacturing: Why Indigenous UAV Capability Matters",
    description:
      "Learn why Make in India drone manufacturing matters for UAV supply chains, tactical technology, local maintenance, and long-term resilience.",
    path: "/insights/make-in-india-drone-manufacturing/",
    category: "Make in India",
    intro:
      "Indigenous UAV manufacturing supports local supply chains, faster serviceability, and better adaptation to Indian operating conditions. For tactical and logistics users, those advantages can matter as much as technical specifications.",
    sections: [
      {
        heading: "Local capability improves responsiveness",
        body: "Drone operators need parts, maintenance, and engineering support without long import cycles. Domestic manufacturing can shorten support timelines and improve operational continuity.",
      },
      {
        heading: "Indian use cases require local adaptation",
        body: "Payload needs, terrain, climate, and mission profiles vary widely. A Make in India drone platform can be adapted around actual field requirements instead of generic assumptions.",
      },
      {
        heading: "Supply-chain resilience is strategic",
        body: "For critical sectors, UAV availability depends on component access, maintenance planning, and long-term vendor stability. Indigenous capability strengthens that foundation.",
      },
    ],
  },
  {
    slug: "emergency-response-uav-logistics",
    title: "Emergency Response UAV Logistics: Using Heavy Payload Drones In Critical Missions",
    description:
      "See how heavy payload UAVs can support emergency response logistics, relief delivery, medical payload movement, and rapid field coordination.",
    path: "/insights/emergency-response-uav-logistics/",
    category: "Emergency Response",
    intro:
      "Emergency response logistics often need speed, reach, and flexibility. Heavy payload UAVs can support response teams when roads are blocked, terrain is difficult, or delivery windows are narrow.",
    sections: [
      {
        heading: "Payload planning starts with the mission",
        body: "Medical kits, communication equipment, food supplies, and urgent tools all create different payload requirements. The UAV platform should match weight, volume, route, and landing constraints.",
      },
      {
        heading: "Response operations need repeatable workflows",
        body: "Emergency drone deployment should use clear roles, pre-flight checks, route planning, and payload handoff procedures. Repeatability reduces delay under pressure.",
      },
      {
        heading: "Heavy lift drones extend field options",
        body: "A 30kg class UAV can move larger payloads than standard inspection drones, giving teams another option for relief logistics and remote-area support.",
      },
    ],
  },
] as const;

export const corePages = [
  { path: "/", title: "Home" },
  { path: "/about/", title: "About" },
  { path: "/products/", title: "Products" },
  { path: "/solutions/", title: "Solutions" },
  { path: "/compliance/", title: "Compliance" },
  { path: "/insights/", title: "Insights" },
  { path: "/careers/", title: "Careers" },
  { path: "/contact/", title: "Contact" },
] as const;

export const sitemapPaths = [
  ...corePages.map((page) => page.path),
  ...products.map((product) => product.path),
  ...insights.map((insight) => insight.path),
] as const;
