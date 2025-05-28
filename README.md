# Simple Canva Clone
This is a basic web-based application designed to mimic some functionalities of a design tool like Canva. Users can drag and drop pre-defined shapes or upload their own images onto a canvas, manipulate them, and export the final design.
## Features
-   **Drag & Drop:** Easily drag sample shapes or uploaded images onto the canvas.
-   **Image Upload:** Upload custom images from your local machine.
-   **Object Manipulation:** Select objects on the canvas to move, resize, rotate (with transformer handles).
-   **Property Panel:** Adjust properties of selected objects, including:
    *   Opacity
    *   Brightness
    *   Contrast
    *   Border Width & Color
    *   Shadow Blur & Color
-   **Layer Management:** Bring objects forward or send them backward.
-   **Lock Position:** Lock an object's position on the canvas to prevent accidental movement.
-   **Duplicate & Delete:** Easily duplicate or delete selected objects.
-   **Canvas Resizing:** Adjust the canvas dimensions dynamically.
-   **Export:** Export the canvas content as a PNG or JPG image.
## Technologies Used
*   **HTML5:** For the basic structure of the web application.
*   **CSS3:** For styling and layout.
*   **JavaScript (ES6+):** For application logic and interactivity.
*   **Konva.js:** A 2d canvas JavaScript framework for desktop and mobile applications, used for canvas drawing and object manipulation.
## Setup and Running the Project
To run this project locally, follow these steps:
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd canvas-test
    ```
2.  **Serve the application:**
    This project is a static web application. You can serve it using any simple HTTP server. If you have Node.js and npm/npx installed, you can use `npx serve`:
    ```bash
    npx serve src
    ```
    This command will serve the `src` directory, and the application will be accessible in your web browser, usually at `http://localhost:3000`.
## Project Structure
```
.
âââ documents/
â   âââ architecture.md
âââ src/
â   âââ index.html
â   âââ js/
â   â   âââ app.js
â   âââ styles/
â       âââ main.css
âââ README.md
```
*   `src/index.html`: The main HTML file for the application.
*   `src/styles/main.css`: Contains all the CSS styles for the application.
*   `src/js/app.js`: The core JavaScript file containing the `CanvaClone` class and application logic.
*   `documents/architecture.md`: Architectural documentation for the project.