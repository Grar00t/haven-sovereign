// Evaluation metrics utilities for HAVEN
export function accuracy(expected: string, actual: string): number {
  return expected.trim() === actual.trim() ? 1 : 0;
}

export function relevance(expectedKeywords: string[], actual: string): number {
  return expectedKeywords.every(k => actual.includes(k)) ? 1 : 0;
}

export function sovereignty(output: string): number {
  // Simple check: penalize if output mentions cloud/external
  const violations = ["cloud", "external", "api", "server", "google", "aws", "azure"];
  return violations.some(v => output.toLowerCase().includes(v)) ? 0 : 1;
}

export function arabicNLP(expectedDialect: string, actualDialect: string): number {
  return expectedDialect === actualDialect ? 1 : 0;
}
