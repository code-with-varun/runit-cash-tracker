# Money Matrix — Hostinger Shared Hosting Deployment Guide

This guide walks you through deploying **Money Matrix** (React Frontend + PHP API Backend + MySQL Database) on **Hostinger Shared Hosting**.

---

## Architecture Overview

```
Hostinger public_html/
├── .htaccess                 # Directs API calls to /api and SPA routes to index.html
├── index.html                # React single page application entry point
├── favicon.png               # Money Matrix official favicon
├── assets/                   # Compiled React JS and CSS bundles
├── branding/                 # Money Matrix logos, icons, and marks
└── api/                      # PHP REST API backend
    ├── .htaccess             # Apache rewrite rules for API routes
    ├── index.php             # Master API router / Front controller
    ├── schema.sql            # MySQL schema and seeds (for reference / phpMyAdmin)
    ├── config/
    │   ├── config.php        # Hostinger MySQL database credentials
    │   ├── db.php            # PDO connection & auto-table migration
    │   └── cors.php          # CORS headers
    ├── helpers/
    │   └── response.php      # JSON response and request parsers
    ├── auth/                 # Login & Registration endpoints
    ├── categories.php        # Category endpoints (GET, POST, DELETE, /bulk)
    ├── transactions.php      # Transaction endpoints (GET, POST, PUT, DELETE, /bulk)
    ├── settings.php          # PIN and user settings
    └── reset.php             # Sample data reset endpoint
```

---

## Step 1: Create MySQL Database in Hostinger hPanel

1. Log in to your **Hostinger Control Panel (hPanel)**.
2. Go to **Databases** → **MySQL Databases**.
3. Under **Create a New MySQL Database and Database User**:
   - **Database Name**: e.g., `u123456789_moneymatrix`
   - **Username**: e.g., `u123456789_admin`
   - **Password**: (Choose a secure password and save it)
4. Click **Create**.
5. *(Optional)* Click **Enter phpMyAdmin** next to the newly created database, select the **Import** tab, choose `api/schema.sql`, and click **Go**. *(Note: The PHP backend also automatically creates and seeds all tables if they do not exist!)*

---

## Step 2: Configure Database Credentials in `api/config/config.php`

Before or after uploading, edit `api/config/config.php` with your Hostinger database details:

```php
<?php
return [
    'db' => [
        'host' => 'localhost',              // Hostinger MySQL host is localhost
        'port' => '3306',
        'name' => 'u123456789_moneymatrix', // Your Hostinger DB Name
        'user' => 'u123456789_admin',      // Your Hostinger DB User
        'pass' => 'your_strong_password',   // Your Hostinger DB Password
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'name' => 'Money Matrix API',
        'version' => '1.0.0',
        'env' => 'production',
    ]
];
```

---

## Step 3: Build the React Frontend

Run the build command on your local machine:

```bash
npm run build
```

This creates a production-ready bundle in the `dist/` directory.

---

## Step 4: Upload Files to Hostinger `public_html`

1. In Hostinger hPanel, go to **Files** → **File Manager** (or connect via FTP / FileZilla).
2. Open the `public_html` directory of your domain or subdomain.
3. Upload everything from your local `dist/` folder into `public_html/`:
   - `index.html`
   - `.htaccess`
   - `assets/` folder
   - `branding/` folder
   - `favicon.png`
4. Upload the local `api/` folder directly into `public_html/api/`.

---

## Step 5: Verify Deployment

1. **Test the API**:
   Open in your browser:
   `https://yourdomain.com/api/health`
   You should see:
   ```json
   {
     "status": "ok",
     "dbState": "connected",
     "message": "Money Matrix PHP MySQL API is running smoothly"
   }
   ```

2. **Test the Application**:
   Open in your browser:
   `https://yourdomain.com/`
   Log in or create an account, create transactions, and check that everything saves directly to your Hostinger MySQL database!

---

## Local Development with XAMPP

To run and test locally with XAMPP:

1. Start **Apache** and **MySQL** in your **XAMPP Control Panel**.
2. Run the full local development environment:
   ```bash
   npm run dev:full
   ```
   - Vite React Dev Server runs on `http://localhost:5173`
   - PHP API Backend runs on `http://127.0.0.1:5000` (auto-proxied via Vite)
   - MySQL database `moneymatrix` is auto-created in XAMPP!
