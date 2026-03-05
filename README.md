# AirCityExplorer - 注塑机数字孪生系统

基于 UE4 的注塑机数字孪生系统，实现 MQTT 实时数据采集、部件级控制与虚实映射。

---

## 项目概述

**技术栈:** UE4 4.26 + C++ + MQTT + JSON

### 核心功能

- MQTT 实时通信（订阅/发布）
- JSON 数据解析（14+ 传感器字段）
- 部件级运动控制（螺杆、注射单元）
- 实时数据 HUD 显示
- 虚实映射（设备数据到虚拟 Actor）
- 多设备支持
- 双向控制（UE4 到物理设备）

### 系统架构

**C++ 组件:**
- `FastBeeMqttSubsystem` - MQTT 通信子系统
- `MachinePartController` - 部件级控制组件
- `MachineDataHUD` - 实时数据显示 HUD
- `MachineGameMode` - 游戏模式

**数据流:**
```
MQTT Broker → FastBeeMqttSubsystem → MachinePartController → BP_Machine 部件
                                   → MachineDataHUD → 屏幕显示
```

---

## 环境要求

### 必需软件

- UE4 4.26
- Visual Studio 2019/2022
- Mosquitto MQTT Broker
- MQTT Explorer（测试工具，可选）

### 系统要求

- 操作系统: Windows 10/11
- 内存: 8GB 以上
- 显卡: 支持 DirectX 11

---

## 快速开始

### 方法 1: 一键启动

1. 双击运行 `快速启动.bat`
2. 等待 UE4 编辑器加载完成
3. 打开 MQTT Explorer，连接到 `localhost:1883`
4. 在 UE4 中点击 Play 按钮
5. 使用 MQTT Explorer 发送测试数据

### 方法 2: 手动启动

详见下方"详细部署步骤"。

---

## 详细部署步骤

### 步骤 1: 安装 Mosquitto MQTT Broker

1. 下载 Mosquitto
   - 访问: https://mosquitto.org/download/
   - 下载 Windows 版本安装包

2. 安装 Mosquitto
   - 运行安装程序
   - 默认安装路径: `C:\Program Files\mosquitto`

3. 创建配置文件
   在 `C:\Program Files\mosquitto` 目录下创建 `mosquitto.conf`:
   ```
   listener 1883
   allow_anonymous true
   ```

4. 启动 Mosquitto
   打开 PowerShell（管理员）:
   ```powershell
   cd "C:\Program Files\mosquitto"
   .\mosquitto.exe -c mosquitto.conf -v
   ```

### 步骤 2: 编译 UE4 项目

1. 右键 `AirCityExplorer.uproject` → Generate Visual Studio project files
2. 打开生成的 `AirCityExplorer.sln`
3. 在 Visual Studio 中: Build → Build Solution
4. 等待编译完成

### 步骤 3: 配置 UE4 项目

1. 双击 `AirCityExplorer.uproject` 打开 UE4 编辑器

2. 添加 MachinePartController 组件到 BP_Machine
   - 打开 `Content/Project_machine/MainMachinery/BP_Machine`
   - 点击 "Add Component" 按钮
   - 搜索 "MachinePartController"
   - 添加后在 Details 面板设置:
     - Device Id = `machine01`
     - Injection Movement Scale = `2.0`
   - 点击 "Compile" 和 "Save"

3. 设置 GameMode（启用 HUD）
   - 打开关卡（例如 Minimal_Default）
   - 菜单: Window → World Settings
   - GameMode Override → 选择 `MachineGameMode`
   - 保存关卡（Ctrl+S）

4. 确保 BP_Machine 有正确的标签
   - 在场景中选中 BP_Machine Actor
   - 在 Details 面板找到 "Tags" 部分
   - 添加 Tag: `machine01`

### 步骤 4: 测试系统

1. 在 UE4 中点击 Play 按钮
2. 屏幕左上角应显示 HUD
3. 使用 MQTT Explorer 发送测试数据

---

## 使用方法

### MQTT 数据格式

**Topic:** `fastbee/machine01/telemetry`

