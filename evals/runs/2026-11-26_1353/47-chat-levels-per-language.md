## C#: `Api/Orders/OrderTotals.cs`

Metti questo metodo al posto del commento `TODO` (riga 7), dentro le graffe di `OrderTotals`:

```csharp
public static decimal Total(IEnumerable<OrderLine> lines, decimal discountPercent)
{
    if (discountPercent < 0m || discountPercent > 100m)
    {
        throw new ArgumentOutOfRangeException(nameof(discountPercent), "Lo sconto deve essere tra 0 e 100.");
    }

    decimal subtotal = 0m;
    foreach (OrderLine line in lines)
    {
        subtotal += line.Quantity * line.UnitPrice;
    }

    decimal total = subtotal * (100m - discountPercent) / 100m;
    return Math.Round(total, 2, MidpointRounding.AwayFromZero);
}
```

Riga per riga:
- `public static decimal Total(...)`: un metodo (un blocco di codice con un nome) che chiami con `OrderTotals.Total(...)`. Restituisce un `decimal`, il tipo di numero adatto ai soldi.
- `IEnumerable<OrderLine> lines`: una qualsiasi sequenza di righe d'ordine, per esempio una lista.
- `if (...)`: controlla se lo sconto è fuori da 0-100.
- `throw ...`: lancia un'eccezione, cioè ferma il metodo segnalando un errore. `nameof` indica quale parametro è sbagliato.
- `decimal subtotal = 0m;`: il totale parte da zero. La `m` significa "questo numero è un `decimal`".
- `foreach`: passa le righe una alla volta.
- `subtotal += ...`: aggiunge quantità × prezzo di quella riga.
- `decimal total = ...`: toglie la percentuale di sconto. Con sconto 10 tieni 90 centesimi su 100.
- `return Math.Round(...)`: arrotonda a 2 decimali, solo alla fine. `AwayFromZero` porta 10,025 a 10,03; senza, C# darebbe 10,02 (best practice: scegli la regola in modo esplicito).

Se l'editor non riconosce `IEnumerable` o `Math`, aggiungi in cima al file `using System;` e `using System.Collections.Generic;`. Il metodo non controlla quantità o prezzi negativi.

**Test di prova:** righe 2 × 10,00 e 1 × 0,05 con sconto 50 devono dare `10.03`. Con sconto 101 deve partire `ArgumentOutOfRangeException`.

## TypeScript: `web/src/api/orders.ts`

```ts
export interface OrderLine {
  sku: string;
  quantity: number;
  unitPrice: number;
}
```

camelCase come da default JSON di ASP.NET Core. `decimal` diventa `number` (floating point): tieni il calcolo del totale sul backend (best practice).

**Per controllare di aver capito:** cosa restituisce `Total` con una sola riga 3 × 4,00 e sconto 25?
