const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  /\(resource != null && request\.auth\.token\.customerId == resource\.data\.customerId\)/g,
  'request.auth.token.customerId == resource.data.customerId'
);

fs.writeFileSync('firestore.rules', rules);
console.log("Patched firestore.rules for resource != null");
