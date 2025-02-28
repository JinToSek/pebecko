# OpenDecision
Moderní alternativa decision21.cz, vytvořená pomocí NextJS a databází od Prismy.
Zdarma. OpenSource.

Autor: JinSeK a podporovatelé

## Instalace:
### 1. fork/dupublikujte toto repo
### 3. vercel
https://vercel.com/
Vytvořte projekt, vyberte repo, které jste duplikovali
### 4. prisma
https://prisma.io/ pro databáze
potřebujete jen URL pro databázi
### 5. nastavit ENV na Vercel:
ENV
```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=ZmenToto"
```
URL jste si vygenerovali v předchozím kroku
### 6. Framework Settings
Na vercelu: Framework Settings
Build command změnit na "prisma generate --no-engine && next build"

To je vše, feel free to contribute to this project and make sure to give it a star if you like it.

Vytvořeno pomocí: Prisma.io databáze (není to zrovna nejrychlejší db co si budem :/ "Funguje to - tak to nech být") a NextJS