**完整数据示例:**
```json
{
  "deviceId": "machine01",
  "rpm": 1200,
  "running": true,
  "screw_position": 50.5,
  "injection_unit_position": 120.0,
  "barrel_temperature": 220.5,
  "mold_temperature": 80.0,
  "oil_temperature": 45.0,
  "injection_pressure": 150.0,
  "holding_pressure": 80.0,
  "back_pressure": 20.0,
  "production_count": 1250,
  "defect_count": 15,
  "alarm_status": "normal",
  "work_mode": "auto"
}
```

**支持的字段:**
- `deviceId` - 设备 ID（必需）
- `rpm` - 螺杆转速（用于塑化和计量阶段，控制螺杆旋转）
- `running` - 运行状态（true/false）
- `screw_position` - 螺杆轴向位置（0-100mm，前后移动）
- `injection_unit_position` - 注射单元位置（0-200mm）
- `barrel_temperature` - 料筒温度（°C）
- `mold_temperature` - 模具温度（°C）
- `oil_temperature` - 油温（°C）
- `injection_pressure` - 注射压力（MPa）
- `holding_pressure` - 保压压力（MPa）
- `back_pressure` - 背压（MPa）
- `production_count` - 生产计数
- `defect_count` - 缺陷计数
- `alarm_status` - 报警状态
- `work_mode` - 工作模式

### 测试场景

#### 场景 1: 基础运动测试

**初始状态:**
```json
{
  "deviceId": "machine01",
  "rpm": 0,
  "running": true,
  "screw_position": 0,
  "injection_unit_position": 0,
  "barrel_temperature": 50,
  "mold_temperature": 50
}
```

**螺杆旋转测试（塑化阶段）:**
```json
{
  "deviceId": "machine01",
  "rpm": 80,
  "running": true,
  "screw_position": 50,
  "injection_unit_position": 0,
  "barrel_temperature": 150,
  "mold_temperature": 80
}
```

**注射单元前进（注射阶段）:**
```json
{
  "deviceId": "machine01",
  "rpm": 0,
  "running": true,
  "screw_position": 50,
  "injection_unit_position": 100,
  "barrel_temperature": 220,
  "mold_temperature": 120
}
```

#### 场景 2: 完整注塑循环

**阶段 1 - 合模准备:**
```json
{
  "deviceId": "machine01",
  "rpm": 0,
  "running": true,
  "screw_position": 100,
  "injection_unit_position": 0,
  "barrel_temperature": 220,
  "mold_temperature": 80,
  "injection_pressure": 0,
  "work_mode": "ready"
}
```

**阶段 2 - 注射:**
```json
{
  "deviceId": "machine01",
  "rpm": 0,
  "running": true,
  "screw_position": 20,
  "injection_unit_position": 150,
  "barrel_temperature": 225,
  "mold_temperature": 85,
  "injection_pressure": 150,
  "work_mode": "injection"
}
```

**阶段 3 - 保压:**
```json
{
  "deviceId": "machine01",
  "rpm": 0,
  "running": true,
  "screw_position": 20,
  "injection_unit_position": 150,
  "barrel_temperature": 223,
  "mold_temperature": 90,
  "holding_pressure": 80,
  "work_mode": "holding"
}
```

**阶段 4 - 冷却计量（螺杆旋转塑化）:**
```json
{
  "deviceId": "machine01",
  "rpm": 80,
  "running": true,
  "screw_position": 100,
  "injection_unit_position": 150,
  "barrel_temperature": 220,
  "mold_temperature": 75,
  "back_pressure": 20,
  "work_mode": "cooling"
}
```

**阶段 5 - 开模顶出:**
```json
{
  "deviceId": "machine01",
  "rpm": 0,
  "running": true,
  "screw_position": 100,
  "injection_unit_position": 0,
  "barrel_temperature": 220,
  "mold_temperature": 70,
  "production_count": 1,
  "work_mode": "ejecting"
}
```

### 预期效果

**HUD 显示（屏幕左上角）:**
```
=== 注塑机数字孪生 - machine01 ===
运行状态: 运行中
转速: 80 RPM
--- 温度数据 ---
  料筒温度: 220.0 °C
  模具温度: 80.0 °C
--- 压力数据 ---
  注射压力: 150.0 MPa
已连接设备: 1
```

