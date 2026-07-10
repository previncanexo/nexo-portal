# Diseño: grilla de profesionales en Psicología On Demand

**Fecha:** 2026-07-10
**Proyecto:** nexo-portal
**Rama:** staging
**Estado:** Implementado en staging (demo). NO apto para producción — ver "Bloqueantes".

## Contexto

El modal de Psicología On Demand mostraba una descripción genérica y un único botón
"Reservar turno" que abría la plataforma externa. Se pide mostrar el equipo profesional
(foto, nombre, botón por profesional) para poder presentar el servicio.

Fuente de los datos: "Psicología on demand · Documentación consolidada · Previnca Nexo · BREAK"
(julio 2026), provista por el cliente.

## El problema de diseño

DOC24 —la plataforma que presta el servicio, bajo la marca "Doctor Previnca"— resuelve la
elección de profesional **dentro de su propio portal de autogestión**. La documentación no
menciona links por profesional, y no está confirmado que existan.

Un botón por psicólogo que lleve a los cinco al mismo destino genérico **le miente al socio**:
promete un atajo a una agenda puntual que no existe.

## Decisión (opción C de tres evaluadas)

Se implementa la grilla con un botón por profesional, pero:

1. Cada profesional tiene un campo opcional `agendaUrl` en la constante `PSICOLOGOS`.
2. Hoy ese campo está vacío para los cinco: el `href` cae por fallback a `PSICOLOGIA_URL`.
3. El aviso al pie lo dice explícitamente: *"El turno se reserva en DOC24, donde elegís al
   profesional y la franja disponible."*

Cuando DOC24 confirme los deep-links, se completan cinco strings. No cambia el componente,
ni el layout, ni el tracking.

Alternativas descartadas:
- **(A) Grilla informativa + un solo CTA.** Más honesta, pero no muestra el botón por profesional
  que el cliente quiere presentar.
- **(B) Botón por profesional sin `agendaUrl`.** Igual de honesta gracias al microcopy, pero
  obliga a rediseñar cuando lleguen los links.

## Equipo profesional (fuente: doc consolidada)

| Profesional | Días | Franja |
|---|---|---|
| Lic. Lorena Reimers | Lunes y Miércoles | 13:30 – 17:30 |
| Lic. Laura Blanco | Martes | 08:30 – 11:00 |
| Lic. María Camila Aragues | Miércoles | 10:00 – 11:30 |
| Lic. Rocío Medina | Jueves | 09:00 – 11:30 |
| Lic. Censo Estigarribia | Viernes | 13:00 – 17:00 |

Turnos de 30 minutos, videoconsulta, turnos programados (no guardia espontánea).

**Nota:** el "resumen general" del cronograma original (21 turnos / 10,5 h semanales) está
desactualizado: no incluye a Reimers. Con los cinco profesionales son **37 turnos / 18,5 h**.
La propia doc del cliente marca esto como "fuente única de agenda: A CONSOLIDAR".

## Fotos

No existen. `public/` no tiene imágenes de profesionales. Se usa un placeholder: círculo con
borde punteado, iniciales y la palabra "foto". Cuando lleguen las imágenes, se reemplaza el
placeholder por `next/image`.

## Fuera de alcance (decidido)

- **Precio.** La doc del cliente lo marca **A DEFINIR**. Los valores $15.000 / $30.000 que
  circulan corresponden al **plan médico general**, no a psicología. No se muestra ningún precio.
  (Existía un `PSICOLOGIA_PRECIO = 30000` en el código; fue removido y NO debe restaurarse.)
- **Tracking por profesional.** `psicologia_clicks` sólo guarda `affiliate_id`. Registrar a qué
  profesional se le hizo clic requiere una migración con una columna nueva. Se difiere hasta que
  el servicio esté definido. Hoy el clic se registra a nivel servicio, como antes.

## Bloqueantes para producción

1. **El link apunta a un entorno de test.** Según la doc (pág. 3), el servicio está configurado en
   `test-doctorprevinca.videoconsultas.app`. `NEXT_PUBLIC_PSICOLOGIA_URL` en staging apunta ahí.
   **No promover a producción hasta que exista el link productivo.**
2. **`NEXT_PUBLIC_PSICOLOGIA_URL` no está seteada en el proyecto Vercel de producción.** Sin ella,
   la card no se renderiza (el código la esconde). Vale lo mismo para `NEXT_PUBLIC_SEGURO_HOGAR_URL`.
3. **Deep-link por profesional: sin confirmar con DOC24.**
4. **Precio y modelo de cobro: sin definir.**

## Estrategia de pruebas

Sin test runner. Verificación: `npx tsc --noEmit` limpio + `npm run build` exit 0 + revisión
visual en staging con un afiliado activo (la card sólo se renderiza para activos).
