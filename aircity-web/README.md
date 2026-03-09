# 注塑机数字孪生系统 - AirCity Web 版本

## 项目简介

这是注塑机数字孪生系统在飞渡 AirCity Web 平台上的完整实现，从 UE4 C++ 迁移到 WebGL/JavaScript。

## 功能特性

✅ **MQTT 通信** - 订阅 `fastbee/#`，接收 14+ 传感器字段
✅ **双向控制** - 启停机器、设置参数，发布到 `fastbee/{deviceId}/command`
✅ **部件级控制** - 26 个组件动画（螺杆旋转/轴向、注射单元、温度可视化）
✅ **多设备支持** - 10+ 设备并行，3 级 Actor 映射策略
✅ **实时 HUD** - 运行状态、转速、温度（带颜色编码）、压力显示

## 技术栈

- **3D 渲染**: Three.js
- **MQTT 客户端**: MQTT.js (WebSocket)
- **构建工具**: Vite
- **语言**: JavaScript (ES6+)

## 项目结构

```
aircity-web/
├── src/
│   ├── index.js              # 主入口，整合所有模块
│   ├── mqtt-client.js        # MQTT 客户端（对应 FastBeeMqttSubsystem）
│   ├── device-manager.js     # 设备管理器（多设备支持）
│   ├── machine-controller.js # 机器控制器（对应 MachinePartController）
│   └── hud-display.js        # HUD 显示器（对应 MachineDataHUD）
├── index.html                # HTML 入口
├── config.json               # MQTT 配置（对应 DefaultGame.ini）
├── package.json              # 依赖配置
└── README.md                 # 本文件
```

## 快速开始

### 1. 安装依赖

```bash
cd aircity-web
npm install
```

### 2. 配置 MQTT Broker

确保 MQTT Broker 支持 WebSocket：

**EMQX 配置** (推荐):
```bash
# 下载 EMQX
# Windows: https://www.emqx.io/downloads

# 启动 EMQX
emqx start

# WebSocket 默认端口: 8083
# Dashboard: http://localhost:18083 (admin/public)
```

**Mosquitto 配置**:
```conf
# mosquitto.conf
listener 1883
protocol mqtt

listener 8083
protocol websockets
```

### 3. 修改配置

编辑 `config.json`:

```json
{
  "host": "127.0.0.1",
  "port": 8083,
  "clientId": "AirCityWeb",
  "topics": ["fastbee/#"],
  "defaultDeviceId": "machine01"
}
```

### 4. 启动开发服务器

```bash
npm run dev
```

浏览器访问: http://localhost:5173

### 5. 测试 MQTT 通信

使用 MQTT Explorer 或命令行发送测试数据：

```bash
# 安装 mosquitto-clients
# Windows: choco install mosquitto

# 发送遥测数据
mosquitto_pub -h 127.0.0.1 -p 1883 -t "fastbee/machine01/telemetry" -m '{
  "deviceId": "machine01",
  "rpm": 1200,
  "running": true,
  "barrelTemperature": 200,
  "moldTemperature": 60,
  "injectionPressure": 80,
  "screwPosition": 50,
  "injectionUnitPosition": 100,
  "productionCount": 1523
}'
```

## 核心模块说明

### 1. MQTT 客户端 (`mqtt-client.js`)

对应 UE4 的 `FastBeeMqttSubsystem`，负责：
- 连接 MQTT Broker (WebSocket)
- 订阅主题 `fastbee/#`
- 解析 JSON 遥测数据（14+ 字段）
- 发布控制命令

**关键方法**:
```javascript
mqttClient.connect()                          // 连接 Broker
mqttClient.on('telemetry', (data) => {...})   // 监听遥测数据
mqttClient.startMachine(deviceId)             // 启动机器
mqttClient.stopMachine(deviceId)              // 停止机器
mqttClient.setMachineParameter(id, name, val) // 设置参数
```

### 2. 设备管理器 (`device-manager.js`)

对应 UE4 的多设备支持逻辑，负责：
- 3 级 Actor 映射策略
- 设备注册和管理
- 多设备并发控制

**3 级映射策略**:
1. `userData.deviceId` 精确匹配
2. 名称匹配
3. 类型关键字匹配 (`userData.type === 'BP_Machine'`)

### 3. 机器控制器 (`machine-controller.js`)

