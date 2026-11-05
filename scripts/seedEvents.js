import { MongoClient } from "mongodb";
import "dotenv/config";

const databaseName = process.env.MONGODB_DB_NAME || "shohojogi";
const uri = process.env.MONGODB_URL;

if (!uri) {
  console.error("Missing required environment variable: MONGODB_URL");
  process.exit(1);
}

export const SEED_EVENTS = [
  {
    title: "Winter Clothes Distribution – Mirpur 10",
    category: "Donation",
    eventType: "Donation",
    date: "2026-11-22",
    eventDate: "2026-11-22",
    time: "09:00 AM - 02:00 PM",
    location: "Mirpur 10 Community Center, Dhaka",
    image: "https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?auto=format&fit=crop&w=1200&q=80",
    description: "Join us to collect, sort, and distribute warm winter clothes, jackets, and sweaters to underprivileged families and rickshaw pullers in Mirpur 10. Help our vulnerable neighbours stay warm during the approaching cold wave.",
    organizer: "Tanvir Ahmed",
    creatorName: "Tanvir Ahmed",
    organizerEmail: "tanvir@shohojogi.org",
    creatorEmail: "tanvir@shohojogi.org",
    organizerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    attendeesCount: 42,
    status: "published",
    createdAt: new Date("2026-11-01T08:00:00Z"),
  },
  {
    title: "Blanket Distribution – Mohammadpur",
    category: "Relief",
    eventType: "Relief",
    date: "2026-11-28",
    eventDate: "2026-11-28",
    time: "08:30 AM - 01:00 PM",
    location: "Mohammadpur Town Hall Ground, Dhaka",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80",
    description: "Volunteers are coming together to hand out 500 thick winter blankets to street dwellers, elderly citizens, and shelter homes in Mohammadpur. Every blanket brings warmth and protection against harsh winter nights.",
    organizer: "Nusrat Jahan",
    creatorName: "Nusrat Jahan",
    organizerEmail: "nusrat@shohojogi.org",
    creatorEmail: "nusrat@shohojogi.org",
    organizerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    attendeesCount: 35,
    status: "published",
    createdAt: new Date("2026-11-02T09:30:00Z"),
  },
  {
    title: "Tree Plantation Drive – Hatirjheel",
    category: "Plantation",
    eventType: "Plantation",
    date: "2026-12-05",
    eventDate: "2026-12-05",
    time: "07:30 AM - 11:30 AM",
    location: "Hatirjheel Promenade (Amphitheater Area), Dhaka",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
    description: "Help plant 300 native shade and fruit trees around the Hatirjheel walkways to restore urban greenery and reduce air pollution. Saplings, gardening tools, gloves, and refreshments will be provided for all participants.",
    organizer: "Farhan Kabir",
    creatorName: "Farhan Kabir",
    organizerEmail: "farhan@shohojogi.org",
    creatorEmail: "farhan@shohojogi.org",
    organizerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    attendeesCount: 58,
    status: "published",
    createdAt: new Date("2026-11-03T10:00:00Z"),
  },
  {
    title: "Riverbank Cleanup – Buriganga",
    category: "Cleanup",
    eventType: "Cleanup",
    date: "2026-12-12",
    eventDate: "2026-12-12",
    time: "08:00 AM - 12:30 PM",
    location: "Sadarghat Launch Terminal & Riverbank, Old Dhaka",
    image: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80",
    description: "A massive volunteer-led cleanup campaign along the Buriganga riverbank to remove plastic debris, polythene bags, and waste blocking waterways. Protective equipment and collection bags are provided on site.",
    organizer: "Sadia Rahman",
    creatorName: "Sadia Rahman",
    organizerEmail: "sadia@shohojogi.org",
    creatorEmail: "sadia@shohojogi.org",
    organizerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    attendeesCount: 64,
    status: "published",
    createdAt: new Date("2026-11-03T14:00:00Z"),
  },
  {
    title: "Free Medical & Health Camp – Dhanmondi",
    category: "Healthcare",
    eventType: "Healthcare",
    date: "2026-12-19",
    eventDate: "2026-12-19",
    time: "09:00 AM - 04:00 PM",
    location: "Dhanmondi Lake Public Plaza, Road 32, Dhaka",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80",
    description: "Qualified physicians and medical students are offering free general check-ups, blood pressure screenings, diabetes testing, and essential prescription medicines to local workers and low-income families.",
    organizer: "Dr. Kazi Mahfuz",
    creatorName: "Dr. Kazi Mahfuz",
    organizerEmail: "dr.mahfuz@shohojogi.org",
    creatorEmail: "dr.mahfuz@shohojogi.org",
    organizerAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80",
    attendeesCount: 80,
    status: "published",
    createdAt: new Date("2026-11-04T07:15:00Z"),
  },
  {
    title: "Emergency Blood Donation Drive – Chittagong",
    category: "Blood Donation",
    eventType: "Blood Donation",
    date: "2026-12-26",
    eventDate: "2026-12-26",
    time: "10:00 AM - 05:00 PM",
    location: "CRB Shirishtola, Chittagong",
    image: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80",
    description: "Partnering with regional blood banks to replenish emergency blood reserves for thalassemia patients and accident victims in Chittagong. Certified medical staff perform safety screenings before donation.",
    organizer: "Anisur Rahman",
    creatorName: "Anisur Rahman",
    organizerEmail: "anisur@shohojogi.org",
    creatorEmail: "anisur@shohojogi.org",
    organizerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    attendeesCount: 52,
    status: "published",
    createdAt: new Date("2026-11-04T08:30:00Z"),
  },
  {
    title: "Street Children Education Day – Old Dhaka",
    category: "Education",
    eventType: "Education",
    date: "2027-01-02",
    eventDate: "2027-01-02",
    time: "09:30 AM - 01:30 PM",
    location: "Bahadur Shah Park, Old Dhaka",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
    description: "An inspiring morning of open-air storytelling, basic literacy workshops, and distribution of school bags, notebooks, and stationery sets to 100 street children. Join us as volunteer mentors and teachers.",
    organizer: "Tasnim Ferdous",
    creatorName: "Tasnim Ferdous",
    organizerEmail: "tasnim@shohojogi.org",
    creatorEmail: "tasnim@shohojogi.org",
    organizerAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    attendeesCount: 39,
    status: "published",
    createdAt: new Date("2026-11-04T09:45:00Z"),
  },
  {
    title: "Flood Relief & Food Distribution – Sylhet",
    category: "Food",
    eventType: "Food",
    date: "2027-01-09",
    eventDate: "2027-01-09",
    time: "08:00 AM - 03:00 PM",
    location: "Kazirbazar Relief Center, Sylhet Sadar",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
    description: "Providing emergency food packages containing rice, lentils, edible oil, and clean drinking water to families recovering from recent flash floods in low-lying Sylhet villages. Volunteers assist with packing and logistics.",
    organizer: "Sayed Mahmud",
    creatorName: "Sayed Mahmud",
    organizerEmail: "sayed@shohojogi.org",
    creatorEmail: "sayed@shohojogi.org",
    organizerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
    attendeesCount: 71,
    status: "published",
    createdAt: new Date("2026-11-04T11:00:00Z"),
  },
  {
    title: "Marine Conservation & Beach Cleanup – Cox's Bazar",
    category: "Cleanup",
    eventType: "Cleanup",
    date: "2027-01-16",
    eventDate: "2027-01-16",
    time: "07:00 AM - 11:00 AM",
    location: "Laboni Beach Point, Cox's Bazar",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    description: "Protecting marine biodiversity by cleaning non-biodegradable tourist waste, fishing nets, and plastic along the world's longest natural sea beach. Join environmentalists and local youth for an impactful sunrise drive.",
    organizer: "Mehnaz Haque",
    creatorName: "Mehnaz Haque",
    organizerEmail: "mehnaz@shohojogi.org",
    creatorEmail: "mehnaz@shohojogi.org",
    organizerAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    attendeesCount: 46,
    status: "published",
    createdAt: new Date("2026-11-04T12:30:00Z"),
  },
  {
    title: "Community Dental & Eye Care Camp – Rajshahi",
    category: "Healthcare",
    eventType: "Healthcare",
    date: "2027-01-23",
    eventDate: "2027-01-23",
    time: "09:00 AM - 03:30 PM",
    location: "Shaheed Minar Compound, Rajshahi University Area",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80",
    description: "Free dental consultations, cleanings, and eye vision tests conducted by volunteer ophthalmologists and dental surgeons. Over 200 pairs of reading glasses and oral hygiene kits will be distributed free of charge.",
    organizer: "Dr. Shireen Akter",
    creatorName: "Dr. Shireen Akter",
    organizerEmail: "dr.shireen@shohojogi.org",
    creatorEmail: "dr.shireen@shohojogi.org",
    organizerAvatar: "https://images.unsplash.com/photo-1594824813589-9a744211f4d9?auto=format&fit=crop&w=200&q=80",
    attendeesCount: 63,
    status: "published",
    createdAt: new Date("2026-11-04T14:00:00Z"),
  },
  {
    title: "Orphanage Support & Book Donation – Khulna",
    category: "Education",
    eventType: "Education",
    date: "2027-01-30",
    eventDate: "2027-01-30",
    time: "10:00 AM - 02:00 PM",
    location: "Shishu Nibash Orphanage, Boyra, Khulna",
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
    description: "Setting up a permanent reading corner and mini-library with 500 children's books, encyclopedias, and creative art supplies for 80 resident children. Volunteers will spend quality time reading and playing games.",
    organizer: "Jubair Hossain",
    creatorName: "Jubair Hossain",
    organizerEmail: "jubair@shohojogi.org",
    creatorEmail: "jubair@shohojogi.org",
    organizerAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
    attendeesCount: 29,
    status: "published",
    createdAt: new Date("2026-11-04T15:15:00Z"),
  },
  {
    title: "Environmental Awareness & Recycling Workshop – Comilla",
    category: "Community Support",
    eventType: "Community Support",
    date: "2027-02-06",
    eventDate: "2027-02-06",
    time: "10:00 AM - 01:30 PM",
    location: "Town Hall Auditorium, Kandirpar, Comilla",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80",
    description: "A community workshop teaching household waste segregation, composting, and plastic upcycling to neighbourhood leaders and school students. Participants receive reusable cloth bags and home compost starters.",
    organizer: "Shahidul Islam",
    creatorName: "Shahidul Islam",
    organizerEmail: "shahidul@shohojogi.org",
    creatorEmail: "shahidul@shohojogi.org",
    organizerAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    attendeesCount: 47,
    status: "published",
    createdAt: new Date("2026-11-04T16:00:00Z"),
  },
];

