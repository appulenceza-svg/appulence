const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  /allow read: if isAdmin\(\) \|\| \(isSalesRep\(\) && \(resource == null \|\| resource\.data\.ownerId == request\.auth\.uid\)\)/g,
  'allow read: if isAdmin() || (isSalesRep() && resource.data.ownerId == request.auth.uid)'
);

fs.writeFileSync('firestore.rules', rules);
console.log("Patched firestore.rules");
