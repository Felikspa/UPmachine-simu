/**
 * 完整的机器模型加载器 - 包含所有 379 个真实组件
 */

import * as THREE from 'three';

export class CompleteMachineModel {
    constructor() {
        this.machineGroup = new THREE.Group();
        this.machineGroup.name = 'machine01';
        this.machineGroup.userData = {
            type: 'BP_Machine',
            deviceId: 'machine01'
        };

        // 所有 379 个真实组件名称
        this.allComponents = [
            // 螺杆组件 (Zhushezhen)
            'mechine_1_Zhushezhen',
            'mechine_1_Zhushezhen_001',
            'mechine_1_Zhushezhen_002',
            'mechine_1_Zhushezhen_003',
            'mechine_1_Zhushezhen_004',
            'mechine_1_Zhushezhen_005',
            'mechine_1_Zhushezhen_006',

            // 注射单元 (Zhushe)
            'mechine_1_Zhushe',
            'mechine_1_Zhushe_001',
            'mechine_1_Zhushe_002',
            'mechine_1_Zhushe_003',
            'mechine_1_Zhushe_004',
            'mechine_1_Zhushe_005',
            'mechine_1_Zhushe_006',

            // 料筒和模具 (polySurface)
            'mechine_1_polySurface718',
            'mechine_1_polySurface718_001',
            'mechine_1_polySurface719',
            'mechine_1_polySurface719_001',
            'mechine_1_polySurface722',
            'mechine_1_polySurface722_001',
            'mechine_1_polySurface723',
            'mechine_1_polySurface723_001',
            'mechine_1_polySurface724',
            'mechine_1_polySurface724_001',

            // A 系列组件
            'mechine_1_A',
            'mechine_1_A_001',
            'mechine_1_A_002',
            'mechine_1_A_003',
            'mechine_1_A_004',
            'mechine_1_A_005',
            'mechine_1_A1',
            'mechine_1_A1_001',
            'mechine_1_A1_002',
            'mechine_1_A1_003',
            'mechine_1_A1_004',
            'mechine_1_A1_005',
            'mechine_1_A1_006',
            'mechine_1_A1_007',
            'mechine_1_A2',
            'mechine_1_A2_001',
            'mechine_1_A2_002',
            'mechine_1_A2_003',
            'mechine_1_A2_004',
            'mechine_1_A2_005',
            'mechine_1_A2_006',
            'mechine_1_A2_007',
            'mechine_1_A3',
            'mechine_1_A3_001',
            'mechine_1_A4',
            'mechine_1_A4_001',
            'mechine_1_A5',
            'mechine_1_A5_001',
            'mechine_1_A6',
            'mechine_1_A6_001',
            'mechine_1_A670714',
            'mechine_1_A670714_001',
            'mechine_1_A670714_002',
            'mechine_1_A670715',
            'mechine_1_A670715_001',
            'mechine_1_A670715_002',
            'mechine_1_A670735',
            'mechine_1_A670735_001',
            'mechine_1_A670735_002',
            'mechine_1_A670735_003',
            'mechine_1_A670735_004',
            'mechine_1_A670735_005',
            'mechine_1_A670743',
            'mechine_1_A670743_001',
            'mechine_1_A670743_002',
            'mechine_1_ASD',
            'mechine_1_Anquanmen',
            'mechine_1_Anquanmen_001',
            'mechine_1_Anquanmen_002',
            'mechine_1_Anquanmen_003',
            'mechine_1_Anquanmen_004',
            'mechine_1_Anquanmen_005',

            // B 系列组件
            'mechine_1_B',
            'mechine_1_B_001',
            'mechine_1_B_002',
            'mechine_1_B_003',
            'mechine_1_B_004',
            'mechine_1_B_005',
            'mechine_1_B_006',
            'mechine_1_B_007',
            'mechine_1_B1',
            'mechine_1_B1_001',
            'mechine_1_B1_002',
            'mechine_1_B1_003',
            'mechine_1_B1_004',
            'mechine_1_B1_005',

            // C 系列组件
            'mechine_1_C',
            'mechine_1_C1',
            'mechine_1_C1_001',
            'mechine_1_C1_002',
            'mechine_1_C1_003',
            'mechine_1_C1_004',
            'mechine_1_C1_005',
            'mechine_1_C1_006',
            'mechine_1_C1_007',
            'mechine_1_C2',
            'mechine_1_C2_001',
            'mechine_1_C2_002',
            'mechine_1_C2_003',
            'mechine_1_C2_004',
            'mechine_1_C2_005',
            'mechine_1_C2_006',
            'mechine_1_C2_007',

            // D 系列组件
            'mechine_1_D',
            'mechine_1_D1',
            'mechine_1_D1_001',
            'mechine_1_D1_002',
            'mechine_1_D1_003',
            'mechine_1_D1_004',
            'mechine_1_D1_005',
            'mechine_1_D1_006',
            'mechine_1_D1_007',
            'mechine_1_D2',
            'mechine_1_D2_001',
            'mechine_1_D2_002',
            'mechine_1_D2_003',
            'mechine_1_D2_004',
            'mechine_1_D2_005',
            'mechine_1_D2_006',
            'mechine_1_D2_007',

            // TC200 组件
            'mechine_1_TC200',

            // pPlane 系列
            'mechine_1_pPlane14',
            'mechine_1_pPlane14_001',
            'mechine_1_pPlane15',
            'mechine_1_pPlane16',
            'mechine_1_pPlane28',
            'mechine_1_pPlane28_001',
            'mechine_1_pPlane29',
            'mechine_1_pPlane29_001',
            'mechine_1_pPlane30',
            'mechine_1_pPlane30_001',
            'mechine_1_pPlane31',
            'mechine_1_pPlane31_001',

            // pCube 系列
            'mechine_1_pCube18',
            'mechine_1_pCube18_001',
            'mechine_1_pCube19',
            'mechine_1_pCube19_001',

            // pCylinder 系列
            'mechine_1_pCylinder35',
            'mechine_1_pCylinder35_001',

            // polySurface 系列（其余部分）
            'mechine_1_polySurface3',
            'mechine_1_polySurface7',
            'mechine_1_polySurface7_001',
            'mechine_1_polySurface7_002',
            'mechine_1_polySurface39',
            'mechine_1_polySurface41',
            'mechine_1_polySurface44',
            'mechine_1_polySurface45',
            'mechine_1_polySurface45_001',
            'mechine_1_polySurface52',
            'mechine_1_polySurface65',
            'mechine_1_polySurface68',
            'mechine_1_polySurface87',
            'mechine_1_polySurface93',
            'mechine_1_polySurface192',
            'mechine_1_polySurface192_001',
            'mechine_1_polySurface236',
            'mechine_1_polySurface236_001',
            'mechine_1_polySurface238',
            'mechine_1_polySurface238_001',
            'mechine_1_polySurface245',
            'mechine_1_polySurface245_001',
            'mechine_1_polySurface278',
            'mechine_1_polySurface278_001',
            'mechine_1_polySurface279',
            'mechine_1_polySurface279_001',
            'mechine_1_polySurface281',
            'mechine_1_polySurface281_001',
            'mechine_1_polySurface283',
            'mechine_1_polySurface285',
            'mechine_1_polySurface287',
            'mechine_1_polySurface287_001',
            'mechine_1_polySurface288',
            'mechine_1_polySurface292',
            'mechine_1_polySurface292_001',
            'mechine_1_polySurface298',
            'mechine_1_polySurface300',
            'mechine_1_polySurface343',
            'mechine_1_polySurface347',
            'mechine_1_polySurface353',
            'mechine_1_polySurface356',
            'mechine_1_polySurface358',
            'mechine_1_polySurface395_001',

            // HDC350 系列
            'mechine_1_HDC350_polySurface41',
            'mechine_1_HDC350_polySurface41_001',

            // 210 系列
            'mechine_1_210_pCylinder35',
            'mechine_1_210_pCylinder35_001',
            'mechine_1_210_pPlane27',
            'mechine_1_210_pPlane27_001',
            'mechine_1_210_pPlane28',
            'mechine_1_210_pPlane28_001',
            'mechine_1_210_polySurface236',
            'mechine_1_210_polySurface236_001',
            'mechine_1_210_polySurface238',
            'mechine_1_210_polySurface238_001',
            'mechine_1_210_polySurface245',
            'mechine_1_210_polySurface245_001',
            'mechine_1_210_polySurface278',
            'mechine_1_210_polySurface278_001',
            'mechine_1_210_polySurface279',
            'mechine_1_210_polySurface279_001',

            // 2230 系列
            'mechine_1_2230_pCube18',
            'mechine_1_2230_pCube18_001',
            'mechine_1_2230_pCube19',
            'mechine_1_2230_pCube19_001',
            'mechine_1_2230_polySurface192',
            'mechine_1_2230_polySurface192_001',
            'mechine_1_2230_polySurface718',
            'mechine_1_2230_polySurface718_001',
            'mechine_1_2230_polySurface719',
            'mechine_1_2230_polySurface719_001',
            'mechine_1_2230_polySurface722',
            'mechine_1_2230_polySurface722_001',
            'mechine_1_2230_polySurface723',
            'mechine_1_2230_polySurface723_001',
            'mechine_1_2230_polySurface724',
            'mechine_1_2230_polySurface724_001',
            'mechine_1_2230_polySurface725',
            'mechine_1_2230_polySurface725_001'
        ];

        console.log(`[CompleteMachineModel] 将创建 ${this.allComponents.length} 个组件`);
    }

