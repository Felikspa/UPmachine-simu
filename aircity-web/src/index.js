/**
 * 主入口文件 - 整合所有模块
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MqttClient } from './mqtt-client.js';
import { DeviceManager } from './device-manager.js';
import { HUDDisplay } from './hud-display.js';
import { loadRealMachineModel } from './model-generator.js';

class DigitalTwinApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        this.mqttClient = null;
        this.deviceManager = null;
        this.hudDisplay = null;

        this.clock = new THREE.Clock();
        this.lastTime = 0;

        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        console.log('[App] 初始化数字孪生系统...');

        // 1. 初始化 Three.js 场景
        this.initScene();

        // 2. 加载 3D 模型
        await this.loadMachineModel();

        // 3. 初始化设备管理器
        this.deviceManager = new DeviceManager(this.scene);

        // 4. 初始化 HUD
        this.hudDisplay = new HUDDisplay();

        // 5. 初始化 MQTT 客户端
        this.initMqtt();

        // 6. 初始化控制面板
        this.initControlPanel();

        // 7. 启动渲染循环
        this.animate();

        console.log('[App] 初始化完成');
    }

    /**
     * 初始化 Three.js 场景
     */
    initScene() {
        const container = document.getElementById('canvas-container');

        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(5, 3, 5);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        // 添加轨道控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);

        // 添加网格地面
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        // 窗口大小调整
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        console.log('[App] Three.js 场景初始化完成');
    }

    /**
     * 加载机器模型 - 从 UE4 导出的真实 GLB 文件
     */
    async loadMachineModel() {
        try {
            console.log('[App] 🚀 开始加载真实GLB模型（31MB）...');
            const machineGroup = await loadRealMachineModel();
            this.scene.add(machineGroup);
            console.log('[App] ✅ 真实机器模型已加载完成');
        } catch (error) {
            console.error('[App] ❌ 加载真实模型失败:', error.message);
            console.log('[App] 使用测试模型作为备用');

            // 备用方案：创建测试模型
            const machineGroup = new THREE.Group();
            machineGroup.name = 'machine01';
            machineGroup.userData = {
                type: 'BP_Machine',
                deviceId: 'machine01'
            };

            // 创建 7 个螺杆（红色圆柱）
            const screwNames = [
                'mechine_1_Zhushezhen', 'mechine_1_Zhushezhen_001', 'mechine_1_Zhushezhen_002',
                'mechine_1_Zhushezhen_003', 'mechine_1_Zhushezhen_004', 'mechine_1_Zhushezhen_005',
                'mechine_1_Zhushezhen_006'
            ];
            screwNames.forEach((name, i) => {
                const screw = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.1, 0.1, 1, 8),
                    new THREE.MeshStandardMaterial({ color: 0xff0000 })
                );
                screw.name = name;
                screw.position.set(i * 0.3 - 1, 1, 0);
                screw.rotation.z = Math.PI / 2;
                machineGroup.add(screw);
            });

            // 创建 7 个注射单元（蓝色方块）
            const injectionNames = [
                'mechine_1_Zhushe', 'mechine_1_Zhushe_001', 'mechine_1_Zhushe_002',
                'mechine_1_Zhushe_003', 'mechine_1_Zhushe_004', 'mechine_1_Zhushe_005',
                'mechine_1_Zhushe_006'
            ];
            injectionNames.forEach((name, i) => {
                const unit = new THREE.Mesh(
                    new THREE.BoxGeometry(0.2, 0.2, 0.2),
                    new THREE.MeshStandardMaterial({ color: 0x0000ff })
                );
                unit.name = name;
                unit.position.set(i * 0.3 - 1, 0.5, 0);
                machineGroup.add(unit);
            });

            this.scene.add(machineGroup);
            console.log('[App] ✅ 测试模型已加载');
        }
    }

    /**
     * 初始化 MQTT 客户端
     */
    async initMqtt() {
        this.mqttClient = new MqttClient({
            host: '127.0.0.1',
            port: 8083, // WebSocket 端口
            clientId: 'AirCityWeb',
            topics: ['fastbee/#']
        });

        // 监听连接状态
        this.mqttClient.on('connected', () => {
            this.updateConnectionStatus(true);
        });

        this.mqttClient.on('disconnected', () => {
            this.updateConnectionStatus(false);
        });

        this.mqttClient.on('error', (error) => {
            console.error('[App] MQTT 错误:', error);
            this.updateConnectionStatus(false);
        });

        // 监听遥测数据
        this.mqttClient.on('telemetry', (telemetry) => {
            this.handleTelemetry(telemetry);
        });

        // 尝试连接
        try {
            await this.mqttClient.connect();
            console.log('[App] MQTT 连接成功');
        } catch (error) {
            console.error('[App] MQTT 连接失败:', error);
            console.log('[App] 请确保 MQTT Broker 已启动并开启 WebSocket 支持');
        }
    }

    /**
     * 处理遥测数据
     */
    handleTelemetry(telemetry) {
        const deviceId = telemetry.deviceId;

        // 注册或获取设备控制器
        let controller = this.deviceManager.getController(deviceId);
        if (!controller) {
            controller = this.deviceManager.registerDevice(deviceId, telemetry);
            if (!controller) {
                console.error(`[App] 设备注册失败: ${deviceId}`);
                return;
            }
        }

        // 更新 HUD（仅显示当前选中的设备）
        if (deviceId === this.hudDisplay.getCurrentDeviceId()) {
            this.hudDisplay.update(telemetry);
        }
    }

    /**
     * 初始化控制面板
     */
    initControlPanel() {
        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');
        const setRpmBtn = document.getElementById('set-rpm-btn');
        const rpmInput = document.getElementById('rpm-input');

        startBtn.addEventListener('click', () => {
            const deviceId = this.hudDisplay.getCurrentDeviceId();
            this.mqttClient.startMachine(deviceId);
            console.log(`[App] 发送启动命令: ${deviceId}`);
        });

        stopBtn.addEventListener('click', () => {
            const deviceId = this.hudDisplay.getCurrentDeviceId();
            this.mqttClient.stopMachine(deviceId);
            console.log(`[App] 发送停止命令: ${deviceId}`);
        });

        setRpmBtn.addEventListener('click', () => {
            const deviceId = this.hudDisplay.getCurrentDeviceId();
            const rpm = parseInt(rpmInput.value);
            if (!isNaN(rpm) && rpm >= 0 && rpm <= 3000) {
                this.mqttClient.setMachineParameter(deviceId, 'rpm', rpm);
                console.log(`[App] 设置转速: ${deviceId} -> ${rpm} RPM`);
            } else {
                alert('请输入有效的转速值 (0-3000)');
            }
        });
    }

    /**
     * 更新连接状态显示
     */
    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');

        if (connected) {
            statusDot.className = 'status-dot status-connected';
            statusText.textContent = '已连接';
        } else {
            statusDot.className = 'status-dot status-disconnected';
            statusText.textContent = '未连接';
        }
    }

    /**
     * 渲染循环
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        // 更新所有设备的动画
        const devices = this.deviceManager.getAllDevices();
        devices.forEach(deviceId => {
            const telemetry = this.deviceManager.getTelemetry(deviceId);
            if (telemetry) {
                this.deviceManager.updateDevice(deviceId, telemetry, deltaTime);
            }
        });

        // 更新控制器
        this.controls.update();

        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }
}

// 启动应用
new DigitalTwinApp();
