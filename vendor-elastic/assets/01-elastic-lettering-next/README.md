# Elastic Lettering

A transparent text asset with tall geometric uppercase display letters. Each letter bounces into place in reading order. Move across the lettering to pull individual letters down; leaving releases a spring recoil. No font or rendering dependency is required.

Load the stylesheet and mount the asset from an ES module:

```html
<link rel="stylesheet" href="./src/styles.css">
<div id="headline" style="height:720px"></div>
<script type="module">
  import { mountElasticLettering } from './src/elastic-lettering.js';
  const lettering = mountElasticLettering(document.querySelector('#headline'), {
    text: 'tweak it'
  });
  await lettering.ready;
  // Later: lettering.update({ text: 'hello world', ink: '#ffffff' });
  // Replay the entrance with lettering.replay().
  // Call lettering.destroy() when removing the component.
</script>
```

Give the mount a width and height (for example 100% and 720px). It fits inside its parent and leaves room for elastic travel. The surrounding surface remains transparent; choose the page background yourself.

React and Next: import `ElasticLettering` from `adapters/react/ElasticLettering.js`, import the stylesheet, and pass `options`. The adapter is a client component; its ref exposes `getState`, `replay` and `release`. `onReady` and `onError` report lifecycle outcomes. Options update the existing mount; unmount cleans it up.

Latin letters use the original uppercase display alphabet regardless of input case. Numbers and common punctuation share the geometric strokes. Other Unicode graphemes use a native sans-serif fallback, so their typography differs. Long text fits on one line and becomes narrower; short phrases best preserve the tall display character. The saved text retains its original case.

Touch moves stretch letters without cancelling vertical page scroll; release recoils. Focus the component and use arrow keys to choose/stretch a letter, Enter or Space to hold, and release the key or Escape to recoil. Reduced motion shows stationary readable text. The native accessible label retains the complete chosen text. Forced colours use the system text colour.
