# Istálló Kezelő Frontend

Az `istallo_kezelo_frontend` projekt az Istálló Kezelő rendszer Angular alapú kliensalkalmazása. A frontend önállóan nem futtatható teljes funkcionalitással, mert a bejelentkezéshez, az adatok lekéréséhez és a módosítások mentéséhez szüksége van a Spring Boot backend szolgáltatásra és a PostgreSQL adatbázisra is.

Ebben a projektben a teljes rendszer Docker Compose segítségével indítható el.

## Mire szolgál ez a README?

Ez a leírás a teljes alkalmazás Docker-alapú indítását mutatja be:

- frontend konténer
- backend konténer
- PostgreSQL adatbázis konténer

## Előfeltételek

Az indításhoz az alábbiak szükségesek:

- Docker Desktop telepítve és elindítva
- Git telepítve
- a backend projekt elérhető legyen a frontend mellett, testvérkönyvtárként

## Projektek klónozása

Javasolt létrehozni egy közös mappát, például `StableManager` néven, és ebbe klónozni mindkét projektet:

```bash
mkdir StableManager
cd StableManager
git clone https://github.com/dornyeiregi/istallo_kezelo_frontend.git
git clone https://github.com/dornyeiregi/istallo_kezelo.git
```

Elvárt könyvtárstruktúra:

```text
StableManager/
  istallo_kezelo/
  istallo_kezelo_frontend/
```

Ennek oka, hogy a [docker-compose.yml](./docker-compose.yml) a backendet a `../istallo_kezelo` útvonalról buildeli.

## A rendszer indítása

Nyiss terminált a frontend projekt gyökerében:

```bash
cd StableManager/istallo_kezelo_frontend
docker compose up --build
```

Ez az alapértelmezett indítási mód. A frontend és a backend LAN-on is elérhető lesz, ezért a rendszer a helyi hálózat más gépeiről is megnyitható.

Ha háttérben szeretnéd futtatni:

```bash
docker compose up --build -d
```

Az első indítás hosszabb ideig tarthat, mert a Docker letölti az alap image-eket és felépíti a frontend és backend image-eket.

## .env beállítása

A Docker Compose automatikusan beolvassa a projekt gyökerében található `.env` fájlt. Ebben kell megadni a futtató gép helyi IP-címét.

Ha szükséges, a minta alapján újra létrehozható:

```bash
cp .env.example .env
```

A `.env` fájl legfontosabb sora:

```env
APP_HOST_IP=192.168.0.61
```

Ezt az értéket mindig a futtató gép aktuális helyi IP-címére kell átírni. A Compose ezt használja arra, hogy a backend CORS beállítása engedélyezze a frontend elérését LAN-on keresztül is.

A `.env` fájlban a portkötések is szabályozhatók:

```env
FRONTEND_BIND_HOST=0.0.0.0
BACKEND_BIND_HOST=0.0.0.0
DB_BIND_HOST=127.0.0.1
```

Az alapértelmezett beállítás szerint:

- a frontend LAN-on is elérhető
- a backend LAN-on is elérhető
- az adatbázis csak helyben érhető el

## Elérési pontok

Sikeres indulás után a szolgáltatások az alábbi címeken érhetők el:

- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

LAN-on keresztüli elérés esetén a frontend például ezen a címen nyitható meg:

```text
http://192.168.0.61:4200
```

## Mit indít el a Compose?

A [docker-compose.yml](./docker-compose.yml) három szolgáltatást indít:

- `frontend`: Angular alkalmazás production buildből, Nginx-szel kiszolgálva
- `backend`: Spring Boot alkalmazás Docker konténerben
- `db`: PostgreSQL adatbázis konténer

A backend automatikusan a Dockeres PostgreSQL adatbázishoz csatlakozik, ezért a kliensgépen nem szükséges külön PostgreSQL telepítés az alap működéshez.

## Adatbázis és adatok megőrzése

A PostgreSQL konténer adatai Docker volume-ban tárolódnak, ezért a sima leállítás nem törli az adatokat.

Normál leállítás:

```bash
docker compose down
```

Ez leállítja és eltávolítja a konténereket, de az adatbázis adatai megmaradnak.

Teljes törlés adatbázissal együtt:

```bash
docker compose down -v
```

Ez a parancs a PostgreSQL volume-ot is törli, tehát a Dockeres adatbázis teljes tartalma elveszik.

## Meglévő image-ek frissítése

Ha a forráskód változott, futtasd újra a buildet:

```bash
docker compose up --build
```

Ha már fut a rendszer háttérben:

```bash
docker compose up --build -d
```

## Állapot és naplók ellenőrzése

Futó szolgáltatások listázása:

```bash
docker compose ps
```

Összes szolgáltatás naplója:

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

## Bejelentkezés

Az alkalmazás alapértelmezett admin felhasználót hoz létre a migráció során:

- Felhasználónév: `admin`
- Jelszó: `admin123`

Ha a Dockeres adatbázisba később saját adatok kerülnek betöltésre, akkor természetesen a tényleges felhasználók és jogosultságok az importált adatoktól függenek.

## Használat másik gépről

Ha a rendszer ezen a gépen fut, másik gépről is elérhető ugyanazon a helyi hálózaton keresztül.

Ebben az esetben a másik gépen a frontendet nem `localhost`, hanem a futtató gép helyi IP-címével kell megnyitni, például:

```text
http://192.168.0.61:4200
```

A frontend a böngésző címsorában lévő hosztnév alapján keresi a backendet, ezért ugyanazon a gépen a backend is ezen az IP-n, `8080` porton lesz elérve.

## Gyakori hibák

`A backend nem buildelődik`

Ennek tipikus oka, hogy a `../istallo_kezelo` mappa nem a frontend mellett található.

`A frontend üres adatokat mutat`

Ilyenkor jellemzően a Dockeres PostgreSQL adatbázis üres, és nem a korábban helyben használt PostgreSQL példányhoz kapcsolódsz.

`Port already in use`

Valamelyik helyi szolgáltatás már használja a `4200`, `8080` vagy `5432` portot. Ilyenkor vagy le kell állítani a foglaló folyamatot, vagy módosítani kell a compose portkiosztását.

`LAN-on a frontend megnyílik, de az API-hívások hibára futnak`

Ilyenkor általában az `.env` fájlban az `APP_HOST_IP` értéke nem megfelelő. Ellenőrizni kell a futtató gép aktuális LAN IP-címét, majd ezt be kell írni a `.env` fájlba.
