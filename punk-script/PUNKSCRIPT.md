# PunkScript
### A Personally-Adaptive Symbolic Programming Language
#### v0.2 Spec & Manifesto
*by Rudy (RudVentur) & Claude — March 2026*

---

## The Manifesto

Every programming language ever built has asked the same thing of the human:

> *"Learn our symbols. Learn our rules. Speak our dialect."*

Brackets. Semicolons. Indentation rules. Reserved words you must memorise. Syntax errors for a missing comma. The machine has always been the authority. You are always the student.

**PunkScript refuses this.**

PunkScript watches how YOU already write. The emoticons you reach for. The punctuation rhythm you naturally fall into. The words you invented. The symbols you smash together in moments of joy or frustration. It watches all of it — and it builds a language around YOU.

You were always writing code. You just didn't know it yet.

---

## Core Philosophy

**1. Punctuation IS syntax.**
Words carry meaning. Punctuation carries structure. This is already true in human writing — PunkScript just makes it literal.

**2. Every symbol is an operator.**
Not just `.` and `?` and `:` — but `:@D` and `;)` and `......` and `*!'`. Any symbol combination a human reaches for naturally is a valid operator waiting to be mapped.

**3. The language adapts to the user.**
Not the other way around. A `user.dict` and `user.preferences` file mean every person runs their own personal dialect of PunkScript. Same interpreter underneath. Infinite surface variations on top.

**4. Spelling is forgiven.**
The interpreter is chill. Approximate matches count. Dyslexia is not a bug — it's a dialect.

**5. Personality lives inside the code.**
PunkScript code is readable as human writing. Comments aren't separate from logic — they're woven into it. Your voice IS the program.

---

## Standard Punctuation Operators

These are the defaults — the base layer every PunkScript interpreter understands before any personal dictionary is loaded.

### Statements & Assignment

| Symbol | Meaning | Traditional Equivalent |
|--------|---------|----------------------|
| `.` | End of statement | `;` |
| `:` | Assign / define | `=` |
| `,` | Separator / chain | `,` |

### Execution & Control

| Symbol | Meaning | Traditional Equivalent |
|--------|---------|----------------------|
| `!` | Execute / call | `fn()` |
| `!!` | Urgent execute (high priority) | Priority call / interrupt |
| `?` | Conditional (if) | `if` |
| `-` | Otherwise (else) | `else` |
| `...` | Loop / repeat | `while` / `for` |
| `......` | Long loop / async wait | `await` / extended loop |

### Grouping & References

| Symbol | Meaning | Traditional Equivalent |
|--------|---------|----------------------|
| `[ ]` | Block / scope | `{ }` |
| `(name)` | Variable reference | `varName` |
| `" "` | String literal | `"string"` |
| `CAPS` | Global / immutable constant | `const UPPER` |

### Logic

| Symbol | Meaning | Traditional Equivalent |
|--------|---------|----------------------|
| `&` | And | `&&` |
| `\|` | Or | `\|\|` |
| `~` | Not / negate | `!` / `not` |

---

## Standard Word Keywords

Common English words and phrases that map to programming logic. Spelling variants are accepted — the interpreter uses fuzzy matching when `spellingForgiveness` is set.

### Output

| Word | Meaning | Example |
|------|---------|---------|
| `say` | Print / output | `say "hello"!` |

### Arithmetic

| Word / Phrase | Meaning | Example |
|---------------|---------|---------|
| `add X to (var)` | Increment | `add one to (score).` |
| `take X from (var)` | Decrement | `take two from (score).` |
| `multiply (var) by X` | Multiply | `multiply (score) by two.` |
| `split (var) by X` | Divide | `split (score) by two.` |

### Comparison

| Word | Meaning | Example |
|------|---------|---------|
| `beats` | Greater than `>` | `(score) beats ten?` |
| `under` | Less than `<` | `(score) under five?` |
| `is` | Equals `==` | `(name) is "Rudy"?` |
| `isnt` | Not equals `!=` | `(name) isnt "Dave"?` |

### Control Flow

