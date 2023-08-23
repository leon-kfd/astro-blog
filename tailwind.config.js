module.exports = {
  content: ['./src/**/*.{astro,html,svelte,vue,js,ts,jsx,tsx}'],
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ["HarmonyOS_Regular", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", "sans-serif"],
      }
    }
  },
  daisyui: {
    themes: [
      'night',
      'winter',
    ]
  }
}
