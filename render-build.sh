#!/usr/bin/env bash
# Build script for deploying to Render

# Exit on error
set -o errexit

# Install dependencies
npm install

# Build the client
npm run build

# Start the server
npm run start
