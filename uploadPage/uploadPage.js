// ---------------------- DOM ELEMENTS ---------------------- //

const form = document.getElementById('uploadForm');
const messageDiv = document.getElementById('message');
const galleryDiv = document.getElementById('gallery');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const confirmUploadButton = document.getElementById('confirmUpload');
const removePreviewButton = document.getElementById('removePreview');
const dropZone = document.getElementById('dropZone');

// ---------------------- TOOLBAR LOADING ---------------------- //

document.addEventListener("DOMContentLoaded", () => {
    const toolbarContainer = document.getElementById("toolbar-container");

    fetch("../toolbar.html")
        .then(response => {
            if (!response.ok) throw new Error("Failed to load toolbar");
            return response.text();
        })
        .then(html => {
            toolbarContainer.innerHTML = html;
        })
        .catch(error => console.error("Error loading toolbar:", error));

    // Load gallery on page load
    loadGallery();
});

// ---------------------- FILE SELECTION & PREVIEW ---------------------- //

fileInput.addEventListener('change', event => handleFile(event.target.files[0]));

dropZone.addEventListener('dragover', event => {
    event.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

dropZone.addEventListener('drop', event => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    handleFile(event.dataTransfer.files[0]);
});

dropZone.addEventListener('click', () => fileInput.click());

/**
 * Handles file selection, validates the file type, and displays a preview.
 * @param {File} file - The selected file.
 */
function handleFile(file) {
    if (!file) {
        clearPreview();
        return;
    }

    if (!file.type.startsWith('image/')) {
        clearPreview();
        alert('Please select a valid image file (jpg, png, gif).');
        return;
    }

    // Programmatically update the file input's value
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    const reader = new FileReader();
    reader.onload = () => {
        imagePreview.src = reader.result;
        imagePreview.style.display = 'block';
        removePreviewButton.style.display = 'block';
        confirmUploadButton.disabled = false; // Enable confirm button
    };
    reader.readAsDataURL(file);
}

// ---------------------- UPLOAD HANDLING ---------------------- //

confirmUploadButton.addEventListener('click', () => form.requestSubmit()); // Trigger form submission

removePreviewButton.addEventListener('click', clearPreview);

/**
 * Clears the image preview and resets the input field.
 */
function clearPreview() {
    imagePreview.style.display = 'none';
    imagePreview.src = '';
    removePreviewButton.style.display = 'none';
    confirmUploadButton.disabled = true;
    fileInput.value = ''; // Reset the file input
}

// ---------------------- FORM SUBMISSION ---------------------- //

form.addEventListener('submit', async event => {
    event.preventDefault();
    messageDiv.textContent = ''; // Clear any previous messages

    const formData = new FormData(form);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Upload failed');

        // Display success message, reset form, and refresh gallery
        messageDiv.textContent = result.message || 'File uploaded successfully!';
        messageDiv.className = 'message';
        form.reset();
        clearPreview();
        loadGallery();

        // Remove the message after 3 seconds
        setTimeout(() => messageDiv.textContent = '', 3000);
    } catch (error) {
        messageDiv.textContent = error.message;
        messageDiv.className = 'message error';

        // Remove the error message after 5 seconds
        setTimeout(() => messageDiv.textContent = '', 3000);
    }
});

// ---------------------- GALLERY LOADING ---------------------- //

/**
 * Fetches and displays uploaded images in the gallery.
 */
async function loadGallery() {
    try {
        const response = await fetch('/images');
        if (!response.ok) throw new Error('Failed to fetch images');

        const images = await response.json();
        galleryDiv.innerHTML = images.map(img => `
            <div class="gallery-item">
                <img src="/uploadPage/uploads/${img}" alt="${img}">
            </div>
        `).join('');
    } catch (error) {
        console.error(error);
        galleryDiv.innerHTML = '<p class="message error">Error loading gallery</p>';
    }
}
