# 0013 — Accurate disclosures and complete answer validation

**Status:** Accepted · 2026-10-11 · Amends [0008](0008-grounded-assistant.md) and clarifies host caching in [0007](0007-in-site-document-reader.md).

## Context

The pre-publication audit found that two-word streaming holdback could release model
text before a later violation, user messages could supply allowed numeric values,
and valid citation numbers were not enforced. Retrieval dates also advanced human
review dates, and disclosures did not match the current seal, maps and Worker.

## Decision

- Buffer at most 24,000 characters of a model answer; release it only after final
  validation. NDJSON still carries source and completion events. No partial model
  answer reaches the browser. Use fixed local fallback text for provider failures.
- Permit numeric values only from the published passages actually cited. Check small
  numeric counts, signed values, explicit peso markers and code-formatted values;
  user text/history is never numeric evidence.
  Reject missing and out-of-range citation numbers and bounded patterns of allegations.
  Screening rejects requests to manufacture accusations while neutral record questions
  remain available. These checks do not prove semantic entailment or detect every
  paraphrased allegation, wrong period, number in words or prompt leak.
- Log fixed error categories and rule identifiers, never provider error/refusal bodies
  or rejected numeric values. Existing operational metadata remains provider-managed.
- Keep existing review dates as explicit literals; generated retrieval times do not
  advance `lastVerified`. A maintainer must review any refreshed record and update its
  review date. This preserves the dates already published, not a new verification.
- Keep the bounded source reader, clarify host caching and add minimum page/FDP security headers.
- Describe the static pages separately from the assistant database and processing.
  Match independence copy to the historical seal exception and disclose the resort
  affiliation in the directory and JSON export. Document the missing private channel.

## Consequences

Readers wait for the complete answer, and some acceptable responses may be replaced
when they omit citations or write an unsupported count. Sources and ordinary search
remain available. Live provider evaluations are required before deploying the Worker;
local fixture evaluations alone cannot establish deployed model accuracy. No municipal
seal artwork, rotation or placement is changed, and no legal exemption is claimed.