**部件运动:**
- 6 个螺杆组件根据 `rpm` 旋转（模拟塑化过程）
- 6 个螺杆组件根据 `screw_position` 轴向移动（前后移动）
- 14 个注射单元组件根据 `injection_unit_position` 移动
- 实时响应 MQTT 数据

**Output Log:**
```
MachinePartController: Found 379 StaticMeshComponents
MachinePartController: Cached - Screw: 6, Injection: 14, Barrel: 3, Mold: 3
MachinePartController: UpdateScrewRotation - RPM=80.0
MachinePartController: UpdateScrewPosition - Position=50.00, Movement=50.00 cm, Components=6
MachinePartController: UpdateInjectionUnitPosition - Position=100.00, Movement=100.00 cm, Components=14
```

---

## 系统特性

### 部件级控制

**自动组件识别:**
- 系统自动识别 BP_Machine 的 758 个子组件
- 根据组件名称自动分类（螺杆、注射单元、料筒、模具）

**支持的部件:**
- 螺杆组件（6 个）: 包含 "Luogan"、"Screw"、"A670735"
- 注射单元组件（14 个）: 包含 "Zhushe"、"Injection"
- 料筒组件（3 个）: 包含 "Liaotong"、"Barrel"、"A670714"
- 模具组件（3 个）: 包含 "Moju"、"Mold"、"A670715"

**运动控制:**
- 螺杆旋转: 根据 `rpm` 参数旋转（模拟塑化过程）
- 螺杆轴向移动: 根据 `screw_position` 沿 X 轴前后移动
- 注射单元移动: 根据 `injection_unit_position` 沿 X 轴移动
- 初始位置和旋转自动缓存，避免累积误差
- 实时响应，零延迟

**可调参数（在 BP_Machine 的 MachinePartController 组件中）:**
- `Screw Max Position`: 螺杆最大位置（默认 100mm）
- `Screw Movement Scale`: 螺杆移动缩放系数（默认 1.0）
- `Enable Screw Rotation`: 是否启用螺杆旋转（默认 true）
- `Injection Max Position`: 注射单元最大位置（默认 200mm）
- `Injection Movement Scale`: 注射单元移动缩放系数（默认 2.0）
- `Enable Temperature Visualization`: 是否启用温度可视化（默认 true）
- `Low Temperature`: 低温阈值（默认 50°C）
- `High Temperature`: 高温阈值（默认 250°C）

### 实时数据显示

**HUD 功能:**
- 设备 ID 显示
- 运行状态指示（绿色/红色）
- 螺杆转速 RPM 显示（用于塑化过程）
- 温度数据（带颜色编码）
- 压力数据
- 已连接设备数量

**温度颜色映射:**
- 50°C 以下: 蓝色
- 50-100°C: 青色
- 100-150°C: 黄色
- 150-200°C: 橙色
- 200°C 以上: 红色

**HUD 可调参数（在 MachineGameMode 或运行时）:**
- `Target Device Id`: 要显示的设备 ID（默认 machine01）
- `HUD Position`: HUD 位置（默认左上角 50,50）
- `Font Scale`: 字体缩放（默认 1.0）
- `Show Machine Data`: 是否显示 HUD（默认 true）

### MQTT 通信

**连接配置（Config/DefaultGame.ini）:**
```ini
[/Script/AirCityExplorer.FastBeeMqttSettings]
bEnableFastBeeMqtt=True
BrokerHost=127.0.0.1
BrokerPort=1883
ClientId=AirCityExplorer
EventLoopDeltaMs=20
TopicQos=0
DefaultDeviceId=machine01
MachineClassKeyword=BP_Machine
bRotateActorFromRpm=True
+SubscribeTopics=fastbee/#
```

**支持的功能:**
- 自动重连
- 多 Topic 订阅
- JSON 数据解析
- 设备自动映射
- 双向通信

---

## 故障排查

### 问题 1: MQTT 连接失败

**现象:** Output Log 显示 "MQTT connection failed"

**解决:**
1. 确认 Mosquitto 正在运行
2. 检查防火墙是否阻止 1883 端口
3. 验证 `Config/DefaultGame.ini` 中的 BrokerHost 和 BrokerPort
4. 使用 MQTT Explorer 测试连接

### 问题 2: HUD 不显示

**现象:** 屏幕上看不到数据显示

