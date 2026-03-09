/**
 * 机器控制器 - 对应 UE4 的 MachinePartController
 * 负责控制 26 个机器部件的动画
 */

export class MachineController {
    constructor(machineModel, deviceId) {
        this.machineModel = machineModel;
        this.deviceId = deviceId;

        // 查找所有部件 - 对应 UE4 的组件查找
        this.parts = {
            // 螺杆部件 (6个) - 旋转 + 轴向移动
            screws: this.findParts(['Screw_01', 'Screw_02', 'Screw_03', 'Screw_04', 'Screw_05', 'Screw_06']),

            // 注射单元 (14个) - Z轴移动
            injectionUnits: this.findParts([
                'InjectionUnit_01', 'InjectionUnit_02', 'InjectionUnit_03', 'InjectionUnit_04',
                'InjectionUnit_05', 'InjectionUnit_06', 'InjectionUnit_07', 'InjectionUnit_08',
                'InjectionUnit_09', 'InjectionUnit_10', 'InjectionUnit_11', 'InjectionUnit_12',
                'InjectionUnit_13', 'InjectionUnit_14'
            ]),

            // 料筒 (3个) - 温度可视化
            barrels: this.findParts(['Barrel_01', 'Barrel_02', 'Barrel_03']),

            // 模具 (3个) - 温度可视化
            molds: this.findParts(['Mold_01', 'Mold_02', 'Mold_03'])
        };

        // 当前状态
        this.currentRpm = 0;
        this.currentScrewPosition = 0;
        this.currentInjectionPosition = 0;

        console.log(`[MachineController] 初始化设备 ${deviceId}:`, {
            screws: this.parts.screws.length,
            injectionUnits: this.parts.injectionUnits.length,
            barrels: this.parts.barrels.length,
            molds: this.parts.molds.length
        });
    }

    /**
     * 查找部件 - 对应 UE4 的 FindComponentByName
     */
    findParts(names) {
        const parts = [];
        names.forEach(name => {
            const part = this.machineModel.getObjectByName(name);
            if (part) {
                parts.push(part);
            } else {
                console.warn(`[MachineController] 未找到部件: ${name}`);
            }
        });
        return parts;
    }

    /**
     * 更新螺杆旋转 - 对应 UE4 的 UpdateScrewRotation
     */
    updateScrewRotation(rpm, deltaTime) {
        this.currentRpm = rpm;

        if (rpm > 0) {
            // RPM 转换为弧度/秒: rpm * 6.0 * (π/180)
            const rotationSpeed = rpm * 6.0 * (Math.PI / 180);

            this.parts.screws.forEach(screw => {
                if (screw) {
                    screw.rotation.y += rotationSpeed * deltaTime;
                }
            });
        }
    }

    /**
     * 更新螺杆轴向位置 - 对应 UE4 的 UpdateScrewPosition
     */
    updateScrewPosition(position) {
        this.currentScrewPosition = position;

        this.parts.screws.forEach(screw => {
            if (screw) {
                // X 轴移动，范围通常 0-100mm
                screw.position.x = position / 100; // 缩放到合适的单位
            }
        });
    }

    /**
     * 更新注射单元位置 - 对应 UE4 的 UpdateInjectionUnitPosition
     */
    updateInjectionUnitPosition(position) {
        this.currentInjectionPosition = position;

        this.parts.injectionUnits.forEach(unit => {
            if (unit) {
                // Z 轴移动，范围通常 0-200mm
                unit.position.z = position / 100;
            }
        });
    }

    /**
     * 更新料筒温度可视化 - 对应 UE4 的 UpdateBarrelTemperature
     */
    updateBarrelTemperature(temperature) {
        this.parts.barrels.forEach(barrel => {
            if (barrel && barrel.material) {
                const color = this.getTemperatureColor(temperature, 180, 220);
                barrel.material.emissive.setHex(color);
                barrel.material.emissiveIntensity = 0.5;
            }
        });
    }

    /**
     * 更新模具温度可视化 - 对应 UE4 的 UpdateMoldTemperature
     */
    updateMoldTemperature(temperature) {
        this.parts.molds.forEach(mold => {
            if (mold && mold.material) {
                const color = this.getTemperatureColor(temperature, 40, 80);
                mold.material.emissive.setHex(color);
                mold.material.emissiveIntensity = 0.5;
            }
        });
    }

    /**
     * 根据温度获取颜色
     * @param {number} temp - 当前温度
     * @param {number} normalTemp - 正常温度
     * @param {number} maxTemp - 最高温度
     * @returns {number} - 十六进制颜色值
     */
    getTemperatureColor(temp, normalTemp, maxTemp) {
        if (temp < normalTemp) {
            // 正常: 绿色
            return 0x00ff00;
        } else if (temp < maxTemp) {
            // 警告: 黄色
            return 0xffaa00;
        } else {
            // 危险: 红色
            return 0xff0000;
        }
    }

    /**
     * 更新所有状态 - 主更新函数
     */
    update(telemetry, deltaTime) {
        // 更新螺杆旋转
        if (telemetry.rpm !== undefined) {
            this.updateScrewRotation(telemetry.rpm, deltaTime);
        }

        // 更新螺杆位置
        if (telemetry.screwPosition !== undefined) {
            this.updateScrewPosition(telemetry.screwPosition);
        }

        // 更新注射单元位置
        if (telemetry.injectionUnitPosition !== undefined) {
            this.updateInjectionUnitPosition(telemetry.injectionUnitPosition);
        }

        // 更新料筒温度
        if (telemetry.barrelTemperature !== undefined) {
            this.updateBarrelTemperature(telemetry.barrelTemperature);
        }

        // 更新模具温度
        if (telemetry.moldTemperature !== undefined) {
            this.updateMoldTemperature(telemetry.moldTemperature);
        }
    }

    /**
     * 获取当前状态
     */
    getState() {
        return {
            deviceId: this.deviceId,
            rpm: this.currentRpm,
            screwPosition: this.currentScrewPosition,
            injectionPosition: this.currentInjectionPosition
        };
    }
}
