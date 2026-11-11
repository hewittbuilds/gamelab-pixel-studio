# Pixel Studio

[Open the drawing app](https://hewittbuilds.github.io/gamelab-pixel-studio/)

Paint characters on a 400 × 400 coordinate grid and copy JavaScript into Code.org Game Lab.

## Using the app

- Pick a color and click or drag on the grid to paint.
- Choose 5-, 10-, 20-, or 40-pixel squares.
- Use the eraser, undo, and redo to revise your drawing.
- Start with a sunshine or crab, or create your own character.
- Copy the generated code or download a JavaScript file.
- Save a drawing as JSON and open it later.

The code uses fill() and rect(). Smooth edges adds noStroke(), and can be switched off. Combining neighboring squares reduces the number of rectangle commands.

In Game Lab, switch to text code and paste after your background. For an animated project, place the drawing inside draw().

## Saving

Drawings automatically save in the current browser on the current device. Use Save drawing to keep a file you can open on another device. The app does not upload student drawings.

## Keyboard drawing

Focus the canvas. Arrow keys move the selected square, Space paints, and Delete or Backspace erases.

## Source

This is a static HTML, CSS, and JavaScript app with no build step. GitHub Pages serves the main branch from the repository root. To run locally, serve this folder with a local HTTP server and open its URL.


## Importing images

Use Import image to turn a PNG, JPEG, or WebP photo, logo, drawing, or meme into editable pixel art. Preview the result with 4, 8, 16, or original colors. Crop and zoom to fill the square, or fit the whole image. Transparent areas stay empty. Apply replaces your drawing and can be undone. Images are processed on your device. Maximum image size is 15 MB and 30 megapixels.
