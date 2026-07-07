---
name: wordcount
description: |
  Produce a word-count report for a text file. Use this skill when the user
  asks to count words, generate a word-count report, or measure document
  length.
---

# Wordcount

Given a text file:

1. Inspect the file contents first. Never guess what the file contains.
2. Count the words with `wc -w <file>`.
3. Write the result to `WORDCOUNT.md` in the repository root containing:
   - a `# Word Count Report` heading
   - the file name and its word count
4. Report the word count in your final response.

Never modify the input file. Never delete any files.
