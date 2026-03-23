# Evaluation Framework for HAVEN

This folder contains the evaluation framework for the HAVEN IDE and Niyah Engine.

## Goals
- Measure accuracy, relevance, and sovereignty alignment of AI responses
- Evaluate code generation, Arabic NLP, and intent analysis
- Support regression and unit testing for all major features

## Structure
- `testCases.json` — List of evaluation prompts and expected outcomes
- `runEvaluation.ts` — Main script to run evaluation and generate reports
- `metrics.ts` — Utility functions for scoring (accuracy, relevance, sovereignty, etc.)
- `README.md` — This documentation

## How to Use
1. Add or update test cases in `testCases.json`
2. Run `runEvaluation.ts` to execute evaluation
3. Review the generated report for metrics and failures

## Metrics
- **Accuracy**: Does the output match the expected result?
- **Relevance**: Is the response contextually appropriate?
- **Sovereignty**: Does the response avoid external dependencies and respect privacy?
- **Arabic NLP**: Correctness of dialect/tone/domain detection

---

For advanced evaluation (e.g., human-in-the-loop, multi-agent), extend the framework as needed.
