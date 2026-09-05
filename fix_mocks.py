import os
for root, _, files in os.walk('backend'):
    for f in files:
        if f.startswith('test_') and f.endswith('.py'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            content = content.replace("patch('ai_extractor", "patch('backend.ai_extractor")
            content = content.replace("patch(\"ai_extractor", "patch(\"backend.ai_extractor")
            content = content.replace('import ai_extractor', 'from backend import ai_extractor')
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write(content)
