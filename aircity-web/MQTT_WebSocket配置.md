# MQTT Broker WebSocket 配置指南

## 问题
当前 MQTT Broker 只开放了 TCP 端口 1883，Web 浏览器需要 WebSocket 端口才能连接。

## 解决方案

### 方案 1: 使用 EMQX (推荐)

EMQX 默认支持 WebSocket，配置最简单。

#### 1. 下载 EMQX
```bash
# Windows
https://www.emqx.io/downloads

# 下载 emqx-5.x.x-windows-amd64.zip
```

#### 2. 启动 EMQX
```bash
# 解压后进入 bin 目录
cd emqx\bin

# 启动
emqx.cmd start

# 或直接运行
emqx.cmd console
```

#### 3. 验证端口
EMQX 默认开放以下端口：
- **1883**: MQTT TCP
- **8083**: MQTT WebSocket (浏览器使用)
- **8084**: MQTT WebSocket SSL
- **18083**: Dashboard (管理界面)

访问 http://localhost:18083
- 用户名: admin
- 密码: public

#### 4. 测试连接
```bash
# 检查端口
netstat -an | findstr "8083"

# 应该看到:
# TCP    0.0.0.0:8083           0.0.0.0:0              LISTENING
```

---

### 方案 2: 配置 Mosquitto WebSocket

如果你使用的是 Mosquitto，需要手动配置 WebSocket。

#### 1. 找到配置文件
```
C:\Program Files\mosquitto\mosquitto.conf
```

#### 2. 编辑配置文件
```conf
# MQTT TCP 端口
listener 1883
protocol mqtt

# MQTT WebSocket 端口
listener 8083
protocol websockets

# 允许匿名连接（测试用）
allow_anonymous true
```

#### 3. 重启 Mosquitto
```bash
# 停止服务
net stop mosquitto

# 启动服务
net start mosquitto

# 或者在服务管理器中重启
services.msc
```

#### 4. 验证配置
```bash
netstat -an | findstr "8083"
```

---

### 方案 3: 使用 MQTT.js 的 TCP 适配器 (临时方案)

如果无法配置 WebSocket，可以使用本地代理。

#### 创建代理服务器
```javascript
// mqtt-proxy.js
const net = require('net');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8083 });

wss.on('connection', (ws) => {
    const client = net.connect({ host: '127.0.0.1', port: 1883 });

    ws.on('message', (data) => {
        client.write(data);
    });

    client.on('data', (data) => {
        ws.send(data);
    });

    ws.on('close', () => client.end());
    client.on('close', () => ws.close());
});

console.log('MQTT WebSocket 代理运行在 ws://localhost:8083');
```

运行代理：
```bash
npm install ws
node mqtt-proxy.js
```

---

## 快速测试

### 1. 启动 EMQX (推荐)
```bash
# 下载并解压 EMQX
# 运行
emqx\bin\emqx.cmd console
```

### 2. 验证 WebSocket
打开浏览器控制台：
```javascript
const ws = new WebSocket('ws://localhost:8083/mqtt');
ws.onopen = () => console.log('WebSocket 连接成功！');
ws.onerror = (e) => console.error('WebSocket 连接失败:', e);
```

### 3. 启动 Web 应用
```bash
cd C:\Users\24045\Desktop\Uproject\aircity-web
npm run dev
```

---

## 当前配置检查

```bash
# 检查 MQTT TCP 端口
netstat -an | findstr "1883"
# ✅ 已开放

# 检查 MQTT WebSocket 端口
netstat -an | findstr "8083"
# ❌ 未开放 - 需要配置
```

---

## 推荐操作步骤

1. **下载 EMQX**: https://www.emqx.io/downloads
2. **解压并启动**: `emqx\bin\emqx.cmd console`
3. **验证端口**: `netstat -an | findstr "8083"`
4. **访问 Dashboard**: http://localhost:18083
5. **启动 Web 应用**: `npm run dev`
6. **测试 MQTT**: 使用 MQTT Explorer 或测试脚本

---

## 故障排查

### WebSocket 连接失败
```
Error: WebSocket connection to 'ws://localhost:8083/mqtt' failed
```

**原因**: WebSocket 端口未开放

**解决**:
1. 确认 EMQX 已启动
2. 检查防火墙是否阻止 8083 端口
3. 尝试使用 `ws://127.0.0.1:8083/mqtt`

### EMQX 启动失败
```
Error: Port 1883 already in use
```

**原因**: Mosquitto 已占用 1883 端口

**解决**:
```bash
# 停止 Mosquitto
net stop mosquitto

# 启动 EMQX
emqx.cmd start
```

---

## 配置文件位置

### EMQX
```
emqx\etc\emqx.conf
```

### Mosquitto
```
C:\Program Files\mosquitto\mosquitto.conf
```

---

## 下一步

配置完成后，运行：
```bash
cd C:\Users\24045\Desktop\Uproject\aircity-web
npm run dev
```

浏览器会自动打开 http://localhost:5173，左下角应显示 "已连接"。
