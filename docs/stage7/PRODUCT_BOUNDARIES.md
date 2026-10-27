# Product boundaries

## What NTD-WATCH is

An **internal innovation proposal and functional prototype** that demonstrates one idea: connecting a community-level concern to a tracked, explainable action, and showing programme users where attention may be needed. It runs locally in a browser with **synthetic data**.

## What it is not

- Not a production health system.
- Not clinically validated, and not a medical device. The risk signal is a **non-diagnostic prompt** from demonstration rules.
- Not an official government system, and not endorsed by any ministry or programme.
- Not integrated with DHIS2 or any other platform.
- Not a replacement for existing systems. Whether it should fill a gap, adapt, integrate or stop is decided by Stage 6 evidence, which is still open.
- Not an outbreak detection tool. A priority category never declares an outbreak.
- Not a source of treatment or medication advice, and it names no disease.

## What it does not store or do

No real patients, no names, phone numbers or addresses, no free text in person-level records, no real notifications, no real authentication, no hosting.

## How the product speaks

Every screen carries the demo banner and "NTD-WATCH DEMO MODE". Risk results come with reasons and the demonstration label. Programme pages say that signals are assessments, not confirmed cases. Priority categories are described as prompts for a human decision. The wording is protected by an automated scan (`apps/web/src/safety.test.ts`).

## Claims about value

Anything about why this might matter to a donor or manager is a **hypothesis to validate** (see `docs/stage6/DIFFERENTIATION_VALIDATION.md`). The prototype demonstrates a workflow, not an effect.
