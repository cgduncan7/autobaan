// rollup.config.js
import path from 'path'

import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import natives from 'rollup-plugin-natives'

export default {
  input: path.resolve('src/server/index.ts'),
  output: {
    file: './dist/server/index.cjs',
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [
    typescript(),
    natives({
      copyTo: 'dist/libs',
      destDir: '../libs',
      dlopen: false,
      sourcemap: true,
    }),
    commonjs(),
    nodeResolve(),
  ],
}
