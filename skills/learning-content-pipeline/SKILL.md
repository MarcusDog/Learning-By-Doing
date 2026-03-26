---
name: learning-content-pipeline
description: Use when creating or updating courses, lessons, exercises, visualizations, code templates, or AI explanation content for the Edge Doing Learning website.
---

# Learning Content Pipeline

## Overview

Use this skill to turn a topic into one consistent learning unit for the site. The goal is not just to "write content" but to produce a complete teaching package that works for zero-basis learners first and still scales to intermediate topics.

Every unit should answer seven questions in order:
what should the learner achieve, what do they need to know first, what should we explain, what should they run, what should they see, what should they practice, and how should AI explain it back to them.

## When to Use

Use this skill when the user asks to:
- add a new course, topic, lesson, exercise set, or visualization
- convert a technical subject into beginner-friendly teaching content
- create Python code templates or guided practice flows
- prepare AI explanation context for code, math, algorithms, or papers
- standardize content production across multiple learning units

Do not use this skill for:
- UI-only work with no learning content
- backend-only infrastructure changes
- broad brainstorming without a concrete learning topic

## Output Contract

Each learning unit must include:
- `title`
- `audience_level`
- `learning_goal`
- `prerequisites`
- `concept_explanation`
- `example_code`
- `visualization_spec`
- `practice_tasks`
- `ai_explanation_context`
- `acceptance_criteria`

Prefer this order in every output. Keep the same names across all units so downstream agents can parse them reliably.

## Workflow

1. Classify the topic.
   - Is it Python basics, algorithm intuition, AI basics, paper reading, or a mixed lesson?
   - Pick one primary learning outcome.

2. Set the learner level.
   - Default to `beginner_first`.
   - If the topic is advanced, still explain the entry path as if the reader is new.

3. Write the teaching path.
   - Start with the idea, not jargon.
   - Move from intuition to code to result to practice.
   - Keep examples small enough to run immediately.

4. Define the executable example.
   - Prefer one canonical example per unit.
   - The code must match the explanation and the visualization.
   - Avoid hidden setup or unexplained helper code.

5. Specify the visualization.
   - Describe what should change frame by frame.
   - Identify the variables, data structures, or states that must be visible.
   - Keep visuals tied to code behavior, not decorative diagrams.

6. Build practice tasks.
   - Include at least one easy task and one transfer task.
   - Tasks should require the learner to modify or reason about the example.
   - Do not ask for facts that the lesson never explained.

7. Prepare AI explanation context.
   - Include the canonical code span.
   - Include the likely confusion points.
   - State the allowed answer style: simple, step-by-step, and mapped back to code.
   - If math appears, mark which formula parts map to which code lines or variables.

8. Check acceptance criteria.
   - A beginner can follow the lesson without external context.
   - The code runs as written.
   - The visualization matches the code path.
   - The practice tasks are solvable from the lesson alone.
   - AI can explain the content without inventing missing context.

## Content Rules

- Explain every non-obvious term before using it.
- Use short sections and concrete examples.
- Keep code small, runnable, and representative.
- Prefer one concept per unit over "everything in one lesson".
- When a unit is about algorithms, show the data flow and state transitions.
- When a unit is about AI or papers, show the mapping between concept, code, and output.
- When a unit is for zero-basis learners, add a plain-language summary at the top.

## Quality Gate

Reject or rewrite the unit if any of these are true:
- the title is vague or too broad
- the prerequisites are missing or unrealistic
- the example code does not match the explanation
- the visualization is not tied to actual state changes
- the practice assumes knowledge not taught in the unit
- the AI context is too vague to answer consistently

## Template

Use [learning-unit-template.md](references/learning-unit-template.md) as the default fill-in structure when producing new content.
