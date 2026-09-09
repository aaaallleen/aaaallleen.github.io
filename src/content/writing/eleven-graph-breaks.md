---
title: "Eleven graph breaks: chasing a 24× inference regression"
date: 2026-02-15
dek: "17 ms became 410 ms. Full-graph compilation was never happening."
tags: ["GPU optimizing", "compilation"]
---

Placeholder body copy. The model compiled, the logs said so, and inference was twenty-four times slower than the eager baseline. Every graph break is a place where the compiler gives up and hands control back to Python, and there were eleven of them.

Placeholder continuation. Walk through how each break was found, which ones were in the model and which ones were in glue code, and what the trace looked like once the graph was whole again.
