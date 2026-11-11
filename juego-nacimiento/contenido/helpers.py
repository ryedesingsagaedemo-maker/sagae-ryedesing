"""Ayudas para escribir niveles con comprobaciones contra los textos verificados (versiculos.py)."""
import unicodedata
from versiculos import V


def _n(t):
    t = unicodedata.normalize('NFD', t)
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return ' '.join(t.lower().replace('¿', '').replace('¡', '').split())


def L(*ks):
    for k in ks:
        assert k in V, f'Lectura sin verificar: {k}'
    return [{'cita': k, 'texto': V[k]} for k in ks]


def MEM(cita, texto):
    assert cita in V, f'Memoriza sin verificar: {cita}'
    assert _n(texto.rstrip('.')) in _n(V[cita]), f'Memoriza no coincide con {cita}: {texto}'
    return {'cita': cita, 'texto': texto}


def O(p, ops, r, cita, ex=''):
    assert 0 <= r < len(ops)
    return {'tipo': 'opcion', 'pregunta': p, 'opciones': ops, 'respuesta': r, 'cita': cita, 'explicacion': ex}


def C(p, resp, cita):
    if cita in V:
        assert _n(resp) in _n(V[cita]), f'Respuesta "{resp}" no está en {cita}'
    return {'tipo': 'completar', 'pregunta': p, 'respuesta': resp, 'cita': cita}


def R(p, orden, cita):
    ev = orden[1:] + orden[:1]  # se baraja en pantalla; esto solo evita mostrar el orden correcto
    return {'tipo': 'ordenar', 'pregunta': p, 'eventos': ev, 'orden_correcto': orden, 'cita': cita}


def M(p, mapa, ops, resp, cita, ex=''):
    assert resp in ops
    return {'tipo': 'mapa', 'mapa': mapa, 'pregunta': p, 'opciones': ops, 'respuesta': resp, 'cita': cita, 'explicacion': ex}


def DEV(lect, ctx, tit, pts, concl, apl, mem, exp, cap=None, capt=None, por=None, nota=None):
    d = {'lectura': L(*lect), 'contexto': ctx,
         'predicacion': {'titulo': tit, 'puntos': [{'titulo': a, 'texto': b, 'cita': c} for a, b, c in pts], 'conclusion': concl},
         'aplicaciones': apl, 'memoriza': MEM(*mem), 'expresa': exp}
    if cap:
        d['capsula'] = cap
        d['capsula_titulo'] = capt
    if por:
        d['porque'] = {'tipo': por[0], 'texto': por[1]}
    if nota:
        d['nota'] = nota
    return d


def NIVEL(id, titulo, pasajes, preguntas, aplicacion, dev):
    return {'id': id, 'titulo': titulo, 'pasajes': pasajes, 'preguntas': preguntas, 'aplicacion': aplicacion, 'devocional': dev}