async function seed() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(databaseName);
    const collection = db.collection("events");

    console.info(`Connected to MongoDB database: "${databaseName}".`);
    console.info(`Seeding ${SEED_EVENTS.length} events...`);

    // Clean up any test/incomplete records from previous test runs so exactly 12 events remain
    const seedTitles = SEED_EVENTS.map((e) => e.title);
    const deleteResult = await collection.deleteMany({ title: { $nin: seedTitles } });
    if (deleteResult.deletedCount > 0) {
      console.info(`Removed ${deleteResult.deletedCount} legacy/test events.`);
    }

    // Idempotent upsert by title
    let upsertedCount = 0;
    let modifiedCount = 0;

    for (const event of SEED_EVENTS) {
      const result = await collection.updateOne(
        { title: event.title },
        { $set: event },
        { upsert: true }
      );
      if (result.upsertedCount > 0) upsertedCount++;
      else if (result.modifiedCount > 0) modifiedCount++;
    }

    const totalInDb = await collection.countDocuments();
    console.info(`\nSeeding completed successfully:`);
    console.info(`- New events inserted: ${upsertedCount}`);
    console.info(`- Existing events refreshed: ${modifiedCount}`);
    console.info(`- Total events in database: ${totalInDb} (target: ${SEED_EVENTS.length})`);

    // Verify indexes
    await collection.createIndex({ date: 1 });
    await collection.createIndex({ title: 1 });
    await collection.createIndex({ organizerEmail: 1 });
    console.info("Indexes verified.");
  } catch (error) {
    console.error("Seeding failed with error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

if (process.argv[1]?.endsWith("seedEvents.js")) {
  seed().then(() => process.exit(0));
}
