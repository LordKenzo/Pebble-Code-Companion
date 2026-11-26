## Il metodo in C#

**Il codice** · va in `Api/Orders/OrderTotals.cs`, dentro la classe `OrderTotals`, al posto del `TODO`:

```csharp
namespace Shop.Api.Orders;

public record OrderLine(string Sku, int Quantity, decimal UnitPrice);

public static class OrderTotals
{
    public static decimal CalculateTotal(IEnumerable<OrderLine> lines, decimal discountPercent)
    {
        if (discountPercent < 0 || discountPercent > 100)
        {
            throw new ArgumentOutOfRangeException(nameof(discountPercent), "Lo sconto deve essere tra 0 e 100.");
        }

        decimal subtotal = 0m;
        foreach (OrderLine line in lines)
        {
            subtotal += line.Quantity * line.UnitPrice;
        }

        decimal discount = subtotal * discountPercent / 100m;
        decimal total = subtotal - discount;

        return Math.Round(total, 2, MidpointRounding.AwayFromZero);
    }
}
```

Cosa fa, riga per riga:

- `public static decimal CalculateTotal(...)` è il **metodo**, cioè un blocco di codice con un nome che puoi richiamare. Riceve le righe dell'ordine e lo sconto, e restituisce un `decimal`. `decimal` è il tipo di numero adatto ai soldi: non introduce i piccoli errori di calcolo che fanno `double` e `float`.
- `IEnumerable<OrderLine>` vuol dire "qualsiasi elenco di righe", che sia una lista o un array.
- L'`if` controlla che lo sconto sia tra 0 e 100. Se non lo è, lancia un'**eccezione**: un errore esplicito che ferma il calcolo invece di produrre un totale sbagliato in silenzio.
- `subtotal` parte da `0m`. La `m` dice a C# che è un `decimal`.
- Il `foreach` passa su ogni riga e somma quantità × prezzo unitario.
- `discount` è la parte da togliere. Dividi per `100m` perché lo sconto arriva come percentuale.
- `Math.Round(total, 2, MidpointRounding.AwayFromZero)` arrotonda a 2 decimali. Senza `AwayFromZero`, C# arrotonda 5,025 a 5,02 (il cosiddetto "arrotondamento bancario"). Con `AwayFromZero` ottieni 5,03, come ci si aspetta su uno scontrino (`best practice`).

`IEnumerable` non richiede `using`: dal .NET 6 in poi è incluso automaticamente.

**Test che provano che funziona** (`best practice`):

1. Righe 2 × 10,00 e 1 × 5,50, sconto 10: il risultato atteso è **22,95**.
2. Riga 1 × 10,05, sconto 50: il risultato atteso è **5,03**. Se ottieni 5,02, manca `AwayFromZero`.
3. Sconto 120: il metodo deve lanciare `ArgumentOutOfRangeException`.

## Il tipo TypeScript

Va in `web/src/api/orders.ts`:

```ts
export interface OrderLine {
  sku: string;
  quantity: number;
  unitPrice: number;
}
```

- Le chiavi sono in camelCase perché System.Text.Json in ASP.NET Core serializza così per default. Se hai cambiato la naming policy, allineale (`best practice`).
- Il `decimal` di C# diventa `number`, cioè un float: va bene per mostrare i prezzi, ma il totale va calcolato solo sul backend. Se serve precisione esatta lato client, serializza il valore come `string` (`best practice`).

Domanda per verificare di aver capito: con una sola riga 3 × 4,00 e sconto 25, che cosa restituisce `CalculateTotal`?
