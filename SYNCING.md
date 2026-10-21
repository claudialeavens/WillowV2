# WillowV2 and WillowV2.0

WillowV2 is the source for both repositories. The **Sync WillowV2.0** GitHub
Actions workflow in WillowV2.0 checks WillowV2's `main` branch on a five-minute
schedule. GitHub may delay scheduled runs, so syncing is not immediate.
The workflow copies the current source into WillowV2.0, sets
`showPromptGuidance` to `false` in
`src/willowVariant.json`, verifies the production build, and pushes a normal
commit to WillowV2.0's `main` branch.
Runs with no source changes skip dependency installation, building, and committing.

Make shared changes in WillowV2. Direct changes in WillowV2.0 are overwritten
by the next sync. Deleted source files are also deleted in the copy. The
repositories retain separate commit histories; the sync never force-pushes.

The workflow only runs in WillowV2.0, even though its files are also stored in
WillowV2. It can also be started manually from WillowV2.0's Actions tab. Failed
builds leave WillowV2.0's published source at its last successful sync.

The workflow reads the public WillowV2 repository and writes only to
WillowV2.0 using GitHub's temporary built-in `GITHUB_TOKEN`. It requires no
personal access token or persistent cross-repository deploy key. GitHub disables
scheduled workflows in public repositories after 60 days without activity; if
that happens, re-enable this workflow in WillowV2.0's Actions tab.

GitHub does not trigger other Actions workflows for commits pushed using
`GITHUB_TOKEN`. If hosting relies on a separate GitHub Actions deployment
workflow, invoke that deployment explicitly after syncing.

This sync covers committed files. Local `.env` files, Vercel project settings,
production secrets, databases, and hosting configuration are managed separately.
