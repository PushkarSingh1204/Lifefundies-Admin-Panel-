const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const fs = require('fs');
const path = require('path');

// 1. Read and parse .env in the root workspace folder
const envPath = path.join(__dirname, '../.env');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      env[match[1]] = val.trim();
    }
  });
} else {
  console.error('❌ .env file not found at project root');
  process.exit(1);
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

console.log('Connecting to project:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Helper to determine types
function getFieldTypes(obj) {
  const schema = {};
  if (!obj) return schema;
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      schema[key] = 'null';
    } else if (Array.isArray(value)) {
      schema[key] = 'array';
    } else if (value && typeof value === 'object') {
      if (typeof value.toDate === 'function' || value.seconds !== undefined) {
        schema[key] = 'timestamp/date';
      } else {
        schema[key] = getFieldTypes(value); // nested
      }
    } else {
      schema[key] = typeof value;
    }
  }
  return schema;
}

const targetCollections = [
  'users',
  'guides',
  'bookings',
  'sessions',
  'payments',
  'community_posts',
  'community_comments',
  'notifications',
  'reports',
  'mentor_reviews',
  'guide_slots'
];

async function runDiscovery() {
  const adminEmail = 'asmitsharma2904@gmail.com';
  const defaultPassword = 'AdminPassword123!';
  
  console.log(`Authenticating as admin (${adminEmail})...`);
  try {
    await signInWithEmailAndPassword(auth, adminEmail, defaultPassword);
    console.log('✅ Successfully authenticated as admin!');
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      console.log(`User not found or credential invalid. Attempting to register (${adminEmail})...`);
      try {
        await createUserWithEmailAndPassword(auth, adminEmail, defaultPassword);
        console.log('✅ Successfully registered and logged in as admin!');
      } catch (regErr) {
        console.warn('⚠️ Authentication/Registration failed. Proceeding as unauthenticated visitor:', regErr.message);
      }
    } else {
      console.warn('⚠️ Sign-in failed. Proceeding as unauthenticated visitor:', err.message);
    }
  }

  const report = {
    projectId: firebaseConfig.projectId,
    discoveredAt: new Date().toISOString(),
    collections: {}
  };

  for (const collName of targetCollections) {
    console.log(`Inspecting collection: "${collName}"...`);
    try {
      const q = query(collection(db, collName), limit(2));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        report.collections[collName] = {
          exists: true,
          status: 'empty',
          documents: []
        };
        console.log(`  -> Empty collection.`);
      } else {
        const docsData = [];
        snap.docs.forEach(docSnap => {
          const rawData = docSnap.data();
          const cleanData = {};
          // Format timestamps nicely for inspection
          for (const [k, v] of Object.entries(rawData)) {
            if (v && typeof v === 'object' && typeof v.toDate === 'function') {
              cleanData[k] = `Timestamp(${v.toDate().toISOString()})`;
            } else {
              cleanData[k] = v;
            }
          }
          docsData.push({
            id: docSnap.id,
            fields: cleanData,
            types: getFieldTypes(rawData)
          });
        });

        report.collections[collName] = {
          exists: true,
          status: 'active',
          count: snap.size, // count of samples retrieved
          sampleSchema: docsData[0].types,
          samples: docsData.map(d => ({ id: d.id, fields: d.fields }))
        };
        console.log(`  -> Discovered ${snap.size} sample docs.`);
      }
    } catch (err) {
      report.collections[collName] = {
        exists: false,
        error: err.message
      };
      console.log(`  -> Failed: ${err.message}`);
    }
  }

  // Save report JSON
  const reportPath = path.join(__dirname, 'schema-discovery-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n🎉 Schema discovery complete! Saved to ${reportPath}`);
}

runDiscovery().catch(err => {
  console.error('Discovery process failed:', err);
});
