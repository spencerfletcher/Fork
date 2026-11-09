# Recipe editing test cases

These are synthetic interface fixtures, not tested cooking recipes. Use them to examine parsing, presentation, scaling and editing. Use your own trusted recipes for actual cooking.

## A — No sections and no extra ceremony

Serves: 2. Makes: leave empty.

Ingredients:

```text
200 g pasta
2 tbsp olive oil
1 lemon, zest and juice
salt to taste
```

Method:

```text
Prepare the pasta according to its packet.

Combine the dressing ingredients and taste.

Toss together and serve.
```

Check: no empty group heading is invented; unparsed qualifiers survive; the editor does not demand a section or yield.

## B — Groups and yield are different from servings

Serves: 6. Makes: 12 buns.

Ingredients:

```text
# Dough
300 g flour
180 ml water
1 tsp salt

# Filling
150 g soft cheese
2 tbsp chopped herbs

# To finish
1 tbsp olive oil
```

Method:

```text
# Prepare the dough
Mix the dough ingredients.

Rest before shaping.

# Assemble
Divide into 12 pieces and add the filling.

# Finish
Brush with the oil.
```

Check: group names and line order survive; step numbers remain understandable across groups. Changing serves from 6 to 3 should make a supported yield of 6 buns. Record how a literal “12 pieces” in the authored method is handled; do not silently assume prose numbers are rewritten.

## C — Literal markers and imperfect input

```text
salt to taste
# Sauce
1 #10 can tomatoes
#10 can beans
#
2 tbsp olive oil
# Finish
```

Check: `#10` is ordinary text, not a section. A bare `#` and an empty final group remain easy to correct. Error feedback should not interrupt someone halfway through naming a section. Distinguish behavior during typing from validation on Save.

## D — Yield scaling boundaries

Use each Makes value independently and change servings to twice the original:

| Makes | Intended check |
| --- | --- |
| `12 buns` | Supported count scales to 24 buns. |
| `1 1/2 L` | Supported mixed number scales to 3 L. |
| `about 1.8 L` | Preserve “about”; supported volume scales to about 3.6 L. |
| `one 9x13 pan` | Keep authored wording and flag that adjustment may be needed. |
| `12 buns at 180°C` | Do not multiply the temperature or pretend this is a simple count. |
| `12–14 buns` | Inspect current handling of ranges; do not invent certainty. |
| `one loaf` | Record whether the unchanged wording is understandable when servings change. |

The existing scale tests at preparation already cover many of these cases. Your job is to judge whether the presented behavior communicates clearly, not duplicate those tests without a new finding.

## E — Small numbers and words that matter

```text
# Base
0.001 kg salt
1/8 tsp spice
1–2 tbsp lemon juice, to taste
200 g butter, divided
zest of 1 lemon
```

Check: half of 0.001 kg is a positive quantity (0.5 g), never “nothing.” Ranges, divided ingredients and unparsed wording must remain meaningful. A description such as “divided” does not by itself identify how much belongs to each step.

## F — Reading and paste resilience

Use one of your own long recipes. Try:

- A long title, long ingredient name and several paragraphs of notes.
- Blank lines and Windows line endings in pasted content.
- Renaming a group after saving, then comparing versions if the local app is available.
- Copying the editor text out and pasting it back.
- Looking up an ingredient after scrolling several steps into the method.
- Editing and navigating with a keyboard instead of the pointer.

Record observed behavior separately from desired behavior. Avoid treating a static screenshot as a working test.
