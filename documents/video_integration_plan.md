# Plan for Video Integration into Canva Clone
**I. Goal: Enable users to add and manipulate videos on the canvas.**
**II. Core Requirements & Plan Details:**
1.  **Video Input Methods & UI (Updates for `src/index.html`):**
    *   **File Upload:**
        *   Modify the existing file input at `src/index.html:37`:
            *   Change `accept="image/*"` to `accept="image/*,video/mp4,video/webm,video/ogg"`.
        *   Update the label for the file input at `src/index.html:39` from "ð Upload Images" to "ð Upload Media".
        *   In `src/js/app.js`, update `handleFileUpload()` (around line 398) to differentiate between image and video files based on `file.type`.
    *   **URL Pasting:**
        *   In `src/index.html`, within the `div.upload-area` (around line 36-41), add the following HTML:
            ```html
            <!-- Existing file input and label above this -->
            <div class="video-url-area" style="margin-top: 15px;">
                <p style="margin-bottom: 5px; font-size: 0.9em;">Or add video from URL:</p>
                <input type="text" id="video-url-input" placeholder="Paste video URL here" style="width: calc(100% - 75px); padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-right: 5px;">
                <button id="add-video-url-btn" style="padding: 8px 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Add</button>
            </div>
            ```
        *   In `src/js/app.js`, implement an event listener for `add-video-url-btn` within `setupEventListeners()` (around line 106) to get the URL and call a new function like `addVideoToCanvas()`.
2.  **Thumbnail Generation & Display:**
    *   In `src/index.html`, change the heading "Image Library" at `src/index.html:31` to "Media Library". The `div#image-thumbnails` (`src/index.html:32`) will now serve as a general media thumbnail container.
    *   Create a new utility function, `generateVideoThumbnail(videoSrc, callback)`, in `src/js/app.js`.
        *   This function will create a temporary, off-screen `<video>` element, set its `src`.
        *   On `loadeddata` or `seeked`, draw the video's first frame to a temporary `<canvas>`.
        *   Convert canvas to data URL and pass to `callback`.
    *   Modify `addToThumbnails()` (around line 415) in `src/js/app.js`:
        *   Accept a `mediaType` parameter ('image' or 'video').
        *   If `mediaType` is 'video', call `generateVideoThumbnail()`. The `img.src` for the thumbnail will be this generated frame.
        *   Store `element.dataset.mediaType = mediaType;` and `element.dataset.mediaSrc = originalVideoSrcOrImageDataUrl;`.
3.  **Adding Videos to Konva Canvas:**
    *   Create a new method `addVideoToCanvas(videoSrc, position, videoName)` in `src/js/app.js`.
        *   Create an HTML `<video>` element. Set `videoElement.src = videoSrc`, `videoElement.loop = true`, `videoElement.muted = true` (initially).
        *   **DOM Attachment for Video Element:** In `src/index.html`, add a hidden container:
            ```html
            <!-- Just before </body> -->
            <div id="hidden-video-elements-container" style="display: none; position: absolute; width: 0; height: 0; overflow: hidden;"></div>
            ```
            Append the created `<video>` element to this container.
        *   Once the video's metadata is loaded, create a `Konva.Image` with the HTML `<video>` element as its `image` property.
        *   Implement `Konva.Animation` tied to `this.layer` for frame updates. Start/stop animation with video play/pause.
        *   **On-Canvas Controls:**
            *   Create a `Konva.Group` (`objectGroup`) for the video and controls. Name it (e.g., `video-group-\${++this.objectCounter}`).
            *   Add `Konva.Path` or `Konva.Text` for Play/Pause and Volume controls to this group.
            *   Attach event listeners to control `videoElement.play/pause/volume/muted` and the `Konva.Animation`.
        *   `objectGroup` should have methods like `getVisualShape()`, `getVideoElement()`, `getAnimation()`.
        *   Add group to `this.layer` and select it.
