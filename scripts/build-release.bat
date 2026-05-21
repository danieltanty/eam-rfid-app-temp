@echo off
setlocal enabledelayedexpansion

echo ------------------------------------------
echo   EAM RFID APP - Build Release
echo ------------------------------------------
echo.

SET APP_FOLDER_NAME=eam-rfid-app

for %%I in ("%~dp0..") do set "ROOT=%%~fI"

set BACKEND=%ROOT%\backend
set FRONTEND=%ROOT%\frontend
set RELEASE_DIR=%ROOT%\release
set INSTALLATION_DIR=%ROOT%\EAM RFID App Setup
set STAGING_DIR=%RELEASE_DIR%\%APP_FOLDER_NAME%
set SCRIPTS_DIR=%ROOT%\scripts
set ARTIFACT_NAME=%APP_FOLDER_NAME%.zip

echo ------------------------------------------
echo STEP 1: Initialize Release Directory
echo ------------------------------------------

if exist "%RELEASE_DIR%" rmdir /s /q "%RELEASE_DIR%"
mkdir "%STAGING_DIR%"

if exist "%INSTALLATION_DIR%\%APP_FOLDER_NAME%" rmdir /s /q "%INSTALLATION_DIR%\%APP_FOLDER_NAME%"

echo Initialized release directory
echo.

echo ------------------------------------------
echo STEP 2: Build Frontend
echo ------------------------------------------

set /p BUILD_FE=Run frontend build? (Y/N): 

if /I "%BUILD_FE%"=="Y" (
    echo Installing frontend dependencies...
    cd /d "%FRONTEND%"
    call npm install

    echo Building frontend...
    call npm run build

    echo Frontend build completed.
) else (
    echo Skipping frontend build.
)

echo.
echo ------------------------------------------
echo STEP 3: Copy Backend to Staging
echo ------------------------------------------

echo Copying src...
xcopy "%BACKEND%\src" "%STAGING_DIR%\src" /E /I /H /Y

echo Copying public...
if exist "%BACKEND%\public" (
    xcopy "%BACKEND%\public" "%STAGING_DIR%\public" /E /I /H /Y
)

echo Copying package files...
copy "%BACKEND%\package.json" "%STAGING_DIR%\"
copy "%BACKEND%\package-lock.json" "%STAGING_DIR%\" 2>nul

echo Copying environment file...
if exist "%BACKEND%\.env" (
    copy "%BACKEND%\.env" "%STAGING_DIR%\" >nul
) else (
    echo [WARN] .env file not found
)

echo.
echo ------------------------------------------
echo STEP 4: Inject Frontend Build
echo ------------------------------------------

if exist "%FRONTEND%\dist" (
    xcopy "%FRONTEND%\dist" "%STAGING_DIR%\public" /E /I /H /Y
) else if exist "%FRONTEND%\build" (
    xcopy "%FRONTEND%\build" "%STAGING_DIR%\public" /E /I /H /Y
) else (
    echo [WARN] No frontend build found.
)

echo.
echo ------------------------------------------
echo STEP 5: Install Production Dependencies
echo ------------------------------------------

cd /d "%STAGING_DIR%"
call npm ci --omit=dev

if %errorlevel% neq 0 (
    echo [ERROR] npm install failed. Aborting release.
    pause
    exit /b 1
)

echo.
echo ------------------------------------------
echo STEP 6: Create Release Package
echo ------------------------------------------

if not exist "%INSTALLATION_DIR%" (
    mkdir "%INSTALLATION_DIR%"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"Compress-Archive -Path '%STAGING_DIR%' -DestinationPath '%INSTALLATION_DIR%\%ARTIFACT_NAME%' -Force"

if %errorlevel% neq 0 (
    echo [ERROR] ZIP creation failed.
    pause
    exit /b 1
)

echo ZIP package created:
echo %INSTALLATION_DIR%\%ARTIFACT_NAME%
echo.

echo ------------------------------------------
echo STEP 7: Prepare Node.js 
echo ------------------------------------------

set NODE_INSTALLER=node-v24.15.0-x64.msi
set NODE_URL=https://nodejs.org/dist/v24.15.0/node-v24.15.0-x64.msi

if exist "%INSTALLATION_DIR%\%NODE_INSTALLER%" (
    echo Node.js installer already exists. Skipping download.
) else (
    echo Downloading Node.JS installer...

    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%INSTALLATION_DIR%\%NODE_INSTALLER%'"

    if %errorlevel% neq 0 (
        echo [ERROR] Failed to download Node.js installer.
        pause
        exit /b 1
    )

    echo Node.JS download complete.
)

echo.
echo ------------------------------------------
echo STEP 8: Prepare NSSM
echo ------------------------------------------

set NSSM_EXE=%INSTALLATION_DIR%\nssm.exe
set NSSM_ZIP=nssm.zip
set NSSM_URL=https://nssm.cc/release/nssm-2.24.zip

if exist "%NSSM_EXE%" (
    echo NSSM already exists. Skipping download.
) else (
    echo Downloading NSSM...

    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '%NSSM_URL%' -OutFile '%INSTALLATION_DIR%\%NSSM_ZIP%'"

    if %errorlevel% neq 0 (
        echo [ERROR] Failed to download NSSM.
        echo.
        echo ------------------------------------------
        echo.
        echo PLEASE DOWNLOAD THE NSSM.exe MANUALLY !
        echo.
        echo ------------------------------------------
        pause
        exit /b 1
    )

    echo Extracting NSSM...

    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "Expand-Archive -Path '%INSTALLATION_DIR%\%NSSM_ZIP%' -DestinationPath '%INSTALLATION_DIR%\nssm-temp' -Force"

    for /r "%INSTALLATION_DIR%\nssm-temp" %%F in (nssm.exe) do (
        echo %%F | findstr /I "win64" >nul
        if !errorlevel! == 0 (
            copy "%%F" "%INSTALLATION_DIR%\nssm.exe" /Y >nul
        )
    )

    rmdir /s /q "%INSTALLATION_DIR%\nssm-temp"
    del "%INSTALLATION_DIR%\%NSSM_ZIP%"
)

echo.
echo ------------------------------------------
echo STEP 9: Prepare installer script
echo ------------------------------------------

if exist "%INSTALLATION_DIR%\install-release.bat" (
    echo installer script exists. 
) else (
    copy "%SCRIPTS_DIR%\install-release.bat" "%INSTALLATION_DIR%\install.bat"
)

echo Installer script prepared.
echo.

echo.
echo ===========================================
echo.
echo BUILD SUCCESSFUL
echo.
echo Installation package is ready at:
echo %INSTALLATION_DIR%
echo.
echo ===========================================
echo.

pause