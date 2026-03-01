# Bot de Telegram per afegir registres al Google Sheet

És possible. El bot rebrà missatges teus (o d’Andrea), interpretarà el text i afegirà una fila al Google Sheet corresponent. Cal un **repositori nou** perquè el bot és un servidor (Node.js) que s’executa en segon pla, no una pàgina web.

---

## Resum del que faràs

1. Crear un bot a Telegram i obtenir el token.
2. Crear un **Service Account** a Google i donar-li accés d’**editor** als teus dos Sheets.
3. Repositori nou amb un servidor Node.js que escolta Telegram i escriu al Sheet.
4. Desplegar el bot (Railway, Render, VPS, etc.) amb les variables d’entorn.

---

## Pas 1: Bot de Telegram

1. Obre Telegram i busca **@BotFather**.
2. Envia `/newbot`, posa un nom (p. ex. “Money Tracker”) i un username que acabi en `bot` (p. ex. `mytracker_bot`).
3. BotFather et donarà un **token** (semblat a `7123456789:AAH...`). **Guarda’l**: el posaràs a les variables d’entorn del projecte nou.

Optional: use `/setdescription` in BotFather and set something like:

> Add new money movements to your spreadsheet. Send a short message (e.g. amount, entity, category) and the bot appends a row to your Google Sheet.

---

## Pas 2: Google Service Account (per escriure al Sheet)

L’app actual usa OAuth “només lectura”. Per escriure des del bot sense obrir el navegador, cal un **Service Account** i compartir els Sheets amb el seu email.

1. Ves a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un projecte nou (o tria el mateix que ja tens per l’app).
3. **APIs & Services → Enable APIs**  
   Activa **Google Sheets API**.
4. **APIs & Services → Credentials → Create credentials → Service account**.  
   Nom (p. ex. “telegram-bot”), sense canvis extra → **Done**.
5. Entra al Service Account → **Keys → Add key → Create new key → JSON**.  
   Es descarregarà un fitxer JSON. **No el pugis a GitHub.**  
   Aquest fitxer el faràs servir al bot com a variable d’entorn (contingut en base64 o path segur).
6. **Compartir els Sheets amb el Service Account**  
   - Copia l’**email** del Service Account (semblat a `xxx@yyy.iam.gserviceaccount.com`).  
   - Obre el **Google Sheet d’Olga** → Compartir → afegeix aquest email amb permisos **Editor**.  
   - Repeteix amb el **Sheet d’Andrea** si en tens un de segon.

Ara el bot podrà llegir i escriure (afegir files) als dos Sheets sense OAuth d’usuari.

---

## Pas 3: Repositori nou per al bot

Recomanat: un repo només per al bot (perquè és un altre llenguatge d’execució, env vars diferents i desplegament separat).

### 3.1 Crear el repo

```bash
mkdir money-tracker-telegram-bot
cd money-tracker-telegram-bot
git init
npm init -y
```

### 3.2 Dependències

```bash
npm install node-telegram-bot-api googleapis
```

- **node-telegram-bot-api**: rebre missatges i respondre.
- **googleapis**: accedir a Google Sheets (append de files).

### 3.3 Variables d’entorn

Crea un fitxer `.env` (i afegir-lo a `.gitignore`). Exemple:

```env
TELEGRAM_BOT_TOKEN=el_token_que_et_va_donar_BotFather
GOOGLE_SERVICE_ACCOUNT_JSON=contingut_del_fitxer_json_en_una_linia
# O bé, si prefereixes path al fitxer (només en local):
# GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

SPREADSHEET_ID_OLGA=id_del_sheet_d_olga
SPREADSHEET_ID_ANDREA=id_del_sheet_d_andrea
```

Per producció, el JSON del Service Account es pot posar en base64 o com a string escapat; el bot el llegirà i farà `JSON.parse`.

### 3.4 Format del missatge (proposta)

El Sheet espera: **fecha, mes, año, tipo, categoria, entidad, cantidad**.

Exemple de comandes i textos:

- **Per afegir a Olga:**  
  `/o 50 BBVA Efectivo`  
  → avui, 50 €, entitat BBVA, categoria Efectivo, tipo Cash.

- **Per afegir a Andrea:**  
  `/a 120 Revolut Compte`

- **Amb data:**  
  `/o 15/02 30 Indexa Indexa Capital`  
  → dia 15 del mes actual (o especificar mes any si vols).

