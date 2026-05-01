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
APP_HOST_IP=192.168.0.61
JWT_SECRET=change-this-to-a-long-random-secret
APP_MAIL_ENABLED=true
APP_MAIL_FROM=your-email@example.com
APP_MAIL_TO=
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your-email@example.com
SPRING_MAIL_PASSWORD=your-app-password
```

Mit kell átírni?

- `APP_HOST_IP`: annak a gépnek a helyi IP-címe, amelyen a Docker fut
- `JWT_SECRET`: saját hosszú titok
- `APP_MAIL_FROM`: a saját email címed
- `SPRING_MAIL_USERNAME`: ugyanaz legyen, mint az `APP_MAIL_FROM`
- `SPRING_MAIL_PASSWORD`: a saját app jelszó vagy SMTP jelszó

Ezek általában maradhatnak így:

- `APP_MAIL_ENABLED=true`
- `APP_MAIL_TO=`
- `SPRING_MAIL_HOST=smtp.gmail.com`
- `SPRING_MAIL_PORT=587`
- `FRONTEND_BIND_HOST=0.0.0.0`
- `BACKEND_BIND_HOST=0.0.0.0`
- `DB_BIND_HOST=127.0.0.1`

Ha nem Gmailt használsz, akkor a `SPRING_MAIL_HOST` és `SPRING_MAIL_PORT` értékét is írd át.

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

Ha ugyanazon a gépen használod, ahol a Docker fut:

```text
http://localhost:4200
```

Ha másik gépről, ugyanazon a helyi hálózaton használod:

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
