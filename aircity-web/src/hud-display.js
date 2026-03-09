/**
 * HUD 显示器 - 对应 UE4 的 MachineDataHUD
 * 负责实时显示机器状态数据
 */

export class HUDDisplay {
    constructor() {
        // 获取 DOM 元素
        this.elements = {
            deviceId: document.getElementById('device-id'),
            runningStatus: document.getElementById('running-status'),
            rpmValue: document.getElementById('rpm-value'),
            barrelTemp: document.getElementById('barrel-temp'),
            moldTemp: document.getElementById('mold-temp'),
            injectionPressure: document.getElementById('injection-pressure'),
            screwPosition: document.getElementById('screw-position'),
            productionCount: document.getElementById('production-count')
        };

        this.currentDeviceId = 'machine01';
    }

    /**
     * 更新 HUD 显示 - 对应 UE4 的 DrawHUD
     */
    update(telemetry) {
        if (!telemetry) return;

        // 更新设备 ID
        if (this.elements.deviceId) {
            this.elements.deviceId.textContent = telemetry.deviceId;
            this.currentDeviceId = telemetry.deviceId;
        }

        // 更新运行状态
        if (this.elements.runningStatus) {
            const running = telemetry.running;
            this.elements.runningStatus.textContent = running ? '运行中' : '停止';
            this.elements.runningStatus.className = running ? 'hud-value status-running' : 'hud-value status-stopped';
        }

        // 更新转速
        if (this.elements.rpmValue) {
            this.elements.rpmValue.textContent = Math.round(telemetry.rpm || 0);
        }

        // 更新料筒温度（带颜色编码）
        if (this.elements.barrelTemp) {
            const temp = telemetry.barrelTemperature || 0;
            this.elements.barrelTemp.textContent = temp.toFixed(1);
            this.elements.barrelTemp.className = 'hud-value ' + this.getTemperatureClass(temp, 180, 220);
        }

        // 更新模具温度（带颜色编码）
        if (this.elements.moldTemp) {
            const temp = telemetry.moldTemperature || 0;
            this.elements.moldTemp.textContent = temp.toFixed(1);
            this.elements.moldTemp.className = 'hud-value ' + this.getTemperatureClass(temp, 40, 80);
        }

        // 更新注射压力
        if (this.elements.injectionPressure) {
            this.elements.injectionPressure.textContent = (telemetry.injectionPressure || 0).toFixed(1);
        }

        // 更新螺杆位置
        if (this.elements.screwPosition) {
            this.elements.screwPosition.textContent = (telemetry.screwPosition || 0).toFixed(1);
        }

        // 更新生产计数
        if (this.elements.productionCount) {
            this.elements.productionCount.textContent = telemetry.productionCount || 0;
        }
    }

    /**
     * 获取温度颜色类名 - 对应 UE4 的温度颜色逻辑
     */
    getTemperatureClass(temp, normalTemp, maxTemp) {
        if (temp < normalTemp) {
            return 'temp-normal';
        } else if (temp < maxTemp) {
            return 'temp-warning';
        } else {
            return 'temp-danger';
        }
    }

    /**
     * 切换显示的设备
     */
    switchDevice(deviceId) {
        this.currentDeviceId = deviceId;
    }

    /**
     * 获取当前显示的设备 ID
     */
    getCurrentDeviceId() {
        return this.currentDeviceId;
    }
}
