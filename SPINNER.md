# Spinner – utilizzo

Componente centralizzato per mostrare un indicatore di caricamento in tutta l’app.

---

## Import

```js
import { Spinner } from '@/components/Spinner';
```

---

## Props

| Prop        | Tipo      | Default   | Descrizione |
|------------|-----------|-----------|-------------|
| `message`  | `string`  | —         | Testo sotto lo spinner (solo se `fullScreen={true}`). |
| `fullScreen` | `boolean` | `true`  | `true` = schermata intera centrata; `false` = solo `ActivityIndicator` (es. dentro bottoni). |
| `size`     | `'small'` \| `'large'` | `'large'` | Dimensione dello spinner. |
| `color`    | `string`  | `colors.tint` | Colore. Se non passato usa il tema (chiaro/scuro). |

---

## Esempi

### Schermata intera (loading page)

Sostituisce il contenuto della schermata finché i dati non sono pronti:

```jsx
if (loading) {
  return <Spinner />;
}
```

Con messaggio:

```jsx
if (loading) {
  return <Spinner message="Caricamento in corso..." />;
}
```

### Spinner nei bottoni (inline)

Dentro un `TouchableOpacity` o `Pressable`, mentre si invia qualcosa:

```jsx
<TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
  {saving ? (
    <Spinner fullScreen={false} size="small" color="white" />
  ) : (
    <ThemedText>Salva</ThemedText>
  )}
</TouchableOpacity>
```

Su sfondo scuro (tema chiaro):

```jsx
<Spinner fullScreen={false} size="small" color="white" />
```

Su sfondo chiaro (tema scuro, testo scuro):

```jsx
<Spinner fullScreen={false} size="small" color={colors.text} />
```

### Colore personalizzato

```jsx
<Spinner color="#ff6600" />
<Spinner fullScreen={false} color="white" />
```

### Dimensione small a schermo intero

```jsx
<Spinner size="small" message="Attendere..." />
```

---

## Dove si usa

- **`fullScreen={true}`** (default): loading di una schermata (es. prima di `loadProfile`, `loadContacts`, `loadStatus`).
- **`fullScreen={false}`**: bottoni (Salva, Accedi, Aggiungi, Attiva, ecc.) mentre la richiesta è in corso.

---

## Tema

Il colore di default (`colors.tint`) segue il tema chiaro/scuro dell’app, quindi non serve passare `color` se vuoi il colore principale del tema.
