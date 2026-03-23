// Main evaluation runner for HAVEN
import testCases from './testCases.json';
import { accuracy, relevance, sovereignty, arabicNLP } from './metrics';
// import { NiyahEngine } from '../ide/engine/NiyahEngine'; // Uncomment and adjust path as needed

async function run() {
  // const engine = new NiyahEngine();
  let passed = 0;
  for (const test of testCases) {
    // const result = engine.process(test.input);
    // Mock result for illustration:
    const result = {
      intent: test.expectedIntent,
      dialect: test.expectedDialect,
      domain: test.expectedDomain,
      output: test.expectedOutputContains.join(' ')
    };
    const acc = accuracy(test.expectedIntent, result.intent);
    const rel = relevance(test.expectedOutputContains, result.output);
    const sov = sovereignty(result.output);
    const nlp = arabicNLP(test.expectedDialect, result.dialect);
    const score = (acc + rel + sov + nlp) / 4;
    if (score === 1) passed++;
    console.log(`Test ${test.id}: Score=${score}`);
  }
  console.log(`Passed: ${passed}/${testCases.length}`);
}

run();
