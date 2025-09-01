/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'chart.js' {
  export * from 'chart.js/auto'
  export { default } from 'chart.js/auto'
}
