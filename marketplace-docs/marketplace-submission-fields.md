# DB Craft Marketplace Submission Fields

This file turns the existing release materials into marketplace-ready form values.

## Core Identity

- Product name: `DB Craft`
- Skill name / slug: `dbcraft`
- Version label: `V1.0`
- License: `MIT`

## One-Line Tagline

`Visual schema design, SQL export, and Codex-ready handoff.`

## Short Description

`Design database tables visually, validate structure, save reusable models, and export SQL for MySQL, PostgreSQL, SQLite, and MSSQL.`

## Full Description

`DB Craft is a local visual database modeling workspace for users who want a faster and clearer workflow than writing schema notes by hand. It helps users create or edit tables, shape relationships, import CREATE TABLE scripts, generate tables with AI, validate the design, and export SQL when the model is ready.`

`DB Craft is especially useful when a team wants to sketch a schema before implementation, evolve a model over time, keep reusable model files together with exported SQL, or hand off structured schema work to Codex or downstream migration workflows.`

## Key Selling Points

- Visual schema design instead of manual note-taking
- Supports MySQL 8, PostgreSQL 14, SQLite, and MSSQL
- AI-assisted table generation from natural language
- Import from existing CREATE TABLE SQL
- Save reusable `.dbmodel.json` models
- Export SQL for downstream engineering workflows
- Send-to-Codex handoff support

## Best For

- Backend engineers designing new tables
- Full-stack developers aligning schema and application work
- Technical leads reviewing relationships and structure before implementation
- Product-minded builders who prefer a visual modeling flow

## Platform And Runtime

- Supported OS: `Windows`
- Runtime dependency: `Node.js`
- Launch model: local service opened in a browser

## Data And Security Summary

- DB Craft is a local tool, not a hosted SaaS product
- Model files, SQL exports, and Codex handoff files are written to the active local workspace
- AI Build may send prompts to the user-configured model provider
- Users should use and manage their own API keys
- Public positioning should avoid implying silent cloud sync or automatic live database execution

## Positioning Guardrails

- Present DB Craft as a design-to-SQL tool
- Do not present it as a database execution or migration runner
- Mention Codex handoff as an optional continuation path, not the only workflow
- Mention local-first behavior when describing storage or privacy

## Submission Asset Mapping

- Icon:
  - `marketplace-assets/brand/dbcraft-icon-1024.png`
- Primary screenshots:
  - `marketplace-assets/screenshots/01-main-workspace.png`
  - `marketplace-assets/screenshots/02-ai-build.png`
  - `marketplace-assets/screenshots/03-sync-sql-preview.png`
- Supporting screenshots:
  - `marketplace-assets/screenshots/04-send-to-codex.png`
  - `marketplace-assets/screenshots/05-help-or-multilanguage.png`

## Suggested Categories

- Developer Tools
- Database
- Productivity

## Suggested Keywords

- database design
- schema modeling
- SQL export
- ERD
- AI table generation
- Codex handoff

## Recommended Final Checks Before Submission

1. Re-read `marketplace-submission-checklist.md`
2. Re-run the clean environment self-test
3. Confirm screenshots do not expose private local data
4. Confirm the icon and description match the current UI branding
