@echo off
chcp 65001 >nul
echo ========================================
echo 注塑机数字孪生系统 - AirCity Web 版本
echo ========================================
echo.

echo [1/4] 检查 Node.js 环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 已安装

echo.
echo [2/4] 检查依赖...
if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
)

echo.
echo [3/4] 检查 MQTT Broker...
echo ⚠️  请确保 MQTT Broker 已启动并支持 WebSocket
echo    - EMQX: WebSocket 端口 8083
echo    - Mosquitto: 需配置 WebSocket 监听器
echo.

echo [4/4] 启动开发服务器...
echo.
echo 🚀 正在启动...
echo 📱 浏览器将自动打开 http://localhost:5173
echo.
echo 💡 提示:
echo    - 按 Ctrl+C 停止服务器
echo    - 修改代码后会自动热重载
echo.

call npm run dev
