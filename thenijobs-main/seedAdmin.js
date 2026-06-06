const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'thenijobs-9f01d';

if (!apiKey) {
  console.error('Error: NEXT_PUBLIC_FIREBASE_API_KEY not found in .env.local');
  process.exit(1);
}

// Function to make HTTPS requests
function request(url, method, headers, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = {};
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = { raw: body };
        }
        resolve({ statusCode: res.statusCode, body: json });
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Main execution flow
async function main() {
  const email = 'admin@thenijobs.com';
  const password = 'Password123!';
  console.log(`Seeding admin account: ${email}...`);

  // 1. Sign up/Sign in user via Firebase Auth REST API
  let uid = null;
  try {
    console.log('Attempting to sign up user...');
    const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
    const signUpRes = await request(signUpUrl, 'POST', { 'Content-Type': 'application/json' }, {
      email: email,
      password: password,
      returnSecureToken: true
    });

    if (signUpRes.statusCode === 200) {
      uid = signUpRes.body.localId;
      console.log(`Successfully signed up new user with UID: ${uid}`);
    } else if (signUpRes.body.error && signUpRes.body.error.message === 'EMAIL_EXISTS') {
      console.log('User already exists, signing in...');
      const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
      const signInRes = await request(signInUrl, 'POST', { 'Content-Type': 'application/json' }, {
        email: email,
        password: password,
        returnSecureToken: true
      });

      if (signInRes.statusCode === 200) {
        uid = signInRes.body.localId;
        console.log(`Successfully signed in. UID: ${uid}`);
      } else {
        throw new Error(JSON.stringify(signInRes.body));
      }
    } else {
      throw new Error(JSON.stringify(signUpRes.body));
    }
  } catch (err) {
    console.error('Auth request failed:', err);
    process.exit(1);
  }

  // 2. Read firebase-tools.json to get Google access token
  let accessToken = null;
  const configPaths = [
    path.join(process.env.USERPROFILE || 'C:\\Users\\Admin', '.config', 'configstore', 'firebase-tools.json'),
    path.join(process.env.HOME || '', '.config', 'configstore', 'firebase-tools.json')
  ];

  for (const p of configPaths) {
    if (fs.existsSync(p)) {
      try {
        const config = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (config.tokens && config.tokens.access_token) {
          accessToken = config.tokens.access_token;
          console.log(`Loaded Firebase access token from ${p}`);
          break;
        }
      } catch (e) {
        console.warn(`Failed to parse ${p}:`, e.message);
      }
    }
  }

  if (!accessToken) {
    console.error('Error: Could not find active Firebase access token. Please run firebase login or check config.');
    process.exit(1);
  }

  // 3. Patch User document to set role as admin
  try {
    console.log(`Updating Firestore document: users/${uid} with role 'admin'...`);
    const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=email&updateMask.fieldPaths=displayName&updateMask.fieldPaths=role&updateMask.fieldPaths=isVerified`;
    
    const patchRes = await request(docUrl, 'PATCH', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }, {
      fields: {
        email: { stringValue: email },
        displayName: { stringValue: 'Super Admin' },
        role: { stringValue: 'admin' },
        isVerified: { booleanValue: true }
      }
    });

    if (patchRes.statusCode === 200) {
      console.log('Successfully updated Firestore document! Admin account is fully set up.');
    } else {
      throw new Error(`Firestore patch failed: ${JSON.stringify(patchRes.body)}`);
    }
  } catch (err) {
    console.error('Firestore request failed:', err);
    process.exit(1);
  }
}

main();
