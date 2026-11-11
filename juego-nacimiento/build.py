"""Genera niveles/datos.js a partir de los JSON de niveles/ y contenido/."""
import json
dev=json.load(open('contenido/devocionales.json'))
rm=json.load(open('contenido/ruta-mapas.json'))
grupos={}
for f in ['ninos','jovenes-adultos']:
    d=json.load(open(f'niveles/{f}.json'))
    for n in d['niveles']:
        n['devocional']=dev[n['id']]
    grupos[f]=d
out={'grupos':grupos,**rm}
open('niveles/datos.js','w').write('window.DATOS = '+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
print('datos.js', len(open('niveles/datos.js').read())//1024,'KB')
