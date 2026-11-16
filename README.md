# IELTS Mock Builder

Build your own IELTS-style computer mock tests and practise them on a screen that looks and works like the real exam.

Most candidates practise from books and PDFs, then meet the computer-delivered test for the first time on exam day. IELTS Mock Builder lets you turn any practice material into a full Listening, Reading and Writing mock, then take it in an exam-like interface with a timer, highlighting, notes and instant marking.

> **Disclaimer:** This is an independent practice tool. It is not affiliated with or endorsed by IELTS, the British Council, IDP or Cambridge University Press & Assessment. "IELTS" is a registered trademark of its owners.

---

## Features

### Builder
- **Listening:** upload one recording (MP3, M4A, WAV…) and add questions across 4 parts.
- **Reading:** add 3 passages by typing them or by **scanning a photo** with built-in OCR (text recognition), then add their questions.
- **Writing:** add Task 1 (with an optional chart, graph, map or diagram image) and Task 2.
- **Question types** covering everything used in the Academic test:
  - Gap completion: notes, forms, tables, sentences, summaries, flow-charts, short answers (with an optional word list shown as drop-downs)
  - TRUE / FALSE / NOT GIVEN and YES / NO / NOT GIVEN
  - Multiple choice (one answer)
  - Multiple choice (choose TWO or THREE)
  - Matching: headings (i, ii, iii…), information, features, sentence endings, map / plan / diagram labelling
- **Live preview** of every question group exactly as it will look in the test.
- **Automatic numbering** and "Questions X–Y" headings.

### Fixed IELTS structure
The builder enforces the real Academic format, and a section can only be started once it is complete:

| Section   | Structure                                    | Time            |
|-----------|----------------------------------------------|-----------------|
| Listening | 4 parts × exactly 10 questions, 1 recording  | Audio length + 2 min |
| Reading   | 3 passages, exactly 40 questions in total    | 60 min          |
| Writing   | Task 1 (150+ words), Task 2 (250+ words)     | 60 min          |

### Marking
- Several **accepted answers** per question (e.g. `colour` and `color`, `10` and `ten`).
- **Optional words** in brackets: `(the) museum` accepts "museum" and "the museum".
- **Case-sensitive** option per answer.
- Choose-TWO/THREE questions score one mark per correct letter, in any order.
- Instant score out of 40 with an approximate band, plus a review screen showing right and wrong answers.
- Writing is not marked automatically; the result screen shows word counts and the text to copy for feedback.

### Exam-like test screen
- Countdown timer (minutes and seconds)
- Passage on the left, questions on the right, with a draggable divider
- Bottom question navigator showing answered questions, plus next/previous arrows
- Listening audio plays once with no pausing
- **Highlight** and **Note** menu appears as soon as you select text
- Submit button with an unanswered-question warning

### Saving and sharing
- Mocks save automatically in your browser (IndexedDB).
- **Export** a mock to a `.ielts-mock.json` file (audio and images included) to back it up or share it.
- **Import** a mock file, and **Duplicate** a mock to make variations.

---

## Getting started

No installation or build step is needed.

1. Download or clone this repository.
2. Open `index.html` in **Google Chrome** or **Microsoft Edge**.
3. Press **Create your own mock test** and follow the steps:
   1. Name
   2. Listening
   3. Reading
   4. Writing
   5. Answers
   6. Check & take
4. When a section is complete, its box on the home page turns green with a **▶ Start** button.

### Writing questions: quick reference
In a gap-completion group:

| Type this                  | To get                         |
|----------------------------|--------------------------------|
| `___` (three underscores)  | An answer box (auto-numbered)  |
| `- ` at the start of a line | A bullet point                 |
| `# ` at the start of a line | A bold sub-heading             |
| `Cell 1 \| Cell 2 \| Cell 3` | A table row (first row = headings) |

In passages, leave an empty line between paragraphs. Lettered paragraphs can start with the letter, e.g. `A  The first paragraph…`.

---

## OCR (scan from photo)

Text scanning uses **[Tesseract.js](https://github.com/naptha/tesseract.js)** (Apache-2.0), an open-source OCR engine that runs entirely in the browser.

- The OCR engine (about 10 MB) downloads from the jsDelivr CDN the first time you scan, so an internet connection is needed once. Everything else works offline.
- Photos are automatically upscaled, converted to greyscale and contrast-adjusted before reading, and broken lines are joined back into paragraphs.
- Tick **Keep every line break** when scanning lists of questions or options.
- OCR fills in text only. Question types and correct answers are always set by you, so a misread can never silently corrupt the answer key.

---

## Project structure

```
IELTS Mock Builder/
├── index.html        Home page: introduction and list of saved mocks
├── builder.html      Step-by-step mock editor
├── take.html         Test screen (loads a mock and runs it)
└── assets/
    ├── spec.js       IELTS structure, question types, validation rules
    ├── store.js      IndexedDB storage, import/export
    ├── builder.js    Editor interface
    ├── compile.js    Converts a saved mock into the test-screen format
    ├── player.js     Test screen: timer, navigation, highlights, marking
    ├── ocr.js        Photo-to-text scanner (Tesseract.js)
    ├── mock.css      Home and builder styles
    └── player.css    Test screen styles
```

Built with plain HTML, CSS and JavaScript: no frameworks and no build tools.

---

## Limitations

- Mocks are stored in the browser they were made in. Clearing browser data deletes them, so **export anything you want to keep**.
- There are no user accounts or online sync yet; share mocks with Export / Import.
- The Speaking test is not included, since it is taken with a human examiner.

## Ideas for the future
- Drag-and-drop matching questions
- Practice mode with pause and replay for Listening
- AI feedback and band scores for Writing
- Hosting as a website with accounts

## Copyright note
Only share mocks made from your own original material. Passages, questions and audio from published books (for example the Cambridge IELTS series) are copyrighted and should be used for personal practice only.
