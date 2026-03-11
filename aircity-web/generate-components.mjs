/**
 * 完整组件名称列表生成器
 * 从 all-components.txt 读取所有 379 个组件名称
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取所有组件名称
const componentsFile = join(__dirname, '..', 'all-components.txt');
const allComponentNames = readFileSync(componentsFile, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

console.log(`总共 ${allComponentNames.length} 个组件`);
console.log('\n按类型分类：');

// 分类统计
const categories = {
    '螺杆 (Zhushezhen)': allComponentNames.filter(n => n.includes('Zhushezhen')),
    '注射单元 (Zhushe)': allComponentNames.filter(n => n.includes('Zhushe')),
    '料筒/模具 (polySurface718-725)': allComponentNames.filter(n =>
        n.includes('polySurface718') || n.includes('polySurface719') ||
        n.includes('polySurface722') || n.includes('polySurface723') ||
        n.includes('polySurface724') || n.includes('polySurface725')
    ),
    'A 系列': allComponentNames.filter(n => /^mechine_1_A[^n]/.test(n)),
    'B 系列': allComponentNames.filter(n => /^mechine_1_B/.test(n)),
    'C 系列': allComponentNames.filter(n => /^mechine_1_C/.test(n)),
    'D 系列': allComponentNames.filter(n => /^mechine_1_D/.test(n)),
    'pPlane 系列': allComponentNames.filter(n => n.includes('pPlane')),
    'pCube 系列': allComponentNames.filter(n => n.includes('pCube')),
    'pCylinder 系列': allComponentNames.filter(n => n.includes('pCylinder')),
    'polySurface 其他': allComponentNames.filter(n =>
        n.includes('polySurface') &&
        !n.includes('polySurface718') && !n.includes('polySurface719') &&
        !n.includes('polySurface722') && !n.includes('polySurface723') &&
        !n.includes('polySurface724') && !n.includes('polySurface725')
    ),
    '其他': allComponentNames.filter(n =>
        !n.includes('Zhushezhen') && !n.includes('Zhushe') &&
        !n.includes('polySurface') && !/^mechine_1_[ABCD]/.test(n) &&
        !n.includes('pPlane') && !n.includes('pCube') && !n.includes('pCylinder')
    )
};

Object.entries(categories).forEach(([category, components]) => {
    console.log(`  ${category}: ${components.length} 个`);
});

// 生成 JavaScript 数组代码
console.log('\n\n生成的 JavaScript 代码：\n');
console.log('export const ALL_COMPONENT_NAMES = [');
allComponentNames.forEach((name, index) => {
    const comma = index < allComponentNames.length - 1 ? ',' : '';
    console.log(`    '${name}'${comma}`);
});
console.log('];');