Pots definir les regles que vulguis (p. ex. primera paraula = quantitat, segona = entitat, tercera = categoria, defaults tipo = Cash, etc.).

### 3.5 Lògica del bot (esbós)

1. Iniciar el client de Telegram amb `TELEGRAM_BOT_TOKEN`.
2. Quan arribi un missatge:
   - Si és `/o ...` → afegir fila al Sheet d’Olga.
   - Si és `/a ...` → afegir fila al Sheet d’Andrea.
3. Parsejar el text (quantitat, entitat, categoria, data si hi és).
4. Amb **googleapis** (Sheets API), fer un **append**:  
   `spreadsheets.values.append` amb `valueInputOption=USER_ENTERED` i el range (p. ex. `Hoja1!A:G` o el nom de la pestanya que facis servir).
5. Respondre a Telegram “Afegit: 50 € BBVA Efectivo” o un missatge d’error si falla.

El range ha de coincidir amb el que usa l’app (ara `A:I`); si la primera fila és la capçalera, el append afegirà la fila nova a sota.

### 3.6 Estructura mínima del projecte

```
money-tracker-telegram-bot/
  .env                 # no pujar a Git
  .gitignore           # node_modules, .env, *.json del service account
  package.json
  index.js             # entrada: inicia el bot, registra handlers
  lib/
    telegram.js        # configurar node-telegram-bot-api
    sheets.js          # append fila al Sheet amb googleapis
    parseMessage.js    # convertir "/o 50 BBVA Efectivo" → { fecha, mes, año, tipo, categoria, entidad, cantidad }
  README.md
```

---

## Pas 4: Desplegar el bot

El bot ha d’estar en marxa contínuament per rebre missatges. Opcions habituals:

- **Railway / Render / Fly.io**  
  Projecte Node.js, comanda `node index.js`, afegir totes les variables d’entorn (token de Telegram, JSON del Service Account, IDs dels Sheets). Gràtis amb límits.
- **VPS** (DigitalOcean, etc.)  
  Instalar Node, clonar el repo, configurar `.env` i executar amb `pm2` o un `systemd` service.

Important: no cal domini ni HTTPS si fas servir **long polling** (el bot pregunta a Telegram “hi ha missatges?”). Si més endavant vols **webhook**, llavors sí caldrà una URL pública amb HTTPS.

---

## Pas 5: Provar en local

```bash
cd money-tracker-telegram-bot
npm install
# Omple .env
node index.js
```

Envia a Telegram `/o 1 Test Entitat Test` i comprova que al Sheet d’Olga apareix la fila. Després prova amb el Sheet d’Andrea.

---

## Resum de seguretat

- **No** pujar el token de Telegram ni el JSON del Service Account a GitHub.
- **Sí** posar-los a variables d’entorn (o fitxer segur) al servidor.
- Opcional: restringir qui pot enviar ordres al bot (comprovar `msg.from.id` contra una llista d’IDs de Telegram permesos).

Si vols, el següent pas pot ser escriure junts el `index.js` i `lib/parseMessage.js` amb el format exacte que vulguis (per exemple “quantitat entitat categoria” amb defaults tipo=Cash i data=avui).

---

## Missatge per demanar entitats (Olga)

Quan l'usuari digui que és **Olga**, el bot ha de mostrar aquest missatge per demanar els valors (format: tipus de compte (entitat):):

```
Si ets Olga, envia els valors per a aquestes entitats (quantitat per línia):

Compte d'estalvis (La Caixa):
Compte corrent (La Caixa):
Compte corrent (Revolut):
Compte compartit (Revolut):
Compte compartit flexible (Revolut):
Accions (Revolut):
Trade Republic:
Fundeen:
Urbanitae:
Fons indexat (Indexa Capital):
Pla de pensions (Indexa Capital):
Efectiu:
Hipoteca: (el que queda per pagar, dividit entre dos)
```

**Regles que el bot ha d'aplicar sempre (no es mostren a l'usuari):**

- **Vivienda personal (BBVA):** no es demana. El bot ha d'afegir sempre una fila amb 150000 € per a aquesta entitat/categoria (Olga i Andrea).
- **Compte compartit flexible:** el valor que envia l'usuari s'ha de **dividir entre dos** abans d'escriure'l al Sheet (perquè és compartit entre dues persones). Aplica a Olga i Andrea.
- **Hipoteca:** el valor que envia l'usuari (el que queda per pagar) s'ha de **dividir entre dos** abans d'escriure'l al Sheet (i en negatiu).
