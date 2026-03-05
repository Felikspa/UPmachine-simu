@echo off
echo ========================================
echo AirCityExplorer FastBee 项目快速启动
echo ========================================
echo.

echo [步骤 1/4] 检查 Mosquitto 是否运行...
netstat -an | findstr ":1883" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [OK] Mosquitto 正在运行
) else (
    echo [启动] 正在启动 Mosquitto...
    start "Mosquitto MQTT Broker" cmd /k "cd /d C:\Program Files\mosquitto && mosquitto.exe -c mosquitto.conf -v"
    timeout /t 3 >nul
    echo [OK] Mosquitto 已启动
)
echo.

echo [步骤 2/4] 检查 UE4 项目文件...
if exist "AirCityExplorer.uproject" (
    echo [OK] 项目文件存在
) else (
    echo [错误] 找不到 AirCityExplorer.uproject
    echo 请确保在项目目录中运行此脚本
    pause
    exit /b 1
)
echo.

echo [步骤 3/4] 准备演示数据...
echo 演示数据已准备在 demo_data.txt 文件中
echo.

echo [步骤 4/4] 启动 UE4 项目...
echo 正在启动 UE4 编辑器...
start "" "AirCityExplorer.uproject"
echo.

echo ========================================
echo 启动完成！
echo ========================================
echo.
echo 下一步操作：
echo 1. 等待 UE4 编辑器加载完成
echo 2. 打开 MQTT Explorer 连接到 localhost:1883
echo 3. 在 UE4 中点击 Play 按钮
echo 4. 使用 demo_data.txt 中的数据进行测试
echo.
echo 演示数据文件：demo_data.txt
echo 演示指南：演示准备指南.md
echo.
pause
