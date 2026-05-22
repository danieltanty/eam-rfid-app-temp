@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo         EAM RFID App Installer
echo ==========================================
echo.

set SERVICE_NAME=EAM RFID App Service
set NODE_PATH=C:\Program Files\nodejs\node.exe

set BASE_DIR=C:\apps
set APP_DIR=%BASE_DIR%\eam-rfid-app
set APP_PATH=%APP_DIR%\src\server.js
set LOG_DIR=%APP_DIR%\logs

set NSSM_SOURCE=%~dp0nssm.exe
set NSSM_DEST=%APP_DIR%\nssm.exe

set ZIP_FILE=%~dp0eam-rfid-app.zip

echo Checking required files...

if not exist "%NSSM_SOURCE%" (
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
    mkdir "%BASE_DIR%"
)

if not exist "%APP_DIR%" (
    mkdir "%APP_DIR%"
)

if not exist "%LOG_DIR%" (
    mkdir "%LOG_DIR%"
)

echo.
echo Checking existing service...

if exist "%NSSM_DEST%" (
    sc query "%SERVICE_NAME%" >nul 2>&1

    if !errorlevel! == 0 (
        echo Service exists. Stopping...
        "%NSSM_DEST%" stop "%SERVICE_NAME%" >nul 2>&1
        timeout /t 3 /nobreak >nul
        echo Removing existing service...
        "%NSSM_DEST%" remove "%SERVICE_NAME%" confirm >nul 2>&1
        timeout /t 3 /nobreak >nul
        echo Existing service removed.
    )
)

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
    echo .env backed up successfully.
)

echo.
echo Cleaning application directory...

for /d %%D in ("%APP_DIR%\*") do (
    if /i not "%%~nxD"=="logs" (
        rmdir /s /q "%%D"
    )
)

for %%F in ("%APP_DIR%\*") do (
    del /q "%%F" 2>nul
)

echo Application directory cleaned.
echo.

echo Copying NSSM to application directory...
copy /Y "%NSSM_SOURCE%" "%NSSM_DEST%" >nul

if not exist "%NSSM_DEST%" (
    echo [ERROR] Failed to copy NSSM.
    pause
    exit /b 1
)

echo NSSM copied successfully.
echo.

echo Extracting application...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%BASE_DIR%' -Force"

if %errorlevel% neq 0 (
    echo [ERROR] Failed to extract ZIP file.
    pause
    exit /b 1
)

echo App extraction completed.

if exist "%ENV_BACKUP%" (
    echo Restoring existing .env...

    copy /Y "%ENV_BACKUP%" "%APP_DIR%\.env" >nul

    del /q "%ENV_BACKUP%" >nul 2>&1
    rmdir "%TEMP_BACKUP_DIR%" >nul 2>&1

    echo .env restored successfully.
)

echo.
echo Installing %SERVICE_NAME%...

"%NSSM_DEST%" install "%SERVICE_NAME%" "%NODE_PATH%" "%APP_PATH%"

"%NSSM_DEST%" set "%SERVICE_NAME%" AppDirectory "%APP_DIR%"
"%NSSM_DEST%" set "%SERVICE_NAME%" Start SERVICE_AUTO_START
"%NSSM_DEST%" set "%SERVICE_NAME%" AppExit Default Restart
"%NSSM_DEST%" set "%SERVICE_NAME%" AppRestartDelay 5000

sc failure "%SERVICE_NAME%" reset= 0 actions= restart/5000/restart/5000/restart/5000

echo Service installed successfully.
echo.

echo Starting service...

"%NSSM_DEST%" start "%SERVICE_NAME%"

echo.
echo ==========================================
echo Installation complete successfully
echo Service Name: %SERVICE_NAME%
echo ==========================================
pause