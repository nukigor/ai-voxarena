import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ---- helpers ---------------------------------------------------------------
const slugify = (s) =>
  String(s).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

async function upsertTerms(category, items) {
  for (const t of items) {
    await prisma.taxonomy.upsert({
      where: { category_term: { category, term: t.term } },
      update: {
        slug: slugify(t.term),
        description: t.description ?? '',
        isActive: true,
      },
      create: {
        category,
        term: t.term,
        slug: slugify(t.term),
        description: t.description ?? '',
        isActive: true,
      },
    });
  }
}

// Reclassify any previous region-like rows that were stored under "culture"
async function reclassifyOldCultureRegions(regionTerms) {
  await prisma.taxonomy.updateMany({
    where: { category: 'culture', term: { in: regionTerms } },
    data: { category: 'region' },
  });
}

// ---- data: archetypes ------------------------------------------------------
const archetypes = [
  { term: 'Analytical',     description: 'Dissects claims methodically; builds step-by-step arguments anchored in data, definitions, and causal chains.' },
  { term: 'Charismatic',    description: 'Persuades through presence and storytelling; rallies the audience with confidence and memorable lines.' },
  { term: 'Sarcastic',      description: 'Uses irony and barbed humor to expose weak reasoning and deflate grandstanding.' },
  { term: 'Humorous',       description: 'Keeps the exchange light and witty; leverages jokes and playful analogies to make points stick.' },
  { term: 'Skeptical',      description: 'Probes assumptions and uncertainties; demands operational definitions, sources, and falsifiable claims.' },
  { term: 'Visionary',      description: 'Paints vivid futures; reframes issues around long-horizon possibilities, moonshots, and transformative change.' },
  { term: 'Cynical',        description: 'Highlights perverse incentives, hypocrisy, and downside risks; assumes systems and actors are self-interested.' },
  { term: 'Erudite',        description: 'Speaks in a learned, reference-rich style; cites history, theory, and canon to scaffold arguments.' },
  { term: 'Provocative',    description: 'Deliberately challenges taboos and comfort zones to surface hidden premises and force clarity.' },
  { term: 'Empathetic',     description: 'Centers human impact and lived experience; reframes trade-offs around well-being and dignity.' },
  { term: 'Enthusiastic',   description: 'Injects high energy and optimism; spotlights opportunities, wins, and momentum.' },
  { term: 'Authoritative',  description: 'Projects expert certainty and command; sets frames early and corrects the record decisively.' },
  { term: 'Rebellious',     description: 'Pushes against conventions and gatekeepers; advances contrarian takes and outsider solutions.' },
  { term: 'Traditionalist', description: 'Grounds arguments in continuity, norms, and precedent; asks what must be preserved and why.' },
  { term: 'Humanitarian',   description: 'Prioritizes moral duty to protect people; argues from harm reduction, fairness, and global responsibility.' },
  { term: 'Technocrat',     description: 'Optimizes for policy design and implementation; favors dashboards, KPIs, and workable mechanisms.' },
  { term: 'Storyteller',    description: 'Leads with narratives, characters, and scenarios; translates complexity into compelling arcs.' },
  { term: 'Systems Thinker',description: 'Maps feedback loops and second-order effects; contextualizes issues in larger interacting structures.' },
  { term: 'Populist',       description: 'Frames debates as “the people vs. elites”; elevates everyday concerns and distrusts insulated expertise.' },
  { term: 'Maverick',       description: 'Independent operator who resists alignment; mixes unconventional evidence and hybrid strategies.' },
  { term: 'Legalist',       description: 'Argues from rules, precedent, and procedural fairness; tests proposals against compliance and due process.' },
];

