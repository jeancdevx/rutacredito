"""Build reviewed catalog. Run extract_sources.py first; no personal sources read."""
import csv
import hashlib
import json
import re
from pathlib import Path

SRC = Path('docs/Umbral_Dovi_Final')
OUT = Path('src/data')
rows = list(csv.DictReader((OUT / 'isia-2025-reviewed.csv').open()))
extracted = Path('/tmp/rutacreditos-extraction')
doc = json.loads((extracted / '1 Ingeniería de Sistemas e Inteligencia Artificial v17.json').read_text())
matrix = json.loads((extracted / 'Instrumento malla 2025.json').read_text())[1]['rows']
normalize = lambda s: re.sub(r'\s+', '', s).upper()
origin_meta = {}
for r in doc[8]['rows']:
    if len(r) > 8 and re.fullmatch(r'[A-Z]+-\d+', normalize(r[1])):
        code = normalize(r[1])
        if code not in origin_meta:
            origin_meta[code] = {'name': r[2].strip(), 'credits': float(r[3]) if r[3].strip().isdigit() else None}

sources = [
    {'id':'coding','title':'Codificación currículo ISIA-2025.pdf','version':'Inicio 202510; referencia a Resolución AU N.º 4-2024-AU-UPAO','scope':'Catálogo ISIA, requisitos y correspondencias ICSI 202220','sha256':hashlib.sha256((SRC/'Codificación currículo ISIA-2025.pdf').read_bytes()).hexdigest()},
    {'id':'docx17','title':'1 Ingeniería de Sistemas e Inteligencia Artificial v17.docx','version':'Propuesta, versión de archivo 17; aprobación independiente no acreditada','scope':'Contraste: tablas 5C, 5E y sumillas; no reemplaza las filas del PDF','sha256':hashlib.sha256((SRC/'1 Ingeniería de Sistemas e Inteligencia Artificial v17.docx').read_bytes()).hexdigest()},
    {'id':'instrument','title':'Instrumento malla 2025.xlsx','version':'Matrices 2015, 2019, 2022 y 2025','scope':'Sección PLAN 2022, filas 136–199; las hojas de ejemplos NO son reglas','sha256':hashlib.sha256((SRC/'Instrumento malla 2025.xlsx').read_bytes()).hexdigest()},
    {'id':'malla13','title':'Malla Sistemas e IA v13.xlsx','version':'Plan de estudios 2025-10; v13','scope':'Contraste visual y de fórmulas; versión distinta del PDF','sha256':hashlib.sha256((SRC/'Malla Sistemas e IA v13.xlsx').read_bytes()).hexdigest()},
    {'id':'meeting','title':'ISIA Reunión con estudiantes 04_12_2024.pptx','version':'4 diciembre 2024','scope':'Implementación, diapositivas 13–14; créditos de malla de ingreso','sha256':hashlib.sha256((SRC/'ISIA Reunión con estudiantes 04_12_2024.pptx').read_bytes()).hexdigest()}
]
issues = [
 ('AC-01','ISIA-106','coding','p. 1, fila 30; DOCX tabla 5C, fila 25','prerequisite','Código ISIA-103 corresponde a Sistemas empresariales; el nombre indica Estadística para ingenieros (ISIA-101).','Pendiente de confirmación académica; regla no verificable.'),
 ('AC-02','ISIA-125','coding','p. 2, filas 56–57; DOCX tabla 5C, filas 57–59','credits,requirements','PDF: Tesis II 2 + Trabajo de investigación 1. DOCX y XLSX: Tesis II 3, sin esa fila separada.','Se conserva completa la versión PDF, sin mezclar créditos.'),
 ('AC-03','ISIA-123','coding','p. 2, filas 54–55; DOCX sumillas Taller integrador I y Prácticas','prerequisite','Todo octavo ciclo no define si exige solo ciclo VIII o todos los anteriores; la sumilla dice hasta el octavo inclusive.','Alcance sin resolver; no se elige una interpretación de otra versión.'),
 ('AC-04',None,'meeting','diapositiva 14; codificación p. 3','graduation,credits','Se exige cumplir créditos de malla de ingreso; 205 es el total de destino, no un saldo individual de transición.','Sin certificación de egreso. Origen parcial y destino separados.'),
 ('AC-05','ISIA-134','coding','p. 2, fila 57','prerequisite','De la 1 a la 54 refiere a filas de este documento, no a números de códigos ni comparación genérica de ciclos.','Conjunto explícito de las primeras 54 filas obligatorias de esta versión.'),
 ('AC-06',None,'coding','p. 2, celdas fusionadas 59 y 60; p. 3','electiveGroup','Siete opciones electivas, pero dos cupos. Fila 59: 127–129; fila 60: 130–133.','Un curso de 4 créditos por grupo. Recuento total: 197 obligatorios + 8 electivos = 205.'),
 ('AC-07','CIEN-768','coding','p. 1, fila 11; DOCX sumilla Física I','prerequisite','Casilla de prerrequisito vacía; sumilla menciona Álgebra matricial. Otras casillas vacías tampoco dicen Ninguno.','Casilla vacía se conserva como no verificable; no se elimina dependencia.'),
 ('AC-08',None,'instrument','Matrices, filas 148,151,159; DOCX tabla 5E','equivalence','Diferencias de códigos en Estadística descriptiva (651/655), Procesos (516/519) y Vigencia (1027/1012).','Correspondencias alternativas conservadas como pendientes, nunca reconocimiento automático.'),
 ('AC-09',None,'coding','encabezado p. 1 y columna derecha','originCoverage','La columna ICSI no es la malla de origen completa ni describe todos sus prerrequisitos.','ICSI 2022 solo catálogo parcial para historial y transición; no planificable como plan completo.'),
 ('AC-10',None,'coding','p. 1 filas 1–6 y casillas de requisito vacías restantes','prerequisite','Ninguno es explícito en las primeras seis filas; una celda en blanco no aporta la misma evidencia.','Las demás ausencias quedan por verificar, aunque haya sumillas de propuesta que sugieran Ninguno.'),
 ('AC-11',None,'docx17','tabla 5C y sumillas Percepción, Modelos generativos, PLN, Tesis I, UX/UI','prerequisite','Hay diferencias internas en requisitos entre tablas y sumillas, además de la versión PDF.','Se preservan como versiones de contraste; no se mezclan para fabricar una versión nueva.')
]
issues = [dict(zip(['id','courseCode','sourceId','location','fields','description','resolution'],x)) for x in issues]
courses = []
for r in rows:
    page = 1 if int(r['row']) <= 34 else 3 if r['code']=='ISIA-133' else 2
    evidence = [{'sourceId':'coding','location':f"p. {page}, fila {r['row']}, {r['code']}"}]
    prereq = r['prerequisite']
    if prereq == 'NONE': rule={'kind':'none'}
    elif prereq in ('BLANK','CONFLICT','OCTAVO'):
        reason = {'BLANK':'La casilla está vacía; no documenta ausencia de prerrequisitos (AC-10).','CONFLICT':'Conflicto entre código ISIA-103 y nombre Estadística para ingenieros (AC-01).','OCTAVO':'El alcance de «todo octavo ciclo» requiere confirmación (AC-03).'}[prereq]
        rule={'kind':'unknown','reason':reason,'references':['ISIA-103','ISIA-101'] if prereq=='CONFLICT' else []}
    elif prereq=='ROWS1TO54': rule={'kind':'set','courses':[x['code'] for x in rows if int(x['row'])<=54]}
    else:
        parts=[{'kind':'pass','course':c} for c in prereq.split('+')]
        rule=parts[0] if len(parts)==1 else {'kind':'and','rules':parts}
    courses.append({'id':'isia2025:'+r['code'],'planId':'isia-2025','code':r['code'],'originalCode':r['code'].replace('-',' '),'name':r['name'],'cycle':int(r['cycle']),'credits':int(r['credits']),'required':not r['group'],'electiveGroup':r['group'] or None,'row':int(r['row']),'prerequisite':dict(rule,evidence=evidence),'sources':{'code':evidence,'name':evidence,'credits':evidence,'cycle':evidence,'requirement':evidence}})
