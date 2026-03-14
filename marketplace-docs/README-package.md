# DB Craft Marketplace Submission Package

## Purpose

This folder is the final handoff-oriented package for preparing a public marketplace submission for DB Craft.

## Directory Structure

## `01-skill`

Contains the core skill files:

- `SKILL.md`
- `openai.yaml`
- `launch-dbdesigner.ps1`

Use this folder when preparing the actual skill metadata and launcher behavior.

## `02-docs`

Contains the main submission-facing documents:

- `marketplace-copy.md`
- `example-prompts.md`
- `install-prerequisites.md`
- `data-security.md`
- `marketplace-submission-checklist.md`
- `icon-and-screenshot-checklist.md`
- `usage.md`

Use this folder when filling marketplace forms, writing descriptions, or checking release readiness.

## `03-brand`

Contains icon assets:

- `dbcraft-icon-draft.svg`
- `dbcraft-icon-1024.png`
- `dbcraft-icon-512.png`
- `dbcraft-icon-256.png`
- `dbcraft-icon-128.png`

Use this folder for marketplace icon upload and brand review.

## `04-screenshots`

Contains marketplace screenshots and their ordering notes:

- `01-main-workspace.png`
- `02-ai-build.png`
- `03-sync-sql-preview.png`
- `04-send-to-codex.png`
- `05-help-or-multilanguage.png`
- `README.md`
- `marketplace-order.md`

Use this folder when selecting marketplace images and deciding screenshot order.

## `05-demo`

Contains demo planning and narration material:

- `demo-order.md`
- `demo-voiceover.md`

Use this folder when recording a GIF, short promo clip, or narrated walkthrough.

## `06-samples`

Contains reusable sample assets:

- `sample.dbmodel.json`
- `sample.sql`

Use this folder to reproduce screenshots, demos, or review flows.

## Root File

- `LICENSE`

This is the MIT license file that should stay with the submission materials.

## Suggested Submission Workflow

1. Start with `02-docs\\marketplace-submission-checklist.md`
2. Review `02-docs\\marketplace-copy.md`
3. Upload the icon from `03-brand`
4. Upload screenshots from `04-screenshots`
5. Use `05-demo` if the marketplace supports video or GIF
6. Keep `01-skill` ready for the final skill package

## Current Strengths

- documentation is prepared
- icon set is prepared
- screenshot set is prepared
- demo script is prepared
- sample model is prepared

## Main Remaining Risks

- final public-facing de-localization review
- clean-machine startup verification
- any marketplace-specific form fields not yet filled
