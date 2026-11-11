"""Genera niveles/datos.js con todos los bloques (1-10), la ruta y los mapas."""
import json, sys
sys.path.insert(0, 'contenido')
from bloques_a import BLOQUES as A
from bloques_b import BLOQUES as B
from ciudades import validar
import genealogias as GEN

dev = json.load(open('contenido/devocionales.json'))
rm = json.load(open('contenido/ruta-mapas.json'))
GR = {'ni': ('ninos', 'Niños (6 a 11 años)'), 'ja': ('jovenes-adultos', 'Jóvenes y adultos')}
grupos = {}
for k, (gid, titulo) in GR.items():
    bloques = [{'id': b['id'], 'num': b['num'], 'titulo': b['titulo'], 'sub': b['sub'], 'niveles': b[k]} for b in A + B]
    b7 = json.load(open(f'niveles/{gid}.json'))
    for n in b7['niveles']:
        n['devocional'] = dev[n['id']]
    b7['niveles'] = (GEN.NIVELES_JA if k == 'ja' else GEN.NIVELES_NI) + b7['niveles']
    bloques.append({'id': 'b7', 'num': 7, 'titulo': 'Los Evangelios: el nacimiento', 'sub': 'Genealogías · Mateo 1–2 · Lucas 1–3', 'niveles': b7['niveles']})
    bloques.sort(key=lambda b: b['num'])
    ids = [n['id'] for b in bloques for n in b['niveles']]
    assert len(ids) == len(set(ids)), 'ids repetidos'
    grupos[gid] = {'grupo': gid, 'titulo': titulo, 'bloques': bloques}
# los lugares usados en preguntas de mapa deben existir y estar en el mapa correcto
for g in grupos.values():
    for b in g['bloques']:
        for n in b['niveles']:
            for q in n['preguntas']:
                if q['tipo'] == 'mapa':
                    for o in q['opciones']:
                        assert o in rm['lugares'], f'Lugar sin coordenadas: {o!r}'
                        assert rm['lugares'][o]['mapa'] == q['mapa'], f'{o!r} no está en el mapa {q["mapa"]}'
ciudades = validar()
# cada lugar del mapa debe tener su ficha
for n in rm['lugares']:
    assert n.strip() in ciudades, f'Lugar sin ficha: {n!r}'
out = {'grupos': grupos, **rm, 'ciudades': ciudades, 'genealogias': GEN.validar()}
open('niveles/datos.js', 'w').write('window.DATOS = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
tot = sum(len(b['niveles']) for g in grupos.values() for b in g['bloques'])
print('datos.js', len(open('niveles/datos.js').read()) // 1024, 'KB ·', tot, 'niveles')