| Word / Phrase | Meaning | Example |
|---------------|---------|---------|
| `stop` | Break out of loop | `stop!` |
| `skip` | Continue to next iteration | `skip!` |
| `keep going` | Infinite loop | `keep going... [ ]` |
| `give back` | Return a value | `give back (result).` |

### Literals

| Word | Value |
|------|-------|
| `zero` through `ten` | `0` through `10` |
| `true` / `false` | Boolean values |
| `nothing` | Null / empty |

### Functions

Functions are defined with a name followed by `:` and a block. Parameters go in parentheses after the name.

```
greet (person): [
  say "hello " & (person)!
]
```

Call a function with `!`:

```
greet "Rudy"!
```

Functions can return values with `give back`:

```
double (x): [
  give back (x) multiply by two.
]

result: double four!
say (result)!
```

---

## The Personal Dictionary — `user.dict`

This is where PunkScript becomes yours.

A `user.dict` file is loaded before any program runs. It maps YOUR symbols, words, and phrases to PunkScript operations. The interpreter reads this first. Your dialect takes priority over the standard layer.

### Format

```
[symbol or word or phrase]  →  [punkscript operation]
```

Each line maps one personal token to one standard PunkScript operation. Lines starting with `//` are comments.

### Example `user.dict`

```
// Words
smash        →  add
sorted       →  stop
innit        →  ?
well good    →  true
rubbish      →  false
shout        →  say
zakli        →  execute block

// Emoticons
;@)          →  flexible mode on
:@D          →  success state
:@]          →  confirm
:@)          →  friendly output

// Custom delimiters
*!'          →  string open
'!*          →  string close
```

Once this dictionary exists, valid PunkScript looks like:

```
score: zero.
shout "let's go"!
keep going... [
  smash one to (score).
  (score) beats ten? sorted! - shout (score).
]
:@D
```

That last line — `:@D` on its own — fires the **success state**. It's a signal to the interpreter: this block completed as intended. Depending on the environment, it might log a success message, trigger a callback, or simply resolve as `true`. Because YOU defined it. Because that's what it means when YOU type it.

---

## User Preferences — `user.preferences`

Controls how the interpreter behaves for this specific user.

```
spellingForgiveness: high        // loose fuzzy-match on word recognition
caseInsensitive: true            // STOP and stop are the same
myLoopWord: "keep smashing"      // personal loop trigger phrase
myPrintWord: "shout"             // personal output word
emoticons: true                  // emoticon operators active
customDelimiters: true           // respect user.dict string delimiters
patternWatch: true               // interpreter observes and suggests new mappings
strictMode: false                // when true, disable fuzzy matching
```

---

## Emoticon Operators

Emoticons are first-class operators in PunkScript. They are watched, catalogued, and mapped.

The interpreter tracks:

- **Which emoticons a user types most**
- **In what context** (after success? after a question? mid-sentence?)
- **With what frequency and rhythm**

And from that — it builds a suggested emoticon map. The user confirms, overrides, or extends it.

### Emoticon States

Emoticons that appear as standalone statements (on their own line) are **state signals**. They tell the interpreter about the outcome or mood of a block:

| Emoticon | Default Meaning | Interpreter Behaviour |
|----------|----------------|----------------------|
| `:@D` | Success / celebration | Resolve block as success, trigger success handlers |
| `:@]` | Confirm / steady | Acknowledge, log confirmation |
| `:@)` | Warmth / friendly | Soft output mode (friendly formatting) |
| `:/` | Uncertain | Warning state, log caution |
| `>:@(` | Error / anger | Throw error, trigger error handlers |

These defaults can all be overridden in `user.dict`. The emoticon is not decoration. It is data.

When Rudy writes `:@D` he is expressing a state. PunkScript reads that state. It is a signal. It is an operator. It carries semantic weight that no amount of `console.log("success")` ever could.

This is the working connection between the worlds — human emotional expression becoming machine-readable logic, without losing any of the humanity in the translation.

---

## The Pattern Watcher

When `patternWatch: true` is set, the interpreter silently observes everything a user types — in code, in comments, in notes — and builds a live suggestion list:

