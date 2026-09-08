/**
 * Sätteri plugin: render `$inline$` and `$$display$$` math with KaTeX at build
 * time. Requires `features: { math: true }` on the processor so the parser
 * emits `math` / `inlineMath` nodes in the first place.
 *
 * Output is HTML + MathML, so nothing math-related runs in the browser and
 * screen readers get the MathML tree.
 */
import katex from 'katex';
import { defineMdastPlugin } from 'satteri';

/** @param {import('katex').KatexOptions} [options] */
export function satteriKatex(options = {}) {
  // A `raw` entry (not an `html` node) so the markup is parsed into real
  // elements, which is what the MDX/JSX pipeline needs; `.md` accepts it too.
  // `mdxExpressions: false` keeps KaTeX's braces from being read as JSX.
  const render = (tex, displayMode) => ({
    raw: katex.renderToString(tex, {
      displayMode,
      throwOnError: false, // a bad formula renders in red instead of failing the build
      output: 'htmlAndMathml',
      ...options,
    }),
    mdxExpressions: false,
  });

  return defineMdastPlugin({
    name: 'satteri-katex',
    math(node, ctx) { ctx.replaceNode(node, render(node.value, true)); },
    inlineMath(node, ctx) { ctx.replaceNode(node, render(node.value, false)); },
  });
}
