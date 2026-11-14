# Writing guide: articles, posts and series

Rules and best practices for writing content on this blog. It combines published
guidance on technical and web writing (see [Sources](#sources)) with the
conventions this codebase already enforces.

Each rule cites where it comes from, so you can tell research findings from
practitioner opinion. Rules marked **Project** come from how this site renders
content.

## Contents

- [Pick the format first](#pick-the-format-first)
- [Rules for every piece](#rules-for-every-piece)
- [Articles](#articles)
- [Posts](#posts)
- [Series](#series)
- [Project conventions](#project-conventions)
- [Checklist before publishing](#checklist-before-publishing)
- [Sources](#sources)

---

## Pick the format first

| | Article | Post | Series |
| --- | --- | --- | --- |
| What it is | Long-form deep dive, read end to end | Short note or quick take | Ordered collection of existing articles and posts |
| Reader's goal | Understand a topic properly | Get one useful thing quickly | Learn a topic from basics to advanced |
| Scope | One topic, several sections | One idea, tip, benchmark or opinion | One learning path |
| Current length on this site | 8–30 minutes | 5–10 minutes | 2–4 parts |
| Cover image | Yes | No (text-first) | Yes |

How to choose:

- **You can state the point in one sentence and support it in a few
  paragraphs:** write a post.
- **The reader needs background, examples and trade-offs to get it:** write an
  article.
- **The topic has several parts that each stand alone but build on each
  other:** write the parts as articles and posts, then group them in a series.

Don't stretch a post into an article. Short posts that cover a few things are
fine, and extra material can become another post (Julia Evans).

Decide which kind of piece it is before writing, because mixing kinds weakens
each one (Diátaxis):

| Kind | Purpose | Typical format here |
| --- | --- | --- |
| Tutorial | Teach by having the reader do something | Article, or a series |
| How-to | Solve a specific real-world problem for a competent reader | Post or article |
| Explanation | Give context and answer "why?" | Article |
| Note / TIL | Share something you just learned | Post |

---

## Rules for every piece

### Before you write

1. **Pick one specific reader.** Write for a friend or your past self, not for
   everyone. Explaining every basic concept produces a piece that suits no one
   (Julia Evans). Work out what that reader already knows and what they need to
   learn (Google Technical Writing One).
2. **Write down the key point in one sentence.** It is the single thing a reader
   should take away even if they read only one sentence (NN/g, inverted
   pyramid). If you can't write it, the piece isn't ready.
3. **Outline first.** Alternatively, write freely and then reorganize (Google
   Technical Writing Two).
4. **You don't need to be original or an expert.** One or two things your
   reader doesn't know are enough, and recently learned things count (Julia
   Evans, Simon Willison).

### Structure

5. **Get to the point.** The title and first three sentences must answer two
   questions: is this for me, and what will I gain? (Michael Lynch).
6. **Lead with the conclusion.** Put the most important information first, then
   supporting detail, then background (NN/g). Don't pre-announce content
   ("In this article we will…") in place of saying it (Google style guide).
7. **Write for scanners.** In NN/g's study, 79% of users scanned a new page and
   16% read word by word. So:
   - use descriptive headings, not clever ones
   - keep one idea per paragraph
   - open each paragraph with its main point
   - use bulleted lists for parallel items
8. **Choose headings that describe what the reader gets or does**, not internal
   labels. "Why the cache misses" is better than "CacheLine struct" (Google
   Technical Writing Two, GDQuest).
9. **Test the skim view.** Read only the headings and images. They should tell
   the story on their own (Michael Lynch).
10. **Order by prerequisite.** Concepts a reader needs come before the content
    that uses them (Write the Docs).

### Language

11. **Cut the word count.** In NN/g's tests, text with about half the words
    scored 58% better on usability, and concise, scannable and objective
    writing combined scored 124% better.
12. **Use neutral language.** Promotional or exaggerated wording lowered
    usability, because readers had to filter the hype to find the facts (NN/g).
13. **Use active voice and address the reader as "you"** (Google style guide).
14. **One idea per sentence.** Convert long sentences to lists (Google Technical
    Writing One).
15. **Define new terms and then use them consistently.** Don't call the same
    thing by two names. Unexplained jargon makes readers assume the piece isn't
    for them (Google Technical Writing One, Michael Lynch).
16. **Mark what you're unsure of.** Use "I think" or "my understanding is", and
    correct the piece later if needed (Julia Evans).
17. **Write for a global audience.** Avoid idioms and culture-specific
    references. This also makes translation into ru and uz easier (Google style
    guide).

### Formatting

18. **Sentence case for titles and headings** (Google style guide).
19. **Numbered lists for steps, bulleted lists for everything else.** Keep list
    items parallel, and start step items with an imperative verb (Google
    Technical Writing One).
20. **Code-related text in `code font`** (Google style guide).
21. **Descriptive link text.** "See the MDN guide to SVG paths", never "click
    here" (Google style guide).

### Code samples

22. **Keep samples accurate, short and easy to understand.** Run every sample
    before publishing (Google Technical Writing Two).
23. **Comment the why,** plus edge cases and performance implications. Don't
    restate what the line does (GDQuest).
24. **Show an anti-example when it helps:** the wrong way next to the right way
    (Google Technical Writing Two).
25. **When changing code shown earlier, make the change easy to spot** (GDQuest).

### Visuals

26. **Add pictures.** Screenshots, graphs and diagrams give the best return on
    effort and break up long text (Michael Lynch).
27. **One idea per diagram.** Limit the information in a single drawing, and
    point the reader at the relevant part (Google Technical Writing Two).
28. **Prefer simple hand-made diagrams to AI-generated images** (Michael Lynch,
    opinion).
29. **Give every image alt text** (Google style guide).

### Editing

30. **Read the draft out loud** (Google Technical Writing Two).
31. **Reread as your chosen reader.** Look for places where you assumed
    knowledge they don't have.
32. **Keep it current.** Incorrect content does more harm than missing content
    (Write the Docs). Update or mark outdated pieces.

---

## Articles

An article is read end to end, so it needs a clear path through the topic.

**Structure that works:**

1. **Opening (2–4 sentences):** the problem, who it's for, and what the reader
   will be able to do or understand afterwards.
2. **Background:** only what the reader needs for the next section. Link out for
   the rest.
3. **Main sections:** one concept per `##` section, ordered so each builds on
   the last.
4. **Worked example:** code, numbers or a diagram that shows the idea working.
5. **Trade-offs and limits:** when the approach is the wrong choice.
6. **Closing:** summarize what was covered and suggest where to go next
   (GDQuest).

**Rules:**

- State scope early: what the article covers and what it doesn't (Google
  Technical Writing One).
- For tutorials, show the finished result near the top, and list prerequisites
  with links (GDQuest).
- In tutorials, keep explanation short and link to deeper material. In
  explanation pieces, answer "why" and give context (Diátaxis).
- In step-by-step tutorials, the reader's project should work at the end of
  every section, even if it does little yet (GDQuest).
- Use `##` for main sections and `###` for subsections. The "On this page" rail
  is built from them, so headings are the reader's map.

---

## Posts

A post delivers one thing quickly. The archive describes posts as fitting in a
coffee break.

**Good post types:**

- **TIL:** something you just figured out. The framing doesn't promise a full
  tutorial, only useful notes (Simon Willison).
- **Tip or how-to:** one problem, one solution.
- **Benchmark or comparison:** method, numbers, conclusion.
- **Opinion or lesson learned:** a claim, the reasoning, and when it doesn't
  apply.
- **Project write-up:** a few paragraphs and a screenshot of something you
  built (Simon Willison).

**Rules:**

- **One idea per post.** If you find a second idea, write a second post.
- **Answer first.** Put the result, tip or conclusion in the opening paragraph,
  then support it.
- **Two to four `##` headings are plenty.** Very short posts need none.
- **Don't pad.** Skip long introductions and background the reader didn't ask
  for.
- **Publish instead of polishing forever.** You can't predict which posts will
  resonate, so publishing often beats waiting for a perfect one (Julia Evans).

---

## Series

On this site a series doesn't contain content of its own. It is an ordered list
of existing articles and posts, and each part stays a normal standalone piece
with its own URL.

**Planning:**

- **Only make a series when there really is more than one part.** Don't split
  one article to create a series.
- **Plan the order before writing.** Start with fundamentals such as terms and
  setup, and move towards advanced parts.
- **Teach one concept per part,** ordered to minimize friction for the reader
  (GDQuest).
- **Keep it short.** One blog suggests 3–7 parts and splitting anything longer.
  Treat that as a rule of thumb, not a tested finding.
- **Consider drafting all parts before publishing the first.** It keeps terms,
  examples and depth consistent.

**Each part:**

- **Must stand alone.** Readers also arrive from search or the archive, outside
  the series. Each part needs its own introduction that says what this part
  covers (GDQuest).
- **States its prerequisites and links to them,** instead of saying "as we saw
  last time".
- **Ends with a short recap and a pointer to what comes next.** The site already
  renders previous and next links, so the text doesn't need "Part 3" labels.
- **Uses the same terms and running example as the other parts.**
- **Don't put part numbers in titles.** A piece can belong to more than one
  series, and its position can change.

**The series itself:**

- **Title:** name the learning outcome, for example "Systems Performance from
  First Principles".
- **Summary:** one or two sentences on what the reader will be able to do after
  finishing, and who it's for.
- **Order:** every part should be readable with only the earlier parts as
  background.

---

## Project conventions

These come from how this site stores and renders content.

**Files**

- One folder per piece, with a shared `meta.yml` and one file per language:

  ```
  content/<articles|posts|series>/<slug>/
    meta.yml   id, originalLocale, publishedAt, tags, cover (series: items)
    en.mdx     frontmatter: title, summary, status; then the body
    ru.mdx
    uz.mdx
  ```

- The folder gives the type and slug. Use one Latin, lower-case, hyphenated slug
  shared by all languages.
- `id` never changes, even if you rename the slug. Series list their parts by id.
- The `originalLocale` file must exist. A missing translation is just a missing
  file: readers in that language see a published version with a notice.
- `status: draft` keeps a translation hidden. Readers in that language see a
  published version, with a notice that their translation is coming soon.
- Reading time is calculated from the body; don't write it by hand.
- Every file is validated. A typo fails `next build` (and the pre-commit hook)
  with the file and field that are wrong.

Example `meta.yml` and `en.mdx`:

```yaml
# content/posts/vim-commands/meta.yml
id: p-vim
originalLocale: en
publishedAt: 2023-10-01
tags: [tooling, productivity]
```

```mdx
---
title: "10 Vim commands that will save you hours"
summary: "The Vim motions with the biggest payoff for everyday editing."
status: published
---

Body starts here.
```

**Metadata**

- **Title:** specific and searchable, in sentence case. It is rendered as the
  page's `h1`.
- **Summary:** one or two sentences stating the benefit. Cards cut it off after
  two lines, so put the important words first.
- **Tags:** lower-case, and reuse existing tags where possible. The tag filter
  matches lower-case tags only.

**Body (MDX)**

- **Don't use `#` (h1) in the body.** The title is already the `h1`.
- **Use `##`, `###` and `####` for structure.** These three levels build the
  "On this page" rail. Don't skip levels.
- **Heading text becomes the anchor link.** Changing a heading later breaks
  links to that section.
- **Keep headings short** so they fit in the rail without wrapping.
- **Give every code block a language** (` ```ts `, ` ```bash `) so it gets
  syntax highlighting.
- **Tables** work (GitHub-flavored Markdown). Wide tables scroll sideways on
  phones, so keep them to a few columns.
- **Images** need alt text.

**Translations**

- Translate meaning, not word by word.
- Keep code, commands and identifiers unchanged.
- Keep the same headings structure in every language, so the rail matches.

---

## Checklist before publishing

- [ ] I can state the key point in one sentence, and it appears in the first
      paragraph.
- [ ] The title and first three sentences say who this is for and what they
      gain.
- [ ] The format matches the content (article, post or part of a series).
- [ ] Reading only the headings tells the story.
- [ ] Each paragraph has one idea and opens with it.
- [ ] New terms are defined and used consistently.
- [ ] I cut every sentence the reader wouldn't miss.
- [ ] No promotional or exaggerated wording.
- [ ] Every code sample was run and has a language set.
- [ ] Every image has alt text.
- [ ] Links have descriptive text and work.
- [ ] Title is sentence case; summary is at most two sentences; tags are
      lower-case.
- [ ] No `h1` in the body; heading levels aren't skipped.
- [ ] For a series part: it makes sense without the other parts, and its
      prerequisites are linked.
- [ ] I read it out loud once.

---

## Sources

Read in full for this guide:

- [Google developer documentation style guide: highlights](https://developers.google.com/style/highlights)
- [Google Technical Writing One: summary](https://developers.google.com/tech-writing/one/summary)
- [Google Technical Writing Two: summary](https://developers.google.com/tech-writing/two/summary)
- [Nielsen Norman Group: How Users Read on the Web](https://www.nngroup.com/articles/how-users-read-on-the-web/)
  (source of the 79%, 58% and 124% figures)
- [Nielsen Norman Group: Inverted Pyramid](https://www.nngroup.com/articles/inverted-pyramid/)
- [Michael Lynch, Refactoring English: How to Write Blog Posts that Developers Read](https://refactoringenglish.com/chapters/write-blog-posts-developers-read/)
- [Diátaxis: Start here](https://diataxis.fr/start-here/)
- [Julia Evans: Some blogging myths](https://jvns.ca/blog/2023/06/05/some-blogging-myths/)
- [Simon Willison: What to blog about](https://simonwillison.net/2022/Nov/6/what-to-blog-about/)
- [Write the Docs: Documentation principles](https://www.writethedocs.org/guide/writing/docs-principles/)
- [GDQuest: Tutorial structure guidelines](https://gdquest.gitbook.io/gdquests-guidelines/creating-tutorials/tutorial-structure-guidelines)

Seen only as search summaries, not opened:

- The 3–7 parts suggestion, the "only when there is more than one part" rule and
  the advice to draft all parts first come from individual blog posts on
  organizing content into series.

How strong the evidence is:

- **Measured research:** the NN/g findings on scanning, concise text and
  objective language. Note that the reading study is old, although NN/g still
  publishes it.
- **Established style guides:** Google's style guide and courses, Write the
  Docs, Diátaxis.
- **Practitioner opinion:** Michael Lynch, Julia Evans, Simon Willison, GDQuest.
  Useful, but based on personal experience.
