# Clean Environment Self-Test

Use this checklist before submitting DB Craft to the marketplace. The goal is to verify that a new user on a clean Windows machine can start the app, understand the flow, and avoid inheriting the maintainer's local state.

## Scope

- Platform: Windows
- Runtime: local Node.js available in `PATH`
- Browser: Chromium/Chrome/Edge
- Package under test:
  - `D:\DBdesigner\marketplace-assets\dbcraft-marketplace-submission.zip`

## Pass Criteria

1. The submission ZIP can be opened and contains the expected folders and files.
2. DB Craft starts from a stopped state without requiring a duplicate manual server launch.
3. The first page load works and does not show broken or blank content.
4. The default UI language is English when no language preference is stored.
5. `AI Config` opens with an empty API key field on a clean browser state.
6. The sample model can be opened and the diagram renders.
7. Help and SQL-preview-related flows are reachable without obvious errors.

## Test Steps

1. Delete or clear browser storage for `http://127.0.0.1:3000`.
2. Make sure no previous DB Craft service is listening on port `3000`.
3. Confirm the submission ZIP exists and can be extracted.
4. Confirm the extracted package includes:
   - `01-skill`
   - `02-docs`
   - `03-brand`
   - `04-screenshots`
   - `05-demo`
   - `06-samples`
   - `LICENSE`
   - `README.md`
5. Start DB Craft from a stopped state.
6. Open `http://127.0.0.1:3000`.
7. Verify the page title and top banner render correctly.
8. Verify English is the default language after clearing browser storage.
9. Open `AI Config` and verify:
   - model field has a default model name
   - Base URL is empty
   - API key field is empty
10. Open the help page and confirm it loads.
11. Confirm the sample model renders tables and relations.
12. Record any blocker, broken text, or stale personal/local state that still appears.

## Notes

- This test should be rerun after any packaging or privacy-related change.
- If the machine already has a previous DB Craft session, clearing browser storage is mandatory before judging first-run behavior.
- If a full second Windows machine is available, prefer that for the final release gate.
