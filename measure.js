// Fake db implementation to measure the N+1 issue
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const updateDoc = async (doc, data) => {
  await sleep(50); // Simulate network latency
};

const writeBatch = () => {
  const ops = [];
  return {
    update: (doc, data) => ops.push({doc, data}),
    commit: async () => {
      await sleep(50); // Simulate network latency for a single batch request
    }
  };
};

async function measureNPlusOne(numContacts) {
  const start = Date.now();
  for (let i = 0; i < numContacts; i++) {
    await updateDoc(`doc${i}`, {isPrimary: false});
  }
  await updateDoc('targetContact', {isPrimary: true});
  await updateDoc('customer', {lastActivityDate: 'now'});
  const end = Date.now();
  return end - start;
}

async function measureBatch(numContacts) {
  const start = Date.now();
  const batch = writeBatch();
  for (let i = 0; i < numContacts; i++) {
    batch.update(`doc${i}`, {isPrimary: false});
  }
  batch.update('targetContact', {isPrimary: true});
  batch.update('customer', {lastActivityDate: 'now'});
  await batch.commit();
  const end = Date.now();
  return end - start;
}

async function run() {
  const numContacts = 10;
  console.log(`Measuring with ${numContacts} primary contacts to demote...`);

  const timeNPlusOne = await measureNPlusOne(numContacts);
  console.log(`N+1 Sequential Updates took: ${timeNPlusOne}ms`);

  const timeBatch = await measureBatch(numContacts);
  console.log(`Batched Updates took: ${timeBatch}ms`);

  console.log(`Performance Improvement: ${timeNPlusOne - timeBatch}ms (${((timeNPlusOne - timeBatch) / timeNPlusOne * 100).toFixed(2)}% faster)`);
}

run();
