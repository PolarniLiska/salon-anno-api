# Shopify Integrace - Návod k nastavení

## 1. Nastavení produktu v Shopify

### Vytvoření produktu "Online kurz přístup"
1. V Shopify Admin jděte na **Products** > **Add product**
2. Vyplňte:
   - **Title**: "Online kurz přístup"
   - **Description**: "Digitální přístup k online kurzům Salón Anno"
   - **Price**: Vaše cena (např. 1500 Kč)
   - **Track quantity**: ❌ Vypnout (digitální produkt)
   - **Requires shipping**: ❌ Vypnout (digitální produkt)
   - **Product status**: **Draft** (zatím neveřejný)
   - **Search engine listing**: Skrýt ze search engines

### Nastavení jako digitální produkt
- V sekci **Shipping** zrušte zaškrtnutí "This is a physical product"
- V sekci **Inventory** vypněte sledování skladových zásob

## 2. Nastavení Webhook v Shopify

### Vytvoření webhook
1. V Shopify Admin jděte na **Settings** > **Notifications**
2. Scroll dolů na **Webhooks** sekci
3. Klikněte **Create webhook**
4. Nastavte:
   - **Event**: `Order payment`
   - **Format**: `JSON`
   - **URL**: `https://salon-anno-api.vercel.app/api/shopify/webhook`
   - **API version**: Nejnovější dostupná

### Zabezpečení webhook
1. V webhook nastavení najděte **Webhook signature**
2. Zkopírujte tajný klíč
3. Přidejte do `.env.local` v `salon-anno-api`:
   ```
   SHOPIFY_WEBHOOK_SECRET=váš_tajný_klíč_zde
   ```

## 3. Testování integrace

### Test webhook endpoint
```bash
curl -X POST https://salon-anno-api.vercel.app/api/shopify/test-webhook
```

### Test přes Shopify
1. Vytvořte testovací objednávku s produktem "Online kurz přístup"
2. Zkontrolujte logy ve Vercel dashboard
3. Ověřte, že se kód přiřadil v databázi

## 4. Spuštění do produkce

### Před spuštěním ověřte:
- [ ] Webhook endpoint funguje
- [ ] Kódy se správně přiřazují
- [ ] Email notifikace fungují (až bude implementováno)
- [ ] Testovací objednávky prošly úspěšně

### Spuštění:
1. Změňte **Product status** z "Draft" na "Active"
2. Aktualizujte **Search engine listing** aby byl produkt viditelný
3. Přidejte produkt do vhodné kolekce
4. Otestujte celý flow s reálnou objednávkou

## 5. Monitoring

### Co sledovat:
- Vercel logs pro webhook zpracování
- MongoDB pro přiřazené kódy
- Email delivery (až bude implementováno)
- Zásoby nepřiřazených kódů

### Automatické doplňování kódů:
Systém automaticky generuje nové kódy když se zásoby snižují.
