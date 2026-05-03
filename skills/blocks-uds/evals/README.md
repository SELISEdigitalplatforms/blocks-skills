# Evaluation Framework

## Overview

This directory contains evaluation criteria and test cases for measuring the quality and accuracy of the blocks-uds skill.

## Running Evals

Evals are defined in `evals.json`. Each eval represents a scenario that the skill should handle correctly.

## Success Metrics

- All 50 action files reference correct endpoints with exact field names
- All 6 flow files follow the Pre-flight Audit + Flow Steps + Error Handling format
- contracts.md contains all documented schemas, endpoints, and enums
- SKILL.md contains Field Names table, Common Pitfalls, Verification Checklist
- GraphQL patterns documented with correct query naming convention
- No string enums used where integers are required

## Key Field Name Rules (critical for evals)

| Field | Rule |
|-------|------|
| projectKey in body | Use `$X_BLOCKS_KEY` value, NOT `$PROJECT_SLUG` |
| SchemaType | Integer: `1`=Entity, `2`=Dto |
| accessLevel | Integer: `0`=Public, `1`=User, `2`=Custom |
| operation | Integer: `0`=Read, `1`=Create, `2`=Update, `3`=Delete, `4`=All |
| validationType | Integer: `0`–`11` |
| Pre-signed URL response | Direct `{isSuccess, uploadUrl, fileId}` — NOT `{data: {uploadUrl}}` |
| delete-file | POST body `{fileId, ...}` — NOT query params |
| DataSource field | `dbConnectionString`, NOT `ConnectionString` |
| create-folder | Full request body with 13 fields |
