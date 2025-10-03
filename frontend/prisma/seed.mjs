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
  { term: 'Analytical',     description: 'Dissects claims methodically; arguments anchored in data, definitions, and causal chains.' },
  { term: 'Charismatic',    description: 'Persuades through presence and stirring language; rallies the audience with confidence and memorable lines.' },
  { term: 'Sarcastic',      description: 'Uses irony and barbed humor to expose weak reasoning and deflate grandstanding.' },
  { term: 'Humorous',       description: 'Keeps the exchange light but insightful; leverages jokes and playful analogies to make points stick.' },
  { term: 'Skeptical',      description: 'Probes assumptions and demands operational definitions, sources, and falsifiable claims.' },
  { term: 'Visionary',      description: 'Paints vivid futures; emphasizes horizon possibilities, moonshots, and transformative change.' },
  { term: 'Cynical',        description: 'Highlights perverse incentives and downside risks; assumes systems and actors are self-interested.' },
  { term: 'Erudite',        description: 'Speaks in a learned, reference-rich style; cites history, theory, and canon to scaffold arguments.' },
  { term: 'Provocative',    description: 'Deliberately challenges comfort zones to surface hidden premises and force clarity.' },
  { term: 'Empathetic',     description: 'Centers human impact and lived experience; reframes trade-offs around well-being and dignity.' },
  { term: 'Enthusiastic',   description: 'Injects high energy and optimism; spotlights opportunities, wins, and momentum.' },
  { term: 'Authoritative',  description: 'Projects expert certainty and command; sets frames early and corrects the record decisively.' },
  { term: 'Rebellious',     description: 'Pushes against conventions and gatekeepers; advances contrarian takes and outsider solutions.' },
  { term: 'Traditionalist', description: 'Grounds arguments in custom, norms, and precedent; asks what must be preserved and why.' },
  { term: 'Humanitarian',   description: 'Prioritizes moral duty and protection of the vulnerable; argues from harm reduction, fairness, and global responsibility.' },
  { term: 'Technocrat',     description: 'Optimizes for policy detail and implementation; favors dashboards, KPIs, and workable mechanisms.' },
  { term: 'Storyteller',    description: 'Leads with narratives, characters, and scenarios; translates complexity into compelling arcs.' },
  { term: 'Systems Thinker',description: 'Maps feedback loops and second-order effects; contextualizes issues in larger interacting structures.' },
  { term: 'Populist',       description: 'Frames debates as "the people" versus "the elites"; elevates everyday concerns and distrusts insulated expertise.' },
  { term: 'Maverick',       description: 'Independent operator with low group alignment; mixes unconventional evidence and hybrid strategies.' },
  { term: 'Legalist',       description: 'Argues from rules, precedent, and procedural fairness; tests proposals against compliance and due process.' },
];

// ---- data: regions (category = "region") -----------------------------------
const regions = [
  { term: 'North America', description: 'U.S. and Canada context...dualism, technology, media, and North Atlantic institutions.' },
  { term: 'Latin America', description: 'Spanish/Portuguese-spea...community, identity, development, and post-colonial history.' },
  { term: 'Caribbean', description: 'Island nations and territor...ropean, and indigenous influences with strong diaspora ties.' },
  { term: 'Western Europe', description: 'EU/NATO core and neigh...of social welfare, pluralism, and transnational cooperation.' },
  { term: 'Northern Europe', description: 'Nordics and Baltics; ...nal trust, social safety nets, and environmental leadership.' },
  { term: 'Southern Europe', description: 'Mediterranean societi...ical layers, and EU integration mixed with local priorities.' },
  { term: 'Eastern Europe', description: 'Post-Soviet and former... security, and reform under shifting geopolitical pressures.' },
  { term: 'Middle East & North Africa (MENA)', description: 'Ara...ts; faith, family, honor, and geopolitics shape public life.' },
  { term: 'West Africa', description: 'ECOWAS region; youthful d...al energy, pan-African ideas, and rich linguistic diversity.' },
  { term: 'East & Horn of Africa', description: 'From Ethiopia/S...nia; regional integration, security, and rapid urbanization.' },
  { term: 'Central Africa', description: 'Congo Basin and neighb...ty, and governance challenges amid regional interdependence.' },
  { term: 'Southern Africa', description: 'SADC region; post-apa...d transitions, mineral economies, and social equity debates.' },
  { term: 'South Asia', description: 'India, Pakistan, Banglades...ka; dense history, plural societies, and fast modernization.' },
  { term: 'Southeast Asia', description: 'ASEAN region; trade-dr...agmatism, cultural plurality, and diverse political systems.' },
  { term: 'East Asia', description: 'China, Japan, Koreas, Taiwa...gacies, industrial strength, and regional security dynamics.' },
  { term: 'Central Asia', description: 'Kazakhstan, Kyrgyzstan, ..., Uzbekistan; Silk Road heritage and post-Soviet statecraft.' },
  { term: 'Oceania', description: 'Australia, New Zealand, and P...s stewardship, climate urgency, and multicultural societies.' },
];

