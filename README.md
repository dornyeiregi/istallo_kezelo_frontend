# IstalloKezeloFrontend

Az **IstalloKezeloFrontend** egy webes felület, amely regisztrált felhasználóknak lehetővé teszi lovak, istállók és oltások kezelését, valamint a szerepkörökhöz kötött jogosultságokat. A backend külön projektben fut (`istallo_kezelo`), ehhez csatlakozik a kliens.

## Előfeltételek
|Szoftver|Leírás|
|---|---|
|[npm](https://docs.npmjs.com/about-npm)|Csomagkezelő|
|[nodejs](https://nodejs.org/en/download)|Futtatókörnyezet|
|[angular](https://angular.dev/installation)|Webes keretrendszer|
|MySQL kliens/connector|Az API által használt adatbázishoz|
|Futó backend szolgáltatás|A frontend API-hívásaihoz szükséges|

## Telepítés és futtatás
1. Kövesd a backend telepítési lépéseit, majd indítsd el a szervert.
2. A frontend könyvtárban futtasd: `npm install`.
3. Indítsd a frontendet: `ng serve`.
4. Böngészőben nyisd meg: `http://localhost:4200/`.
5. Jelentkezz be az előre telepített admin felhasználóval:
        Felhasználónév: admin
        Jelszó: admin123
## Fejlesztői szerver

Helyi szerver indítása:

```bash
ng serve
```

Futtatás után a böngészőben nyisd meg a `http://localhost:4200/` címet. A forrásfájlok módosítása automatikus újratöltést indít.

### Kódsablonok

Új komponens generálása:

```bash
ng generate component component-name
```

További sémák listázása (pl. `components`, `directives`, `pipes`):

```bash
ng generate --help
```

### Unit tesztek futtatása

Unit tesztek futtatása a [Karma](https://karma-runner.github.io) tesztfuttatóval:

```bash
ng test
```

### Dokumentáció

Ha dokumentációt szeretnél generálni (pl. typedoc segítségével), telepítsd a fejlesztői függőséget: `npm install --save-dev typedoc`, majd futtasd: `npx typedoc --entryPointStrategy Expand src`.

---

Az alkalmazás az [Angular CLI](https://github.com/angular/angular-cli) 20.3.6-os verziójával készült.

## Fejlesztői szerver

Helyi szerver indítása:

```bash
ng serve
```

Futtatás után a böngészőben nyisd meg a `http://localhost:4200/` címet. A forrásfájlok módosítása automatikus újratöltést indít.

## Kódsablonok

Új komponens generálása:

```bash
ng generate component component-name
```

További sémák listázása (pl. `components`, `directives`, `pipes`):

```bash
ng generate --help
```

## Build

Build készítése:

```bash
ng build
```

A lefordított állományok a `dist/` mappába kerülnek; a gyári beállítások teljesítményre optimalizálnak.

## Unit tesztek

Unit tesztek futtatása a [Karma](https://karma-runner.github.io) tesztfuttatóval:

```bash
ng test
```

## E2E tesztek

Végponttól végpontig tesztek futtatása:

```bash
ng e2e
```

Az Angular CLI alapból nem tartalmaz E2E keretrendszert; válassz olyat, ami megfelel az igényeidnek.

## További források

Részletes CLI-dokumentáció: [Angular CLI áttekintés és parancsreferencia](https://angular.dev/tools/cli).
