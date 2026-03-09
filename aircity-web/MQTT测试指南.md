# MQTT 测试脚本

## 测试数据发送

### 1. 基础遥测数据
```bash
mosquitto_pub -h 127.0.0.1 -p 1883 -t "fastbee/machine01/telemetry" -m '{
  "deviceId": "machine01",
  "rpm": 1200,
  "running": true,
  "barrelTemperature": 200,
  "moldTemperature": 60,
  "oilTemperature": 45,
  "injectionPressure": 80,
  "holdingPressure": 60,
  "backPressure": 20,
  "screwPosition": 50,
  "injectionUnitPosition": 100,
  "productionCount": 1523,
  "defectCount": 12,
  "alarmStatus": "",
  "workMode": "auto"
}'
```

### 2. 高速运行状态
```bash
mosquitto_pub -h 127.0.0.1 -p 1883 -t "fastbee/machine01/telemetry" -m '{
  "deviceId": "machine01",
  "rpm": 2500,
  "running": true,
  "barrelTemperature": 220,
  "moldTemperature": 75,
  "injectionPressure": 120,
  "screwPosition": 80,
  "productionCount": 1524
}'
```

### 3. 停止状态
```bash
mosquitto_pub -h 127.0.0.1 -p 1883 -t "fastbee/machine01/telemetry" -m '{
  "deviceId": "machine01",
  "rpm": 0,
  "running": false,
  "barrelTemperature": 180,
  "moldTemperature": 50,
  "injectionPressure": 0,
  "screwPosition": 0,
  "productionCount": 1524
}'
```

### 4. 多设备测试
```bash
# 设备 1
mosquitto_pub -h 127.0.0.1 -p 1883 -t "fastbee/machine01/telemetry" -m '{"deviceId":"machine01","rpm":1200,"running":true,"barrelTemperature":200,"productionCount":1523}'

# 设备 2
mosquitto_pub -h 127.0.0.1 -p 1883 -t "fastbee/machine02/telemetry" -m '{"deviceId":"machine02","rpm":1500,"running":true,"barrelTemperature":210,"productionCount":2341}'

# 设备 3
mosquitto_pub -h 127.0.0.1 -p 1883 -t "fastbee/machine03/telemetry" -m '{"deviceId":"machine03","rpm":1000,"running":false,"barrelTemperature":180,"productionCount":987}'
```

## 控制命令测试

### 1. 启动机器
```bash
mosquitto_pub -h 127.0.0.1 -p 1883 -t "fastbee/machine01/command" -m '{
  "deviceId": "machine01",
  "command": "StartMachine",
  "timestamp": 1709971200000
}'
```

### 2. 停止机器
```bash
mosquitto_pub -h 127.0.0.1 -p 1883 -t "fastbee/machine01/command" -m '{
  "deviceId": "machine01",
  "command": "StopMachine",
  "timestamp": 1709971200000
}'
```

### 3. 设置转速
```bash
mosquitto_pub -h 127.0.0.1 -p 1883 -t "fastbee/machine01/command" -m '{
  "deviceId": "machine01",
  "command": "SetMachineParameter",
  "parameterName": "rpm",
  "parameterValue": 1800,
  "timestamp": 1709971200000
}'
```

## 循环测试脚本

### Windows (PowerShell)
```powershell
# 模拟实时数据流
$count = 0
while ($true) {
    $rpm = Get-Random -Minimum 1000 -Maximum 2000
    $temp = Get-Random -Minimum 180 -Maximum 220
    $count++

    $json = @{
        deviceId = "machine01"
        rpm = $rpm
        running = $true
        barrelTemperature = $temp
        productionCount = $count
    } | ConvertTo-Json -Compress

    mosquitto_pub -h 127.0.0.1 -p 1883 -t "fastbee/machine01/telemetry" -m $json
    Start-Sleep -Seconds 1
}
```

### Linux/Mac (Bash)
```bash
#!/bin/bash
# 模拟实时数据流
count=0
while true; do
    rpm=$((RANDOM % 1000 + 1000))
    temp=$((RANDOM % 40 + 180))
    count=$((count + 1))

    mosquitto_pub -h 127.0.0.1 -p 1883 -t "fastbee/machine01/telemetry" -m "{
        \"deviceId\": \"machine01\",
        \"rpm\": $rpm,
        \"running\": true,
        \"barrelTemperature\": $temp,
        \"productionCount\": $count
    }"

    sleep 1
done
```

## MQTT Explorer 测试

1. 下载 MQTT Explorer: http://mqtt-explorer.com/
2. 连接配置:
   - Host: 127.0.0.1
   - Port: 1883
   - Protocol: mqtt://
3. 订阅主题: `fastbee/#`
4. 发布测试消息到 `fastbee/machine01/telemetry`

## Node.js 测试脚本

```javascript
// test-mqtt.js
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://127.0.0.1:1883');

client.on('connect', () => {
    console.log('已连接到 MQTT Broker');

    // 模拟实时数据
    let count = 0;
    setInterval(() => {
        const data = {
            deviceId: 'machine01',
            rpm: Math.floor(Math.random() * 1000) + 1000,
            running: true,
            barrelTemperature: Math.floor(Math.random() * 40) + 180,
            moldTemperature: Math.floor(Math.random() * 30) + 50,
            injectionPressure: Math.floor(Math.random() * 50) + 60,
            screwPosition: Math.floor(Math.random() * 100),
            productionCount: ++count
        };

        client.publish('fastbee/machine01/telemetry', JSON.stringify(data));
        console.log('已发送:', data);
    }, 1000);
});

// 运行: node test-mqtt.js
```

## Python 测试脚本

```python
# test_mqtt.py
import paho.mqtt.client as mqtt
import json
import time
import random

client = mqtt.Client()
client.connect("127.0.0.1", 1883, 60)

count = 0
while True:
    count += 1
    data = {
        "deviceId": "machine01",
        "rpm": random.randint(1000, 2000),
        "running": True,
        "barrelTemperature": random.randint(180, 220),
        "moldTemperature": random.randint(50, 80),
        "injectionPressure": random.randint(60, 110),
        "screwPosition": random.randint(0, 100),
        "productionCount": count
    }

    client.publish("fastbee/machine01/telemetry", json.dumps(data))
    print(f"已发送: {data}")
    time.sleep(1)

# 运行: python test_mqtt.py
```
