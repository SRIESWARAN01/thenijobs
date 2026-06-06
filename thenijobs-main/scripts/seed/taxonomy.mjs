import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

const categories = [
  'Agriculture',
  'Construction',
  'Manufacturing',
  'Textile',
  'IT & Software',
  'Education',
  'Healthcare',
  'Retail',
  'Transportation',
  'Real Estate',
  'Finance',
  'Hospitality',
  'Food & Beverage',
  'Automobile',
  'Media & Entertainment',
];

const districts = [
  'Chennai',
  'Coimbatore',
  'Madurai',
  'Trichy',
  'Salem',
  'Tirunelveli',
  'Erode',
  'Vellore',
  'Thoothukudi',
  'Dindigul',
  'Thanjavur',
  'Ranipet',
  'Sivaganga',
  'Virudhunagar',
  'Namakkal',
  'Theni',
  'Villupuram',
  'Nagapattinam',
  'Kancheepuram',
  'Tiruppur',
  'Krishnagiri',
  'Dharmapuri',
  'Pudukkottai',
  'Ramanathapuram',
  'Karur',
  'Cuddalore',
  'Ariyalur',
  'Perambalur',
  'Nilgiris',
  'Tiruvannamalai',
  'Tiruvarur',
  'Tirupathur',
  'Chengalpattu',
  'Mayiladuthurai',
  'Kallakurichi',
  'Tenkasi',
];

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    limits: { activeJobs: 1, applicationsPerMonth: 5, featuredListings: 0 },
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 40,
    period: 'month',
    limits: { activeJobs: 3, applicationsPerMonth: null, featuredListings: 0 },
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 100,
    period: 'month',
    limits: { activeJobs: 10, applicationsPerMonth: null, featuredListings: 2 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 190,
    period: 'month',
    limits: { activeJobs: null, applicationsPerMonth: null, featuredListings: null },
  },
];

function initAdmin() {
  if (getApps().length > 0) return;

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    const serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
    return;
  }

  initializeApp({ credential: applicationDefault() });
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function seedCollection(db, collectionName, records) {
  const batch = db.batch();

  for (const record of records) {
    const id = record.id ?? slugify(record.name);
    const ref = db.collection('taxonomy').doc(collectionName).collection('items').doc(id);
    batch.set(
      ref,
      {
        ...record,
        slug: id,
        isActive: true,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  await batch.commit();
  console.log(`Seeded taxonomy/${collectionName}/items (${records.length})`);
}

initAdmin();
const db = getFirestore();

await seedCollection(
  db,
  'categories',
  categories.map((name) => ({ name, type: 'job_business' })),
);

await seedCollection(
  db,
  'districts',
  districts.map((name) => ({ name, state: 'Tamil Nadu', country: 'India' })),
);

await seedCollection(db, 'plans', plans);

console.log('Taxonomy seed complete.');