// ---- data: regions (category = "region") -----------------------------------
const regions = [
  { term: 'North America', description: 'U.S. and Canada context; references liberal democracy, individualism, technology, media, and North Atlantic institutions.' },
  { term: 'Latin America', description: 'Spanish/Portuguese-speaking Central & South America (incl. Mexico & Brazil); themes of community, identity, development, and post-colonial history.' },
  { term: 'Caribbean', description: 'Island nations and territories across the Caribbean; blends African, European, and indigenous influences with strong diaspora ties.' },
  { term: 'Western Europe', description: 'EU/NATO core and neighbors; long traditions of social welfare, pluralism, and transnational cooperation.' },
  { term: 'Northern Europe', description: 'Nordics and Baltics; high institutional trust, social safety nets, and environmental leadership.' },
  { term: 'Southern Europe', description: 'Mediterranean societies; strong regional identities, historical layers, and EU integration mixed with local priorities.' },
  { term: 'Eastern Europe', description: 'Post-Soviet and former Eastern Bloc contexts; sovereignty, security, and reform under shifting geopolitical pressures.' },
  { term: 'Middle East & North Africa (MENA)', description: 'Arab, Persian, Turkish, and North African contexts; faith, family, honor, and geopolitics shape public life.' },
  { term: 'West Africa', description: 'ECOWAS region; youthful demographics, entrepreneurial energy, pan-African ideas, and rich linguistic diversity.' },
  { term: 'East & Horn of Africa', description: 'From Ethiopia/Somalia to Kenya/Tanzania; regional integration, security, and rapid urbanization.' },
  { term: 'Central Africa', description: 'Congo Basin and neighbors; natural resources, biodiversity, and governance challenges amid regional interdependence.' },
  { term: 'Southern Africa', description: 'SADC region; post-apartheid transitions, mineral economies, and social equity debates.' },
  { term: 'South Asia', description: 'India, Pakistan, Bangladesh, Nepal, Sri Lanka; dense history, plural societies, and fast modernization.' },
  { term: 'Southeast Asia', description: 'ASEAN region; trade-driven pragmatism, cultural plurality, and diverse political systems.' },
  { term: 'East Asia', description: 'China, Japan, Koreas, Taiwan, etc.; Confucian legacies, industrial strength, and regional security dynamics.' },
  { term: 'Central Asia', description: 'Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan, Uzbekistan; Silk Road heritage and post-Soviet statecraft.' },
  { term: 'Oceania', description: 'Australia, New Zealand, and Pacific Islands; indigenous stewardship, climate urgency, and multicultural societies.' },
];

