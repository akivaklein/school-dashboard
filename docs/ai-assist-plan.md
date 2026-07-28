# AI Assist Future Plan (Not Implemented in This Branch)

## Purpose
Provide optional writing assistance for school staff in note-heavy workflows while preserving factual accuracy and user control.

## Target Actions
- Fix spelling and grammar
- Make professional
- Make concise
- Create a sentence from keywords

## Scope Candidates
- Student notes
- Behavior observations
- Progress updates
- Parent call notes
- Flags and support notes
- Therapy/session notes
- Announcements
- Teacher comments
- To-do descriptions

## Safety and Accuracy Rules
- Preserve all facts from the original text.
- Never invent events, diagnoses, motivations, dates, or people.
- Never infer clinical conclusions that are not already present.
- Keep student identifiers and sensitive details unchanged unless explicitly edited by the user.

## UX Requirements
- Show original text and suggested text side-by-side.
- Require explicit user approval before replacing any text.
- Provide an "Apply" and "Keep Original" decision for each suggestion.
- Keep all suggestions local to the current form until user confirms save.

## Suggested Interaction
1. User clicks "AI Assist" in a text field area.
2. User chooses one action (Professional, Concise, Grammar, Keywords to Sentence).
3. System generates a suggestion from existing text only.
4. User compares original and suggestion.
5. User chooses Apply or Keep Original.

## Data Handling (Future)
- Do not auto-save generated text.
- Preserve auditability by storing who applied an AI suggestion and when (if persistence is added later).
- Respect role-based privacy boundaries already in the app.

## Non-Goals for This Branch
- No AI API integration.
- No backend or database schema changes.
- No automatic rewriting on save.
- No hidden edits.
