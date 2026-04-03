# SELISE Blocks Skills

AI agent skills for implementing [SELISE Blocks](https://seliseblocks.com) features in any web project.

Each skill is a self-contained folder with a `SKILL.md` instruction file and reference examples that an AI coding agent can follow to integrate a Blocks feature into an existing codebase — regardless of the frontend framework.

## Available Skills

| Skill | Description |
|---|---|
| [blocks-localization](./blocks-localization/) | Multi-language support via the Blocks UILM API — stack detection, CSV migration, translation loading, key-mode debugging |

## How Skills Work

1. Point your AI agent at a skill's `SKILL.md` file
2. The agent reads the instructions and follows the execution workflow
3. It detects the project's stack, asks for any missing configuration, and implements the feature step by step

Each skill includes:
- **Execution workflow** — a strict step-by-step checklist the agent follows
- **API reference** — endpoints, headers, and response formats
- **Reference implementations** — working example code for common stacks
- **Stack-agnostic guidance** — patterns that adapt to any framework

## Links

- **Blocks Platform**: [seliseblocks.com](https://seliseblocks.com)
- **Documentation**: [docs.seliseblocks.com](https://docs.seliseblocks.com)
