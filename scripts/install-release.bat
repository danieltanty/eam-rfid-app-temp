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

:: --- [STEP 4: Prepare Application Directory] ---
echo [4/8] Initializing application directory...

if not exist "%FILE_BASE_DIR%" (
    echo Creating %FILE_BASE_DIR%...
    mkdir "%FILE_BASE_DIR%"
)
echo %FILE_BASE_DIR% is ready.
echo.

if not exist "%APP_BASE_DIR%" (
    echo Creating %APP_BASE_DIR%...
    mkdir "%APP_BASE_DIR%"
)
echo %APP_BASE_DIR% is ready.
echo.

if not exist "%APP_DIR%" (
    echo Creating %APP_DIR%...
    mkdir "%APP_DIR%"
)
echo %APP_DIR% is ready.
echo.

if not exist "%LOG_DIR%" (
    echo Creating %LOG_DIR%...
    mkdir "%LOG_DIR%"
)
echo %LOG_DIR% is ready.
echo.

echo Application directory initialized.
echo.

:: --- [STEP 5: Check for Existing Service and Stop if Exists] ---
echo [5/8] Checking for existing service and stopping if exists...
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

:: --- [STEP 6: Backup and Extract Application] ---
echo [6/8] Extracting application (preserving configuration)...

if exist "%APP_DIR%\.env" (
    echo Existing .env found. Backing up...

    if not exist "%TEMP_BACKUP_DIR%" (
        echo Creating temporary backup directory...
        mkdir "%TEMP_BACKUP_DIR%"
    )

    copy /Y "%APP_DIR%\.env" "%TEMP_BACKUP_DIR%" >nul
    echo .env backed up successfully.
)

echo.

:: Clean old files
echo Cleaning application directory...

for /d %%D in ("%APP_DIR%\*") do ( 
    echo Checking directory: %%~nxD
    if /i not "%%~nxD"=="logs" (
        echo Removing directory: %%~nxD
        rmdir /s /q "%%D" 2>nul 
        echo Directory %%~nxD removed.
    )
)

for %%F in ("%APP_DIR%\*") do (
    echo Removing file: %%~nxF
    del /q "%%F" 2>nul
    echo File %%~nxF removed.
)

echo Application directory cleaned.
echo.

:: Extract new version
echo Extracting latest application version...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%APP_BASE_DIR%' -Force"

if %errorlevel% neq 0 ( 
    echo [ERROR] Failed to extract ZIP. 
    pause 
    exit /b 1 
)

echo App extraction completed.
echo.

:: Restore configuration
echo Restoring configuration...
if exist "%ENV_BACKUP%" (
    echo Restoring existing .env...

    copy /Y "%ENV_BACKUP%" "%APP_DIR%\.env" >nul
    echo .env restored successfully.

    del /q "%ENV_BACKUP%" >nul 2>&1
    echo Temporary backup .env deleted.

    rmdir "%TEMP_BACKUP_DIR%" >nul 2>&1
    echo Temporary backup directory removed.
)
echo.

:: --- [STEP 7: Register and Start Windows Service] ---
echo [7/8] Configuring Windows Service...
echo Installing %SERVICE_NAME%...

"%NSSM_DEST%" install "%SERVICE_NAME%" "%NODE_DEST%" "%APP_PATH%"

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

:: --- [Cleanup: Delete the source folder and open app folder] ---
echo.
echo [8/8] Cleaning up source folder...

(
echo @echo off
echo timeout /t 3 /nobreak >nul
echo rmdir /s /q "%SCRIPT_DIR%" 2>nul
echo del "%%~f0" 2>nul
) > "%DELETE_SCRIPT%"

:: Launch the deletion script as a separate, hidden process
start /b "" "%DELETE_SCRIPT%"
echo "EAM RFID App Setup" source folder are no longer needed
echo.

echo ==========================================
echo Installation complete!
echo Service Name: %SERVICE_NAME%
echo App Location: %APP_DIR%
echo ==========================================
echo.

:: echo Opening application folder...
echo Opening application folder...
explorer "%APP_DIR%"

echo All done. You can now close this window.
pause