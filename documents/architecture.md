# Canva Clone Architectural Plan

## Technology Stack Selection

**Core Technologies:**
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Canvas Library**: Konva.js (excellent choice for 2D canvas manipulation)
- **UI Framework**: Vanilla JS with modern CSS (keeps it simple)
- **File Handling**: HTML5 File API + Canvas API
- **Storage**: localStorage for project persistence (upgradeable to backend later)

## Application Architecture

### 1. High-Level Structure
```
src/
├── index.html
├── styles/
│   ├── main.css
│   ├── sidebar.css
│   └── canvas.css
├── js/
│   ├── app.js                 # Main application controller
│   ├── canvas-manager.js      # Konva canvas operations
│   ├── sidebar-manager.js     # Sidebar drag/drop functionality
│   ├── image-handler.js       # Image upload/manipulation
│   ├── tools-manager.js       # Tool panel controls
│   ├── export-manager.js      # Export functionality
│   └── utils/
│       ├── file-utils.js
│       ├── storage-utils.js
│       └── image-utils.js
└── assets/
    ├── icons/
    └── sample-images/
```

### 2. Core Components Architecture

**A. Canvas Manager (Konva.js Integration)**
```javascript
class CanvasManager {
  constructor(containerId) {
    this.stage = new Konva.Stage({
      container: containerId,
      width: 800,
      height: 600,
      draggable: false
    });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
    this.selectedObject = null;
    this.transformer = new Konva.Transformer();
    this.layer.add(this.transformer);
  }
  
  // Methods:
  // - addImage(imageData, position)
  // - selectObject(object)
  // - deleteSelected()
  // - duplicateSelected()
  // - updateLayerOrder(direction)
  // - applyFilters(filterType, value)
  // - exportCanvas(format)
}
```

**B. Sidebar Manager (Drag & Drop Source)**
```javascript
class SidebarManager {
  constructor(canvasManager) {
    this.canvasManager = canvasManager;
    this.initializeDragDrop();
    this.loadSampleImages();
  }
  
  // Methods:
  // - initializeDragDrop()
  // - handleImageUpload()
  // - createDraggableItem(imageData)
  // - loadSampleImages()
}
```

**C. Tools Manager (Feature Controls)**
```javascript
class ToolsManager {
  constructor(canvasManager) {
    this.canvasManager = canvasManager;
    this.initializeControls();
  }
  
  // Methods for each feature:
  // - setupTransformControls()
  // - setupFilterControls()
  // - setupLayerControls()
  // - setupCropControls()
  // - setupEffectControls()
}
```

## Feature Implementation Details

### 1. Basic Manipulation
**Technical Approach:**
- Use Konva.Transformer for resize/rotate handles
- Implement custom delete key listener
- Clone objects for duplication with offset positioning

**Key Code Pattern:**
```javascript
// Transform handling
const transformer = new Konva.Transformer();
imageNode.on('click', () => {
  transformer.nodes([imageNode]);
  layer.draw();
});

// Keyboard controls
window.addEventListener('keydown', (e) => {
  if (e.key === 'Delete') deleteSelected();
  if (e.ctrlKey && e.key === 'd') duplicateSelected();
});
```

### 2. Layering & Position
**Implementation:**
- Use Konva's zIndex() and moveToTop()/moveToBottom()
- Add lock property to prevent transformation
- Group objects using Konva.Group

### 3. Cropping & Masking
**Technical Solution:**
- Use Konva clipping with clipFunc
- Implement custom crop overlay with draggable corners
- Pre-defined mask shapes using Konva paths

```javascript
// Crop implementation
imageNode.clipFunc(function(ctx) {
  ctx.rect(cropX, cropY, cropWidth, cropHeight);
});
```

### 4. Visual Adjustments
**Filter Implementation:**
```javascript
// Using Konva filters
imageNode.filters([
  Konva.Filters.Brighten,
  Konva.Filters.Contrast,
  Konva.Filters.HSV
]);
imageNode.brightness(0.2); // -1 to 1
imageNode.contrast(20);    // -100 to 100
```

### 5. Borders & Effects
**Approach:**
- Add separate Konva.Rect for borders
- Use shadowColor, shadowBlur, shadowOffset for shadows
- cornerRadius for rounded corners

### 6. Image Source & Replacement
**File Handling:**
```javascript
// Upload handling
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.onchange = (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => addImageToCanvas(img);
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};
```

### 7. Export & Download
**Export Implementation:**
```javascript
// Canvas export
exportCanvas(format = 'png') {
  const dataURL = this.stage.toDataURL({
    mimeType: `image/${format}`,
    quality: 1.0
  });
  
  // Trigger download
  const link = document.createElement('a');
  link.download = `canvas.${format}`;
  link.href = dataURL;
  link.click();
}
```

