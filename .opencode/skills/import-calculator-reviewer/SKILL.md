---
name: import-calculator-reviewer
description: Implement, test, validate, or review Spanish vehicle import cost calculations, fiscal configuration, logistics scenarios, and cost breakdowns for the EU Car Import Analyzer.
compatibility: opencode
metadata:
  project: eu-car-import-analyzer
  domain: spanish-vehicle-import
---

# Import Calculator Reviewer

## When to use

Use this skill whenever the user asks to:

- implement or modify import calculations;
- add Spanish registration taxes or fees;
- calculate transport costs;
- estimate IVTM;
- update depreciation bands;
- review numerical correctness;
- create calculation tests;
- display the final landed cost in Spain.

## Core principle

The calculator provides an estimate, not tax or legal advice.

Clearly separate:

- official values;
- configurable assumptions;
- user-provided values;
- calculated values;
- values that