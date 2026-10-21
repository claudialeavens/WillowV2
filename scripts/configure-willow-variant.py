"""Apply the sole WillowV2.0 application override after copying WillowV2."""

import json
from pathlib import Path
import sys


def configure_variant(project):
    settings_file = Path(project) / 'src' / 'willowVariant.json'
    settings = json.loads(settings_file.read_text())
    if not isinstance(settings.get('showPromptGuidance'), bool):
        raise ValueError('Expected a boolean showPromptGuidance setting')
    settings['showPromptGuidance'] = False
    settings_file.write_text(json.dumps(settings, indent=2) + '\n')


if __name__ == '__main__':
    configure_variant(sys.argv[1])
