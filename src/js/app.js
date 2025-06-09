class CanvaClone {
    constructor() {
        this.stage = null;
        this.layer = null;
        this.transformer = null;
        this.selectedObject = null; // This will now be the Konva.Group
        this.dragOverlay = null;
        this.objectCounter = 0;
        this.scaleBy = 1.02;
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
        
        // Add zoom functionality with Mouse wheel (Ctrl for precise)
        this.stage.on('wheel', (e) => {
            e.evt.preventDefault();
            const oldScale = this.stage.scaleX();
            const pointer = this.stage.getPointerPosition();

            // Use this.scaleBy (1.02) for precise zoom with Ctrl, 1.1 for standard zoom
            const zoomFactor = e.evt.ctrlKey ? this.scaleBy : 1.1;
            let direction = e.evt.deltaY > 0 ? -1 : 1; // Standard natural zoom direction

            const newScale = direction > 0 ? oldScale * zoomFactor : oldScale / zoomFactor;
            this._setStageScale(newScale, pointer.x, pointer.y);
        });
        
        this.layer.draw();
        
        // Initialize zoom display
        this.updateZoomDisplay();
        this.fitToScreen(); // Initial fit to screen
    }
    loadSampleImages() {
        // Create sample images using canvas
        const sampleImages = [
            { name: 'Red Square', color: '#ff6b6b', width: 100, height: 100 },
            { name: 'Blue Circle', color: '#4ecdc4', width: 100, height: 100, shape: 'circle' },
            { name: 'Green Rectangle', color: '#45b7d1', width: 150, height: 80 },
            { name: 'Purple Triangle', color: '#f093fb', width: 100, height: 100, shape: 'triangle' }
        ];
        const thumbnailsContainer = document.getElementById('image-thumbnails'); // This ID is generic now
        sampleImages.forEach((sample) => {
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
            // For sample images, mediaType is 'image'
            this.addToThumbnails(canvas.toDataURL(), sample.name, 'image', sample);
        });
    }
    setupDragAndDrop(element) {
        element.addEventListener('dragstart', (e) => {
            const img = element.querySelector('img');
            this.dragOverlay = document.createElement('div');
            this.dragOverlay.className = 'drag-overlay';
            this.dragOverlay.style.width = '60px';
            this.dragOverlay.style.height = '60px';
            this.dragOverlay.style.backgroundImage = `url(${img.src})`; // Thumbnail src
            this.dragOverlay.style.backgroundSize = 'cover';
            this.dragOverlay.style.borderRadius = '4px';
            document.body.appendChild(this.dragOverlay);
            e.dataTransfer.setData('text/plain', element.dataset.mediaSrc); // Use 'text/plain' for the src URL/DataURL
            e.dataTransfer.setData('mediaType', element.dataset.mediaType);
            e.dataTransfer.setData('mediaName', element.dataset.fileName);
            if (element.dataset.imageShape) { // For sample images with shapes
                 e.dataTransfer.setData('imageShape', element.dataset.imageShape);
            }
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
            const mediaSrc = e.dataTransfer.getData('text/plain');
            const mediaType = e.dataTransfer.getData('mediaType');
            const mediaName = e.dataTransfer.getData('mediaName');
            const imageShape = e.dataTransfer.getData('imageShape'); // For sample images with shapes
            if (mediaSrc) {
                const canvasRect = this.stage.container().getBoundingClientRect();
                const x = e.clientX - canvasRect.left;
                const y = e.clientY - canvasRect.top;
                if (mediaType === 'video') {
                    this.addVideoToCanvas(mediaSrc, { x, y }, mediaName);
                } else { // Default to image
                    this.addImageToCanvas(mediaSrc, { x, y }, mediaName, imageShape);
                }
            }
        });
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });
        document.getElementById('add-video-url-btn').addEventListener('click', () => {
            const videoUrlInput = document.getElementById('video-url-input');
            const videoUrl = videoUrlInput.value.trim();
            if (videoUrl) {
                // Basic URL validation (very simple)
                if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://') || videoUrl.startsWith('data:video')) {
                    const videoName = videoUrl.substring(videoUrl.lastIndexOf('/') + 1) || 'video_from_url';
                    this.addVideoToCanvas(videoUrl, { x: 150, y: 150 }, videoName);
                    this.addToThumbnails(videoUrl, videoName, 'video'); // Add to thumbnails as well
                    videoUrlInput.value = ''; // Clear input
                } else {
                    alert('Please enter a valid video URL (starting with http://, https://, or data:video).');
                }
            } else {
                alert('Please enter a video URL.');
            }
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
        
        // Add preset sizes dropdown functionality
        document.getElementById('preset-sizes').addEventListener('change', (e) => {
            const value = e.target.value;
            if (value) {
                const [width, height] = value.split(',').map(num => parseInt(num));
                document.getElementById('canvas-width').value = width;
                document.getElementById('canvas-height').value = height;
                this.resizeCanvas();
                // Reset dropdown to default
                e.target.value = '';
            }
        });
        
        // Zoom control buttons and dropdown
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const zoomFitBtn = document.getElementById('zoom-fit-btn');
        const zoomFillBtn = document.getElementById('zoom-fill-btn');
        const zoomPresetDropdown = document.getElementById('zoom-preset-dropdown');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        if (zoomFitBtn) {
            zoomFitBtn.addEventListener('click', () => this.fitToScreen());
        }
        if (zoomFillBtn) {
            zoomFillBtn.addEventListener('click', () => this.fillToScreen());
        }
        if (zoomPresetDropdown) {
            zoomPresetDropdown.addEventListener('change', (e) => {
                const newScale = parseFloat(e.target.value);
                if (!isNaN(newScale)) {
                    // Zoom centered on the viewport for preset changes
                    const viewportCenterX = this.stage.width() / 2;
                    const viewportCenterY = this.stage.height() / 2;
                    this._setStageScale(newScale, viewportCenterX, viewportCenterY);
                }
            });
        }
        this.setupPropertyControls();
        document.addEventListener('keydown', (e) => {
            if (this.selectedObject) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    this.deleteSelected();
                } else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
                    e.preventDefault();
                    this.duplicateSelected();
                }
            }

            // Zoom keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '+':
                    case '=': // Plus key often sends '=' without shift
                        e.preventDefault();
                        this.zoomIn();
                        break;
                    case '-':
                        e.preventDefault();
                        this.zoomOut();
                        break;
                    case '0':
                        e.preventDefault();
                        this.resetZoom();
                        break;
                    case '1':
                        e.preventDefault();
                        this.fitToScreen(); // Placeholder for now
                        break;
                }
            }
        });
    }
    addImageToCanvas(imageData, position = { x: 100, y: 100 }, imageName = '', imageShape = '') { // Added imageShape for samples
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
            // Use imageShape for determining shape, fallback to imageName if needed
            const shapeToDraw = imageShape || (imageName.includes('Circle') ? 'circle' : (imageName.includes('Triangle') ? 'triangle' : 'rect'));
            if (shapeToDraw === 'circle') {
                visualShape = new Konva.Circle({
                    x: 0,
                    y: 0,
                    radius: Math.min(width, height) / 2,
                    strokeWidth: 0,
                    fillPatternImage: imageObj,
                    fillPatternScale: { x: width / imageObj.width, y: height / imageObj.height },
                    fillPatternOffset: { x: -width / 2, y: -height / 2 }
                });
            } else if (shapeToDraw === 'triangle') {
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
                name: `media-group-image-${++this.objectCounter}` // Clarify media type in name
            });
            objectGroup.add(visualShape);
            objectGroup.getVisualShape = () => visualShape;
            objectGroup.getMediaType = () => 'image'; // Helper for type identification
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
        // Ensure transformer is always on top
        this.transformer.moveToTop();
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
            // Video-specific cleanup
            if (typeof this.selectedObject.getMediaType === 'function' && this.selectedObject.getMediaType() === 'video') {
                const videoElement = this.selectedObject.getVideoElement && this.selectedObject.getVideoElement();
                const animation = this.selectedObject.getAnimation && this.selectedObject.getAnimation();
                if (animation) animation.stop();
                if (videoElement) {
                    videoElement.pause();
                    videoElement.src = ''; // Release resources
                    videoElement.removeAttribute('src'); // Ensure it's fully cleared
                    videoElement.load();
                    if (videoElement.parentNode) {
                        videoElement.parentNode.removeChild(videoElement);
                    }
                }
            }
            this.selectedObject.destroy(); // Destroys the Konva group and its children
            this.deselectAll(); // This also redraws
        }
    }
    duplicateSelected() {
        if (this.selectedObject && typeof this.selectedObject.getVisualShape === 'function') {
            const originalGroup = this.selectedObject;
            const originalVisualShape = originalGroup.getVisualShape();
            const groupClone = originalGroup.clone({
                x: originalGroup.x() + 20,
                y: originalGroup.y() + 20,
                name: originalGroup.name().startsWith('media-group-video-') ? `media-group-video-${++this.objectCounter}` : `media-group-image-${++this.objectCounter}`
            });
             // Re-establish getVisualShape and other type-specific methods for the cloned group
            const newVisualShape = groupClone.getChildren(node => !(node.name && node.name() === 'control-group'))[0]; // Assuming visual shape is the first non-control child
            groupClone.getVisualShape = () => newVisualShape;
            if (typeof originalGroup.getMediaType === 'function') {
                groupClone.getMediaType = originalGroup.getMediaType;
            }
            // TODO: Deep cloning for videos (HTMLVideoElement, Animation) is complex and not fully handled here.
            // The video element itself is not cloned, so the clone would point to the same HTML video.
            // This would require creating a new video element and setting up its source and animation.
            // For now, duplicating a video will result in a new Konva group that looks like the video,
            // but won't be an independently controllable video without further work.
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
            this.transformer.moveToTop(); // Ensure transformer is on top after duplication
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
                // Update transformer to maintain proper selection and keep it on top
                this.transformer.nodes([this.selectedObject]);
                this.transformer.moveToTop();
                this.layer.draw();
            }
        });
        document.getElementById('send-backward').addEventListener('click', () => {
            if (this.selectedObject) {
                this.selectedObject.moveDown();
                // Update transformer to maintain proper selection and keep it on top
                this.transformer.nodes([this.selectedObject]);
                this.transformer.moveToTop();
                this.layer.draw();
            }
        });
        document.getElementById('lock-btn').addEventListener('click', (e) => {
            if (this.selectedObject) {
                const isDraggable = this.selectedObject.draggable(); // Lock/Unlock the group
                this.selectedObject.draggable(!isDraggable);
                this.transformer.nodes(!isDraggable ? [this.selectedObject] : []); // Transformer visibility based on draggable state
                e.target.textContent = !isDraggable ? '🔒 Lock Position' : '🔓 Unlock Position';
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
                const borderWidth = parseInt(e.target.value);
                visualShape.strokeWidth(borderWidth);
                
                // Always set stroke color when width is greater than 0, even if it was previously null
                if (borderWidth > 0) {
                    const borderColor = document.getElementById('border-color').value;
                    visualShape.stroke(borderColor);
                } else {
                    // Remove stroke completely when width is 0
                    visualShape.stroke(null);
                }
                
                document.getElementById('border-width-value').textContent = e.target.value + 'px';
                this.layer.draw();
            }
        });
        document.getElementById('border-color').addEventListener('input', (e) => {
            if (this.selectedObject && typeof this.selectedObject.getVisualShape === 'function') {
                const visualShape = this.selectedObject.getVisualShape();
                const borderWidth = visualShape.strokeWidth() || 0;
                // Only apply color if there's actually a border width
                if (borderWidth > 0) {
                    visualShape.stroke(e.target.value);
                    this.layer.draw();
                }
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
            // Handle stroke color properly - if there's no stroke but width > 0, set a default color
            const strokeColor = visualShape.stroke();
            if (borderWidth > 0 && !strokeColor) {
                document.getElementById('border-color').value = '#000000';
            } else {
                document.getElementById('border-color').value = strokeColor || '#000000';
            }
            const lockBtn = document.getElementById('lock-btn');
            lockBtn.textContent = this.selectedObject.draggable() ? '🔓 Unlock Position' : '🔒 Lock Position';
        } else {
            noSelection.style.display = 'block';
            selectionTools.style.display = 'none';
        }
    }
    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileDataUrl = e.target.result;
                if (file.type.startsWith('image/')) {
                    this.addImageToCanvas(fileDataUrl, {
                        x: 100 + (index * 20),
                        y: 100 + (index * 20)
                    }, file.name);
                    this.addToThumbnails(fileDataUrl, file.name, 'image');
                } else if (file.type.startsWith('video/')) {
                    // For videos, we add to thumbnails, user can then drag to canvas
                    // or we could directly add to canvas like images:
                    // this.addVideoToCanvas(fileDataUrl, { x: 150 + (index * 20), y: 150 + (index * 20) }, file.name);
                    this.addToThumbnails(fileDataUrl, file.name, 'video');
                }
            };
            reader.readAsDataURL(file);
        });
        event.target.value = ''; // Clear the input
    }
    addToThumbnails(mediaSrc, fileName, mediaType = 'image', sampleDetails = null) {
        const thumbnailsContainer = document.getElementById('image-thumbnails');
        const thumbnailItem = document.createElement('div');
        thumbnailItem.className = 'thumbnail-item';
        thumbnailItem.draggable = true;
        const img = document.createElement('img'); // This will show the image or video thumbnail
        img.alt = fileName;
        thumbnailItem.dataset.mediaSrc = mediaSrc;
        thumbnailItem.dataset.fileName = fileName;
        thumbnailItem.dataset.mediaType = mediaType;
        if (mediaType === 'image' && sampleDetails && sampleDetails.shape) {
            thumbnailItem.dataset.imageShape = sampleDetails.shape; // Store shape for sample images
        }
        if (mediaType === 'video') {
            this.generateVideoThumbnail(mediaSrc, (thumbnailDataUrl) => {
                img.src = thumbnailDataUrl;
            });
        } else { // 'image'
            img.src = mediaSrc; // For images, mediaSrc is the imageData (DataURL)
        }
        thumbnailItem.appendChild(img);
        thumbnailsContainer.appendChild(thumbnailItem);
        this.setupDragAndDrop(thumbnailItem);
    }
    generateVideoThumbnail(videoSrc, callback) {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        video.muted = true;
        video.crossOrigin = "anonymous"; // If loading from external URLs, for canvas tainting
        video.onloadeddata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            // Seek to a specific time if needed, e.g., 1 second, or just use first frame
            video.currentTime = Math.min(1, video.duration / 2); // seek to 1s or midpoint for short videos
        };
        video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailDataUrl = canvas.toDataURL();
            callback(thumbnailDataUrl);
            // Clean up
            video.src = "";
            video.removeAttribute("src");
            video.load();
        };
        video.onerror = () => {
            console.error("Error loading video for thumbnail generation:", videoSrc);
            // Fallback: use a generic video icon as data URL or path
            const genericVideoIcon = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="100" height="80"><rect width="100" height="80" fill="%23ccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%23555">VIDEO</text></svg>';
            callback(genericVideoIcon);
        };
        video.src = videoSrc;
        video.load(); // Start loading the video
    }
    addVideoToCanvas(videoSrc, position = { x: 150, y: 150 }, videoName = 'video') {
        const videoElement = document.createElement('video');
        videoElement.src = videoSrc;
        videoElement.loop = true;
        videoElement.muted = true; // Autoplay muted is generally allowed
        videoElement.setAttribute('playsinline', ''); // For iOS
        videoElement.crossOrigin = "anonymous"; // If loading from external URLs
        const hiddenContainer = document.getElementById('hidden-video-elements-container');
        hiddenContainer.appendChild(videoElement);
        videoElement.onloadedmetadata = () => {
            const maxSize = 250; // Max size for videos on canvas
            let { videoWidth: width, videoHeight: height } = videoElement;
            if (width > maxSize || height > maxSize) {
                const scale = Math.min(maxSize / width, maxSize / height);
                width *= scale;
                height *= scale;
            }
            const konvaVideo = new Konva.Image({
                image: videoElement,
                x: -width / 2,
                y: -height / 2,
                width: width,
                height: height,
                strokeWidth: 0,
            });
            const groupX = position.x;
            const groupY = position.y;
            const objectGroup = new Konva.Group({
                x: groupX,
                y: groupY,
                draggable: true,
                name: `media-group-video-${++this.objectCounter}`
            });
            objectGroup.add(konvaVideo);
            // On-canvas controls (simplified for now)
            const controlGroup = new Konva.Group({name: 'control-group', y: height / 2 + 5});
            const playPauseButton = new Konva.Text({
                text: '▶️ Play',
                fontSize: 12,
                fill: 'white',
                padding: 5,
                background: 'black',
                cornerRadius: 3,
                name: 'play-pause-btn'
            });
            let isPlaying = false;
            const anim = new Konva.Animation(() => {
                // The layer will be redrawn, which updates the Konva.Image from the video
            }, this.layer);
            playPauseButton.on('click tap', () => {
                if (isPlaying) {
                    videoElement.pause();
                    anim.stop();
                    playPauseButton.text('▶️ Play');
                } else {
                    videoElement.play().catch(e => console.error("Play error:", e));
                    anim.start();
                    playPauseButton.text('⏸️ Pause');
                }
                isPlaying = !isPlaying;
                this.layer.batchDraw();
            });
            controlGroup.add(playPauseButton);
            objectGroup.add(controlGroup);
            // Store references for later management
            objectGroup.getVideoElement = () => videoElement;
            objectGroup.getAnimation = () => anim;
            objectGroup.getVisualShape = () => konvaVideo;
            objectGroup.getMediaType = () => 'video';
            objectGroup.on('click tap', (e) => {
                // Prevent group click from selecting if a control button was clicked
                if (e.target.name() === 'play-pause-btn') {
                    e.cancelBubble = true; // Stop event from bubbling to the group
                    return;
                }
                this.selectObject(objectGroup);
            });
            objectGroup.on('dragstart', () => {
                // Optional: Pause video during drag to save performance
                // if (isPlaying) videoElement.pause();
            });
            objectGroup.on('dragend', () => {
                // Optional: Resume video after drag
                // if (isPlaying) videoElement.play();
            });
            this.layer.add(objectGroup);
            this.selectObject(objectGroup); // Select the new video
            // Start playing automatically (muted) and start animation
            videoElement.play().then(() => {
                anim.start();
                isPlaying = true;
                playPauseButton.text('⏸️ Pause');
                this.layer.batchDraw();
            }).catch(e => {
                console.error("Autoplay failed:", e);
                // Update button text if autoplay fails
                playPauseButton.text('▶️ Play');
                this.layer.batchDraw();
            });
        };
        videoElement.onerror = (e) => {
            console.error('Error loading video:', videoSrc, e);
            alert('Failed to load video: ' + videoName);
            if (videoElement.parentNode) {
                 videoElement.parentNode.removeChild(videoElement);
            }
        };
        videoElement.load(); // Start loading
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
        
        // Define maximum canvas sizes based on common screen resolutions
        const maxSizes = {
            '8K': { width: 7680, height: 4320 },
            '4K': { width: 3840, height: 2160 },
            '2K': { width: 2560, height: 1440 },
            'FHD': { width: 1920, height: 1080 }
        };
        
        // Set maximum limits (8K resolution)
        const maxWidth = maxSizes['8K'].width;
        const maxHeight = maxSizes['8K'].height;
        
        if (width > 0 && height > 0) {
            // Clamp values to maximum limits
            const clampedWidth = Math.min(width, maxWidth);
            const clampedHeight = Math.min(height, maxHeight);
            
            // Update input values if they were clamped
            if (clampedWidth !== width) {
                document.getElementById('canvas-width').value = clampedWidth;
            }
            if (clampedHeight !== height) {
                document.getElementById('canvas-height').value = clampedHeight;
            }
            
            // Show warning if size was clamped
            if (clampedWidth !== width || clampedHeight !== height) {
                alert(`Canvas size was limited to maximum allowed: ${clampedWidth}x${clampedHeight} (8K resolution limit)`);
            }
            
            this.stage.width(clampedWidth);
            this.stage.height(clampedHeight);
            this.layer.draw();
        }
    }
    exportCanvas(format) {
        // Temporarily hide transformer and video elements for export
        this.transformer.hide();
        const videoGroups = [];
        this.layer.getChildren(node => {
            if (typeof node.getMediaType === 'function' && node.getMediaType() === 'video') {
                // For videos, also pause them and seek to current time to capture current frame
                const videoElement = node.getVideoElement && node.getVideoElement();
                if (videoElement && !videoElement.paused) {
                    videoElement.pause(); // Pause to ensure current frame is static
                }
                videoGroups.push(node);
                node.hide(); // Hide the entire video group
            }
            return false; // Continue search
        });
        this.layer.draw(); // Redraw with videos hidden
        const dataURL = this.stage.toDataURL({
            mimeType: `image/${format}`,
            quality: format === 'jpg' ? 0.8 : 1.0,
            pixelRatio: 2 // For better quality export
        });
        this.transformer.show(); // Show transformer again
        videoGroups.forEach(node => node.show()); // Show video groups again
        // Optionally resume videos if they were playing
        // videoGroups.forEach(node => {
        //     const videoElement = node.getVideoElement && node.getVideoElement();
        //     // Check a stored 'isPlaying' state on the group if needed, or just play if it was auto-playing
        //     // For simplicity, not auto-resuming here as export is a snapshot.
        // });
        this.layer.draw(); // Redraw with videos visible
        const link = document.createElement('a');
        link.download = `canvas-export.${format}`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    updateZoomDisplay() {
        const currentScale = this.stage.scaleX();
        const percentage = Math.round(currentScale * 100);
        const zoomDisplay = document.getElementById('zoom-percentage-display');
        if (zoomDisplay) {
            zoomDisplay.textContent = percentage + '%';
        }

        // Update preset dropdown
        const zoomPresetDropdown = document.getElementById('zoom-preset-dropdown');
        if (zoomPresetDropdown) {
            let matched = false;
            for (let i = 0; i < zoomPresetDropdown.options.length; i++) {
                if (Math.abs(parseFloat(zoomPresetDropdown.options[i].value) - currentScale) < 0.001) {
                    zoomPresetDropdown.value = zoomPresetDropdown.options[i].value;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                // If no exact match, clear selection or add a "Custom" option
                // For simplicity, we'll clear it. A more advanced approach might add a temporary "Custom X%" option.
                zoomPresetDropdown.value = "";
            }
        }
    }

    _setStageScale(targetScale, focalPointX, focalPointY) {
        const oldScale = this.stage.scaleX();
        const minScale = 0.25; // Minimum 25%
        const maxScale = 4.0;  // Maximum 400%

        let newScale = targetScale;
        if (newScale < minScale) newScale = minScale;
        if (newScale > maxScale) newScale = maxScale;

        if (newScale === oldScale) {
            // If scale hasn't changed (e.g. at min/max limit), ensure display is updated if it was the first attempt
            this.updateZoomDisplay(); // Update display in case it's called with a scale already at limit
            return;
        }

        const mousePointTo = {
            x: (focalPointX - this.stage.x()) / oldScale,
            y: (focalPointY - this.stage.y()) / oldScale,
        };

        this.stage.scale({ x: newScale, y: newScale });

        const newPos = {
            x: focalPointX - mousePointTo.x * newScale,
            y: focalPointY - mousePointTo.y * newScale,
        };
        this.stage.position(newPos);
        this.updateZoomDisplay();
        this.layer.draw();
    }
    
    zoomIn() {
        const oldScale = this.stage.scaleX();
        const newScale = oldScale * 1.25; // Approx 25% increase
        
        // Zoom centered on the viewport
        const viewportCenterX = this.stage.width() / 2;
        const viewportCenterY = this.stage.height() / 2;
        this._setStageScale(newScale, viewportCenterX, viewportCenterY);
    }
    
    zoomOut() {
        const oldScale = this.stage.scaleX();
        const newScale = oldScale / 1.25; // Approx 25% decrease

        // Zoom centered on the viewport
        const viewportCenterX = this.stage.width() / 2;
        const viewportCenterY = this.stage.height() / 2;
        this._setStageScale(newScale, viewportCenterX, viewportCenterY);
    }
    
    resetZoom() {
        // Reset to 100% scale (1.0) and position (0,0)
        // For 100% zoom, centering on (0,0) of the stage is standard.
        this.stage.scale({ x: 1, y: 1 });
        this.stage.position({ x: 0, y: 0 });
        this.updateZoomDisplay();
        this.layer.draw();
    }

    fitToScreen() {
        const contentBounds = this.layer.getClientRect({ skipTransform: true, relativeTo: this.stage });

        if (!contentBounds.width || !contentBounds.height) {
            // No content or zero-size content, reset to 100% centered
            this.resetZoom();
            return;
        }

        const stageWidth = this.stage.width();
        const stageHeight = this.stage.height();
        const padding = 0.95; // 5% padding around the content

        const scaleX = stageWidth / contentBounds.width;
        const scaleY = stageHeight / contentBounds.height;
        let newScale = Math.min(scaleX, scaleY) * padding;

        // Ensure newScale is within global min/max zoom limits
        const minZoom = 0.25;
        const maxZoom = 4.0;
        newScale = Math.max(minZoom, Math.min(maxZoom, newScale));
        
        // Calculate new position to center the content
        // The focal point for _setStageScale should be the center of the stage
        const focalPointX = stageWidth / 2;
        const focalPointY = stageHeight / 2;

        // To center the content, we need to adjust the stage's position *after* scaling.
        // The _setStageScale method handles scaling around a focal point,
        // but for fitToScreen, we want the *content* to be centered.
        // So, we first scale, then adjust position.

        this.stage.scale({ x: newScale, y: newScale });
        
        // Recalculate bounds with the new scale to find the correct offset
        const scaledContentBounds = this.layer.getClientRect({ skipTransform: false, relativeTo: this.stage });

        const newX = (stageWidth - scaledContentBounds.width) / 2 - scaledContentBounds.x;
        const newY = (stageHeight - scaledContentBounds.height) / 2 - scaledContentBounds.y;

        this.stage.position({ x: newX, y: newY });

        this.updateZoomDisplay();
        this.layer.draw();
    }

    fillToScreen() {
        // Placeholder for "Fill to Screen" functionality
        // This would typically zoom to fill the screen width with the design.
        console.log('Fill to Screen button pressed - placeholder');
        alert('Fill to Screen functionality is not yet implemented.');
        // Similar logic to fitToScreen, but likely uses only width or a different aspect ratio consideration.
        // const contentBounds = this.layer.getClientRect({ skipTransform: true });
        // if (!contentBounds.width) { this.resetZoom(); return; }
        // const stageWidth = this.stage.width();
        // const newScale = stageWidth / contentBounds.width * 0.98; // Fill width with slight padding
        // const focalPointX = stageWidth / 2;
        // const focalPointY = this.stage.height() / 2;
        // this._setStageScale(newScale, focalPointX, focalPointY); // This will center based on current view
        // // Additional adjustments might be needed for vertical positioning.
    }
}
// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new CanvaClone();
});