import type { Theme } from 'unocss/preset-uno'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig<Theme>({
  extendTheme: [
    (theme) => {
      const animation: Theme['animation'] = Object.assign(theme.animation ?? {}, {
        keyframes: {
          'blink-text-cursor': '{from{border-right-color: currentColor;}to{border-right-color:transparent;}}',
          'wave-hands': `{0%{transform:rotate(0.0deg)}10%{transform:rotate(14.0deg)}20%{transform:rotate(-8.0deg)}30%{transform:rotate(14.0deg)}40%{transform:rotate(-4.0deg)}50%{transform:rotate(10.0deg)}60%{transform:rotate(0.0deg)}100%{transform:rotate(0.0deg)}}`,
        },
      })

      return { ...theme, animation }
    },
  ],
  shortcuts: [
    {
      'lodash-effect': [
        'relative after:absolute after:content-empty after:h-1 after:w-full after:bottom-0 after:left-0 ',
        'after:scale-0 hover:after:scale-100 after:transition-transform after:origin-l',
      ].join(' '),
    },
  ],
  safelist: ['i-ri:file-copy-fill', 'i-ri:check-fill'],
  presets: [
    presetUno(),
    presetIcons(),
    presetAttributify(),
    presetTypography({
      cssExtend: {
        'h1,h2,h3,h4,h5,h6': {
          'font-weight': '500',
          'position': 'relative',
        },
        'p,ul,ol,pre': {
          'font-size': '0.9375rem',
        },
        'p:has(> img)': {
          'display': 'flex',
          'justify-content': 'center',
        },
        'details': {
          'border-radius': '0.125rem',
        },
        ':not(pre) > code::before,:not(pre) > code::after': {
          content: '" "',
        },
      },
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
})