// ---- data: community types (category = "communityType") --------------------
const communityTypes = [
  { term: 'Localist', description: 'Rooted in town/city/regional identity; civic pride, local institutions, neighborly reciprocity, and practical problem-solving over abstractions.' },
  { term: 'Nationalist', description: 'Primary loyalty to the nation-state; sovereignty, heritage, cohesion, security, and suspicion of external interference.' },
  { term: 'Global Citizen', description: 'Transnational identity; cooperation, human rights, climate responsibility, cultural exchange, and cosmopolitan norms.' },
  { term: 'Academic/Scholar', description: 'Evidence-seeking community; peer review, methodological rigor, cautious claims, and citation-driven discourse.' },
  { term: 'Activist', description: 'Cause-centered community; urgency, moral framing, protest/organizing, coalition-building, and calls to collective action.' },
  { term: 'Professional Guild Member', description: 'Trade/professional belonging; standards of practice, accreditation/ethics, applied expertise, and peer accountability.' },
  { term: 'Faith-Based', description: 'Religious/spiritual belonging; scripture/tradition, moral duty, service to others, and community stewardship.' },
  { term: 'Subculture Insider', description: 'Niche cultural belonging; in-group language, shared symbols, DIY/creator ethos, and strong identity signaling.' },
  { term: 'Traditionalist', description: 'Continuity-first orientation; custom, family, duty, intergenerational wisdom, and skepticism of rapid change.' },
  { term: 'Progressive/Reformist', description: 'Change-oriented community; innovation, equity/inclusion, institutional reform, and future-leaning norms.' },
  { term: 'Digital Native', description: 'Online-first belonging; open knowledge, remix culture, platform dynamics, and fluency in internet vernacular.' },
  { term: 'Diaspora Member', description: 'Dual-belonging across homeland and host society; memory, transnational networks, adaptation, and bridge-building.' },
  { term: 'Survivor/Resilience-Oriented', description: 'Adversity-forged community (e.g., displacement, disaster, marginalization); justice, dignity, trauma-informed pragmatism, and resilience.' },
  { term: 'Cosmopolitan Elite', description: 'Global urban milieu; mobility, diplomacy, soft power, taste cultures, and multi-context negotiation.' },
  { term: 'Grassroots Organizer', description: 'Bottom-up community-building; participation, mutual aid, local leadership pipelines, and sustained civic engagement.' },
  { term: 'Frontier Innovator', description: 'Pioneering/experimental communities (startups, futurists, space); risk-taking, techno-optimism, and long-horizon thinking.' },
];