// ---- data: cultures (category = "culture") ---------------------------------
const cultures = [
  { term: 'Maori', description: 'Indigenous Polynesian people of New Zealand, emphasizing kinship, oral tradition, and connection to land.' },
  { term: 'Aboriginal Australian', description: 'First Nations of Australia; deep spiritual connection to land, Dreamtime stories, and resilience.' },
  { term: 'Inuit', description: 'Arctic peoples of Canada, Greenland, Alaska; resilient culture rooted in survival, community, and environment.' },
  { term: 'Sami', description: 'Indigenous people of Northern Europe (Norway, Sweden, Finland, Russia); known for reindeer herding, music (joik), and cultural preservation.' },
  { term: 'Quechua', description: 'Indigenous Andean people; strong agrarian and communal traditions, Incan heritage, and language preservation.' },
  { term: 'Aymara', description: 'Indigenous Andean culture of Bolivia, Peru, Chile; emphasizes reciprocity, ritual, and communal identity.' },
  { term: 'Navajo (Diné)', description: 'Native American nation; rich in oral tradition, weaving, and cultural resilience.' },
  { term: 'Lakota / Sioux', description: 'Plains Native American culture emphasizing kinship, spirituality, and warrior traditions.' },
  { term: 'Zulu', description: 'Largest South African ethnic group; known for strong cultural identity, oral tradition, and resistance history.' },
  { term: 'Yoruba', description: 'West African culture (Nigeria, Benin, diaspora); deeply spiritual, rich in oral literature, music, and tradition.' },
  { term: 'Ashanti (Asante)', description: 'Ghanaian culture with strong chieftaincy traditions, art, and proverbs.' },
  { term: 'Berber (Amazigh)', description: 'Indigenous North African culture; emphasizes language, continuity, and resilience under external rule.' },
  { term: 'Tuareg', description: 'Nomadic Berber culture in the Sahara; rich in poetry, music, and desert traditions.' },
  { term: 'Polynesian (Samoan, Tongan, Hawaiian, Fijian)', description: 'Pacific Islander cultures; emphasize kinship, oral traditions, and resilience.' },
  { term: 'Han Chinese', description: 'Largest ethnic group in the world; Confucian traditions, kinship ties, and modern global diaspora.' },
  { term: 'Punjabi', description: 'North Indian & Pakistani cultural identity, strong in food, language, and diaspora pride.' },
  { term: 'Tamil', description: 'South Indian/Sri Lankan culture; ancient language, literature, and vibrant diaspora communities.' },
  { term: 'Gujarati', description: 'Indian culture known for commerce, diaspora success, and deep traditions.' },
  { term: 'Pashtun', description: 'Ethnic group in Afghanistan/Pakistan; emphasizes honor (Pashtunwali) and tribal identity.' },
  { term: 'Kurdish', description: 'Middle Eastern ethnic group across Turkey, Iraq, Iran, Syria; emphasis on language, identity, and resilience.' },
  { term: 'Persian (Iranian)', description: 'Distinct cultural identity rooted in Persian language, poetry, and historical continuity.' },
  { term: 'Arab (Pan-Arab)', description: 'Shared identity across Middle East/North Africa; language, family, and traditions central.' },
  { term: 'Turkish', description: 'Culture blending Ottoman legacy, Anatolian traditions, and modern nationalism.' },
  { term: 'Russian', description: 'Identity shaped by literature, resilience, and geopolitical history.' },
  { term: 'Ukrainian', description: 'Distinct Slavic identity; language revival, folk traditions, and independence struggles.' },
  { term: 'Polish', description: 'Central European identity; Catholic heritage, resilience, and diasporic influence.' },
  { term: 'Irish', description: 'Distinct Celtic culture; storytelling, music, and diaspora strength.' },
  { term: 'Scottish', description: 'Identity rooted in language, clan traditions, and national pride.' },
  { term: 'Catalan', description: 'Iberian regional identity; emphasizes language, autonomy, and cultural pride.' },
  { term: 'Basque', description: 'Distinct Iberian identity; ancient language (Euskara), resilience, and autonomy movement.' },
  { term: 'Quebecois', description: 'Francophone Canadian culture blending European and North American traditions.' },
  { term: 'Japanese', description: 'Distinct cultural identity balancing tradition, modernity, and group harmony.' },
  { term: 'Korean', description: 'Emphasis on language, Confucian values, and resilience in modern globalization.' },
  { term: 'Vietnamese', description: 'Rich traditions of independence, Confucianism, and diaspora identity.' },
  { term: 'Thai', description: 'Culture of Buddhist traditions, monarchy, and vibrant cuisine/arts.' },
  { term: 'Afro-Caribbean', description: 'Blend of African, European, and indigenous traditions; music, religion, and resilience.' },
  { term: 'Afro-Brazilian', description: 'African heritage in Brazil; Candomblé, samba, and social resistance.' },
  { term: 'African American', description: 'Culture rooted in resilience, jazz, hip-hop, civil rights, and global influence.' },
  { term: 'Arab Diaspora', description: 'Arab communities outside MENA; hybrid identity shaped by language, faith, and migration.' },
  { term: 'Chinese Diaspora', description: 'Overseas Chinese identity; entrepreneurial, family-centered, and linguistically diverse.' },
  { term: 'Indian Diaspora', description: 'Global Indian communities; blend of heritage with integration into host societies.' },
  { term: 'Jewish (Diaspora)', description: 'Global identity rooted in religion, history of resilience, and communal life.' },
  { term: 'Latin American Diaspora', description: 'Migrant identity blending heritage with adaptation in North America/Europe.' },
  { term: 'Turkish Diaspora', description: 'Strong identity in Europe; balancing heritage with integration.' },
  { term: 'Romani', description: 'Nomadic European ethnic group with distinct music, traditions, and emphasis on mobility and community.' },
  { term: 'Hip-Hop Culture', description: 'Global movement rooted in African American communities; rap, DJing, breakdance, graffiti, and social critique.' },
  { term: 'Punk Subculture', description: 'Countercultural identity emphasizing rebellion, anti-establishment values, and music.' },
  { term: 'Gamer Culture', description: 'Global digital subculture; emphasizes online communities, shared narratives, and competitive play.' },
  { term: 'Hacker Culture', description: 'Subculture rooted in coding, freedom of information, and disruptive creativity.' },
  { term: 'Tech Startup Culture', description: 'Entrepreneurial identity valuing disruption, innovation, and risk-taking.' },
  { term: 'Academic Research Culture', description: 'Identity tied to universities, science, and knowledge production.' },
  { term: 'Environmental Activist Culture', description: 'Subculture emphasizing sustainability, protest, and climate consciousness.' },
  { term: 'Feminist Culture', description: 'Social movement identity rooted in gender equality and activism.' },
  { term: 'Queer / LGBTQ+ Culture', description: 'Global identity rooted in resilience, creativity, and rights activism.' },
];

// ---- orchestrator -----------------------------------------------------------
async function main() {
  // 1) Archetypes
  await upsertTerms('archetype', archetypes);
  const aCount = await prisma.taxonomy.count({ where: { category: 'archetype', isActive: true } });
  console.log(`Seeded archetypes: ${aCount}`);

  // 2) Regions
  await reclassifyOldCultureRegions(regions.map(r => r.term)); // harmless if none exist
  await upsertTerms('region', regions);
  const rCount = await prisma.taxonomy.count({ where: { category: 'region', isActive: true } });
  console.log(`Seeded regions: ${rCount}`);

  // 3) Cultures
  await upsertTerms('culture', cultures);
  const cCount = await prisma.taxonomy.count({ where: { category: 'culture', isActive: true } });
  console.log(`Seeded cultures: ${cCount}`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });