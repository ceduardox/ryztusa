# Guía para editar y sincronizar el theme RYZTOR

Esta guía explica cómo editar el theme desde VS Code, Codex, OpenCode u otra aplicación y asegurar que los cambios lleguen al theme correcto de Shopify.

## 1. Datos oficiales del proyecto

| Concepto | Valor correcto |
|---|---|
| Tienda | `ryztor.myshopify.com` |
| Carpeta local oficial | `G:\ALEJANDRO CELIS\RYZTOR USA WEB\ryztor-theme\horizon-working` |
| Repositorio GitHub | `https://github.com/ceduardox/ryztusa.git` |
| Rama principal | `main` |
| Theme de trabajo | `RYZTOR Working` |
| ID del theme de trabajo | `188277522728` |
| Theme publicado | `Horizon` |
| ID del theme publicado | `188276212008` |

> **Regla principal:** todos los cambios se prueban primero en `RYZTOR Working` (`188277522728`). No se debe editar ni subir directamente al theme publicado.

## 2. Qué carpeta debe abrir la otra aplicación

En cualquier editor o aplicación de inteligencia artificial, abrir exactamente:

```text
G:\ALEJANDRO CELIS\RYZTOR USA WEB\ryztor-theme\horizon-working
```

No abrir la carpeta superior `ryztor-theme`, porque contiene otra copia antigua del theme.

Antes de editar, comprobar desde la terminal de la aplicación:

```powershell
Set-Location "G:\ALEJANDRO CELIS\RYZTOR USA WEB\ryztor-theme\horizon-working"
git rev-parse --show-toplevel
git branch --show-current
git remote -v
git status --short
```

El resultado correcto debe indicar:

- Carpeta Git: `...\horizon-working`
- Rama: `main`
- Remoto: `https://github.com/ceduardox/ryztusa.git`

Si aparece otra carpeta, otro repositorio o una rama diferente, no continuar.

## 3. Método recomendado: edición en tiempo real

Shopify CLI puede observar los archivos de la carpeta. Cuando otra aplicación guarda un cambio, Shopify lo sincroniza con el theme indicado.

### Paso 1: cerrar sesiones anteriores

Debe existir una sola sesión de `shopify theme dev` para este proyecto. Si hay otra terminal ejecutándola, detenerla con:

```text
Ctrl + C
```

### Paso 2: iniciar la sesión correcta

Abrir PowerShell en la carpeta oficial y ejecutar:

```powershell
Set-Location "G:\ALEJANDRO CELIS\RYZTOR USA WEB\ryztor-theme\horizon-working"

shopify.cmd theme dev `
  --store ryztor.myshopify.com `
  --theme 188277522728 `
  --host 127.0.0.1 `
  --port 9294 `
  --live-reload hot-reload `
  --theme-editor-sync
```

Este comando fija explícitamente:

- La tienda correcta.
- El theme `RYZTOR Working`.
- El puerto local `9294`.
- La recarga automática.
- La sincronización con el editor visual de Shopify.

Mientras el comando esté funcionando:

- Los cambios guardados por la otra aplicación se envían al theme de trabajo.
- La vista local estará en `http://127.0.0.1:9294`.
- La terminal debe permanecer abierta.
- Para detener la sincronización se usa `Ctrl + C`.

> No usar `--allow-live`. Esa opción permite trabajar sobre un theme publicado.

### Paso 3: abrir el producto

Vista previa directa del producto Berberina:

```text
https://ryztor.myshopify.com/products/berberine?preview_theme_id=188277522728
```

Editor del theme de trabajo:

```text
https://ryztor.myshopify.com/admin/themes/188277522728/editor
```

## 4. Método controlado: subir archivos después de editarlos

Si no se quiere mantener una sesión de desarrollo abierta, la otra aplicación puede editar localmente y después subir únicamente los archivos modificados.

### Validar primero

```powershell
Set-Location "G:\ALEJANDRO CELIS\RYZTOR USA WEB\ryztor-theme\horizon-working"

git diff --check
shopify.cmd theme check
```

### Revisar qué cambió

```powershell
git status --short
git diff
```

### Subir un archivo específico

Ejemplo:

```powershell
shopify.cmd theme push `
  --store ryztor.myshopify.com `
  --theme 188277522728 `
  --path . `
  --only sections/ryztor-berberine-story.liquid
```

### Subir dos archivos específicos

```powershell
shopify.cmd theme push `
  --store ryztor.myshopify.com `
  --theme 188277522728 `
  --path . `
  --only sections/ryztor-berberine-story.liquid `
  --only templates/product.json
