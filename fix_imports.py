import os
import re

backend_dir = 'backend'
modules = ['models', 'database', 'resolver', 'impact_engine', 'scenario_engine', 
           'recommendation', 'evidence', 'confidence', 'ai_extractor', 'seed', 
           'seed_data', 'ai_engine', 'fallback_extractor', 'ripple_engine', 'api']
pattern_import = re.compile(r'^(\s*)import (' + '|'.join(modules) + r')\b')
pattern_from = re.compile(r'^(\s*)from (' + '|'.join(modules) + r') import\b')

for root, _, files in os.walk(backend_dir):
    for f in files:
        if f.endswith('.py'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            
            new_content = []
            for line in content.split('\n'):
                m_import = pattern_import.match(line)
                if m_import:
                    mod = m_import.group(2)
                    line = f'{m_import.group(1)}from backend import {mod}'
                
                m_from = pattern_from.match(line)
                if m_from:
                    mod = m_from.group(2)
                    line = pattern_from.sub(rf'\1from backend.\2 import', line)
                    
                new_content.append(line)
                
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write('\n'.join(new_content))
print('Imports updated successfully')