# Origin rows come from the PDF correspondence; verified source credits only when
# the independent DOCX identifies that same source code unambiguously.
origins={}
eqs=[]
for r in rows:
    if not r['origin']: continue
    meta=origin_meta.get(r['origin'],{})
    sourceName=meta.get('name') or next((x.get('F'+re.sub(r'\D','',next(iter(x))),{}).get('value') for x in matrix if any(v['value'].replace(' ','')==r['origin'] for k,v in x.items() if k.startswith('E'))),None) or r['origin']
    # CIEN-655 is duplicated/conflicted in DOCX: do not borrow its source credits.
    credit=None if r['origin']=='CIEN-655' else meta.get('credits')
    origins[r['origin']]={'planId':'icsi-2022','code':r['origin'],'name':sourceName,'credits':credit,'evidence':[{'sourceId':'coding','location':f"columna ICSI, correspondencia con {r['code']}"}]+([{'sourceId':'docx17','location':'tabla 5E, columna créditos de origen'}] if credit is not None else [])}
    pending=r['origin'] in ('CIEN-651','ICSI-516','HUMA-1027')
    eqs.append({'id':'eq2022:'+r['origin']+':'+r['code'],'fromPlan':'icsi-2022','toPlan':'isia-2025','from':[r['origin']],'to':[r['code']],'type':'documented-correspondence','verification':'pending' if pending else 'documented','conditions':'Requiere aprobación de origen y declaración de reconocimiento individual; la tabla no acredita convalidación personal.','evidence':[{'sourceId':'coding','location':f"fila {r['row']}, columnas ICSI → ISIA"}]})