```

Siempre comprobar que la respuesta indique:

```text
The theme 'RYZTOR Working' (#188277522728) was pushed successfully.
```

Si aparece otro nombre o ID, detener el proceso y revisar el comando.

## 5. Cómo guardar los cambios en GitHub

Shopify y GitHub son dos sincronizaciones diferentes:

- `shopify theme push` actualiza Shopify.
- `git push` actualiza GitHub.

### Flujo seguro

```powershell
Set-Location "G:\ALEJANDRO CELIS\RYZTOR USA WEB\ryztor-theme\horizon-working"

git status --short
git diff --check
shopify.cmd theme check
```

Agregar solamente los archivos revisados:

```powershell
git add sections/ryztor-berberine-story.liquid
git add templates/product.json
```

Crear el commit:

```powershell
git commit -m "Describe claramente el cambio realizado"
```

Actualizar la rama y subir:

```powershell
git pull --rebase origin main
git push origin main
```

Comprobar:

```powershell
git status --short
git log -1 --oneline
```

Cuando `git status --short` no imprime nada, la carpeta está limpia.

> No ejecutar `git add -A` sin revisar antes `git status`, porque podría incluir cambios de otra persona o aplicación.

## 6. Cómo descargar cambios realizados en Shopify

`theme pull` descarga el theme remoto y puede reemplazar archivos locales. Antes de usarlo:

1. Cerrar otras aplicaciones que estén editando el theme.
2. Detener `shopify theme dev`.
3. Ejecutar `git status --short`.
4. Guardar o confirmar los cambios pendientes.

Después:

```powershell
shopify.cmd theme pull `
  --store ryztor.myshopify.com `
  --theme 188277522728 `
  --path .
```

Revisar inmediatamente:

```powershell
git status --short
git diff
```

Nunca ejecutar `theme pull` sobre trabajo local sin guardar.

## 7. Puertos detectados en la PC

Esta es una fotografía de los puertos TCP en escucha al crear este manual. Puede cambiar después de reiniciar la PC o cerrar aplicaciones.

### Puertos relevantes para desarrollo

| Puerto | Dirección | Proceso | Uso probable |
|---:|---|---|---|
| `9292` | `127.0.0.1` | `node` | Sesión Shopify CLI |
| `9293` | `127.0.0.1` | `node` | Otra sesión Shopify CLI |
| `9294` | `127.0.0.1` | Libre al crear la guía | Puerto reservado recomendado para RYZTOR |
| `4173` | `127.0.0.1` | `node` | Vista previa Vite u otra aplicación web |
| `4174` | `127.0.0.1` | `node` | Segunda vista previa web |
| `3002` | `0.0.0.0` | `node` | Otra aplicación Node |
| `8089` | `127.0.0.1` | `php` | Servidor PHP local |

### Bases de datos

| Puerto | Proceso |
|---:|---|
| `3307` | MariaDB |
| `5432` | PostgreSQL |
| `5433` | PostgreSQL |
| `5434` | PostgreSQL |

### Otros servicios detectados

También estaban en escucha puertos de Windows y aplicaciones instaladas, entre ellos:

```text
135, 139, 445, 1042, 1043, 2869, 4096, 4791, 5040,
5939, 7680, 9012, 9013, 13010, 13030, 13031, 13032,
17532, 17945, 22112, 22350, 49664-49672, 52177-52179,
56876 y 65001
```

Los puertos `135`, `139`, `445` y otros servicios de Windows no deben cerrarse desde este proyecto.

### Ver los puertos nuevamente

```powershell
netstat -ano -p tcp | Select-String "LISTENING"
```

Revisar un puerto específico:

```powershell
netstat -ano | Select-String ":9294"
```

### Seguridad

- `127.0.0.1` significa que el servicio solo se escucha desde esta PC.
- `0.0.0.0` puede aceptar conexiones desde otras interfaces, dependiendo del Firewall de Windows.
- Para Shopify CLI se debe usar `--host 127.0.0.1`.
- No abrir el puerto de desarrollo en el router.
- No compartir tokens, contraseñas ni archivos de credenciales con otra aplicación.

## 8. Evitar conflictos entre aplicaciones

Cuando se use Codex, VS Code, OpenCode u otra aplicación:

1. Todas deben abrir la misma carpeta `horizon-working`.
2. Solo una terminal debe ejecutar `shopify theme dev`.
3. Antes de editar, ejecutar `git status --short`.
4. No permitir que dos aplicaciones modifiquen el mismo archivo simultáneamente.
5. No hacer `theme pull` mientras otra aplicación está guardando archivos.
6. Validar antes de subir.
7. Subir siempre con `--theme 188277522728`.
8. Confirmar que Shopify responda `RYZTOR Working`.

## 9. Comando de inicio rápido

Copiar y pegar:

```powershell
Set-Location "G:\ALEJANDRO CELIS\RYZTOR USA WEB\ryztor-theme\horizon-working"

git status --short

shopify.cmd theme dev `
  --store ryztor.myshopify.com `
  --theme 188277522728 `
  --host 127.0.0.1 `
  --port 9294 `
  --live-reload hot-reload `
  --theme-editor-sync
```

Después abrir:

```text
http://127.0.0.1:9294/products/berberine
```

## 10. Problemas frecuentes

### PowerShell bloquea `shopify.ps1`

Usar:

```powershell
shopify.cmd
```

No usar:

```powershell
shopify
```

### El puerto ya está ocupado

Comprobar:

```powershell
netstat -ano | Select-String ":9294"
```

Detener la sesión anterior con `Ctrl + C` o cambiar el comando a otro puerto local, por ejemplo `9295`.

### Los cambios aparecen en otro theme

1. Detener inmediatamente con `Ctrl + C`.
2. Ejecutar:

```powershell
shopify.cmd theme list --store ryztor.myshopify.com
```

3. Confirmar que el comando use:

```text
--theme 188277522728
```

### Los cambios no aparecen

1. Comprobar que `theme dev` siga abierto.
2. Abrir `http://127.0.0.1:9294`.
3. Guardar nuevamente el archivo.
4. Revisar errores en la terminal.
5. Ejecutar `shopify.cmd theme check`.
6. Actualizar el navegador con `Ctrl + F5`.

### Aparece un error de Liquid

No subir más archivos hasta corregirlo:

```powershell
shopify.cmd theme check
git diff --check
```

## 11. Publicación final

La publicación debe hacerse únicamente después de revisar `RYZTOR Working` en computadora y móvil.

No publicar desde una aplicación automática. Publicar manualmente desde:

```text
Shopify Admin → Online Store → Themes → RYZTOR Working → Publish
```

Antes de publicar:

- Revisar inicio, producto, contacto y carrito.
- Probar cantidad, agregar al carrito y eliminar.
- Confirmar precio y moneda.
- Revisar computadora y móvil.
- Confirmar que GitHub contiene la misma versión.

