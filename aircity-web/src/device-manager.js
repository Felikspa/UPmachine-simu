/**
 * 设备管理器 - 对应 UE4 的多设备支持逻辑
 * 负责管理多个机器设备的映射和控制
 */

import { MachineController } from './machine-controller.js';

export class DeviceManager {
    constructor(scene) {
        this.scene = scene;
        this.deviceMap = new Map(); // deviceId -> { actor, controller, telemetry }
        this.machineClassKeyword = 'BP_Machine'; // 对应 UE4 的 MachineClassKeyword
    }

    /**
     * 查找设备对应的 Actor - 对应 UE4 的 FindActorForDevice
     * 3级映射策略:
     * 1. userData.deviceId 精确匹配
     * 2. 名称匹配
     * 3. 类型关键字匹配
     */
    findActorForDevice(deviceId) {
        let actor = null;

        // Level 1: userData.deviceId 精确匹配
        this.scene.traverse(obj => {
            if (obj.userData && obj.userData.deviceId === deviceId) {
                actor = obj;
                return;
            }
        });

        if (actor) {
            console.log(`[DeviceManager] Level 1 匹配成功: ${deviceId} -> ${actor.name}`);
            return actor;
        }

        // Level 2: 名称匹配
        actor = this.scene.getObjectByName(deviceId);
        if (actor) {
            console.log(`[DeviceManager] Level 2 匹配成功: ${deviceId} -> ${actor.name}`);
            return actor;
        }

        // Level 3: 类型关键字匹配（找到第一个未分配的机器）
        this.scene.traverse(obj => {
            if (obj.userData && obj.userData.type === this.machineClassKeyword) {
                // 检查是否已被其他设备占用
                let isOccupied = false;
                for (let [existingDeviceId, data] of this.deviceMap) {
                    if (data.actor === obj) {
                        isOccupied = true;
                        break;
                    }
                }

                if (!isOccupied && !actor) {
                    actor = obj;
                    console.log(`[DeviceManager] Level 3 匹配成功: ${deviceId} -> ${actor.name}`);
                }
            }
        });

        if (!actor) {
            console.warn(`[DeviceManager] 未找到设备对应的 Actor: ${deviceId}`);
        }

        return actor;
    }

    /**
     * 注册设备 - 当收到新设备的遥测数据时调用
     */
    registerDevice(deviceId, telemetry) {
        // 如果设备已注册，直接更新遥测数据
        if (this.deviceMap.has(deviceId)) {
            const device = this.deviceMap.get(deviceId);
            device.telemetry = telemetry;
            return device.controller;
        }

        // 查找对应的 Actor
        const actor = this.findActorForDevice(deviceId);
        if (!actor) {
            console.error(`[DeviceManager] 无法注册设备 ${deviceId}: 未找到对应的 Actor`);
            return null;
        }

        // 创建控制器
        const controller = new MachineController(actor, deviceId);

        // 注册到映射表
        this.deviceMap.set(deviceId, {
            actor: actor,
            controller: controller,
            telemetry: telemetry
        });

        console.log(`[DeviceManager] 设备注册成功: ${deviceId} (总设备数: ${this.deviceMap.size})`);

        return controller;
    }

    /**
     * 获取设备控制器
     */
    getController(deviceId) {
        const device = this.deviceMap.get(deviceId);
        return device ? device.controller : null;
    }

    /**
     * 获取设备遥测数据
     */
    getTelemetry(deviceId) {
        const device = this.deviceMap.get(deviceId);
        return device ? device.telemetry : null;
    }

    /**
     * 更新设备状态
     */
    updateDevice(deviceId, telemetry, deltaTime) {
        const controller = this.getController(deviceId);
        if (controller) {
            controller.update(telemetry, deltaTime);

            // 更新存储的遥测数据
            const device = this.deviceMap.get(deviceId);
            if (device) {
                device.telemetry = telemetry;
            }
        }
    }

    /**
     * 获取所有设备列表
     */
    getAllDevices() {
        return Array.from(this.deviceMap.keys());
    }

    /**
     * 获取设备数量
     */
    getDeviceCount() {
        return this.deviceMap.size;
    }

    /**
     * 移除设备
     */
    removeDevice(deviceId) {
        if (this.deviceMap.has(deviceId)) {
            this.deviceMap.delete(deviceId);
            console.log(`[DeviceManager] 设备已移除: ${deviceId}`);
            return true;
        }
        return false;
    }

    /**
     * 清空所有设备
     */
    clearAllDevices() {
        this.deviceMap.clear();
        console.log('[DeviceManager] 所有设备已清空');
    }
}
