# Publishing both Willow versions

WillowV2 is the source project. WillowV2.0 is its generated variant with
`src/willowVariant.json` setting `showPromptGuidance` to `false`.

When the user asks to commit, push, publish, or deploy shared changes, finish the
whole flow for both versions. After reviewing the changes, run:

```sh
npm run publish:both -- "Describe the changes"
```

This commits and pushes WillowV2, runs the WillowV2.0 sync, pulls the resulting
commit into the sibling local copy, and verifies that both Vercel production
deployments are READY for the exact repository commits. Do not report publishing
complete after only a Git push. If any step fails, report which local, GitHub, or
production version remains behind.

Make shared edits in WillowV2 even when starting in WillowV2.0. Preserve local
uncommitted work in both folders; never force-push or reset it to get publishing
to succeed. Never commit local environment files or credentials. Vercel settings
and credentials are separate for the two projects.

The scheduled GitHub sync remains a fallback for ordinary pushes from other
machines. A remote push cannot update a local checkout on a disconnected
computer; use the publish command here to keep both local copies current.
