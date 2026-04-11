import fs from 'fs';
let c = fs.readFileSync('packages/core/src/i18n.svelte.ts', 'utf8');

c = c.replace(/'zh-CN': \{/, "'zh-CN': {\n    'common.list': '列表',\n    'common.prev': '上一页',\n    'common.pageOf': '第 {page} 页，共 {total} 页',\n    'common.areYouSure': '确认操作？',\n    'common.backToList': '返回列表',\n    'common.refresh': '刷新',\n    'common.importData': '导入数据',\n    'common.upload': '上传',\n    'common.returnHome': '返回首页',");

c = c.replace(/'en': \{/, "'en': {\n    'common.list': 'List',\n    'common.prev': 'Prev',\n    'common.pageOf': 'Page {page} of {total}',\n    'common.areYouSure': 'Are you sure?',\n    'common.backToList': 'Back to List',\n    'common.refresh': 'Refresh',\n    'common.importData': 'Import data',\n    'common.upload': 'Upload',\n    'common.returnHome': 'Return to Home',");

fs.writeFileSync('packages/core/src/i18n.svelte.ts', c);
