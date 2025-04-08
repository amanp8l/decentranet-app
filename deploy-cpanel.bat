@echo off
echo Installing dependencies...
call npm install

echo Setting up environment variables...
echo NEXT_PUBLIC_HUBBLE_HTTP_URL=https://hub.pinata.cloud> .env.production
echo NEXT_PUBLIC_HUBBLE_GRPC_URL=https://hub-grpc.pinata.cloud>> .env.production
echo NEXT_PUBLIC_APP_NAME=Social UI>> .env.production

echo Building the application...
call npm run build

echo Creating deployment package...
cd .next
powershell -command "Compress-Archive -Path * -DestinationPath ..\build.zip -Force"
cd ..

echo Deployment package created: build.zip
echo Please upload the build.zip file to your cPanel hosting and extract it to the public_html directory.
echo.
echo After uploading, don't forget to set up the .htaccess file as described in the README.

pause 