# Preserve alternate 2022 correspondences without silently replacing the PDF.
for source,target in [('CIEN-655','ISIA-101'),('ICSI-519','ICSI-672'),('HUMA-1012','HUMA-1183')]:
    meta=origin_meta.get(source,{})
    if source not in origins: origins[source]={'planId':'icsi-2022','code':source,'name':meta.get('name',source),'credits':None if source=='CIEN-655' else meta.get('credits'),'evidence':[{'sourceId':'docx17','location':'tabla 5E; incidencia AC-08'}]}
    eqs.append({'id':'eq-alt:'+source+':'+target,'fromPlan':'icsi-2022','toPlan':'isia-2025','from':[source],'to':[target],'type':'documented-correspondence','verification':'pending','conditions':'Código o nombre contradictorio entre fuentes. Requiere revisión individual (AC-08).','evidence':[{'sourceId':'docx17','location':'tabla 5E; AC-08'}]})
# Preserve ICSI 2022 origin courses documented in Instrumento malla 2025.xlsx
# (Identificando equivalencias) that have no direct ISIA 2025 equivalent (#N/A).
# Credits stay null so each student's report credits are preserved verbatim.
for code,name,cell in [
    ('CIEN-532','Física general','E16'),
    ('HUMA-1021','Psicología y desarrollo humano','E25'),
    ('HUMA-641','Actividad formativa II: Apreciación musical','E26'),
    ('HUMA-1025','Ética y valores','E32'),
    ('HUMA-679','Actividad formativa III: Apreciación de artes plásticas','E33'),
    ('HUMA-903','Filosofía de la ciencia','E34'),
    ('ICSI-512','Paradigmas de programación','E39')
]:
    if code not in origins:
        origins[code]={'planId':'icsi-2022','code':code,'name':name,'credits':None,'evidence':[{'sourceId':'instrument','location':f'Identificando equivalencias, celda {cell} (sin equivalencia directa en ISIA 2025)'}]}
plan={'id':'isia-2025','program':'Ingeniería de Sistemas e Inteligencia Artificial','version':'Codificación 2025 · PDF','effectiveFrom':'202510','coverage':'catalog-complete-rules-partial','totalCredits':205,'graduationVerified':False,'sources':['coding'],'groups':[{'id':'electivo-1','name':'Electivo I','slots':1,'creditsPerSlot':4,'evidence':[{'sourceId':'coding','location':'p. 2, celda fusionada 59'}]},{'id':'electivo-2','name':'Electivo II','slots':1,'creditsPerSlot':4,'evidence':[{'sourceId':'coding','location':'p. 2–3, celda fusionada 60'}]}]}
catalog={'schemaVersion':1,'version':'2026-11-17.1','reviewedAt':'2026-11-17','plans':[plan],'courses':courses,'originPlans':[{'id':'icsi-2022','program':'Ingeniería de Computación y Sistemas','version':'Referencia 202220 en codificación y tabla 5E','effectiveFrom':'202220','effectiveUntil':None,'coverage':'partial','totalCredits':None,'sources':['coding','docx17','instrument']}],'origins':list(origins.values()),'equivalences':eqs,'sources':sources,'issues':issues}
(OUT/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
print(len(courses),'courses;',sum(c['credits'] for c in courses if c['required']),'+ 8 = 205 credits;',len(eqs),'correspondences;',len(issues),'issues')
