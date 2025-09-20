// frontend/prisma/seed.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertTax(category, terms) {
  for (const term of terms) {
    await prisma.taxonomy.upsert({
      where: { category_term: { category, term } },
      update: { isActive: true },
      create: { category, term, isActive: true }
    });
  }
}

async function main() {
  await upsertTax("university", ["MIT", "Harvard", "Oxford", "IIT Delhi", "University of Nairobi"]);
  await upsertTax("organization", ["UN Agency", "UNICEF", "Tesla", "Chase Bank", "Greenpeace", "Google", "Local Government"]);
  await upsertTax("culture", ["Western Europe", "East Asia", "South Asia", "Sub-Saharan Africa", "Latin America", "North America", "Middle East & North Africa"]);

  await upsertTax("ageGroup", ["Teen", "Adult", "Middle-aged", "Senior"]);
  await upsertTax("genderIdentity", ["Male", "Female", "Non-binary", "Other"]);

  await upsertTax("political", ["Conservative", "Liberal", "Socialist", "Libertarian", "Anarchist"]);
  await upsertTax("religion", ["Catholic", "Protestant", "Muslim", "Buddhist", "Hindu", "Atheist", "Agnostic"]);
  await upsertTax("philosophy", ["Utilitarian", "Stoic", "Existentialist", "Pragmatic"]);
  await upsertTax("accent", ["British RP", "Southern US", "Nigerian English", "Singlish"]);
  await upsertTax("archetype", ["Analytical", "Charismatic", "Diplomatic", "Sarcastic", "Humorous", "Reserved"]);

  const eliza = await prisma.persona.create({
    data: {
      name: "Dr. Eliza Moore",
      profession: "Economist",
      temperament: "Analytical",
      confidence: 7,
      verbosity: "Medium",
      tone: "Neutral",
      vocabularyStyle: "Academic",
      debateApproach: ["Logical", "Evidence-driven"],
      quirks: ["Always cites statistics"]
    }
  });

  const fetch = (category, term) =>
    prisma.taxonomy.findUnique({ where: { category_term: { category, term } } });

  const [
    harvard,
    unicef,
    southAsia,
    liberal,
    muslim,
    stoic,
    rp,
    analytical,
    ageAdult,
    genderFemale
  ] = await Promise.all([
    fetch("university", "Harvard"),
    fetch("organization", "UNICEF"),
    fetch("culture", "South Asia"),
    fetch("political", "Liberal"),
    fetch("religion", "Muslim"),
    fetch("philosophy", "Stoic"),
    fetch("accent", "British RP"),
    fetch("archetype", "Analytical"),
    fetch("ageGroup", "Adult"),            // 👈 new
    fetch("genderIdentity", "Female")      // 👈 new
  ]);

  const links = [
    harvard,
    unicef,
    southAsia,
    liberal,
    muslim,
    stoic,
    rp,
    analytical,
    ageAdult,
    genderFemale
  ].filter(Boolean);

  for (const t of links) {
    await prisma.personaTaxonomy.upsert({
      where: { personaId_taxonomyId: { personaId: eliza.id, taxonomyId: t.id } },
      update: {},
      create: { personaId: eliza.id, taxonomyId: t.id }
    });
  }

  await prisma.persona.update({
    where: { id: eliza.id },
    data: {
      universityId: harvard?.id ?? null,
      organizationId: unicef?.id ?? null,
      cultureId: southAsia?.id ?? null,
      ageGroup: "Adult",             // also populate the direct field
      genderIdentity: "Female"       // also populate the direct field
    }
  });

  console.log("Seed complete ✅");
}

try {
  await main();
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}