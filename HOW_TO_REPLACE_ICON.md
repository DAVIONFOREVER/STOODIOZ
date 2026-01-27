# How to Replace the App Icon

## Quick Steps:

1. **Place your new icon image** in the project:
   - File name: `assets/new-icon-source.png`
   - Format: PNG with transparency (or clear background)
   - Size: Any size is fine (will be cropped automatically)

2. **Run the crop script**:
   ```bash
   node scripts/crop-icon-to-outline.mjs
   ```

3. **Done!** The script will:
   - Detect the outline/shape of your icon
   - Crop to just the content (with padding)
   - Save to both `assets/stoodioz-app-icon.png` and `public/icon.png`
   - All spinners and favicons will automatically use the new icon

---

## What the Script Does:

- **Finds the outline**: Detects all non-transparent pixels
- **Crops to content**: Removes empty space around the icon
- **Adds padding**: Adds 10% padding around the content for breathing room
- **Preserves transparency**: Keeps your icon's transparency intact
- **Updates both locations**: Updates both the assets folder and public folder

---

## Tips:

- **Best results**: Use an icon with a transparent background
- **Clear outline**: Make sure your icon has a clear shape/outline
- **High quality**: Use a high-resolution image (will be scaled as needed)
- **Square recommended**: Square icons work best for app icons

---

## After Running:

The dev server should hot-reload automatically. If you don't see the new icon:
- Hard refresh your browser (Cmd+Shift+R / Ctrl+Shift+R)
- Check that the file was created in both locations
- Verify the image has transparency/clear background

---

## Troubleshooting:

**"Source image not found"**
- Make sure the file is named exactly: `new-icon-source.png`
- Make sure it's in the `assets/` folder

**"Cropped image looks wrong"**
- Make sure your source image has a transparent background
- The script detects non-transparent pixels, so a white background might not work well
- Try using an image editor to make the background transparent first