4.  **Drag and Drop for Videos:**
    *   In `setupDragAndDrop()` (around `src/js/app.js:81`):
        *   Set `e.dataTransfer.setData('mediaType', element.dataset.mediaType)` and `e.dataTransfer.setData('mediaSrc', element.dataset.mediaSrc)`.
    *   In the `drop` event listener (around `src/js/app.js:116`):
        *   Get `mediaType` and `mediaSrc`.
        *   If `mediaType` is 'video', call `this.addVideoToCanvas()`. Else, `this.addImageToCanvas()`.
5.  **Object Management & Properties:**
    *   `selectObject()` (around `src/js/app.js:216`) selects the `Konva.Group`.
    *   Property panel controls (`setupPropertyControls`, `updatePropertyPanel`) apply to `visualShape`.
    *   When a video object is deleted via `deleteSelected()` (around `src/js/app.js:228`):
        *   Stop animation, pause video, clear video src, remove video element from DOM.
        *   Then destroy the `Konva.Group`.
6.  **Export Behavior:**
    *   Modify `exportCanvas()` (around `src/js/app.js:448`):
        *   Iterate canvas children. If a video group (e.g., by name or custom property), temporarily set `node.visible(false)`.
        *   After `stage.toDataURL()`, restore `node.visible(true)`.
        *   Ensure `this.layer.draw()` is called after hiding and showing.
**III. Visual Plan (Mermaid Diagram):**
\`\`\`mermaid
graph TD
    subgraph User Input
        UI1[File Upload: Select Video/Image in \`src/index.html:37\`] --> JS1([\`handleFileUpload\` in \`src/js/app.js:398\`]);
        UI2[URL Input: Paste Video URL in new HTML input] --> JS2[Handle Add URL Button Click];
    end
    subgraph Media Processing & Thumbnail
        JS1 -- Media File/URL --> JS3([\`generateVideoThumbnail\` or use image directly]);
        JS2 -- Video URL --> JS3;
        JS3 -- Thumbnail DataURL --> JS4([\`addToThumbnails\` in \`src/js/app.js:415\`]);
        JS4 --> UI3[Display Media Thumbnail in Panel (\`src/index.html:32\`)];
    end
    subgraph Canvas Integration
        UI3 -- Drag Thumbnail --> JS5[Canvas Drop Event (\`src/js/app.js:116\`)];
        JS5 -- Media Source & Type --> JS6_COND{Is it Video?};
        JS6_COND -- Yes --> JS_VID_ADD([\`addVideoToCanvas\` in \`src/js/app.js\`]);
        JS6_COND -- No --> JS_IMG_ADD([\`addImageToCanvas\` in \`src/js/app.js:155\`]);
        JS_VID_ADD --> HTML_VID[Create HTML <video> Element (append to \`#hidden-video-elements-container\` in \`src/index.html\`)];
        HTML_VID --> KV[Create Konva.Image from <video>];
        KV --> KG[Create Konva.Group (Video + On-Canvas Controls)];
            subgraph OnCanvasControls [On-Canvas Controls]
                KG --> KGC_PP[Play/Pause Shape];
                KG --> KGC_VOL[Volume Shape];
            end
        KGC_PP -- onClick --> HTML_VID_CTRL[Control video.play/pause & Konva.Animation];
        KGC_VOL -- onClick --> HTML_VID_CTRL2[Control video.volume/muted];
        HTML_VID -- playing --> ANIM[Konva.Animation for frame updates];
        ANIM --> RENDER[Layer Redraw / Video Displayed];
        KG --> LAYER[Add Group to Konva Layer];
    end
    subgraph Object Lifecycle & Export
        LAYER --> SELECT([\`selectObject\` in \`src/js/app.js:216\`]);
        SELECT --> TRANSFORM[Transform/Modify Group];
        SELECT --> DELETE([\`deleteSelected\` in \`src/js/app.js:228\`]);
        DELETE --> CLEANUP[Cleanup HTML <video>, Animation & Konva Objects];
        EXPORT_BTN[Export Canvas Button] --> JS_EXPORT([\`exportCanvas\` in \`src/js/app.js:448\`]);
        JS_EXPORT --> HIDE_MEDIA[Temporarily Hide Video Groups];
        HIDE_MEDIA --> EXPORT_IMG[Generate Static Image];
        EXPORT_IMG --> SHOW_MEDIA[Restore Video Group Visibility];
    end
\`\`\`