// Load environment variables from .env file
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// ---------------------- CONFIGURATION ---------------------- //

// Session middleware setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',  // Use environment variable in production
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// ---------------------- AUTHENTICATION ROUTES ---------------------- //

// Initiate Google login
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback route
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => res.redirect('/dashboard')
);

// Dashboard Route: Redirects after login attempt
app.get('/dashboard', (req, res) => {
    const isAuthenticated = req.isAuthenticated();
    res.send(`
        <h1>${isAuthenticated ? 'Successful Login' : 'Unsuccessful Login'}</h1>
        <script>
            setTimeout(() => { window.location.href = "/"; }, 2000);
        </script>
    `);
});

// Logout Route
app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

// Check login status via API
app.get('/auth/status', (req, res) => {
    res.json({ loggedIn: req.isAuthenticated(), user: req.user || null });
});

// ---------------------- STATIC FILES & UPLOAD SETUP ---------------------- //

// Serve static files (index, upload page, and uploaded images)
app.use(express.static(path.join(__dirname)));
app.use('/uploadPage/uploads', express.static(path.join(__dirname, 'uploadPage/uploads')));

// Ensure the upload directory exists
const uploadDir = './uploadPage/uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, `upload-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 1 * 1024 * 1024 }, // 1MB file size limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const isValid = filetypes.test(path.extname(file.originalname).toLowerCase()) && filetypes.test(file.mimetype);
        return cb(null, isValid ? true : 'Error: Images only!');
    }
}).single('myFile');

// ---------------------- PAGE ROUTES ---------------------- //

// Serve homepage
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Serve upload page
app.get('/uploadPage/upload.html', (req, res) => res.sendFile(path.join(__dirname, 'uploadPage/upload.html')));

// ---------------------- API ROUTES ---------------------- //

// Handle file uploads
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) return res.status(400).json({ error: err });
        res.json({ message: 'File uploaded successfully!', file: req.file });
    });
});

// Retrieve list of uploaded images
app.get('/images', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to load images' });
        res.json(files.filter(file => /\.(jpeg|jpg|png|gif)$/i.test(file)));
    });
});

// ---------------------- START SERVER ---------------------- //

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
