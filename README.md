# Agenda deportiva demo v1.3

La publicación sigue siendo una demo: los datos iniciales son ficticios, no hay autenticación ni sincronización familiar. No introducir datos personales reales ni subir copias privadas. La vista familiar pública conserva su feed ficticio independiente y nunca usa la configuración de la vista personal.

La vista personal incorpora `calendario-real.js`, que permite configurar localmente una fuente JSON pública de equipo (HTTPS, mismo origen, sin parámetros, sin redirecciones). Requiere las claves `scope`, `checked_at`, `fixtures` del formato de Dani Fútbol Tracker, con jornadas, fechas, horas, rival, local/visitante, resultado y campo. El identificador exacto de la fuente se comprueba antes de importar. La configuración y el calendario se mantienen en localStorage; no se publica la asociación entre persona y equipo. No es un almacenamiento privado autenticado: todas las páginas del mismo origen tienen acceso a localStorage.

Al abrir o recuperar la página se consulta la última copia disponible. No es una consulta directa a la Federación ni un nuevo proceso programado. Si falla, se conserva la última copia. Una fecha desaparecida no se interpreta como cancelación; se muestra una advertencia. Los partidos de fuentes reales se distinguen por las notas de jornada y fuente; no acreditan convocatoria individual. Las jornadas sin fecha no aparecen como partidos programados. Los resultados son del equipo seguido, no del deportista.

La demo de v1.2 sigue disponible para las personas no conectadas a una fuente real. No cambiar las claves locales de v1.1: conservan selecciones anteriores. El encabezado pasa a V1.3.

Pruebas locales: `node --check calendario-real.js`, `node --check calendario-demo.js`, `node test-calendario-real.cjs`. Pruebas de navegador, publicación y acceso a los feeds reales pendientes; no se ha verificado una consulta HTTP en el navegador.

Publicar exclusivamente los archivos de esta carpeta en el repositorio de demo existente. No modificar los otros trackers, no publicar fuentes privadas ni asociaciones reales. No activar recolectores de RFFM sin validar permisos, acceso y condiciones de reutilización.
