# My Budget

PWA italiana gratuita per spese personali. Nessun server applicativo, nessun collegamento bancario, nessun tracker o abbonamento. Dati in IndexedDB sul dispositivo; archivio iniziale vuoto.

## Avvio e test

Richiede Node.js 20 o successivo, senza dipendenze da installare.

```sh
node server.mjs
node --test tests/core.test.mjs
```

Apri http://127.0.0.1:4173. GitHub Pages pubblica la cartella `docs` dal branch `main`.

## Funzioni

- Budget iniziali 150 / 120 / 60 / 60 / 10 / 0 euro; totale 400 euro.
- Dashboard, ricerca, inserimento/modifica/eliminazione movimenti, spese escluse.
- Associazioni esercente/categoria, categorie personalizzate e archiviate.
- Configurazioni budget con decorrenza mensile: nessuna modifica ai mesi precedenti. La configurazione viene ereditata dai mesi successivi fino alla prossima decorrenza.
- Vista annuale cumulativa per le categorie; il tetto complessivo mensile rimane indipendente.
- Anticipi condivisi, quota propria, rimborso atteso e più rimborsi ricevuti con date. Netto = totale anticipato meno rimborsi ricevuti, imputato al mese della spesa originale. Non registra redditi.
- Statistiche con intervalli personalizzati, raggruppamenti giorno/settimana/mese/anno, confronti e classifiche.
- Avvisi in-app 50/80/90/100%, tema automatico/chiaro/scuro, layout mobile.
- Backup JSON completo e ripristino con conferma, CSV con validazione e deduplicazione.
- Service worker per cache offline e manifest installabile.

## iPhone

Apri il sito HTTPS definitivo in Safari → Condividi → Aggiungi alla schermata Home. Apri l'app online una prima volta; la cache deve completarsi prima dell'uso offline. I dati locali non seguono automaticamente un cambio di dominio/browser/dispositivo: esporta e ripristina un backup.

## Apple Pay: ponte Comandi Rapidi

La PWA non accede a Wallet. L'automazione personale viene configurata sul dispositivo. In Comandi Rapidi crea un'automazione **Transazione**, scegli le carte e, se disponibile, l'esecuzione immediata. Usa Importo ed Esercente dall'input se disponibili, altrimenti chiedili all'utente. Menu: registra / fuori budget / ignora. Crea un UUID per la transazione, codifica i valori URL e apri:

```
https://TUO-SITO/#capture?amount=12.50&merchant=ESERCENTE&currency=EUR&id=UUID&excluded=false
```

Usa `excluded=true` per una spesa esclusa. Per ignorare termina il comando. Nell'app scegli categoria e conferma. Il frammento `#` non viene trasmesso al server; viene rimosso dall'indirizzo appena letto. Il client rifiuta gli ID già registrati/ignorati e segnala pagamenti con stesso importo/esercente entro due minuti. Un ID diverso non rende infallibile la deduplicazione: serve sempre la conferma.

**Limite da collaudare sull'iPhone dell'utente:** il trigger dipende da transazione/carta/iOS, non copre necessariamente acquisti online, carte fisiche o Apple Watch. I dati dell'input possono essere assenti. “Apri URL” può aprire Safari invece dell'app Home, che può avere un archivio separato. Non promettiamo acquisizione universale in background o esecuzione a schermo bloccato. La guida interna spiega il flusso; non è incluso un comando iCloud firmato e il test con un pagamento reale resta necessario.

Fonti primarie consultate il 25 novembre 2026:

- [Apple: trigger Transazione](https://support.apple.com/guide/shortcuts/apd65c67538a/ios)
- [WebKit: Web Push per app Home iOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [GitHub: disponibilità Pages e piani](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

## Privacy e limiti dichiarati

Il codice del repository è pubblico; i movimenti non sono caricati nel repository o su un database remoto. Hosting GitHub Pages gratuito per repository pubblico nei limiti del servizio. Costi ricorrenti del progetto: nessun servizio a pagamento configurato; eventuali futuri cambi del provider non sono garantibili.

IndexedDB e backup sono in chiaro. Non è implementato un blocco PIN né crittografia applicativa; usa il blocco del dispositivo e proteggi i backup. Nessuna sincronizzazione automatica: trasferimento manuale tramite backup. La cancellazione dei dati del browser può eliminare l'archivio. Il pulsante di persistenza chiede al browser una protezione dall'evizione, che può essere negata e non sostituisce il backup.

Gli avvisi sono visualizzati nell'app, non push: il push iOS richiede un'app installata sulla Home, consenso e un servizio di invio, non presente nell'architettura locale. Le spese e i rimborsi sono in EUR; non viene effettuata conversione valutaria.

## Test

Suite Node per centesimi, rimborsi, esclusioni, budget storici e annuali, duplicati, date, CSV e validazione backup. Test UI manuali nel browser locale, separato dalla produzione. Il collaudo su iPhone fisico e il trigger Apple Pay non sono sostituibili da test desktop.

Prima di aggiornare gli asset incrementare `CACHE` in `docs/sw.js`; il nuovo service worker entra in uso dopo la chiusura delle vecchie schede. Non salvare backup, CSV reali, credenziali o dati finanziari nel repository.
