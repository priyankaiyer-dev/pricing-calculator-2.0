# Setup Instructions

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

## Installation Steps

1. **Navigate to the project directory:**
   ```bash
   cd /Users/priyanka.iyer/pricing-calculator-2.0
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   
   This will install all required packages including:
   - Next.js 15
   - React 18
   - TypeScript
   - Tailwind CSS
   - Lucide React icons

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - The app should load and show the quote list dashboard

## Troubleshooting

### If the app doesn't load:

1. **Check if dependencies are installed:**
   ```bash
   ls node_modules
   ```
   If this folder doesn't exist, run `npm install` again.

2. **Check for errors in the terminal:**
   - Look for TypeScript errors
   - Look for import errors
   - Check if port 3000 is already in use

3. **Try a different port:**
   ```bash
   npm run dev -- -p 3001
   ```

4. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

5. **Check Node.js version:**
   ```bash
   node --version
   ```
   Should be 18 or higher.

## Common Issues

- **"Module not found" errors**: Run `npm install` again
- **Port already in use**: Use `-p 3001` flag or kill the process using port 3000
- **TypeScript errors**: Check that all imports are correct
- **Blank page**: Check browser console for JavaScript errors
