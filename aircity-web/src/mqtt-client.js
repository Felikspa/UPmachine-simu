/**
 * MQTT 客户端 - 对应 UE4 的 FastBeeMqttSubsystem
 * 负责 MQTT 连接、消息订阅和发布
 */

import mqtt from 'mqtt';

export class MqttClient {
    constructor(config) {
        this.config = {
            host: config.host || '127.0.0.1',
            port: config.port || 8083, // WebSocket 端口
            clientId: config.clientId || 'AirCityWeb_' + Math.random().toString(16).substr(2, 8),
            topics: config.topics || ['fastbee/#']
        };

        this.client = null;
        this.connected = false;
        this.listeners = new Map();
    }

    /**
     * 连接到 MQTT Broker
     */
    connect() {
        return new Promise((resolve, reject) => {
            const url = `ws://${this.config.host}:${this.config.port}/mqtt`;

            console.log(`[MQTT] 正在连接到 ${url}...`);
            console.log(`[MQTT] 客户端ID: ${this.config.clientId}`);

            this.client = mqtt.connect(url, {
                clientId: this.config.clientId,
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000
            });

            this.client.on('connect', () => {
                console.log('[MQTT] ✅ 连接成功！');
                this.connected = true;

                // 订阅主题
                this.config.topics.forEach(topic => {
                    this.client.subscribe(topic, (err) => {
                        if (!err) {
                            console.log(`[MQTT] ✅ 已订阅主题: ${topic}`);
                        } else {
                            console.error(`[MQTT] ❌ 订阅失败: ${topic}`, err);
                        }
                    });
                });

                this.emit('connected');
                resolve();
            });

            this.client.on('error', (error) => {
                console.error('[MQTT] ❌ 连接错误:', error);
                console.error('[MQTT] 错误类型:', error.name);
                console.error('[MQTT] 错误消息:', error.message);
                this.connected = false;
                this.emit('error', error);
                // 不要reject，让它继续重试
            });

            this.client.on('close', () => {
                console.log('[MQTT] 🔌 连接关闭');
                this.connected = false;
                this.emit('disconnected');
            });

            this.client.on('offline', () => {
                console.log('[MQTT] ⚠️ 客户端离线');
            });

            this.client.on('reconnect', () => {
                console.log('[MQTT] 🔄 正在重新连接...');
            });

            this.client.on('message', (topic, payload) => {
                this.handleMessage(topic, payload);
            });

            // 10秒后如果还没连接上，输出诊断信息
            setTimeout(() => {
                if (!this.connected) {
                    console.error('[MQTT] ⚠️ 10秒内未能连接成功');
                    console.error('[MQTT] 请检查:');
                    console.error('[MQTT]   1. Mosquitto 是否运行？');
                    console.error('[MQTT]   2. 8083端口是否开启？ (netstat -an | grep 8083)');
                    console.error('[MQTT]   3. mosquitto.conf 是否配置了 WebSocket？');
                }
            }, 10000);
        });
    }

    /**
     * 处理接收到的消息 - 对应 UE4 的 OnMessageReceived
     */
    handleMessage(topic, payload) {
        try {
            const message = payload.toString();
            console.log(`[MQTT] 收到消息 [${topic}]: ${message}`);

            // 解析 JSON
            const data = JSON.parse(message);

            // 提取设备 ID
            const deviceId = data.deviceId || this.extractDeviceIdFromTopic(topic);

            // 构建遥测数据结构 - 对应 UE4 的 FFastBeeMachineState
            const telemetry = {
                deviceId: deviceId,
                topic: topic,
                timestamp: Date.now(),

                // 基础状态
                rpm: data.rpm || 0,
                running: data.running || false,

                // 温度数据
                barrelTemperature: data.barrelTemperature || data.barrel_temp || 0,
                moldTemperature: data.moldTemperature || data.mold_temp || 0,
                oilTemperature: data.oilTemperature || data.oil_temp || 0,

                // 压力数据
                injectionPressure: data.injectionPressure || data.injection_pressure || 0,
                holdingPressure: data.holdingPressure || data.holding_pressure || 0,
                backPressure: data.backPressure || data.back_pressure || 0,

                // 位置数据
                screwPosition: data.screwPosition || data.screw_position || 0,
                injectionUnitPosition: data.injectionUnitPosition || data.injection_unit_position || 0,

                // 计数数据
                productionCount: data.productionCount || data.production_count || 0,
                defectCount: data.defectCount || data.defect_count || 0,

                // 状态数据
                alarmStatus: data.alarmStatus || data.alarm_status || '',
                workMode: data.workMode || data.work_mode || '',

                // 原始数据
                rawData: data
            };

            // 触发遥测事件
            this.emit('telemetry', telemetry);

        } catch (error) {
            console.error('[MQTT] 消息解析失败:', error, payload.toString());
        }
    }

    /**
     * 从主题中提取设备 ID
     * 例如: fastbee/machine01/telemetry -> machine01
     */
    extractDeviceIdFromTopic(topic) {
        const parts = topic.split('/');
        if (parts.length >= 2) {
            return parts[1];
        }
        return 'unknown';
    }

    /**
     * 发布命令 - 对应 UE4 的 PublishCommand
     */
    publishCommand(deviceId, command, params = {}) {
        if (!this.connected) {
            console.error('[MQTT] 未连接，无法发布命令');
            return false;
        }

        const topic = `fastbee/${deviceId}/command`;
        const payload = {
            deviceId: deviceId,
            command: command,
            timestamp: Date.now(),
            ...params
        };

        const message = JSON.stringify(payload);

        this.client.publish(topic, message, { qos: 1 }, (err) => {
            if (err) {
                console.error(`[MQTT] 发布命令失败 [${topic}]:`, err);
            } else {
                console.log(`[MQTT] 已发布命令 [${topic}]: ${message}`);
            }
        });

        return true;
    }

    /**
     * 启动机器
     */
    startMachine(deviceId) {
        return this.publishCommand(deviceId, 'StartMachine');
    }

    /**
     * 停止机器
     */
    stopMachine(deviceId) {
        return this.publishCommand(deviceId, 'StopMachine');
    }

    /**
     * 设置机器参数
     */
    setMachineParameter(deviceId, paramName, paramValue) {
        return this.publishCommand(deviceId, 'SetMachineParameter', {
            parameterName: paramName,
            parameterValue: paramValue
        });
    }

    /**
     * 事件监听
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * 触发事件
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[MQTT] 事件处理错误 [${event}]:`, error);
                }
            });
        }
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.client) {
            this.client.end();
            this.connected = false;
            console.log('[MQTT] 已断开连接');
        }
    }

    /**
     * 获取连接状态
     */
    isConnected() {
        return this.connected;
    }
}
