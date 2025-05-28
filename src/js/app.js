class CanvaClone {
    constructor() {
        this.stage = null;
        this.layer = null;
        this.transformer = null;
        this.selectedObject = null; // This will now be the Konva.Group
        this.dragOverlay = null;
        this.objectCounter = 0;
        this.init();
        this.loadSampleImages();
        this.setupEventListeners();
    }
    init() {
        // Initialize Konva stage
        this.stage = new Konva.Stage({
            container: 'konva-container',
            width: 800,
            height: 600,
            draggable: false
        });
        this.layer = new Konva.Layer();
        this.stage.add(this.layer);
        // Add transformer for object manipulation
        this.transformer = new Konva.Transformer({
            rotateAnchorOffset: 30,
            enabledAnchors: ['top-left', 'top-center', 'top-right',
                           'middle-right', 'middle-left',
                           'bottom-left', 'bottom-center', 'bottom-right'],
        });
        this.layer.add(this.transformer);
        // Stage click to deselect
        this.stage.on('click tap', (e) => {
            if (e.target === this.stage) {
                this.deselectAll();
            }
        });
        this.layer.draw();
    }
    loadSampleImages() {
        // Create sample images using canvas
        const sampleImages = [
            { name: 'Red Square', color: '#ff6b6b', width: 100, height: 100 },
            { name: 'Blue Circle', color: '#4ecdc4', width: 100, height: 100, shape: 'circle' },
            { name: 'Green Rectangle', color: '#45b7d1', width: 150, height: 80 },
            { name: 'Purple Triangle', color: '#f093fb', width: 100, height: 100, shape: 'triangle' }
        ];
        const thumbnailsContainer = document.getElementById('image-thumbnails');
        sampleImages.forEach((sample, index) => {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 80;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = sample.color;
            if (sample.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(50, 40, 30, 0, 2 * Math.PI);
                ctx.fill();
            } else if (sample.shape === 'triangle') {
                ctx.beginPath();
                ctx.moveTo(50, 10);
                ctx.lineTo(20, 70);
                ctx.lineTo(80, 70);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillRect(25, 20, sample.width * 0.5, sample.height * 0.4);
            }
            const thumbnailItem = document.createElement('div');
            thumbnailItem.className = 'thumbnail-item';
            thumbnailItem.draggable = true;
            const img = document.createElement('img');
            img.src = canvas.toDataURL();
            img.alt = sample.name;
            thumbnailItem.appendChild(img);
            thumbnailsContainer.appendChild(thumbnailItem);
            thumbnailItem.dataset.imageData = canvas.toDataURL();
            thumbnailItem.dataset.imageName = sample.name;
            this.setupDragAndDrop(thumbnailItem);
        });
    }
    setupDragAndDrop(element) {
        element.addEventListener('dragstart', (e) => {
            const img = element.querySelector('img');
            this.dragOverlay = document.createElement('div');
            this.dragOverlay.className = 'drag-overlay';
            this.dragOverlay.style.width = '60px';
            this.dragOverlay.style.height = '60px';
            this.dragOverlay.style.backgroundImage = `url(${img.src})`;
            this.dragOverlay.style.backgroundSize = 'cover';
            this.dragOverlay.style.borderRadius = '4px';
            document.body.appendChild(this.dragOverlay);
            e.dataTransfer.setData('text/plain', element.dataset.imageData);
            e.dataTransfer.setData('imageName', element.dataset.imageName);
            e.dataTransfer.effectAllowed = 'copy';
            const emptyImg = new Image();
            emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
            e.dataTransfer.setDragImage(emptyImg, 0, 0);
        });
        element.addEventListener('dragend', () => {
            if (this.dragOverlay) {
                document.body.removeChild(this.dragOverlay);
                this.dragOverlay = null;
            }
        });
    }
    setupEventListeners() {
        const canvasContainer = document.getElementById('canvas-wrapper');
        canvasContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            if (this.dragOverlay) {
                this.dragOverlay.style.left = (e.clientX - 30) + 'px';
                this.dragOverlay.style.top = (e.clientY - 30) + 'px';
            }
        });
        canvasContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            const imageData = e.dataTransfer.getData('text/plain');
            const imageName = e.dataTransfer.getData('imageName');
            if (imageData) {
                const canvasRect = this.stage.container().getBoundingClientRect();
                const x = e.clientX - canvasRect.left;
                const y = e.clientY - canvasRect.top;
                this.addImageToCanvas(imageData, { x, y }, imageName);
            }
        });
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });
        document.getElementById('clear-canvas').addEventListener('click', () => {
            this.clearCanvas();
        });
        document.getElementById('export-png').addEventListener('click', () => {
            this.exportCanvas('png');
        });
        document.getElementById('export-jpg').addEventListener('click', () => {
            this.exportCanvas('jpg');
        });
        document.getElementById('resize-canvas').addEventListener('click', () => {
            this.resizeCanvas();
        });
        this.setupPropertyControls();
        document.addEventListener('keydown', (e) => {
            if (this.selectedObject) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    this.deleteSelected();
                } else if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
                    e.preventDefault();
                    this.duplicateSelected();
                }
            }
        });
    }
    addImageToCanvas(imageData, position = { x: 100, y: 100 }, imageName = '') {
        const imageObj = new Image();
        imageObj.onload = () => {
            const maxSize = 200;
            let { width, height } = imageObj;
            if (width > maxSize || height > maxSize) {
                const scale = Math.min(maxSize / width, maxSize / height);
                width *= scale;
                height *= scale;
            }
            let visualShape;
            const groupX = position.x;
            const groupY = position.y;
            if (imageName.includes('Circle')) {
                visualShape = new Konva.Circle({
                    x: 0,
                    y: 0,
                    radius: Math.min(width, height) / 2,
                    strokeWidth: 0,
                    fillPatternImage: imageObj,
                    fillPatternScale: { x: width / imageObj.width, y: height / imageObj.height },
                    fillPatternOffset: { x: -width / 2, y: -height / 2 }
                });
            } else if (imageName.includes('Triangle')) {
                visualShape = new Konva.RegularPolygon({
                    x: 0,
                    y: 0,
                    sides: 3,
                    radius: Math.min(width, height) / 2,
                    strokeWidth: 0,
                    fillPatternImage: imageObj,
                    fillPatternScale: { x: width / imageObj.width, y: height / imageObj.height },
                    fillPatternOffset: { x: -width / 2, y: -height / 2 }
                });
            } else { 
                visualShape = new Konva.Image({
                    x: -width / 2,
                    y: -height / 2,
                    image: imageObj,
                    strokeWidth: 0,
                    width: width,
                    height: height
                });
            }
            const objectGroup = new Konva.Group({
                x: groupX,
                y: groupY,
                draggable: true,
                name: `image-group-${++this.objectCounter}`
            });
            objectGroup.add(visualShape);
            objectGroup.getVisualShape = () => visualShape;
            objectGroup.on('click tap', () => {
                this.selectObject(objectGroup);
            });
            this.layer.add(objectGroup);
            this.layer.draw();
            this.selectObject(objectGroup);
        };
        imageObj.src = imageData;
    }
    selectObject(objectGroup) { // objectGroup is now always a Konva.Group
        this.selectedObject = objectGroup;
        this.transformer.nodes([objectGroup]);
        this.layer.draw();
        this.updatePropertyPanel();
    }
    deselectAll() {
        this.selectedObject = null;
        this.transformer.nodes([]);
        this.layer.draw();
        this.updatePropertyPanel();
    }
    deleteSelected() {
        if (this.selectedObject) {
            this.selectedObject.destroy(); // Destroys the group and its children
            this.deselectAll();
            this.layer.draw();
        }
    }
    duplicateSelected() {
        if (this.selectedObject && typeof this.selectedObject.getVisualShape === 'function') {
            const originalGroup = this.selectedObject;
            const originalVisualShape = originalGroup.getVisualShape();
            const groupClone = originalGroup.clone({
                x: originalGroup.x() + 20,
                y: originalGroup.y() + 20,
                name: `image-group-${++this.objectCounter}`
            });
            // Re-establish getVisualShape for the cloned group and get its new visual shape
            const newVisualShape = groupClone.getChildren()[0]; // Assuming visual shape is the first child
            groupClone.getVisualShape = () => newVisualShape;
            // Copy visual properties from the original visual shape to the new one
            if (originalVisualShape && newVisualShape) {
                newVisualShape.stroke(originalVisualShape.stroke());
                newVisualShape.strokeWidth(originalVisualShape.strokeWidth());
                newVisualShape.shadowBlur(originalVisualShape.shadowBlur());
                newVisualShape.shadowColor(originalVisualShape.shadowColor());
                newVisualShape.opacity(originalVisualShape.opacity());
                // Copy filters if any (brightness, contrast)
                newVisualShape.filters(originalVisualShape.filters());
                newVisualShape.brightness(originalVisualShape.brightness());
                newVisualShape.contrast(originalVisualShape.contrast());
            }
            groupClone.on('click tap', () => { // Ensure the clone is selectable
                this.selectObject(groupClone);
            });
            this.layer.add(groupClone);
            this.selectObject(groupClone); // Auto-select the clone
            this.layer.draw();
        }
    }
    setupPropertyControls() {
        document.getElementById('delete-btn').addEventListener('click', () => {
            this.deleteSelected();
        });
        document.getElementById('duplicate-btn').addEventListener('click', () => {
            this.duplicateSelected();
        });
        document.getElementById('bring-forward').addEventListener('click', () => {
            if (this.selectedObject) {
                this.selectedObject.moveUp(); // Groups handle z-index
                this.layer.draw();
            }
        });
        document.getElementById('send-backward').addEventListener('click', () => {
            if (this.selectedObject) {
                this.selectedObject.moveDown();
                this.layer.draw();
            }
        });
        document.getElementById('lock-btn').addEventListener('click', (e) => {
            if (this.selectedObject) {
                const isDraggable = this.selectedObject.draggable(); // Lock/Unlock the group
                this.selectedObject.draggable(!isDraggable);
                this.transformer.nodes(!isDraggable ? [this.selectedObject] : []); // Transformer visibility based on draggable state
                e.target.textContent = !isDraggable ? 'ð Lock Position' : 'ð Unlock Position';
                this.layer.draw();
            }
        });
        // Visual adjustment controls - now target the visualShape within the group
        document.getElementById('opacity').addEventListener('input', (e) => {
            if (this.selectedObject && typeof this.selectedObject.getVisualShape === 'function') {
                const visualShape = this.selectedObject.getVisualShape();
                visualShape.opacity(parseFloat(e.target.value));
                document.getElementById('opacity-value').textContent = Math.round(e.target.value * 100) + '%';
                this.layer.draw();
            }
        });
        document.getElementById('brightness').addEventListener('input', (e) => {
            if (this.selectedObject && typeof this.selectedObject.getVisualShape === 'function') {
                const visualShape = this.selectedObject.getVisualShape();
                visualShape.clearCache(); // Clear previous cache before applying new filter
                const currentFilters = visualShape.filters() || [];
                if (!currentFilters.includes(Konva.Filters.Brighten)) {
                    currentFilters.push(Konva.Filters.Brighten);
                }
                visualShape.filters(currentFilters);
                visualShape.brightness(parseFloat(e.target.value));
                visualShape.cache(); // Cache the shape to apply filters
                document.getElementById('brightness-value').textContent = e.target.value;
                this.layer.draw();
            }
        });
        document.getElementById('contrast').addEventListener('input', (e) => {
            if (this.selectedObject && typeof this.selectedObject.getVisualShape === 'function') {
                const visualShape = this.selectedObject.getVisualShape();
                visualShape.clearCache(); // Clear previous cache before applying new filter
                const currentFilters = visualShape.filters() || [];
                if (!currentFilters.includes(Konva.Filters.Contrast)) {
                    currentFilters.push(Konva.Filters.Contrast);
                }
                visualShape.filters(currentFilters);
                visualShape.contrast(parseFloat(e.target.value));
                visualShape.cache(); // Cache the shape to apply filters
                document.getElementById('contrast-value').textContent = e.target.value;
                this.layer.draw();
            }
        });
        document.getElementById('shadow-blur').addEventListener('input', (e) => {
            if (this.selectedObject && typeof this.selectedObject.getVisualShape === 'function') {
                const visualShape = this.selectedObject.getVisualShape();
                visualShape.shadowBlur(parseFloat(e.target.value));
                visualShape.shadowColor(document.getElementById('shadow-color').value); // Ensure color is also set
                visualShape.shadowOpacity(1); // Make sure shadow is visible
                document.getElementById('shadow-blur-value').textContent = e.target.value + 'px';
                this.layer.draw();
            }
        });
        document.getElementById('shadow-color').addEventListener('input', (e) => {
            if (this.selectedObject && typeof this.selectedObject.getVisualShape === 'function') {
                const visualShape = this.selectedObject.getVisualShape();
                visualShape.shadowColor(e.target.value);
                this.layer.draw();
            }
        });
        document.getElementById('border-width').addEventListener('input', (e) => {
            if (this.selectedObject && typeof this.selectedObject.getVisualShape === 'function') {
                const visualShape = this.selectedObject.getVisualShape();
                visualShape.strokeWidth(parseInt(e.target.value));
                visualShape.stroke(document.getElementById('border-color').value); // Ensure color is also set
                document.getElementById('border-width-value').textContent = e.target.value + 'px';
                this.layer.draw();
            }
        });
        document.getElementById('border-color').addEventListener('input', (e) => {
            if (this.selectedObject && typeof this.selectedObject.getVisualShape === 'function') {
                const visualShape = this.selectedObject.getVisualShape();
                visualShape.stroke(e.target.value);
                this.layer.draw();
            }
        });
    }
    updatePropertyPanel() {
        const noSelection = document.getElementById('no-selection');
        const selectionTools = document.getElementById('selection-tools');
        if (this.selectedObject && typeof this.selectedObject.getVisualShape === 'function') {
            noSelection.style.display = 'none';
            selectionTools.style.display = 'block';
            const visualShape = this.selectedObject.getVisualShape();
            document.getElementById('opacity').value = visualShape.opacity();
            document.getElementById('opacity-value').textContent = Math.round(visualShape.opacity() * 100) + '%';
            const brightness = visualShape.brightness() || 0;
            document.getElementById('brightness').value = brightness;
            document.getElementById('brightness-value').textContent = brightness;
            const contrast = visualShape.contrast() || 0;
            document.getElementById('contrast').value = contrast;
            document.getElementById('contrast-value').textContent = contrast;
            const shadowBlur = visualShape.shadowBlur() || 0;
            document.getElementById('shadow-blur').value = shadowBlur;
            document.getElementById('shadow-blur-value').textContent = shadowBlur + 'px';
            document.getElementById('shadow-color').value = visualShape.shadowColor() || '#000000';
            const borderWidth = visualShape.strokeWidth() || 0;
            document.getElementById('border-width').value = borderWidth;
            document.getElementById('border-width-value').textContent = borderWidth + 'px';
            document.getElementById('border-color').value = visualShape.stroke() || '#000000';
            const lockBtn = document.getElementById('lock-btn');
            lockBtn.textContent = this.selectedObject.draggable() ? 'ð Lock Position' : 'ð Unlock Position';
        } else {
            noSelection.style.display = 'block';
            selectionTools.style.display = 'none';
        }
    }
    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        files.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.addImageToCanvas(e.target.result, {
                        x: 200 + (index * 50),
                        y: 200 + (index * 50)
                    }, file.name); // Pass file.name as imageName
                    this.addToThumbnails(e.target.result, file.name);
                };
                reader.readAsDataURL(file);
            }
        });
        event.target.value = '';
    }
    addToThumbnails(imageData, fileName) {
        const thumbnailsContainer = document.getElementById('image-thumbnails');
        const thumbnailItem = document.createElement('div');
        thumbnailItem.className = 'thumbnail-item';
        thumbnailItem.draggable = true;
        const img = document.createElement('img');
        img.src = imageData;
        img.alt = fileName;
        thumbnailItem.appendChild(img);
        thumbnailsContainer.appendChild(thumbnailItem);
        thumbnailItem.dataset.imageData = imageData;
        thumbnailItem.dataset.imageName = fileName; // Store imageName for use when adding to canvas
        this.setupDragAndDrop(thumbnailItem);
    }
    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
            //this.layer.destroyChildren(); // This would remove the transformer too
            // Instead, remove all groups and shapes, but keep the transformer
            const groupsAndShapes = this.layer.getChildren(node => node !== this.transformer);
            groupsAndShapes.forEach(node => node.destroy());
            this.deselectAll(); // Deselect also redraws and updates panel
            this.layer.draw();
        }
    }
    resizeCanvas() {
        const width = parseInt(document.getElementById('canvas-width').value);
        const height = parseInt(document.getElementById('canvas-height').value);
        if (width > 0 && height > 0) {
            this.stage.width(width);
            this.stage.height(height);
            this.layer.draw();
        }
    }
    exportCanvas(format) {
        // Temporarily hide transformer for export
        this.transformer.hide();
        this.layer.draw();
        const dataURL = this.stage.toDataURL({
            mimeType: `image/${format}`,
            quality: format === 'jpg' ? 0.8 : 1.0,
            pixelRatio: 2 // For better quality export
        });
        this.transformer.show(); // Show transformer again
        this.layer.draw();
        const link = document.createElement('a');
        link.download = `canvas-export.${format}`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new CanvaClone();
});