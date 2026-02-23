# DevTrack Pro - Správa zákaziek a projektov

**DevTrack Pro** je profesionálny desktopový systém navrhnutý pre vývojárov, projektových manažérov a tímy na efektívnu evidenciu zákaziek, vývojových projektov (ticketov) a výkazov práce. Aplikácia je postavená na moderných technológiách s dôrazom na rýchlosť, bezpečnosť dát a užívateľskú prívetivosť.

## 🚀 Hlavné funkcie

- **Dashboard:** Prehľadné štatistiky, grafy spotreby hodín a vizualizácia stavu projektov v reálnom čase.
- **Správa projektov (Ticketov):** Detailná evidencia úloh, priradenie k SAP modulom, sledovanie rozpočtu a odhadov.
- **Denník práce (Work Log):** Presné zaznamenávanie odpracovaných hodín s väzbou na konkrétne projekty a zákazníkov.
- **Správa mandantov a zákazníkov:** Hierarchická štruktúra pre organizáciu dát podľa divízií a koncových klientov.
- **Fakturácia a Billing:** Prehľad nevyfakturovaných hodín a správa fakturačných údajov.
- **Export dát:** Možnosť exportovať všetky dôležité prehľady do formátu Microsoft Excel (.xlsx).
- **Flexibilná databáza:** Možnosť zmeniť cestu k SQLite databáze priamo v nastaveniach aplikácie.
- **Tmavý režim:** Podpora pre svetlý aj tmavý vizuálny štýl šetriaci zrak.
- **Diagnostika:** Integrovaný logovací systém pre jednoduché riešenie technických problémov.

## 🛠 Technológie

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Backend:** Rust (Tauri Framework)
- **Databáza:** SQLite (lokálne úložisko)
- **Grafy:** Recharts
- **Ikony:** Lucide React
- **Export:** SheetJS (XLSX)

## 📦 Inštalácia a spustenie

### Požiadavky
- [Node.js](https://nodejs.org/) (LTS verzia)
- [Rust](https://www.rust-lang.org/tools/install)
- Systémové závislosti pre Tauri (pozri [Tauri sprievodcu](https://tauri.app/v1/guides/getting-started/prerequisites))

### Vývojový režim
1. Naklonujte repozitár:
   ```bash
   git clone https://github.com/vas-ucet/devtrack-pro.git
   cd devtrack-pro
   ```
2. Nainštalujte závislosti:
   ```bash
   npm install
   ```
3. Spustite aplikáciu vo vývojovom režime:
   ```bash
   npm run tauri dev
   ```

### Build (Produkčná verzia)
Pre vytvorenie inštalačného balíčka (.msi, .exe pre Windows):
```bash
npm run tauri build
```

## 📂 Štruktúra projektu

- `/src`: Zdrojový kód frontendu (React komponenty, hooky, služby).
- `/src-tauri`: Zdrojový kód backendu v jazyku Rust a konfigurácia Tauri.
- `/services`: Logika pre komunikáciu s databázou a logovaním.
- `/hooks`: Vlastné React hooky pre správu stavu dát.

## 🛡 Licencia

Tento projekt je licencovaný pod licenciou MIT. Podrobnosti nájdete v súbore LICENSE.

---
*Vyvinuté s dôrazom na efektivitu a prehľadnosť.*

