// ---------------------- DOM ELEMENTS ---------------------- //

const form = document.getElementById('uploadForm');
const messageDiv = document.getElementById('message');
const galleryDiv = document.getElementById('gallery');

// ---------------------- TOOLBAR LOADING ---------------------- //

document.addEventListener("DOMContentLoaded", async () => {
    const toolbarContainer = document.getElementById("toolbar-container");

    try {
        const response = await fetch("toolbar.html");
        if (!response.ok) throw new Error("Failed to load toolbar");

        toolbarContainer.innerHTML = await response.text();

        // After toolbar loads, update the authentication link
        updateAuthLink();
    } catch (error) {
        console.error("Error loading toolbar:", error);
    }

    // Load the gallery on page load
    loadGallery();
});

// ---------------------- AUTHENTICATION LINK ---------------------- //

/**
 * Updates the authentication link dynamically based on user login status.
 */
async function updateAuthLink() {
    const authLink = document.getElementById("auth-link");
    if (!authLink) return; // If the link is missing, do nothing

    try {
        const response = await fetch("/auth/status");
        const data = await response.json();

        authLink.textContent = data.loggedIn ? "Log Out" : "Login";
        authLink.href = data.loggedIn ? "/logout" : "/auth/google";
    } catch (error) {
        console.error("Error checking authentication status:", error);
    }
}

// ---------------------- FORM SUBMISSION ---------------------- //

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageDiv.textContent = ''; // Clear previous messages

    const formData = new FormData(form);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Upload failed');

        // Display success message and reset form
        messageDiv.textContent = result.message || 'File uploaded successfully!';
        messageDiv.className = 'message';
        form.reset();

        // Refresh the gallery after a successful upload
        loadGallery();
    } catch (error) {
        messageDiv.textContent = error.message;
        messageDiv.className = 'message error';
    }
});

// ---------------------- GALLERY LOADING ---------------------- //

async function loadGallery() {
    try {
        const response = await fetch('/images');
        if (!response.ok) throw new Error('Failed to fetch images');

        const images = await response.json();

        galleryDiv.innerHTML = images.map(img => `
            <div class="gallery-item">
                <img src="uploads/${img}" alt="Uploaded Image">
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
        messageDiv.textContent = 'Error loading gallery';
        messageDiv.className = 'message error';
    }
}
