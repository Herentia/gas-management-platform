import { globalIgnores } from 'eslint/config'
import {
  defineConfigWithVueTs,
  vueTsConfigs,
  configureVueProject,
} from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import path from 'node:path'

// 启用高级配置
configureVueProject({
  scriptLangs: ['ts', 'tsx'],
  rootDir: path.resolve(import.meta.dirname),
  allowComponentTypeUnsafety: true,
})

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  globalIgnores([
    '&zwnj;**/dist/**&zwnj;',
    '&zwnj;**/dist-ssr/**&zwnj;',
    '&zwnj;**/coverage/**&zwnj;',
  ]),
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommendedTypeChecked, // 使用类型检查版本
  skipFormatting,
  {
    rules: {
      // 环境敏感规则
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
)
