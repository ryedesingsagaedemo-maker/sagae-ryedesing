# SAGAE — Contexto del proyecto

Sistema de gestión de activos e inventario escolar (SAGAE — Sistema de
Activos y Gestión Administrativa Educativa), de RYE Design. Frontend en
HTML/CSS/JS plano (sin build), backend en Google Apps Script + Google
Sheets como base de datos. Ver `.claude/skills/frontend-design/` para
convenciones de diseño.

**El código del backend (Apps Script `Code.gs`) NO vive en este
repositorio a propósito** — se eliminó por decisión explícita del dueño
del proyecto (no quiere el backend en GitHub). Si se necesita ver o
editar el backend real, hay que pedírselo al usuario directamente (lo
pega desde su editor de Apps Script) — no reintroducir una copia en el
repo sin que lo pida.

## Plan de negocio / roadmap — no reabrir esta conversación desde cero

Existe un plan por fases, ya conversado y decidido con el dueño del
proyecto, sobre qué le falta a SAGAE para pasar de "sistema seguro para
una escuela" a "producto vendible a varias instituciones" (arquitectura
multi-cliente, base legal, seguridad de nivel comercial, etc.).

**Está documentado completo en [`docs/PLAN-VENTA-SAGAE.md`](docs/PLAN-VENTA-SAGAE.md).**

Si el usuario pregunta de nuevo "qué necesitaría para vender esto" o
similar, leer ese archivo primero en vez de re-derivar el análisis desde
cero — actualizarlo si la conversación agrega algo nuevo, no duplicarlo
en otro lado.
