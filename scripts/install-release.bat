@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo         EAM RFID App Installer
echo ==========================================
echo.

set SERVICE_NAME=EAM RFID App Service
set NODE_PATH=C:\Program Files\nodejs\node.exe
set NSSM=%~dp0nssm.exe
set ZIP_FILE=%~dp0eam-rfid-app.zip

set BASE_DIR=C:\apps
set APP_DIR=%BASE_DIR%\eam-rfid-app
set APP_PATH=%APP_DIR%\src\server.js
set LOG_DIR=%APP_DIR%\logs

echo Checking required files...

if not exist "%NSSM%" (
    echo [ERROR] nssm.exe not found.
    pause
    exit /b 1
)

if not exist "%ZIP_FILE%" (
    echo [ERROR] Application ZIP not found.
    pause
    exit /b 1
)


set NODE_MSI=

for %%F in ("%~dp0node-*.msi") do (
    set NODE_MSI=%%~fF
)

if not defined NODE_MSI (
    if not exist "%NODE_PATH%" (
        echo [ERROR] node.exe in %NODE_PATH% not found.
        pause
        exit /b 1
    )
)

echo All required files found.
echo.
echo Checking Node.js installation...

if exist "%NODE_PATH%" (
    echo Node.js already installed. Skipping installation.
) else (
    echo Node.js not found. Installing...
    msiexec /i "%NODE_MSI%" /qn /norestart

    if exist "%NODE_PATH%" (
        echo Node.js installed successfully.
    ) else (
        echo [ERROR] Node.js installation failed.
        echo Please check the installer or restart CMD and rerun this script.
        pause
        exit /b 1
    )
)

echo.
echo Initializing application directory...

if not exist "%BASE_DIR%" (
    echo Creating %BASE_DIR% ...
    mkdir "%BASE_DIR%"
)

if not exist "%APP_DIR%" (
    mkdir "%APP_DIR%"
)

if not exist "%LOG_DIR%" (
    mkdir "%LOG_DIR%"
)

for /d %%D in ("%APP_DIR%\*") do (
    if /i not "%%~nxD"=="logs" rmdir /s /q "%%D"
)

del /q "%APP_DIR%\*" 2>nul

echo Application directory initialized.
echo.
echo Extracting application...

set TEMP_BACKUP_DIR=C:\apps\eam-rfid-app-backup
set ENV_BACKUP=%TEMP_BACKUP_DIR%\.env

if exist "%APP_DIR%\.env" (
    echo Existing .env found. Backing up...

    if not exist "%TEMP_BACKUP_DIR%" (
        mkdir "%TEMP_BACKUP_DIR%"
    )

    copy /Y "%APP_DIR%\.env" "%TEMP_BACKUP_DIR%" >nul
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%BASE_DIR%' -Force"

if %errorlevel% neq 0 (
    echo [ERROR] Failed to extract ZIP file.
    pause
    exit /b 1
)

if exist "%ENV_BACKUP%" (
    echo Restoring existing .env...
    copy /Y "%ENV_BACKUP%" "%APP_DIR%" >nul

    del /q "%ENV_BACKUP%" >nul 2>&1
    rmdir "%TEMP_BACKUP_DIR%" >nul 2>&1
)

echo Extraction completed.
echo.

sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% == 0 (
    echo "%SERVICE_NAME%" already exists. Stopping and removing...
    "%NSSM%" stop "%SERVICE_NAME%" >nul 2>&1
    echo Existing service stopped.
    "%NSSM%" remove "%SERVICE_NAME%" confirm
    echo Existing service removed.
)
echo.
echo Installing %SERVICE_NAME%...

"%NSSM%" install "%SERVICE_NAME%" "%NODE_PATH%" "%APP_PATH%"

"%NSSM%" set "%SERVICE_NAME%" AppDirectory "%APP_DIR%"
"%NSSM%" set "%SERVICE_NAME%" Start SERVICE_AUTO_START
"%NSSM%" set "%SERVICE_NAME%" AppExit Default Restart
"%NSSM%" set "%SERVICE_NAME%" AppRestartDelay 5000

sc failure "%SERVICE_NAME%" reset= 0 actions= restart/5000/restart/5000/restart/5000

echo Service installed successfully.
echo Starting service...

"%NSSM%" start "%SERVICE_NAME%"

echo.
echo ==========================================
echo Installation complete successfully
echo Service Name: %SERVICE_NAME%
echo ==========================================
pause