对应 UE4 的 `MachinePartController`，负责：
- 26 个部件的动画控制
- 螺杆旋转（基于 RPM）
- 螺杆轴向移动
- 注射单元移动
- 温度可视化（材质发光）

**26 个组件**:
| 组件类型 | 数量 | 命名规则 | 控制参数 |
|---------|------|---------|---------|
| 螺杆旋转 | 6 | Screw_01~06 | rpm |
| 螺杆轴向 | 6 | Screw_01~06 | screwPosition |
| 注射单元 | 14 | InjectionUnit_01~14 | injectionUnitPosition |
| 料筒温度 | 3 | Barrel_01~03 | barrelTemperature |
| 模具温度 | 3 | Mold_01~03 | moldTemperature |

### 4. HUD 显示器 (`hud-display.js`)

对应 UE4 的 `MachineDataHUD`，负责：
- 实时显示设备状态
- 温度颜色编码（绿/黄/红）
- 运行状态指示

## UE4 vs Web 对比

| 功能 | UE4 实现 | Web 实现 |
|------|---------|---------|
| **MQTT 客户端** | MqttUtilities 插件 (TCP 1883) | MQTT.js (WebSocket 8083) |
| **3D 渲染** | UE4 渲染引擎 | Three.js |
| **数据解析** | JsonUtilities | JSON.parse() |
| **Actor 查找** | UGameplayStatics::GetAllActorsOfClass | scene.getObjectByName() |
| **组件控制** | USceneComponent::SetRelativeRotation | object3D.rotation.set() |
| **HUD 显示** | AHUD::DrawText | HTML Canvas / DOM |
| **配置管理** | DefaultGame.ini | config.json |

## 遥测数据格式

```json
{
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
}
```

## 控制命令格式

```json
// 启动机器
{
  "deviceId": "machine01",
  "command": "StartMachine",
  "timestamp": 1709971200000
}

// 停止机器
{
  "deviceId": "machine01",
  "command": "StopMachine",
  "timestamp": 1709971200000
}

// 设置参数
{
  "deviceId": "machine01",
  "command": "SetMachineParameter",
  "parameterName": "rpm",
  "parameterValue": 1500,
  "timestamp": 1709971200000
}
```

## 多设备测试

系统支持 10+ 设备并发，测试方法：

```bash
# 设备 1
mosquitto_pub -t "fastbee/machine01/telemetry" -m '{"deviceId":"machine01","rpm":1200,"running":true}'

# 设备 2
mosquitto_pub -t "fastbee/machine02/telemetry" -m '{"deviceId":"machine02","rpm":1500,"running":true}'

# 设备 3
mosquitto_pub -t "fastbee/machine03/telemetry" -m '{"deviceId":"machine03","rpm":1000,"running":false}'
```

## 性能优化

- 使用 `requestAnimationFrame` 进行渲染循环
- 仅在数据变化时更新 HUD
- 使用 Three.js 的对象池减少 GC
- WebSocket 保持长连接，减少握手开销

## 部署

### 构建生产版本

```bash
npm run build
```

生成的文件在 `dist/` 目录，可部署到任何静态服务器。

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/aircity-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # WebSocket 代理（如果 MQTT Broker 在其他服务器）
    location /mqtt {
        proxy_pass http://mqtt-broker:8083;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

## 故障排查

### 1. MQTT 连接失败

**问题**: 浏览器控制台显示 WebSocket 连接失败

**解决**:
- 检查 MQTT Broker 是否启动
- 确认 WebSocket 端口（通常 8083 或 9001）
- 检查防火墙设置
- 确认 Broker 配置支持 WebSocket

### 2. 3D 模型不显示

**问题**: 页面空白，没有 3D 内容

**解决**:
- 打开浏览器控制台查看错误
- 检查 Three.js 是否正确加载
- 确认 WebGL 支持（访问 https://get.webgl.org/）

### 3. 数据不更新

**问题**: HUD 显示但数据不变化

**解决**:
- 检查 MQTT 主题是否正确订阅
- 确认发送的 JSON 格式正确
- 查看浏览器控制台的 MQTT 日志

## 下一步计划

- [ ] 集成真实的 GLTF 机器模型
- [ ] 添加历史数据图表
- [ ] 实现设备切换功能
- [ ] 添加报警通知
- [ ] 支持移动端响应式布局

## 许可证

MIT

## 联系方式

如有问题，请联系项目维护者。
