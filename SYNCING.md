# WillowV2 and WillowV2.0

## Publish both local and public versions

From either local project, use:

```sh
npm run publish:both -- "Describe the changes"
```

The command builds, commits, and pushes the WillowV2 source; starts and waits for
the V2.0 sync; pulls the synced commit into the local WillowV2.0 folder; and checks
that both Vercel production deployments are READY for their exact commits. Both
local folders must be on `main` and linked to their respective Vercel projects.
GitHub CLI and Vercel CLI authentication are required. Local V2.0 application edits
must be preserved or integrated before publishing; conflicting local files are
never overwritten. Unrelated editor and local deployment files remain local.

The public sites are https://willow-v2.vercel.app and
https://willow-v2-0.vercel.app. Both Vercel projects are connected to their GitHub
repositories' `main` branches. WillowV2 deploys through its Git integration;
after syncing, V2.0 explicitly starts a deployment using its production deploy
hook, so publication does not depend on GitHub emitting a push event for bot commits.
This command verifies deployment completion instead of assuming that a push
means a public release succeeded.

## Background repository sync

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

`WILLOW_V20_DEPLOY_HOOK` is an encrypted Actions secret in WillowV2.0. It can
trigger production builds of that Vercel project's `main` branch; it grants no
repository write access or general Vercel API access. The sync workflow invokes
it after changed syncs and manual runs. The publishing command then waits for
both exact commits to reach READY in Vercel. This secret is configured separately
from committed files and must not be printed or committed.

GitHub's built-in token cannot modify workflow definitions. The local publishing
command therefore copies and pushes `.github/workflows/` using the existing local
GitHub sign-in before starting the sync. Background sync preserves that directory.
Use `publish:both` when changing workflow definitions as well as application code.

This sync covers committed files. Local `.env` files, Vercel project settings,
production secrets, databases, and hosting configuration are managed separately.
