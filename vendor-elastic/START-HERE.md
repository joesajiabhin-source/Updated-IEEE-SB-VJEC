# Start here: your tweak it download

Welcome! This guide helps you turn your download into something useful on your website. Read the sections that apply to what you downloaded.

## Website use

We grant you non-exclusive permission to use, modify and reuse downloaded tweak it assets in personal and commercial websites, including websites you build for clients. This permission also covers library images downloaded separately, selected library images included with an item, and the item's original bundled media and authoring files. Other people may use the same material.

Your statutory rights are preserved. Bundled third-party software remains under its own license; retain its license and notice files. Newly prepared item packages include WEBSITE-USE.md with the full website-use terms and authoring information; older recovered packages may omit that file, but the permission above still applies to original tweak it work. Image provenance records describe source history; they do not replace this current website-use permission.

## Find your files

Extract the ZIP before using its contents.

- **assets/** contains a separate folder for each downloaded item and format. Each folder includes its own installation instructions and supporting files.
- **images/** contains individually downloaded images and their accompanying provenance records.

Only the folders relevant to your download will be present. Images in the images folder are separate files: putting an image and an asset in the same download does not automatically assign that image to the asset.

## Advice for assets

### Start with one item

Choose where the item belongs on your page and get it working there before installing the next one. An asset provides its own design or interaction; it does not include the surrounding Example website shown in the catalogue.

Read INSTALL.md in the item's folder first. README.md and CUSTOMIZATION.md explain its behavior and supported changes. Keep the package folder intact when copying it into your project so relative paths continue to work.

### Use the format that matches your project

- **Vanilla:** plain JavaScript, with the package's documented setup and stylesheet.
- **React:** a React adapter for use in a React application.
- **Next:** a package with instructions for Next.js App Router.

Check INSTALL.md for the exact imports and dependencies. The download is not necessarily a complete application you can open by double-clicking a file. Use your project's local development server to preview the integration.

### Keep your tweaks

If you tweaked an item before downloading, its downloaded options capture your tweaks. Follow YOUR-SETTINGS.md to apply the supplied .options.js file alongside the installation instructions. Keep that file with its matching package version.

Changing the item in the storefront later does not update an existing download. Keep the original ZIP as a backup before editing files.

### Fit it into your page

Give the item enough space, load its required styles, and use its documented controls to adjust the result. Check desktop and mobile widths, cropping, keyboard interaction where applicable, and reduced-motion behavior. Follow the package's cleanup instructions when removing an item or navigating between pages.

## Advice for images

### Put images where your project can serve them

Copy the images you want into your project's public or static media location. Use the URL your website serves for each image, rather than a path to a file on your computer.

To use an image inside an asset, follow that asset's image settings or content instructions. Image fields differ between packages; avoid assuming every gallery accepts the same configuration.

### Choose the right crop and size

Match the image shape to its space: a wide banner, a square card, and a portrait slot may need different crops. Check that the subject stays visible on smaller screens.

Keep your original image, then create an optimized copy for your website. Resize it for its intended display size and use compression that keeps it looking good. Avoid loading full-resolution originals into small thumbnails when a smaller copy is sufficient.

### Add useful descriptions

Write alt text that describes meaningful content in context. Decorative images generally need empty alt text rather than a repeated filename. When replacing a photo, update its description as well as its URL where the asset supports it.

Keep the accompanying provenance records with your originals. These records describe the source; they do not themselves grant additional usage rights.

### Images in asset downloads

Customized assets include the generated PNGs you applied to their image slots. Stock previews and device uploads use placeholders in the item's images folder. Replace an image by saving yours over its placeholder, keeping the file name and format, or by changing the slot's path in the item's .options.js file, for example to /images/hero.jpg served from your site's public folder. YOUR-SETTINGS.md lists every slot.

Photos downloaded separately are not automatically inserted into downloaded assets either. Use them in the same way.

## Prompts you can copy

Give your coding assistant access to both your website project and the extracted download. Replace the bracketed details before sending. Ask it to read the package documentation before making changes.

### Install an asset

> Add [asset name] from [extracted folder] to [page or section] in my project. Read its installation and customization documentation first, inspect my project structure, and use the supplied package and saved options. Keep the rest of the page unchanged. Check the required styles, dependencies, sizing, and cleanup. Run it locally and verify desktop and mobile behavior. Explain any remaining issue. Do not deploy.

### Use downloaded images

> Use [image filenames] in [asset, slots, or page locations]. Follow the existing project's media conventions and the asset's documented image interface. Preserve the intended order, choose suitable crops, and update supported alt text. Keep original files and create optimized copies if needed. Verify the images load correctly at desktop and mobile sizes.

### Adjust an asset to your page

> Adapt [asset name] to fit [section and desired result] using its supported customization options. Preserve my site's existing typography, colors, navigation, and unrelated content. Check sizing, clipping, image crops, and mobile layout. Explain any limitation that cannot be addressed through the supported controls.

### Fix something that is not working

> I installed [asset name] and see [describe the problem]. Read the included documentation and inspect my integration, browser console, and failed network requests. Check the selected format, styles, host dimensions, image URLs, and matching saved settings. Find and fix the cause without replacing the asset or bypassing validation. Verify the result locally and explain what changed.

## Quick troubleshooting

- **Nothing appears:** check the browser console, required styles, and the space given to the asset.
- **Images are missing:** check their served URLs and image assignments. Placeholders show until you assign your own images.
- **It looks different from your tweaks:** confirm the integration uses the supplied options file from the same package version.
- **It breaks on mobile:** inspect the host width, height, overflow, and image cropping before changing the asset's internals.
- **It duplicates after navigation:** check mounting and cleanup against the package instructions.

Start with the included documentation, make one change at a time, and preview the result before moving on.