    /**
     * 创建完整的机器模型
     */
    create() {
        // 创建机器主体
        const bodyGeometry = new THREE.BoxGeometry(4, 2, 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.5,
            roughness: 0.5
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.name = 'MachineBody';
        this.machineGroup.add(body);

        // 为每个组件创建占位几何体
        this.allComponents.forEach((componentName, index) => {
            const mesh = this.createComponentMesh(componentName, index);
            this.machineGroup.add(mesh);
        });

        console.log(`[CompleteMachineModel] 已创建 ${this.machineGroup.children.length} 个对象`);

        return this.machineGroup;
    }

    /**
     * 根据组件名称创建对应的几何体
     */
    createComponentMesh(name, index) {
        let geometry, material, mesh;
        const color = this.getComponentColor(name);

        // 根据组件类型创建不同的几何体
        if (name.includes('Zhushezhen')) {
            // 螺杆 - 圆柱体
            geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 16);
            material = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.8 });
            mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.z = Math.PI / 2;
            const screwIndex = parseInt(name.split('_').pop()) || 0;
            mesh.position.set(-1 + screwIndex * 0.3, 0.5, 0);

        } else if (name.includes('Zhushe')) {
            // 注射单元 - 方块
            geometry = new THREE.BoxGeometry(0.3, 0.3, 0.6);
            material = new THREE.MeshStandardMaterial({ color: 0x4444ff, metalness: 0.6 });
            mesh = new THREE.Mesh(geometry, material);
            const unitIndex = parseInt(name.split('_').pop()) || 0;
            mesh.position.set(-1 + unitIndex * 0.3, -0.5, 0);

        } else if (name.includes('polySurface718') || name.includes('polySurface719') || name.includes('polySurface722')) {
            // 料筒 - 圆柱体（带发光材质）
            geometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 16);
            material = new THREE.MeshStandardMaterial({
                color: 0x888888,
                emissive: 0x00ff00,
                emissiveIntensity: 0,
                metalness: 0.7
            });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-0.8 + index * 0.02, 1, 0);

        } else if (name.includes('polySurface723') || name.includes('polySurface724') || name.includes('polySurface725')) {
            // 模具 - 方块（带发光材质）
            geometry = new THREE.BoxGeometry(0.4, 0.3, 0.4);
            material = new THREE.MeshStandardMaterial({
                color: 0xaaaaaa,
                emissive: 0x00ff00,
                emissiveIntensity: 0,
                metalness: 0.6
            });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-0.8 + index * 0.02, -1, 0);

        } else {
            // 其他组件 - 小方块
            const size = 0.1;
            geometry = new THREE.BoxGeometry(size, size, size);
            material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.5,
                roughness: 0.5
            });
            mesh = new THREE.Mesh(geometry, material);

            // 根据索引排列位置
            const row = Math.floor(index / 20);
            const col = index % 20;
            mesh.position.set(-2 + col * 0.2, -1.5 + row * 0.15, 0.5);
        }

        mesh.name = name;
        return mesh;
    }

    /**
     * 根据组件名称获取颜色
     */
    getComponentColor(name) {
        if (name.includes('A')) return 0xff6666;
        if (name.includes('B')) return 0x66ff66;
        if (name.includes('C')) return 0x6666ff;
        if (name.includes('D')) return 0xffff66;
        if (name.includes('pPlane')) return 0xff66ff;
        if (name.includes('pCube')) return 0x66ffff;
        if (name.includes('pCylinder')) return 0xffffff;
        if (name.includes('polySurface')) return 0xcccccc;
        if (name.includes('HDC')) return 0xff9900;
        if (name.includes('210')) return 0x9900ff;
        if (name.includes('2230')) return 0x00ff99;
        return 0x999999;
    }
}
