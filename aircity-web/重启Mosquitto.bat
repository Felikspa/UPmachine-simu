@echo off
chcp 65001 >nul
echo ========================================
echo 重启 Mosquitto 服务（需要管理员权限）
echo ========================================
echo.

echo [1/2] 停止 Mosquitto 服务...
net stop mosquitto
if errorlevel 1 (
    echo ❌ 停止失败，请确保以管理员身份运行此脚本
    pause
    exit /b 1
)
echo ✅ 服务已停止

echo.
echo [2/2] 启动 Mosquitto 服务...
net start mosquitto
if errorlevel 1 (
    echo ❌ 启动失败
    pause
    exit /b 1
)
echo ✅ 服务已启动

echo.
echo [验证] 检查 WebSocket 端口...
netstat -an | findstr "8083"
if errorlevel 1 (
    echo ⚠️  端口 8083 未开放，请检查配置
) else (
    echo ✅ WebSocket 端口 8083 已开放
)

echo.
echo ========================================
echo 配置完成！
echo ========================================
echo.
echo 现在可以刷新浏览器: http://localhost:5174
echo 左下角应显示 "已连接"
echo.
pause
