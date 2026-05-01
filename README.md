# Istálló Kezelő Frontend

Ez a projekt indítja el a teljes rendszert Dockerrel. Innen fog elindulni:

- a frontend
- a backend
- a PostgreSQL adatbázis

## Mire lesz szükséged?

- Docker Desktop
- Git
- a backend projekt a frontend mellett legyen

Elvárt mappaszerkezet:

```text
StableManager/
  istallo_kezelo/
  istallo_kezelo_frontend/
```

## Lépésről lépésre

### 1. Klónozd le a két projektet

```bash
mkdir StableManager
cd StableManager
git clone https://github.com/dornyeiregi/istallo_kezelo_frontend.git
git clone https://github.com/dornyeiregi/istallo_kezelo.git
```

### 2. Menj a frontend mappába

```bash
cd StableManager/istallo_kezelo_frontend
```

### 3. Nyisd meg a `.env` fájlt

A projektben már van egy kész `.env` fájl mintaadatokkal. Ezt nem kell létrehozni, csak meg kell nyitni és át kell írni.

Fájl helye:

```text
StableManager/istallo_kezelo_frontend/.env
```

### 4. Írd át a `.env` fájlt

A legfontosabb sorok:

```env
APP_HOST_IP=192.0.2.10
JWT_SECRET=change-this-to-a-long-random-secret
APP_MAIL_ENABLED=true
APP_MAIL_FROM=your-email@example.com
APP_MAIL_TO=
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your-email@example.com
SPRING_MAIL_PASSWORD=your-smtp-or-app-password
```

Mit kell átírni?

- `APP_HOST_IP`: annak a gépnek a helyi IP-címe, amelyen a Docker fut. A `192.0.2.10` csak példa, ezt mindenképp írd át.
- `JWT_SECRET`: saját hosszú titok
- `APP_MAIL_FROM`: a saját email címed
- `SPRING_MAIL_USERNAME`: ugyanaz legyen, mint az `APP_MAIL_FROM`
- `SPRING_MAIL_PASSWORD`: az `APP_MAIL_FROM` email-címhez tartozó, alkalmazás számára használt SMTP jelszó vagy app password

Ezek általában maradhatnak így:

- `APP_MAIL_ENABLED=true`
- `APP_MAIL_TO=`
- `SPRING_MAIL_HOST=smtp.gmail.com`
- `SPRING_MAIL_PORT=587`
- `FRONTEND_BIND_HOST=0.0.0.0`
- `BACKEND_BIND_HOST=0.0.0.0`
- `DB_BIND_HOST=127.0.0.1`
- `DB_HOST_PORT=5432`

Ha nem Gmailt használsz, akkor a `SPRING_MAIL_HOST` és `SPRING_MAIL_PORT` értékét is írd át.

Ha a `5432` port már foglalt a gépeden, akkor a `.env` fájlban ezt például átírhatod erre:

```env
DB_HOST_PORT=5433
```

Ez csak a gépeden megnyitott portot változtatja meg, a konténereken belüli működést nem.

### 5. Indítsd el a rendszert

Terminálból:

```bash
docker compose up --build
```

Docker Desktopból:

1. Nyisd meg a Docker Desktop alkalmazást.
2. Menj a `Containers` vagy `Containers / Apps` részre.
3. Ha a projekt már egyszer el lett indítva, keresd meg az `istallo_kezelo_frontend` compose appot vagy a hozzá tartozó konténereket.
4. Kattints a `Start` vagy `Run` gombra.

Az első buildet általában egyszerűbb terminálból elindítani. Utána a következő indítások és leállítások már kényelmesen kezelhetők Docker Desktopból is.

### 6. Nyisd meg a böngészőben

Normál használatnál mindig a frontendet kell megnyitni.

```text
http://APP_HOST_IP:4200
```

A backendet általában nem kell külön megnyitni böngészőben. Az API-ként fut a frontend mögött.

### 7. Alapértelmezett admin belépés

- Felhasználónév: `admin`
- Jelszó: `admin123`

## Leállítás

Terminálból:

```bash
docker compose down
```

Docker Desktopból:

1. Nyisd meg a Docker Desktop alkalmazást.
2. Menj a `Containers` vagy `Containers / Apps` részre.
3. Keresd meg az alkalmazás compose appját vagy konténereit.
4. Kattints a `Stop` gombra.

Ha az adatbázis adatait is törölni akarod:

```bash
docker compose down -v
```

## Hasznos parancsok

Futó konténerek:

```bash
docker compose ps
```

Összes napló:

```bash
docker compose logs -f
```

Csak a backend naplója:

```bash
docker compose logs -f backend
```

Csak a frontend naplója:

```bash
docker compose logs -f frontend
```

## Gyakori hibák

`A backend nem buildelődik`

Ellenőrizd, hogy a `../istallo_kezelo` mappa valóban a frontend mellett van-e.

`A frontend nem érhető el másik gépről`

Nézd meg, jól van-e beírva az `APP_HOST_IP` a `.env` fájlban.

`Email nem működik`

Ellenőrizd ezeket:

- `APP_MAIL_FROM`
- `SPRING_MAIL_USERNAME`
- `SPRING_MAIL_PASSWORD`
- `SPRING_MAIL_HOST`
- `SPRING_MAIL_PORT`

`Port already in use`

Valami más program már használja a `4200`, `8080` vagy `5432` portot.

Ha a hiba a `127.0.0.1:5432` portra vonatkozik, akkor általában egy helyben futó PostgreSQL használja azt.

Ilyenkor két megoldás van:

- állítsd le a helyi PostgreSQL-t
- vagy írd át a `.env` fájlban a `DB_HOST_PORT` értékét például `5433`-ra, majd futtasd újra a `docker compose up --build` parancsot
