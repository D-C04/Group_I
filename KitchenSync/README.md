# KitchenSync - Frontend MVP

## What is this?
These are the HTML/CSS/Bootstrap 5 frontend files for the KitchenSync app, converted from our Figma high-fidelity prototype.

## How to Run
1. Open the `kitchensync` folder in **VSCode**
2. Install the **Live Server** extension (by Ritwick Dey) if you don't have it
3. Right-click on `index.html` and select **"Open with Live Server"**
4. Your browser will open and you can navigate through all the pages

Alternatively, just double-click `index.html` to open it directly in your browser.

## File Structure
```
kitchensync/
├── index.html            <-- Welcome/Landing page (start here)
├── login.html            <-- Sign In page
├── register.html         <-- Create Account page
├── dashboard.html        <-- Main Dashboard (overview, items, recipes, storage)
├── recipes.html          <-- Browse Recipes page
├── liked-recipes.html    <-- Liked/Saved Recipes page
├── fridge.html           <-- Fridge storage view
├── pantry.html           <-- Pantry storage view
├── freezer.html          <-- Freezer storage view
├── add-item.html         <-- Add New Item form
├── css/
│   └── style.css         <-- All custom styles (colors, layout, components)
├── js/
│   └── app.js            <-- All interactivity (search overlay, tabs, forms)
├── images/               <-- Folder for images (empty for now, add images here later)
└── README.md             <-- This file
```

## Page Flow (User Journey)
```
index.html (Welcome)
  └──> login.html (Sign In)
         ├──> register.html (Create Account)
         └──> dashboard.html (Main Dashboard)
                ├──> recipes.html (Browse Recipes)
                ├──> liked-recipes.html (Liked Recipes)
                ├──> fridge.html (Fridge Storage)
                ├──> pantry.html (Pantry Storage)
                ├──> freezer.html (Freezer Storage)
                └──> add-item.html (Add New Item)
```

## Technology Stack
- **HTML5** - Page structure
- **CSS3** - Custom styling (in `css/style.css`)
- **Bootstrap 5.3.3** - Responsive grid and utility classes (loaded via CDN)
- **Bootstrap Icons 1.11.3** - All icons (loaded via CDN)
- **Vanilla JavaScript** - Interactivity (in `js/app.js`)

## Key Features Working Right Now
- Navigation between all pages (links/buttons)
- Filter tabs on dashboard (All / Expired / Expiring Soon / Low Stock)
- Quantity +/- buttons on Add Item page
- Storage assignment toggle buttons on Add Item page
- Form validation (login + add item)
- Search filtering on recipe and storage pages
- Fully responsive layout (mobile, tablet, and desktop)
- Items and recipe cards reflow into 2-column (tablet) and 3-column (desktop) grids
- KS logo appears on Welcome and Dashboard pages only

## Colors Used (from our Figma design)
- Background cream: `#F5F0E1`
- Gold accent: `#D4A843`
- Brown button: `#A07850`
- Red (expired): `#E74C3C`
- Orange (expiring): `#F39C12`
- Green (add item): `#2E7D32`
- Blue (learn more): `#2196F3`

## Next Steps
- Connect to Node.js/Express backend
- Set up MongoDB/Mongoose models
- Replace placeholder icons with real food images
- Implement actual CRUD operations
- Add EJS templating to replace static HTML
- Wire up notification system for expiry alerts
