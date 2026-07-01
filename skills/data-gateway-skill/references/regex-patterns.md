# Regex Patterns Reference — Data Gateway Validation

Use these in `POST /uds/v1/data-validations` → `validations[].value`.
Always escape backslashes in JSON strings (e.g. `\d` → `\\d`).

---

## Email

```
^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$
```

JSON value: `"^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$"`

## Phone — E.164 International

```
^\+[1-9]\d{7,14}$
```

JSON value: `"^\\+[1-9]\\d{7,14}$"`

## URL (http/https)

```
^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$
```

JSON value: `"^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$"`

## UUID v4

```
^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$
```

## Positive decimal (price)

```
^\d+(\.\d{1,2})?$
```

JSON value: `"^\\d+(\\.\\d{1,2})?$"`

## ISO Date (YYYY-MM-DD)

```
^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$
```

## Alphanumeric slug (URL-safe)

```
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

## Custom SKU (2 uppercase + dash + 4 digits)

```
^[A-Z]{2}-\d{4}$
```

JSON value: `"^[A-Z]{2}-\\d{4}$"`

## US Zip Code

```
^\d{5}(-\d{4})?$
```

## Hex Color

```
^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$
```

---

## Building Custom Patterns

Ask user for 3 valid and 2 invalid examples, then build the pattern.

Key pieces:

- `^...$` — always anchor start/end
- `\d{N}` — exactly N digits (JSON: `\\d{N}`)
- `[A-Z]+` — one or more uppercase letters
- `(...)?` — optional section
- `(A|B)` — either A or B
- `[a-zA-Z0-9]` — alphanumeric

Always present and explain the pattern to the user before applying it.
Test against both valid and invalid examples before confirming.
