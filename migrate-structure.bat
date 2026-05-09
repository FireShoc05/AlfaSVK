@echo off
REM ═══════════════════════════════════════════════════════════════
REM  Скрипт реструктуризации проекта AlfaSVK
REM  Переносит файлы фронтенда из корня в папку frontend/
REM  
REM  ВАЖНО: Запускай из корня проекта (AlfaSVK — копия)
REM  ВАЖНО: Новые файлы (frontend/src/store/, frontend/src/lib/api.js, 
REM         frontend/src/pages/LoginPage.jsx, frontend/.env.local,
REM         frontend/package.json) уже созданы — скрипт их НЕ трогает.
REM ═══════════════════════════════════════════════════════════════

echo [1/8] Копирую файлы конфигурации...
copy /Y "vite.config.js" "frontend\vite.config.js"
copy /Y "index.html" "frontend\index.html"
copy /Y "eslint.config.js" "frontend\eslint.config.js"
copy /Y "package-lock.json" "frontend\package-lock.json" 2>nul

echo [2/8] Копирую папку public...
xcopy /E /I /Y "public" "frontend\public"

echo [3/8] Копирую src\components...
xcopy /E /I /Y "src\components" "frontend\src\components"

echo [4/8] Копирую src\pages (кроме LoginPage.jsx — уже есть)...
xcopy /E /I /Y "src\pages" "frontend\src\pages"
REM Перезаписываем LoginPage.jsx новой версией (уже создана)
REM Поэтому копируем обратно нашу версию
copy /Y "frontend\src\pages\LoginPage.jsx.new" "frontend\src\pages\LoginPage.jsx" 2>nul

echo [5/8] Копирую src\styles...
xcopy /E /I /Y "src\styles" "frontend\src\styles"

echo [6/8] Копирую src\utils...
xcopy /E /I /Y "src\utils" "frontend\src\utils"

echo [7/8] Копирую src\data и src\assets...
xcopy /E /I /Y "src\data" "frontend\src\data"
xcopy /E /I /Y "src\assets" "frontend\src\assets"

echo [8/8] Копирую оставшиеся src файлы (App.jsx, main.jsx, App.css, index.css)...
copy /Y "src\App.jsx" "frontend\src\App.jsx"
copy /Y "src\App.css" "frontend\src\App.css"
copy /Y "src\main.jsx" "frontend\src\main.jsx"
copy /Y "src\index.css" "frontend\src\index.css"

REM Копируем useWizardStore.js (он не использует supabase, не был модифицирован)
copy /Y "src\store\useWizardStore.js" "frontend\src\store\useWizardStore.js"

echo.
echo ✅ Перенос завершён!
echo.
echo Следующие шаги:
echo   1. cd frontend ^&^& npm install
echo   2. cd ..\backend ^&^& npm install
echo   3. Настрой backend\.env (скопируй из .env.example)
echo   4. npm run seed  (создать суперадмина в БД)
echo   5. npm run dev   (запустить бэкенд)
echo   6. В другом терминале: cd frontend ^&^& npm run dev
echo.
echo После проверки можно удалить старые файлы из корня:
echo   del vite.config.js index.html eslint.config.js package.json package-lock.json .env.local vercel.json
echo   rmdir /S /Q src public node_modules
