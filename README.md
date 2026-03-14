# DB Craft

DB Craft is a local visual database modeling workspace for designing tables and relationships, generating SQL, and preparing handoff-ready artifacts for Codex or downstream migration workflows.

It is built for people who want a faster path from idea to schema without bouncing between notes, spreadsheets, and raw SQL drafts.

With DB Craft, you can move from requirement to model in one flow:

- model tables visually
- keep the current project diagram in sync
- export SQL quickly
- hand off unfinished AI tasks to Codex when needed

## Why DB Craft

DB Craft is positioned as a design-to-SQL workspace, not a live database execution tool.

It is a good fit when you want to:

- sketch a schema before implementation starts
- refine tables and relationships over multiple conversations
- generate an initial structure from natural language or SQL
- keep model files and SQL exports together in one project
- hand the result off cleanly to migration or deployment workflows

## Highlights

- Visual schema design for MySQL 8, PostgreSQL 14, SQLite, and MSSQL
- Manual table creation, AI-assisted table drafting, and SQL-based table import
- Syntax checking and SQL export
- Project-aware model persistence
- Send-to-Codex handoff flow
- Marketplace-ready docs and release assets

## Repository Layout

### Application Source

The DB Craft app source now lives under:

- [app](./app)

Main files:

- [app/index.html](./app/index.html)
- [app/app.js](./app/app.js)
- [app/styles.css](./app/styles.css)
- [app/server.js](./app/server.js)
- [app/src/core](./app/src/core)
- [app/samples](./app/samples)

### Skill Definition

The Codex skill definition and supporting references live under:

- [skill](./skill)

Main files:

- [skill/SKILL.md](./skill/SKILL.md)
- [skill/agents/openai.yaml](./skill/agents/openai.yaml)
- [skill/scripts/launch-dbdesigner.ps1](./skill/scripts/launch-dbdesigner.ps1)
- [skill/references](./skill/references)

### Marketplace Docs

The marketplace-facing documents live under:

- [marketplace-docs](./marketplace-docs)

Start here if you want release guidance or listing copy:

- [Marketplace Copy](./marketplace-docs/marketplace-copy.md)
- [Marketplace Submission Fields](./marketplace-docs/marketplace-submission-fields.md)
- [市场提交字段（中文）](./marketplace-docs/marketplace-submission-fields.zh-CN.md)
- [Install Prerequisites](./marketplace-docs/install-prerequisites.md)
- [Data Security](./marketplace-docs/data-security.md)
- [Marketplace Submission Checklist](./marketplace-docs/marketplace-submission-checklist.md)
- [Clean Environment Self-Test](./marketplace-docs/clean-environment-self-test.md)
- [Clean Environment Self-Test Report](./marketplace-docs/clean-environment-self-test-report.md)

### Marketplace Assets

Release assets live under:

- [marketplace-assets/brand](./marketplace-assets/brand)
- [marketplace-assets/screenshots](./marketplace-assets/screenshots)
- [marketplace-assets/demo](./marketplace-assets/demo)

Included:

- icon exports for marketplace upload
- screenshot set and recommended order
- demo order and voiceover script

## Suggested Release Flow

1. Review the [submission checklist](./marketplace-docs/marketplace-submission-checklist.md)
2. Prepare marketplace form values from [marketplace-submission-fields.md](./marketplace-docs/marketplace-submission-fields.md)
3. Finalize the listing copy from [marketplace-copy.md](./marketplace-docs/marketplace-copy.md)
4. Choose icon and screenshots from [marketplace-assets](./marketplace-assets)
5. Run the clean-environment test one more time
6. Package and submit the release candidate

## License

This repository is distributed under the MIT License. See [LICENSE](./LICENSE).
