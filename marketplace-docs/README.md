# DB Craft Marketplace Docs

This repository contains the documentation set used to prepare the public marketplace release of DB Craft.

DB Craft is a local visual database modeling tool for designing tables and relationships, generating SQL, and handing model context off to Codex when needed.

## What Is Included

- Marketplace positioning and listing copy
- Example prompts for real user workflows
- Installation and prerequisites notes
- Data and security disclosure
- Submission checklist
- Icon and screenshot planning
- Usage notes
- Clean-environment self-test steps and report

## Document Index

- [Marketplace Copy](./marketplace-copy.md)
- [Example Prompts](./example-prompts.md)
- [Install Prerequisites](./install-prerequisites.md)
- [Data Security](./data-security.md)
- [Marketplace Submission Checklist](./marketplace-submission-checklist.md)
- [Icon and Screenshot Checklist](./icon-and-screenshot-checklist.md)
- [Usage Notes](./usage.md)
- [Clean Environment Self-Test](./clean-environment-self-test.md)
- [Clean Environment Self-Test Report](./clean-environment-self-test-report.md)
- [Packaging Notes](./README-package.md)

## Recommended Reading Order

1. Start with [Marketplace Submission Checklist](./marketplace-submission-checklist.md)
2. Review [Marketplace Copy](./marketplace-copy.md)
3. Check [Install Prerequisites](./install-prerequisites.md) and [Data Security](./data-security.md)
4. Review [Example Prompts](./example-prompts.md) and [Usage Notes](./usage.md)
5. Use [Icon and Screenshot Checklist](./icon-and-screenshot-checklist.md) during asset review
6. Finish with the clean-environment validation documents before release

## Release Status

Current state: release candidate documentation set.

Prepared:

- Listing copy
- Prompt examples
- Installation notes
- Data disclosure notes
- Submission checklist
- Clean-environment validation notes

Still worth rechecking before final release:

- One more clean-machine run on a separate Windows environment
- Final marketplace form fields and category selection
- Final asset selection for icon, screenshots, and optional demo media

## Notes

- This repository focuses on marketplace-facing documents, not the full DB Craft application source.
- The application and packaging assets are maintained separately.
- Sensitive local configuration such as browser-saved API keys should never be committed here.