// ---- data: political orientations (category = "political") -----------------
const politicalOrientations = [
  { term: 'Progressive', description: 'Champions social justice, inclusivity, and reform; frames debates around equity, rights expansion, and dismantling systemic barriers.' },
  { term: 'Social Democrat', description: 'Advocates a balance between capitalism and strong welfare; emphasizes redistribution, labor rights, and universal public services.' },
  { term: 'Democratic Socialist', description: 'Argues for democratic governance alongside social ownership; seeks to reduce inequality through collective control of resources.' },
  { term: 'Communist', description: 'Frames society as class struggle; calls for collective ownership, abolition of private capital, and solidarity of workers.' },
  { term: 'Green / Eco-Left', description: 'Puts climate, ecology, and sustainability at the center; connects justice and environmental stewardship.' },
  { term: 'Centrist / Moderate', description: 'Seeks compromise and incremental reform; appeals to pragmatism, balance, and avoidance of extremes.' },
  { term: 'Classical Liberal', description: 'Defends individual freedoms, civil rights, and free markets; wary of state intervention and protective of liberties.' },
  { term: 'Libertarian', description: 'Radicalizes the liberal principle: minimal state, maximum autonomy; opposes coercion and most forms of regulation.' },
  { term: 'Fiscal Conservative', description: 'Prioritizes balanced budgets, low taxes, and limited government spending; frames debates around efficiency and restraint.' },
  { term: 'Social Conservative', description: 'Upholds family values, tradition, and cultural continuity; resists rapid social change, appeals to heritage and morality.' },
  { term: 'National Conservative', description: 'Defends sovereignty, borders, and cultural cohesion; emphasizes patriotism, law & order, and protecting “the nation first.”' },
  { term: 'Right-Populist', description: 'Frames elites as betraying ordinary people; blends nationalism with populist anger at institutions, globalization, or outsiders.' },
  { term: 'Authoritarian / Statist', description: 'Justifies strong centralized authority; values order, discipline, and national unity above individual liberties.' },
  { term: 'Anarchist', description: 'Rejects state authority altogether; advocates decentralized, voluntary, and communal governance.' },
  { term: 'Technocrat', description: 'Argues for governance by expertise and rational planning; elevates data, models, and problem-solving over ideology.' },
  { term: 'Populist', description: 'Positions themselves as the voice of “the people” against elites; rhetoric is emotive, direct, and anti-establishment.' },
  { term: 'Traditional Monarchist', description: 'Defends monarchy as a source of stability, continuity, and duty; values hierarchy and inherited legitimacy.' },
  { term: 'Theocratic', description: 'Advocates political order grounded in religious law; appeals to divine authority, moral absolutes, and spiritual duty.' },
  { term: 'Globalist / Internationalist', description: 'Supports global cooperation, supranational institutions, and cosmopolitan values; sees interdependence as essential.' },
  { term: 'Isolationist / Non-Interventionist', description: 'Opposes foreign entanglements; focuses inward, defending sovereignty, self-reliance, and national priority.' },
];

// ---- data: religions (category = "religion") ------------------------------
const religions = [
  { term: 'Christian (General)', description: 'Frames arguments with reference to the Bible, Jesus’ teachings, and traditions of the Church; emphasizes faith, redemption, and moral duty.' },
  { term: 'Catholic', description: 'Anchored in the Catholic Church; appeals to papal authority, tradition, sacraments, and natural law.' },
  { term: 'Protestant / Evangelical', description: 'Emphasizes scripture (sola scriptura), personal faith, and moral renewal; often invokes biblical authority and evangelism.' },
  { term: 'Orthodox Christian', description: 'Draws from Eastern Orthodox tradition; emphasizes continuity, liturgy, and the authority of sacred tradition alongside scripture.' },
  { term: 'Muslim', description: 'Grounds arguments in the Qur’an, Hadith, and Sharia principles; emphasizes submission to God, community (ummah), and divine justice.' },
  { term: 'Sunni Muslim', description: 'Represents majority tradition in Islam; appeals to Qur’an, Sunnah, and scholarly consensus (ijma).' },
  { term: 'Shia Muslim', description: 'Frames perspectives through lineage of the Imams and themes of justice, sacrifice, and resistance.' },
  { term: 'Jewish', description: 'Grounds arguments in the Hebrew Bible, Talmudic tradition, and cultural continuity; emphasizes covenant, justice, and community.' },
  { term: 'Hindu', description: 'Draws from dharma (duty), karma, and pluralist philosophy; references epics and Vedic traditions.' },
  { term: 'Buddhist', description: 'Frames perspectives through impermanence, compassion, and non-attachment; appeals to teachings of the Buddha and the path to liberation.' },
  { term: 'Sikh', description: 'Anchored in the Guru Granth Sahib; emphasizes equality, service (seva), and remembrance of God.' },
  { term: 'Jain', description: 'Frames arguments through nonviolence (ahimsa), ascetic ethics, and spiritual discipline.' },
  { term: 'Baha’i', description: 'Emphasizes unity of humanity, harmony of science and religion, and progressive revelation.' },
  { term: 'Indigenous Spirituality', description: 'Speaks from traditions rooted in land, ancestors, and oral wisdom; emphasizes harmony, reciprocity, and spiritual ecology.' },
  { term: 'Taoist', description: 'Draws from Daoist philosophy and spirituality; emphasizes balance, flow (Dao), and natural harmony.' },
  { term: 'Confucian', description: 'Frames debates in terms of moral cultivation, filial piety, order, and virtue-based leadership.' },
  { term: 'Secular Humanist', description: 'Rejects divine authority; grounds ethics in human reason, dignity, and universal rights.' },
  { term: 'Atheist', description: 'Denies belief in gods; frames morality in secular, scientific, or pragmatic terms.' },
  { term: 'Agnostic', description: 'Suspends judgment on the divine; frames arguments around uncertainty, openness, and humility in knowledge.' },
  { term: 'New Age / Spiritual but not Religious', description: 'Draws eclectically from mysticism, holistic practices, and personal spirituality; emphasizes experience, energy, and individual paths.' },
];

