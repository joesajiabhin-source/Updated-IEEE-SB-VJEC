# Customization

Pass settings to the mount or to the React/Next `options` prop. `update()` merges a partial update; unknown fields are removed by normalization.

| Setting | Default | Range / meaning |
| --- | --- | --- |
| text | tweak it | Up to 40 characters; uppercase display alphabet |
| width | 1440 | 240–1800px maximum width, fitted to the parent |
| height | 720 | 160–1000px maximum height, including recoil space |
| ink | #ffffff | Six-digit hex text colour |
| stretch | 1 | 0–1 downward pull |
| bounce | 0.65 | 0–1 spring recoil |
| stagger | 100 | 40–240ms delay between letters |

Changing colours, dimensions or motion preserves the current runtime. Changing text rebuilds the letters and plays their entrance. `replay()` repeats the sequential entrance; `release()` releases pointer or keyboard pull. Reduced motion disables both entrance and pull. Width and height are independent; no surrounding background is included.
