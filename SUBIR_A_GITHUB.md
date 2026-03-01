# Subir el proyecto a GitHub

Este proyecto está preparado para que **no se suba nada confidencial**. El `.gitignore` excluye:

- `.env` (y cualquier `.env.*`) → no se suben credenciales
- `public/data.csv` → no se suben tus datos financieros
- `node_modules` y `dist`

Sí se sube `.env.example` (solo plantilla sin valores reales).

---

## Pasos (tú ejecutas los comandos y el commit queda a tu nombre)

### 1. Comprobar que no hay datos sensibles

En la carpeta del proyecto:

```bash
npm run check-safe
```

Si hay algo sensible en el área de staging, el script avisará. Si no has hecho `git add` aún, no hará falta.

### 2. Inicializar Git (si aún no lo has hecho)

```bash
cd /Users/ocollp/Projects/money-tracker
git init
```

### 3. Añadir los archivos

```bash
git add .
```

### 4. Ver qué se va a subir (importante)

```bash
git status
```

**Comprueba que NO aparezcan** en la lista:
- `.env`
- `public/data.csv`

Si aparecen, no hagas commit y revisa el `.gitignore`.

### 5. Crear el commit (autor: tú)

```bash
git commit -m "chore: initial project setup"
```

(Si prefieres conventional commit con más detalle: `git commit -m "chore: initial commit with Money Tracker app"`)

### 6. Crear el repo en GitHub y enlazarlo

- En GitHub: **New repository** → nombre por ejemplo `money-tracker` → no marques "Add a README" (ya tienes uno).
- Luego en tu máquina:

```bash
git remote add origin https://github.com/TU_USUARIO/money-tracker.git
git branch -M main
git push -u origin main
```

(Sustituye `TU_USUARIO` por tu usuario de GitHub.)

---

## Después de subir

- **Variables en GitHub:** Para que el deploy (GitHub Pages) funcione con tus datos, en el repo ve a **Settings → Secrets and variables → Actions** y añade los mismos nombres que en tu `.env`:  
  `VITE_GOOGLE_CLIENT_ID`, `VITE_SPREADSHEET_ID`, `VITE_MORTGAGE_END_YEAR`, `VITE_MORTGAGE_END_MONTH`, `VITE_MORTGAGE_MONTHLY_PAYMENT`, `VITE_OWNERSHIP_SHARE`.
- **OAuth:** En Google Cloud Console, en "URIs de redirección autorizados" y "Orígenes JavaScript autorizados", añade la URL de tu página desplegada (ej. `https://TU_USUARIO.github.io`).