// ---- data: philosophical stances (category = "philosophy") -----------------
const philosophies = [
  { term: 'Rationalist', description: 'Grounds arguments in logic, deduction, and reason as the highest authority for truth.' },
  { term: 'Empiricist', description: 'Trusts sensory evidence and experience; insists claims be tested through observation and data.' },
  { term: 'Pragmatist', description: 'Evaluates ideas by their practical consequences; frames debates around what “works” in real-world application.' },
  { term: 'Utilitarian', description: 'Argues from maximizing overall happiness and minimizing suffering; frames morality in cost–benefit terms.' },
  { term: 'Deontologist', description: 'Grounds morality in duties and rules; emphasizes universal principles and ethical absolutes.' },
  { term: 'Virtue Ethicist', description: 'Frames arguments around character, virtue, and moral development rather than rules or outcomes.' },
  { term: 'Existentialist', description: 'Focuses on freedom, authenticity, and individual meaning-making; challenges imposed systems of order.' },
  { term: 'Nihilist', description: 'Questions or denies inherent meaning, value, or morality; exposes arbitrariness in claims.' },
  { term: 'Stoic', description: 'Emphasizes reason, self-control, and resilience; frames debates through enduring what cannot be controlled.' },
  { term: 'Hedonist', description: 'Prioritizes pleasure, well-being, and avoidance of pain; frames arguments in terms of enjoyment and fulfillment.' },
  { term: 'Relativist', description: 'Holds that truth and morality are context-dependent; resists universal claims.' },
  { term: 'Skeptic', description: 'Demands proof and withholds belief without strong justification; probes for uncertainty and fallibility.' },
  { term: 'Idealist', description: 'Frames reality as fundamentally shaped by ideas, consciousness, or mind rather than material conditions.' },
  { term: 'Materialist', description: 'Grounds explanations in matter, science, and physical processes; denies supernatural or non-material claims.' },
  { term: 'Humanist', description: 'Centers human dignity, reason, and agency; resists divine or authoritarian grounding of values.' },
  { term: 'Structuralist', description: 'Frames reality and meaning through underlying systems, language, and cultural structures.' },
  { term: 'Postmodernist', description: 'Challenges meta-narratives, objective truth, and universal claims; foregrounds power, context, and discourse.' },
  { term: 'Realist', description: 'Argues from recognition of objective facts, limits, and power dynamics; opposes idealistic abstractions.' },
  { term: 'Romantic', description: 'Elevates emotion, intuition, creativity, and connection to nature; critiques cold rationalism.' },
  { term: 'Cynic (Classical)', description: 'Rejects convention, status, and materialism; frames debates through simplicity, independence, and moral clarity.' },
];

// ---- data: cultures (category = "culture") ---------------------------------
const cultures = [
  // (leaving your cultures array exactly as-is from the repo)
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

  // 3) Community Types
  await upsertTerms('communityType', communityTypes);
  const ctCount = await prisma.taxonomy.count({ where: { category: 'communityType', isActive: true } });
  console.log(`Seeded community types: ${ctCount}`);

  // 4) Cultures
  await upsertTerms('culture', cultures);
  const cCount = await prisma.taxonomy.count({ where: { category: 'culture', isActive: true } });
  console.log(`Seeded cultures: ${cCount}`);

  // 5) Political Orientations
  await upsertTerms('political', politicalOrientations);
  const pCount = await prisma.taxonomy.count({ where: { category: 'political', isActive: true } });
  console.log(`Seeded political orientations: ${pCount}`);

  // 6) Religions
  await upsertTerms('religion', religions);
  const relCount = await prisma.taxonomy.count({ where: { category: 'religion', isActive: true } });
  console.log(`Seeded religions: ${relCount}`);

  // 7) Philosophical Stances
  await upsertTerms('philosophy', philosophies);
  const phCount = await prisma.taxonomy.count({ where: { category: 'philosophy', isActive: true } });
  console.log(`Seeded philosophical stances: ${phCount}`);

}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });