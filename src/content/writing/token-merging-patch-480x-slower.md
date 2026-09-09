---
title: "A token-merging patch that made compilation 480× slower"
date: 2026-01-15
dek: "25 ms to twelve seconds, inside a Vision Transformer integration."
tags: ["GPU optimizing", "compilation"]
---

Placeholder body copy. Token merging is supposed to make a Vision Transformer cheaper. The patch did that for eager execution and then made the compiled path unusable, because every forward pass produced tensors of a shape the compiler had never seen.

Placeholder continuation. Dynamic shapes, recompilation storms, and the one-line guard that fixed it.
