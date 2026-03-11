/**
 * MQTT 测试脚本 - 模拟注塑机实时数据
 * 运行: node test-mqtt.js
 */

const mqtt = require('mqtt');

// 连接到 MQTT Broker
const client = mqtt.connect('mqtt://127.0.0.1:1883', {
    clientId: 'TestClient_' + Math.random().toString(16).substr(2, 8)
});

let count = 0;
let running = false;

client.on('connect', () => {
    console.log('✅ 已连接到 MQTT Broker (127.0.0.1:1883)');
    console.log('📡 开始发送模拟数据...');
    console.log('');

    // 订阅命令主题
    client.subscribe('fastbee/+/command', (err) => {
        if (!err) {
            console.log('📥 已订阅命令主题: fastbee/+/command');
        }
    });

    // 模拟实时数据流
    setInterval(() => {
        sendTelemetry('machine01');
    }, 1000);
});

client.on('message', (topic, message) => {
    try {
        const cmd = JSON.parse(message.toString());
        console.log(`\n📨 收到命令 [${topic}]:`, cmd);

        // 处理命令
        if (cmd.command === 'StartMachine') {
            running = true;
            console.log('✅ 机器已启动');
        } else if (cmd.command === 'StopMachine') {
            running = false;
            console.log('⏹️  机器已停止');
        } else if (cmd.command === 'SetMachineParameter') {
            console.log(`⚙️  参数已设置: ${cmd.parameterName} = ${cmd.parameterValue}`);
        }
    } catch (e) {
        console.error('❌ 命令解析失败:', e.message);
    }
});

function sendTelemetry(deviceId) {
    count++;

    // 模拟真实的机器数据
    const rpm = running ? Math.floor(Math.random() * 500) + 1000 : 0;
    const barrelTemp = running ? Math.floor(Math.random() * 40) + 180 : 150;
    const moldTemp = running ? Math.floor(Math.random() * 30) + 50 : 40;
    const injectionPressure = running ? Math.floor(Math.random() * 50) + 60 : 0;
    const screwPosition = running ? Math.floor(Math.random() * 100) : 0;
    const injectionUnitPosition = running ? Math.floor(Math.random() * 200) : 0;

    const data = {
        deviceId: deviceId,
        timestamp: Date.now(),

        // 基础状态
        rpm: rpm,
        running: running,

        // 温度数据
        barrelTemperature: barrelTemp,
        moldTemperature: moldTemp,
        oilTemperature: running ? Math.floor(Math.random() * 20) + 40 : 35,

        // 压力数据
        injectionPressure: injectionPressure,
        holdingPressure: running ? Math.floor(Math.random() * 30) + 50 : 0,
        backPressure: running ? Math.floor(Math.random() * 15) + 15 : 0,

        // 位置数据
        screwPosition: screwPosition,
        injectionUnitPosition: injectionUnitPosition,

        // 计数数据
        productionCount: running ? count : count - 1,
        defectCount: Math.floor(count * 0.02),

        // 状态数据
        alarmStatus: '',
        workMode: running ? 'auto' : 'manual'
    };

    const topic = `fastbee/${deviceId}/telemetry`;
    client.publish(topic, JSON.stringify(data), { qos: 0 });

    // 每 5 秒打印一次状态
    if (count % 5 === 0) {
        console.log(`[${new Date().toLocaleTimeString()}] 📊 ${deviceId}: RPM=${rpm}, 料筒=${barrelTemp}°C, 模具=${moldTemp}°C, 计数=${data.productionCount}`);
    }
}

client.on('error', (error) => {
    console.error('❌ MQTT 连接错误:', error.message);
    process.exit(1);
});

client.on('close', () => {
    console.log('🔌 MQTT 连接已关闭');
});

// 优雅退出
process.on('SIGINT', () => {
    console.log('\n\n👋 正在关闭...');
    client.end();
    process.exit(0);
});

console.log('');
console.log('========================================');
console.log('  注塑机数字孪生系统 - MQTT 测试工具');
console.log('========================================');
console.log('');
console.log('💡 提示:');
console.log('  - 按 Ctrl+C 停止');
console.log('  - 在 Web 界面点击"启动机器"按钮测试双向控制');
console.log('  - 数据每秒发送一次');
console.log('');
