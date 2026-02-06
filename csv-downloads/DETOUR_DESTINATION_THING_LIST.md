# Detour Destination Award – Thing List (batch run)

**Source:** Mock nominations CSV → `add-resolved-thing.js` (Layer 3 batch).  
**Award:** Detour Destination (destination-having-moment).

---

## Resolved things (unique buckets)

| # | Resolved Thing (slug) | Original title / description | Vote count |
|---|------------------------|-----------------------------|------------|
| 1 | `the-city-that-protested-ice-violence-a-month-ago-in-below-temperature-weather` | The city that protested ICE violence a month ago in below temperature weather | 1 |
| 2 | `ice-agents-tried-to-quietly-get-mexican-food-in-minneapolis` | ICE agents tried to quietly get Mexican food in Minneapolis (link) | 1 |
| 3 | `new-york-city` | New York City... Why: Because the mayor is awesome | 1 |
| 4 | `wherever-this-guy-is` | Wherever this guy is (with NYC mayor link) | 1 |
| 5 | `big-island-hawaii` | Big Island Hawaii | 1 |
| 6 | `volcano` | Volcano (Kīlauea link) | 1 |

---

## Thing list (for copy/paste or pivots)

```
the-city-that-protested-ice-violence-a-month-ago-in-below-temperature-weather
ice-agents-tried-to-quietly-get-mexican-food-in-minneapolis
new-york-city
wherever-this-guy-is
big-island-hawaii
volcano
```

---

## Notes

- **#1 and #2** both point to Minneapolis (ICE protest / Mexican food story); different titles → two slugs. A later LLM or manual merge could bucket them as one “Minneapolis” thing.
- **#3 and #4** are both NYC-mayor related; kept separate by the rule-based slug from title.
- **#5 and #6** are Hawaii (Big Island / Volcano); kept separate as “big-island-hawaii” vs “volcano”.
- To get **popularity**: in the resolved CSV, pivot (or SUMIF) by **Resolved Thing** on **Vote Count**. This mock has 1 vote each; with real data you’ll see which things have the most nominations.

**Files:**
- Input: `csv-downloads/mock-detour-destination-nominations.csv`
- Output: `csv-downloads/mock-detour-destination-with-resolved.csv`
