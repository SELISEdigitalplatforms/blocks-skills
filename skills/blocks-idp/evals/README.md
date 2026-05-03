# Evaluation Framework

## Overview

This directory contains evaluation criteria and test cases for measuring the quality and accuracy of the blocks-idp skill.

## Running Evals

Evals are defined in `evals.json`. Each eval represents a scenario that the skill should handle correctly.

## Success Metrics

- All 72 action files reference correct endpoints with exact field names
- All 10 flow files follow the Pre-flight Audit + Flow Steps + Error Handling format
- contracts.md contains all documented schemas, endpoints, and enums
- SKILL.md contains Field Names table, Common Pitfalls, Verification Checklist
- Token endpoint uses `application/x-www-form-urlencoded`, not `application/json`
- All responses checked against `isSuccess`, not `success`

## Key Field Name Rules (critical for evals)

| Field | Rule |
|-------|------|
| Token grant | Use `application/x-www-form-urlencoded`, NOT JSON |
| User operations | Use `itemId`, NOT `id` |
| Response envelope | Check `isSuccess`, NOT `success` |
| List endpoints | Handle `{data, errors, totalCount}` envelope |
| MFA OTP | 5-digit for email OTP, 6-digit for TOTP |
| MFA during login | Use `mfa_code` grant type, NOT `verify-otp` |
| userCreationType | `4`=AdminCreated, `5`=SelfService |