**解决:**
1. 检查 World Settings 中 GameMode Override 是否设置为 MachineGameMode
2. 重新 Play
3. 检查 Output Log 是否有错误

### 问题 3: 部件不移动

**现象:** 发送数据后部件没有运动

**解决:**
1. 检查 BP_Machine 是否添加了 MachinePartController 组件
2. 检查 Device Id 是否匹配（默认 machine01）
3. 检查 BP_Machine 是否有正确的 Tag
4. 查看 Output Log 中的 "MachinePartController: Cached" 日志
5. 确认 MQTT 数据中包含 screw_position 和 injection_unit_position 字段

### 问题 4: HUD 显示"等待设备数据"

**现象:** HUD 显示但没有实际数据

**解决:**
1. 检查 MQTT 是否连接（Output Log 应有 "FastBee MQTT: connected"）
2. 检查 BP_Machine 的 Tag 或名称是否包含设备 ID
3. 发送测试数据，确认 deviceId 字段匹配
4. 检查 Topic 是否正确（fastbee/machine01/telemetry）

### 问题 5: 编译错误

**现象:** Visual Studio 编译失败

**解决:**
1. 清理项目: 删除 `Intermediate`、`Binaries`、`.vs` 文件夹
2. 右键 .uproject → Generate Visual Studio project files
3. 重新打开 .sln 并编译
4. 确认 UE4 版本为 4.26

### 问题 6: UE4 崩溃或配置丢失

**解决:**
按照"详细部署步骤"中的步骤 3 重新配置:
1. 添加 MachinePartController 组件到 BP_Machine
2. 设置 GameMode 为 MachineGameMode
3. 确保 BP_Machine 有正确的 Tag
4. 保存所有修改

---

## 技术说明

### 数字孪生实现

**当前实现:**
- 实时数据采集框架
- 完整的 JSON 数据解析（14+ 字段）
- 部件级运动控制（螺杆、注射单元）
- 实时数据 HUD 显示
- 虚实映射（MQTT 数据到 3D 模型）
- 多设备支持

**技术特点:**
- 组件引用在 BeginPlay 时缓存，避免每帧查找
- 初始位置保存，避免累积误差
- 只更新有变化的数据
- 零延迟响应

### 组件识别逻辑

系统通过组件名称自动识别部件类型。如需修改识别逻辑，编辑 `Source/AirCityExplorer/Private/MachinePartController.cpp` 中的 `CacheComponentReferences()` 函数。

### 运动轴向

默认沿 X 轴移动。如需改变轴向，修改 `UpdateScrewPosition()` 和 `UpdateInjectionUnitPosition()` 中的 `FVector` 参数:
```cpp
// 当前: 沿 X 轴
FVector NewPosition = *InitialPos + FVector(MovementDistance, 0.0f, 0.0f);

// 改为沿 Y 轴:
FVector NewPosition = *InitialPos + FVector(0.0f, MovementDistance, 0.0f);

// 改为沿 Z 轴:
FVector NewPosition = *InitialPos + FVector(0.0f, 0.0f, MovementDistance);
```

### 扩展开发

**可扩展方向:**
1. 添加更多部件控制（模具开合、料斗旋转）
2. 实现温度材质可视化（需要修改材质）
3. 添加平滑过渡动画
4. 实现历史数据记录和回放
5. 添加 3D UI 面板（World Space Widget）
6. 实现多机器同步显示

---

## 项目结构

```
AirCityExplorer/
├── Source/AirCityExplorer/
│   ├── Public/
│   │   ├── FastBeeMqttSubsystem.h
│   │   ├── MachinePartController.h
│   │   ├── MachineDataHUD.h
│   │   └── MachineGameMode.h
│   ├── Private/
│   │   ├── FastBeeMqttSubsystem.cpp
│   │   ├── MachinePartController.cpp
│   │   ├── MachineDataHUD.cpp
│   │   └── MachineGameMode.cpp
│   └── AirCityExplorer.Build.cs
├── Content/
│   └── Project_machine/
│       └── MainMachinery/
│           └── BP_Machine.uasset
├── Config/
│   └── DefaultGame.ini
├── Plugins/
│   └── MqttUtilities/
├── 快速启动.bat
└── README.md
```
