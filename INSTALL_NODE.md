# Installing Node.js on macOS

You need to install Node.js (which includes npm) before you can run this application.

## Option 1: Install via Homebrew (Recommended)

If you have Homebrew installed:

```bash
brew install node
```

To check if you have Homebrew:
```bash
which brew
```

If Homebrew is not installed, install it first:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## Option 2: Install via Official Installer

1. Go to https://nodejs.org/
2. Download the LTS (Long Term Support) version for macOS
3. Run the installer
4. Follow the installation wizard
5. Restart your terminal

## Option 3: Install via NVM (Node Version Manager)

This allows you to manage multiple Node.js versions:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.zshrc

# Install Node.js LTS
nvm install --lts

# Use the installed version
nvm use --lts
```

## Verify Installation

After installing, verify it works:

```bash
node --version
npm --version
```

You should see version numbers (e.g., `v20.10.0` and `10.2.3`).

## After Installing Node.js

Once Node.js is installed, you can proceed with:

```bash
cd /Users/priyanka.iyer/pricing-calculator-2.0
npm install
npm run dev
```

## Quick Check

Run this to see if Node.js is installed:
```bash
which node
```

If it shows a path, Node.js is installed. If it says "not found", you need to install it using one of the options above.
