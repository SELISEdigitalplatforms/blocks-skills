# Evaluation Framework

## Overview

This directory contains evaluation criteria and test cases for measuring the quality and accuracy of the blocks-uilm skill.

## Running Evals

Evals are defined in `evals.json`. Each eval represents a scenario that the skill should handle correctly.

## Success Metrics

- All 23 action files reference correct endpoints with exact field names
- All 5 flow files follow the Pre-flight Audit + Flow Steps + Error Handling format
- contracts.md contains all documented schemas, endpoints, and enums
- SKILL.md contains Field Names table, Common Pitfalls, Verification Checklist
- API responses used directly (no `data` envelope unwrapping)
- Translation keys use semantic naming — no UI-type prefixes

## Key Field Name Rules (critical for evals)

| Field | Rule |
|-------|------|
| Key operations | Use `moduleId`, NOT `moduleName` |
| Module operations | Use `moduleName`, NOT `moduleId` |
| Key resources | Use `resources[]` with `{value, culture, characterLength}`, NOT `translations[]` |
| GetKeysResponse | Use `keys[]`, NOT `data[]` |
| GetKeyTimeline | Use `EntityId` query param, NOT `keyId` |
| Language/Delete | Use `LanguageName` query param, NOT `itemId` |
| Translate actions | Include `messageCoRelationId` (UUID) |
| Import | Use `fileId` reference, NOT raw file upload |
| Export | Use `appIds[]`, NOT `moduleIds[]` |
| Auth header | Use `x-blocks-key`, NOT `Authorization: ApiKey` |
