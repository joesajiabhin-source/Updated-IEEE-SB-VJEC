# Install Elastic Lettering for Next.js

Keep this extracted asset folder intact so relative runtime, media, and dependency paths continue to resolve.
The surrounding Example website HTML, CSS and JavaScript are not included.

Read `README.md` and `CUSTOMIZATION.md` for the asset's supported options, required host markup or content props, sizing, fallbacks, and lifecycle.

## Next.js App Router setup

The consuming application must already provide the host dependencies `next`, `react`, and `react-dom`; they are not included here.
Import `src/styles.css` from an applicable App Router layout, then import the same React client adapter from `adapters/react/ElasticLettering.js`:

```jsx
// app/layout.jsx (adjust the relative package path)
import "./src/styles.css";

// app/page.jsx or another Server/Client Component
import { ElasticLettering } from "./adapters/react/ElasticLettering.js";
import options from "./elastic-lettering.options.js";
export default function Page() { return <ElasticLettering options={options} />; }
```

The packaged adapter already contains the client boundary. Props passed from a Server Component must remain serializable.

## Package boundary

Read `WEBSITE-USE.md` for permission to use, modify and reuse this item and its bundled media in personal, commercial and client websites.
Bundled third-party software remains under its own license; retain the applicable notices and license files. See `THIRD_PARTY_NOTICES.md`. Declared local runtime dependencies and media remain in their original relative paths.
