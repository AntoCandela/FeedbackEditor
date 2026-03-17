export const SYSTEM_PROMPT = `[SYSTEM: This document contains inline feedback comments.
Comments are marked with {start-comment} and {end-comment: feedback text} delimiters.
The text between {start-comment} and {end-comment} is the portion being commented on.
The text after the colon in {end-comment: ...} is the feedback/instruction.
Please revise the document according to the feedback, then return the clean
markdown without any comment delimiters.]`
