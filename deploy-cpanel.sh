#!/bin/bash

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Create or update environment files
echo "Setting up environment variables..."
cat > .env.production << EOL
NEXT_PUBLIC_HUBBLE_HTTP_URL=https://hub.pinata.cloud
NEXT_PUBLIC_HUBBLE_GRPC_URL=https://hub-grpc.pinata.cloud
NEXT_PUBLIC_APP_NAME=Social UI
NEXT_PUBLIC_NEYNAR_API_KEY=45455345-4F67-4A40-B9B1-05561361662B
NEXT_PUBLIC_USE_NEYNAR_API=true
EOL

# Build the application
echo "Building the application..."
npm run build

# Create a zip file of the build output
echo "Creating deployment package..."
cd .next
zip -r ../build.zip *
cd ..

echo "Deployment package created: build.zip"
echo "Please upload the build.zip file to your cPanel hosting and extract it to the public_html directory."
echo ""
echo "After uploading, don't forget to set up the following in your .htaccess file:"
echo "RewriteEngine On"
echo "RewriteBase /"
echo "RewriteRule ^index\.html$ - [L]"
echo "RewriteCond %{REQUEST_FILENAME} !-f"
echo "RewriteCond %{REQUEST_FILENAME} !-d"
echo "RewriteRule . /index.html [L]" 