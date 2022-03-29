// rollup.config.js
import path from 'path'

import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
  input: path.join(__dirname, 'index.ts'),
  output: {
    file: './dist/reservationRequestor/index.js',
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [typescript({ module: 'esnext' }), nodeResolve(), commonjs()],
}