## User Interface Layout

### HTML Structure:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Simple Canva Clone</title>
  <link rel="stylesheet" href="styles/main.css">
</head>
<body>
  <div class="app-container">
    <!-- Top Toolbar -->
    <div class="toolbar">
      <button id="upload-btn">Upload Image</button>
      <button id="export-btn">Export</button>
      <div class="canvas-size-controls">
        <input type="number" id="canvas-width" value="800">
        <input type="number" id="canvas-height" value="600">
        <button id="resize-canvas">Resize Canvas</button>
      </div>
    </div>
    
    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Left Sidebar -->
      <div class="sidebar">
        <div class="image-library">
          <h3>Images</h3>
          <div id="image-thumbnails"></div>
        </div>
        <div class="upload-area">
          <input type="file" id="file-input" accept="image/*" multiple>
          <label for="file-input">+ Upload Images</label>
        </div>
      </div>
      
      <!-- Canvas Area -->
      <div class="canvas-container">
        <div id="canvas-wrapper">
          <div id="konva-container"></div>
        </div>
      </div>
      
      <!-- Right Properties Panel -->
      <div class="properties-panel">
        <div class="tool-section" id="transform-tools">
          <h4>Transform</h4>
          <button id="delete-btn">Delete</button>
          <button id="duplicate-btn">Duplicate</button>
          <button id="bring-forward">Bring Forward</button>
          <button id="send-backward">Send Backward</button>
        </div>
        
        <div class="tool-section" id="visual-tools">
          <h4>Visual Adjustments</h4>
          <label>Opacity: <input type="range" id="opacity" min="0" max="1" step="0.1" value="1"></label>
          <label>Brightness: <input type="range" id="brightness" min="-1" max="1" step="0.1" value="0"></label>
          <label>Contrast: <input type="range" id="contrast" min="-100" max="100" step="5" value="0"></label>
        </div>
        
        <div class="tool-section" id="effects-tools">
          <h4>Effects</h4>
          <label>Border Width: <input type="range" id="border-width" min="0" max="20" value="0"></label>
          <input type="color" id="border-color" value="#000000">
          <label>Shadow Blur: <input type="range" id="shadow-blur" min="0" max="20" value="0"></label>
        </div>
      </div>
    </div>
  </div>
  
  <script src="https://unpkg.com/konva@9/konva.min.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

## Implementation Phases

### Phase 1: Core Foundation (Week 1)
- Set up HTML structure and basic CSS
- Initialize Konva.js canvas
- Implement basic drag & drop from sidebar to canvas
- Add image upload functionality
- Basic selection and transformation (move, resize, rotate)

### Phase 2: Essential Tools (Week 2)
- Delete and duplicate functionality
- Layer ordering (bring forward/send backward)
- Canvas resizing controls
- Basic export functionality (PNG)

### Phase 3: Visual Enhancements (Week 3)
- Opacity and basic filters (brightness, contrast)
- Border and shadow effects
- Lock/unlock positioning
- Grouping/ungrouping

### Phase 4: Advanced Features (Week 4)
- Cropping functionality
- Masking with shapes
- Additional filters and effects
- Multiple export formats
- Project save/load (localStorage)

### Phase 5: Polish & Optimization (Week 5)
- Performance optimization
- Better UI/UX
- Error handling
- Mobile responsiveness testing

## Key Technical Challenges & Solutions

1. **Performance with Multiple Images**
   - Solution: Implement object pooling and lazy loading
   - Use Konva's caching for complex objects

2. **Drag & Drop Between DOM and Canvas**
   - Solution: Convert mouse coordinates between DOM and canvas space
   - Handle file drops on canvas directly

3. **Complex Transformations**
   - Solution: Use Konva's built-in transformer with custom constraints
   - Maintain aspect ratios during scaling

4. **Filter Performance**
   - Solution: Apply filters only when needed, cache filtered results
   - Use requestAnimationFrame for smooth updates

5. **Export Quality**
   - Solution: Use high DPI settings for export
   - Implement different quality options

## Data Structure

```javascript
// Project data model
const projectData = {
  canvas: {
    width: 800,
    height: 600,
    backgroundColor: '#ffffff'
  },
  objects: [
    {
      id: 'unique-id',
      type: 'image',
      src: 'data:image/base64...',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      filters: {
        brightness: 0,
        contrast: 0,
        saturation: 0
      },
      effects: {
        borderWidth: 0,
        borderColor: '#000000',
        shadowBlur: 0,
        shadowColor: '#000000'
      },
      locked: false,
      visible: true
    }
  ]
};
```