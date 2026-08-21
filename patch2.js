const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

// Insert ai_leads rule before schools_onboardings
rules = rules.replace(
  /\/\/ Match schools_onboardings collection/,
  `// Match ai_leads collection
    match /ai_leads/{leadId} {
      allow read, write: if isAdmin() || isSalesRep();
    }

    // Match schools_onboardings collection`
);

// Fix resource == null in schools_onboardings
rules = rules.replace(
  /resource == null \|\| resource\.data\.userId == request\.auth\.uid/g,
  'resource.data.userId == request.auth.uid'
);

fs.writeFileSync('firestore.rules', rules);
console.log("Patched firestore.rules for ai_leads");
