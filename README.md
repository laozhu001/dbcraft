# DB Craft

DB Craft is a local visual database modeling workspace for designing tables and relationships, generating SQL, and preparing handoff-ready artifacts for Codex or downstream migration workflows.

It is designed for people who want a faster and more concrete path from idea to schema:

- model tables visually
- keep the current project diagram in sync
- export SQL quickly
- hand off unfinished AI tasks to Codex when needed

## Highlights

- Visual schema design for MySQL 8, PostgreSQL 14, SQLite, and MSSQL
- Manual table creation, AI-assisted table drafting, and SQL-based table import
- Syntax checking and SQL export
- Project-aware model persistence
- Send-to-Codex handoff flow
- Marketplace-ready docs and release assets

## Repository Layout

### Marketplace Docs

The marketplace-facing documents live under:

- [marketplace-docs](./marketplace-docs)

Start here if you want release guidance or listing copy:

- [Marketplace Copy](./marketplace-docs/marketplace-copy.md)
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
2. Finalize the listing copy from [marketplace-copy.md](./marketplace-docs/marketplace-copy.md)
3. Choose icon and screenshots from [marketplace-assets](./marketplace-assets)
4. Run the clean-environment test one more time
5. Package and submit the release candidate

## License

This repository is distributed under the MIT License. See [LICENSE](./LICENSE).
