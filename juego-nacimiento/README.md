# Juego bíblico: el nacimiento de Jesucristo · Templo Bíblico Emmanuel

Publicado en: https://juego-nacimiento.vercel.app

## Qué incluye
- **Niveles:** 10 bloques de Génesis a Apocalipsis, 5 niveles por bloque para niños (6-11) y 5 para jóvenes y adultos (100 niveles).
  Cada nivel: cápsula de video (cuando hay), lectura (RVR1960), devocional con contexto y mini predicación, juego
  (opción múltiple, mapa, ordenar, distancias, completar), memoriza, expresa con tus palabras y resultado con estrellas.
- **Ruta de la promesa:** de Génesis 3:15 (tras el pecado de Adán) a Romanos y Apocalipsis 22:16, con un reto para ordenarla.
- **Mapa de viajes:** cada traslado con su motivo (mandato del rey, aviso en sueños, estrella, ángeles, ley),
  la cita, coordenadas aproximadas y distancia en línea recta.
- **Mis notas:** lo que cada persona escribe se guarda en su dispositivo.
- Instalable en el celular (PWA) y usable sin conexión después de la primera visita.

## Archivos
- `contenido/bloques_a.py` (bloques 1-5) y `contenido/bloques_b.py` (bloques 6, 8-10): niveles; `niveles/*.json`: bloque 7.
- `contenido/versiculos.py`: textos RVR1960 verificados; `contenido/helpers.py` comprueba que cada versículo para memorizar
  y cada respuesta de completar aparezcan tal cual en el texto.
- `contenido/devocionales.json`: contexto, lectura, mini predicación, aplicaciones, versículo para memorizar.
- `contenido/ruta-mapas.json`: ruta de la promesa, lugares, viajes y mapas.
- `build.py`: genera `niveles/datos.js` (lo que lee la página). Ejecutar después de editar los JSON.
- `videos/`: cápsulas recortadas del video de las profecías (con el nombre y logo del templo).
- `assets/`: logo, íconos y mapas de pergamino.

## Verificación
Textos bíblicos copiados de la Reina-Valera 1960 (Bible Gateway). Distancias calculadas en línea recta
desde coordenadas aproximadas; el camino real es más largo. Egipto: el texto no dice la ciudad; el mapa usa el
delta del Nilo como referencia. Daniel 9 y Apocalipsis llevan una nota: los intérpretes conservadores difieren en detalles; el juego se limita a lo que el texto afirma.
Pendiente: genealogías (Mt 1:1-17; Lc 3:23-38) y revisión pastoral del contenido.
