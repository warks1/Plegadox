# PlegadoX R85 — Guardar copia directa al pendrive

La edición portátil incorpora en «Copia completa del proyecto» un botón nuevo «Guardar copia directamente en USB», visible sólo cuando la página se abre desde el ejecutable local. Las páginas web normales no pueden acceder a la carpeta física del usuario.

Al pulsarlo, el programa valida el backup completo mediante `buildProjectBackup` y lo envía a un endpoint local servido por `PlegadoX.exe`, que escribe en `MIS_PROYECTOS/PlegadoX-BACKUP-*.json` en el mismo USB. No elimina ni sustituye copias anteriores. La escritura temporal seguida de `os.replace` evita dejar el backup definitivo a medias.

Seguridad: servidor limitado a 127.0.0.1; comprueba Host, Origin, token aleatorio de sesión, Content-Type application/json, formato y esquema, y tamaño máximo de 4 MB. Sin CORS abierto. No acepta rutas proporcionadas por la página. El service worker no intercepta ni guarda en caché las operaciones USB. Se prueban solicitudes legítimas y denegaciones (origen falso, token falso, otro formato).

Cambiar de PC **no sincroniza automáticamente** el almacenamiento del navegador. Para llevarse las piezas, usar «Guardar copia directamente en USB» y en el otro PC «Restaurar proyecto completo». La importación conserva su validación transaccional y rechaza datos inválidos sin borrar los existentes.

Esta edición no implica certificado industrial ni permite ejecutar programas CNC en la máquina.
