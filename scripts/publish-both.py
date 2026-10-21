"""Publish the source and variant, then verify both local and production versions."""

import json
from pathlib import Path
import re
import subprocess
import sys
import time


OWNER = 'claudialeavens'
SCOPE = 'claudialeavens-5404s-projects'
WORKFLOW = 'sync-willow-variant.yml'


def run(args, cwd, capture=False):
    result = subprocess.run(args, cwd=cwd, check=True, text=True,
                            stdout=subprocess.PIPE if capture else None)
    return result.stdout.strip() if capture else None


def git(project, *args, capture=False):
    return run(['git', *args], project, capture)


def validate_checkout(project, repository):
    if not (project / '.git').exists():
        raise RuntimeError(f'Missing local repository: {project}')
    remote = git(project, 'remote', 'get-url', 'origin', capture=True)
    if not remote.removesuffix('.git').endswith(f'{OWNER}/{repository}'):
        raise RuntimeError(f'Unexpected origin for {project}: {remote}')
    if git(project, 'branch', '--show-current', capture=True) != 'main':
        raise RuntimeError(f'{project} must be on main before publishing')
    if git(project, 'ls-files', '-u', capture=True):
        raise RuntimeError(f'Resolve the merge conflicts in {project} first')
    link = project / '.vercel' / 'project.json'
    if not link.exists():
        raise RuntimeError(f'Link {project} to its Vercel project first')
    return json.loads(link.read_text())


def wait_for_production(project, link, sha):
    endpoint = f'/v6/deployments?projectId={link["projectId"]}&target=production&limit=30'
    deadline = time.monotonic() + 600
    print(f'Waiting for {link["projectName"]} production at {sha[:7]}...', flush=True)
    while time.monotonic() < deadline:
        data = json.loads(run(['npx', '--yes', 'vercel', 'api', endpoint,
                               '--scope', SCOPE], project, capture=True))
        deployments = [d for d in data.get('deployments', [])
                       if d.get('meta', {}).get('githubCommitSha') == sha]
        if deployments:
            deployment = deployments[0]
            state = deployment.get('state', deployment.get('readyState'))
            if state == 'READY':
                print(f'READY: https://{link["projectName"]}.vercel.app ({sha[:7]})', flush=True)
                return
            if state in ('ERROR', 'CANCELED'):
                raise RuntimeError(f'{link["projectName"]} deployment {state}: '
                                   f'https://{deployment["url"]}')
        time.sleep(10)
    raise RuntimeError(f'Timed out waiting for {link["projectName"]} at {sha[:7]}. '
                       'Check the Vercel Git connection and build logs.')


def main():
    here = Path(__file__).resolve().parents[1]
    source = here if here.name == 'WillowV2' else here.with_name('WillowV2')
    variant = source.with_name('WillowV2.0')
    source_link = validate_checkout(source, 'WillowV2')
    variant_link = validate_checkout(variant, 'WillowV2.0')
    if source_link['projectName'] != 'willow-v2' or variant_link['projectName'] != 'willow-v2-0':
        raise RuntimeError('Unexpected Vercel project links; refusing to publish')
    if len(sys.argv) < 2 or not ' '.join(sys.argv[1:]).strip():
        raise RuntimeError('Supply a commit message: npm run publish:both -- "Your changes"')
    application_paths = ['src', 'public', 'index.html', 'package.json', 'package-lock.json']
    if git(variant, 'status', '--porcelain', '--', *application_paths, capture=True):
        raise RuntimeError('Preserve or integrate local WillowV2.0 application edits before syncing.')

    # Refuse divergence before staging or committing the source changes.
    git(source, 'fetch', 'origin', 'main')
    if git(source, 'rev-list', '--count', 'HEAD..origin/main', capture=True) != '0':
        raise RuntimeError('Local WillowV2 is behind origin/main. Integrate remote changes first.')
    run(['npm', 'run', 'build'], source)
    git(source, 'add', '-A')
    changed = subprocess.run(['git', 'diff', '--cached', '--quiet'], cwd=source)
    if changed.returncode == 1:
        git(source, 'commit', '-m', ' '.join(sys.argv[1:]))
    elif changed.returncode != 0:
        raise RuntimeError('Could not inspect staged changes')
    source_sha = git(source, 'rev-parse', 'HEAD', capture=True)
    git(source, 'push', 'origin', 'main')

    print('Running the WillowV2.0 sync...', flush=True)
    output = run(['gh', 'workflow', 'run', WORKFLOW, '--repo', f'{OWNER}/WillowV2.0',
                  '--ref', 'main'], source, capture=True)
    print(output, flush=True)
    match = re.search(r'/actions/runs/(\d+)', output)
    if not match:
        raise RuntimeError('GitHub did not return a workflow run URL. Check the Actions tab.')
    run(['gh', 'run', 'watch', match.group(1), '--repo', f'{OWNER}/WillowV2.0',
         '--exit-status', '--interval', '5'], source)

    # Git refuses a pull that would overwrite local edits or diverging commits.
    git(variant, 'pull', '--ff-only', 'origin', 'main')
    variant_sha = git(variant, 'rev-parse', 'HEAD', capture=True)
    settings = json.loads((variant / 'src' / 'willowVariant.json').read_text())
    if settings.get('showPromptGuidance') is not False:
        raise RuntimeError('WillowV2.0 guidance setting was not preserved')
    if git(variant, 'status', '--porcelain', '--', *application_paths, capture=True):
        raise RuntimeError('Local V2.0 application files changed during publishing')
    source_tree = git(source, 'ls-tree', '-r', 'HEAD', capture=True).splitlines()
    variant_tree = git(variant, 'ls-tree', '-r', 'HEAD', capture=True).splitlines()
    without_setting = lambda lines: [line for line in lines
                                     if not line.endswith('\tsrc/willowVariant.json')]
    if without_setting(source_tree) != without_setting(variant_tree):
        raise RuntimeError('The repositories differ beyond the expected guidance setting. '
                           'Another source update may have arrived; rerun publishing.')
    wait_for_production(source, source_link, source_sha)
    wait_for_production(variant, variant_link, variant_sha)
    print('Both local copies, GitHub repositories, and Vercel production versions are current.',
          flush=True)


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError) as error:
        print(f'Publishing stopped: {error}', file=sys.stderr)
        sys.exit(1)
