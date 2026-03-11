/**
 * 真实机器模型加载器 - 从 GLB 文件加载
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * 加载真实的机器模型（从 UE4 导出的 GLB）
 */
export function loadRealMachineModel() {
    return new Promise((resolve, reject) => {
        console.log('[Model] 🚀 开始加载真实机器模型 (30MB GLB)...');

        const loader = new GLTFLoader();
        let lastLogTime = Date.now();
        let progressLogged = false;

        // 添加30秒超时
        const timeout = setTimeout(() => {
            console.error('[Model] ❌ 加载超时（30秒），GLTFLoader可能卡在解析阶段');
            reject(new Error('加载超时'));
        }, 30000);

        loader.load(
            '/models/machine.glb',
            (gltf) => {
                clearTimeout(timeout);
                console.log('[Model] ✅ GLB 文件解析成功！');

                const machineGroup = gltf.scene;
                machineGroup.name = 'machine01';
                machineGroup.userData = {
                    type: 'BP_Machine',
                    deviceId: 'machine01'
                };

                // 遍历所有子对象，统计组件
                let componentCount = 0;
                const componentNames = [];
                machineGroup.traverse((child) => {
                    if (child.isMesh) {
                        componentCount++;
                        componentNames.push(child.name);
                    }
                });

                console.log(`[Model] ✅ 模型解析完成: ${componentCount} 个组件`);
                console.log(`[Model] 📋 前20个组件名称:`, componentNames.slice(0, 20));

                // 调整模型位置和缩放
                machineGroup.position.set(0, 0, 0);
                machineGroup.scale.set(1, 1, 1);

                console.log('[Model] ✅ 模型已准备就绪');
                resolve(machineGroup);
            },
            (progress) => {
                const now = Date.now();
                // 每500ms打印一次进度
                if (now - lastLogTime > 500 || !progressLogged) {
                    if (progress.lengthComputable) {
                        const percent = (progress.loaded / progress.total * 100).toFixed(1);
                        const loadedMB = (progress.loaded / 1024 / 1024).toFixed(2);
                        const totalMB = (progress.total / 1024 / 1024).toFixed(2);
                        console.log(`[Model] 📥 下载进度: ${percent}% (${loadedMB}MB / ${totalMB}MB)`);

                        // 下载完成后提示正在解析
                        if (progress.loaded >= progress.total) {
                            console.log('[Model] 📦 下载完成，正在解析GLB文件...');
                        }

                        progressLogged = true;
                    } else {
                        const loadedMB = (progress.loaded / 1024 / 1024).toFixed(2);
                        console.log(`[Model] 📥 已下载: ${loadedMB}MB (总大小未知)`);
                        progressLogged = true;
                    }
                    lastLogTime = now;
                }
            },
            (error) => {
                clearTimeout(timeout);
                console.error('[Model] ❌ GLB 文件加载失败:', error);
                console.error('[Model] 错误详情:', error.message);
                reject(error);
            }
        );
    });
}

/**
 * 创建占位模型（备用方案）
 */
export function createPlaceholderModel() {
    console.log('[Model] 使用占位模型');

    const machineGroup = new THREE.Group();
    machineGroup.name = 'machine01';
    machineGroup.userData = {
        type: 'BP_Machine',
        deviceId: 'machine01'
    };

    // 创建简单的占位几何体
    const bodyGeometry = new THREE.BoxGeometry(4, 2, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.name = 'MachineBody';
    machineGroup.add(body);

    return machineGroup;
}
