# Clean Environment Self-Test Report

Date: 2026-03-14

## Environment

- OS: Windows
- Test machine: current maintainer machine, with browser storage manually cleared before validation
- Package:
  - `dbcraft-marketplace-submission.zip`

## Summary

- Overall result: Partial pass
- Ready for marketplace packaging: Yes
- Recommended before final submission: run one more test on a second clean Windows machine or a brand-new browser profile

## Results

1. Submission ZIP exists and can be read: PASS
2. ZIP contains the expected top-level content groups: PASS
3. DB Craft can start from a fully stopped state using the packaged launcher: PASS
4. Default first-run UI language is English after clearing browser storage: PASS
5. `AI Config` opens with an empty API key field after clearing browser storage: PASS
6. Help page opens successfully in English: PASS
7. Maintainer API key and local browser AI config were not retained in the tested first-run state: PASS
8. Workspace hint via URL query did not automatically rehydrate the sample workspace in this run: NEEDS FOLLOW-UP

## Evidence

- Launcher output confirmed a fresh start rather than reuse:
  - status: `started`
  - reusedExisting: `false`
- First-run page showed:
  - Language: `English`
  - Current Project: `Not Set`
  - Project Path: `Not Filled`
- AI Config showed:
  - Default model name present
  - Base URL empty
  - API key empty

## Remaining Risk

- The `workspacePath` / `workspaceName` URL hint did not populate the workspace on the clean-state browser reload used in this test.
- This is not a privacy blocker, but it is a first-run convenience issue worth rechecking before public release.

## Recommendation

1. Keep the package as the current release candidate.
2. Perform one final verification on a separate Windows machine or a brand-new Chrome profile.
3. If the workspace hint issue reproduces there, treat it as a polish fix rather than a marketplace blocker unless your listing promises automatic sample loading on first run.
