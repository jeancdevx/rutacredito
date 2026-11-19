"""Extract non-personal Office sources using only Python's standard library.

Usage: python3 scripts/extract_sources.py [source-directory] [output-directory]
Originals are never copied into public/. Formula and cached values are retained.
"""
import json
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else 'docs/Umbral_Dovi_Final')
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else '/tmp/rutacreditos-extraction')
OUT.mkdir(parents=True, exist_ok=True)
N = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
     'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
     'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}

for path in sorted(ROOT.iterdir()):
    if path.suffix not in ('.xlsx', '.docx', '.pptx'):
        continue
    z = zipfile.ZipFile(path)
    data = []
    if path.suffix == '.xlsx':
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            shared = [''.join(x.itertext()) for x in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        rels = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        for sheet in wb.find('s:sheets', N):
            rid = sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
            target = rels[rid]
            target = target.lstrip('/') if target.startswith('/') else 'xl/' + target
            xml = ET.fromstring(z.read(target))
            rows = []
            for row in xml.findall('.//s:row', N):
                cells = {}
                for c in row:
                    v = c.find('s:v', N)
                    value = v.text if v is not None else ''.join(c.find('s:is', N).itertext()) if c.find('s:is', N) is not None else ''
                    if c.attrib.get('t') == 's' and value:
                        value = shared[int(value)]
                    formula = c.find('s:f', N)
                    if value or formula is not None:
                        cells[c.attrib['r']] = {'value': value, 'formula': formula.text if formula is not None else None}
                if cells:
                    rows.append(cells)
            data.append({'sheet': sheet.attrib['name'], 'rows': rows,
                         'merges': [m.attrib['ref'] for m in xml.findall('.//s:mergeCell', N)]})
    elif path.suffix == '.docx':
        xml = ET.fromstring(z.read('word/document.xml'))
        for i, table in enumerate(xml.findall('.//w:tbl', N)):
            rows = [[ ' '.join(t.text or '' for t in c.findall('.//w:t', N)) for c in r.findall('w:tc', N)] for r in table.findall('w:tr', N)]
            data.append({'table': i, 'rows': rows})
        data.append({'paragraphs': [' '.join(t.text or '' for t in p.findall('.//w:t', N)) for p in xml.findall('.//w:p', N)]})
    else:
        for name in sorted(z.namelist()):
            if name.startswith('ppt/slides/slide') and name.endswith('.xml'):
                data.append({'slide': name, 'text': [t.text for t in ET.fromstring(z.read(name)).findall('.//a:t', N)]})
    (OUT / (path.stem + '.json')).write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(path.name, '→', len(data), 'tables/sheets/slides')
