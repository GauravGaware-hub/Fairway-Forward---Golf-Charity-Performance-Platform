import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding development charities...");

  const demoCharities = [
    {
      name: "Digital Heroes Community Foundation",
      slug: "digital-heroes-community-foundation",
      description: "Fictional demo charity supporting local community golf & wellness initiatives.",
      imageUrl: "https://placehold.co/600x400?text=Digital+Heroes+Foundation",
      websiteUrl: "https://example.com/digital-heroes-foundation",
      isFeatured: true,
      isActive: true,
    },
    {
      name: "Green Fairways Initiative",
      slug: "green-fairways-initiative",
      description: "Fictional demo charity promoting eco-friendly golf course management and conservation.",
      imageUrl: "https://placehold.co/600x400?text=Green+Fairways",
      websiteUrl: "https://example.com/green-fairways",
      isFeatured: true,
      isActive: true,
    },
    {
      name: "Future Sports Access Trust",
      slug: "future-sports-access-trust",
      description: "Fictional demo charity providing sports equipment and training for underprivileged youth.",
      imageUrl: "https://placehold.co/600x400?text=Sports+Access+Trust",
      websiteUrl: "https://example.com/future-sports-access",
      isFeatured: false,
      isActive: true,
    },
    {
      name: "Local Youth Opportunity Fund",
      slug: "local-youth-opportunity-fund",
      description: "Fictional demo charity funding educational and athletic grants for young golfers.",
      imageUrl: "https://placehold.co/600x400?text=Youth+Opportunity+Fund",
      websiteUrl: "https://example.com/youth-opportunity-fund",
      isFeatured: false,
      isActive: true,
    },
  ];

  for (const charity of demoCharities) {
    await prisma.charity.upsert({
      where: { slug: charity.slug },
      update: charity,
      create: charity,
    });
  }

  console.log("Demo charities seeded successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding charities:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