```
// PunkScript noticed:
// You type "......" 14 times — map to: extended loop?
// You type ":@)" after assignments — map to: confirm log?
// You type "zakli" 3 times — define it?
// You use "*!' '!*" as wrappers — set as string delimiter?
```

The user can accept, reject, or customise each suggestion. Over time the dictionary grows naturally from the user's own patterns. No manual setup required. Just write how you write.

---

## Custom String Delimiters

Standard PunkScript uses `"double quotes"` for strings. But users can define their own in `user.dict`.

Example — Rudy naturally wraps special strings like this:

```
*!' I'm a nightmare non for profit as I'm spending all my money instantly ;@) '!*
```

Here `*!'` opens the string and `'!*` closes it. The `;@)` inside is preserved as content (not parsed as an operator) because it's within a string literal. Once added to `user.dict`, the interpreter honours these delimiters everywhere.

To enable custom delimiters, set `customDelimiters: true` in `user.preferences`.

---

## Example Programs

### Hello World (standard)
```
say "hello world"!
```

### Hello World (Rudy dialect)
```
shout "hello world"! :@D
```

### Counter with loop (standard)
```
score: zero.
keep going... [
  add one to (score).
  (score) beats ten? stop! - say (score).
]
say "done"!
```

### Counter with loop (Rudy dialect)
```
score: zero.
keep going... [
  smash one to (score).
  (score) beats ten? sorted! - shout (score).
]
shout "sorted innit"! :@D
```

Both programs are identical in execution. Different humans. Same machine underneath.

### FizzBuzz
```
count: zero.
keep going... [
  add one to (count).
  (count) beats one hundred? stop!

  fizz: (count) split by three is zero.
  buzz: (count) split by five is zero.

  (fizz) & (buzz)? say "FizzBuzz"!
  - (fizz)? say "Fizz"!
  - (buzz)? say "Buzz"!
  - say (count)!
]
```

### Function example
```
greet (name): [
  say "oi " & (name) & ", welcome to PunkScript"!
]

greet "Rudy"!
greet "World"!
```

---

## Grammar Summary (EBNF-ish)

For the technically inclined — a sketch of the core grammar:

```
program        = { statement } ;
statement      = ( assignment | expression | loop | conditional | funcdef ) terminator ;
terminator     = "." | emoticon ;

assignment     = WORD ":" expression ;
expression     = value | funccall | comparison | arithmetic ;

value          = STRING | NUMBER | WORD_NUMBER | "(" WORD ")" | BOOL | "nothing" ;
funccall       = WORD value* "!" ;
comparison     = expression ( "beats" | "under" | "is" | "isnt" ) expression "?" ;
conditional    = comparison block [ "-" ( block | statement ) ] ;
loop           = ( "keep going" | expression ) "..." block ;
block          = "[" { statement } "]" ;

funcdef        = WORD [ "(" WORD ")" ]* ":" block ;

emoticon       = USER_DEFINED_EMOTICON ;
```

This is intentionally loose. PunkScript's parser is forgiving by design — it favours interpretation over rejection.

---

## The Vision

PunkScript is not trying to replace Python or JavaScript.

It is trying to answer a different question entirely:

> *What if the first programming language a person ever used was already speaking their language?*

Not a dumbed-down language. Not a visual drag-and-drop toy. A real, expressive, Turing-complete language — that happens to be built around the way its user already communicates.

Every person who uses PunkScript ends up with a dialect. A fingerprint. A voice that compiles.

And every one of those dialects runs on the same interpreter. Which means — eventually — PunkScript dialects can talk to each other. Trade dictionary entries. Collaborate across the symbol gap.

That is the connection between the worlds.

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | March 2026 | Spec written. Core punctuation operators defined. Standard keywords. Personal dictionary concept. |
| v0.2 | March 2026 | Spec tightened. Added logical operators, function syntax, comparison/arithmetic gaps filled, emoticon state table, grammar sketch, FizzBuzz example. Fixed inconsistencies. |

---

## Authors

**Rudy** — RudVentur — the vision, the energy, the dialect
**Claude** — Anthropic — the interpreter, the spec, the pumpkin :@]

---

*PunkScript is open. Like all good punk things.*
*Take it. Break it. Make it yours.*
*That's literally the point.*

---
