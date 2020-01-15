/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import json from 'rollup-plugin-json';
import typescriptPlugin from 'rollup-plugin-typescript2';
import replace from 'rollup-plugin-replace';
import copy from 'rollup-plugin-copy-assets';
import typescript from 'typescript';
import pkg from './package.json';
import * as path from 'path';

const deps = Object.keys(
  Object.assign({}, pkg.peerDependencies, pkg.dependencies)
);

/**
 * ES5 Builds
 */
const es5BuildPlugins = [
  typescriptPlugin({
    typescript
  }),
  json()
];

const persistenceDeps = [
  'local/indexeddb_persistence',
  'local/indexeddb_index_manager',
  'local/indexeddb_mutation_queue',
  'local/indexeddb_remote_document_cache',
  'local/indexeddb_schema',
  'local/indexeddb_target_cache',
  'local/local_serializer',
  'local/simple_db',
  'api/persistence'
].map(p => path.resolve(__dirname, 'src', p));

const es5Builds = [
  /**
   * Node.js Build
   */
  // {
  //   input: 'index.node.ts',
  //   output: [{ file: pkg.main, format: 'cjs', sourcemap: true }],
  //   plugins: [
  //     ...es5BuildPlugins,
  //     // Needed as we also use the *.proto files
  //     copy({
  //       assets: ['./src/protos']
  //     }),
  //     replace({
  //       'process.env.FIRESTORE_PROTO_ROOT': JSON.stringify('src/protos')
  //     })
  //   ],
  //   external: id =>
  //     [...deps, 'util', 'path'].some(
  //       dep => id === dep || id.startsWith(`${dep}/`)
  //     )
  // },
  // /**
  //  * Browser Builds
  //  */
  {
    input: 'index.ts',
    output: [
      { file: pkg.browser, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true }
    ],
    plugins: es5BuildPlugins,
    external: id => deps.some(dep => id === dep || id.startsWith(`${dep}/`))
  },
  /**
   * Browser Builds
   */
  {
    input: 'index.thick-client.ts',
    output: [
      { file: pkg.browserThickClient, format: 'cjs', sourcemap: true },
      { file: pkg.moduleThickClient, format: 'es', sourcemap: true }
    ],
    plugins: es5BuildPlugins,
    external: (id, referencedBy) => {
      const externalRef = path
        .resolve(path.dirname(referencedBy), id)
        .replace('.ts', '');
      if (persistenceDeps.indexOf(externalRef) !== -1) {
        throw new Error('Unexpected reference in thick client on ' + id);
      }
      return deps.some(dep => id === dep || id.startsWith(`${dep}/`));
    }
  },
  /**
   * Browser Builds
   */
  {
    input: 'index.persistence.ts',
    output: [
      { file: pkg.browserPersistence, format: 'cjs', sourcemap: true,  paths: (id) => {
          return id.startsWith(__dirname) ? 'firebase/firestore/thick-client' : '';
        }, },
      { file: pkg.modulePersistence, format: 'es', sourcemap: true,  paths: (id) => {
          return id.startsWith(__dirname) ? 'firebase/firestore/thick-client' : '';
        }, },
    ],
    plugins: es5BuildPlugins,
    external: (id, parentId) => {
      const externalRef = path.resolve(path.dirname(parentId), stripExtension(id));
      const isNotExternal = persistenceDeps.indexOf(externalRef) === -1;
      return isNotExternal;
    }
  }
];


function stripExtension(id) {
  return id.replace(/\.ts$/, "");
}
/**
 * ES2017 Builds
 */
const es2017BuildPlugins = [
  typescriptPlugin({
    typescript,
    tsconfigOverride: {
      compilerOptions: {
        target: 'es2017'
      }
    }
  }),
  json({ preferConst: true })
];

const es2017Builds = [
  // /**
  //  * Browser Build
  //  */
  // {
  //   input: 'index.ts',
  //   output: {
  //     file: pkg.esm2017,
  //     format: 'es',
  //     sourcemap: true
  //   },
  //   plugins: es2017BuildPlugins,
  //   external: id => deps.some(dep => id === dep || id.startsWith(`${dep}/`))
  // },
  // {
  //   input: 'index.thick-client.ts',
  //   output: {
  //     file: pkg.esm2017ThickClient,
  //     format: 'es',
  //     sourcemap: true
  //   },
  //   plugins: es2017BuildPlugins,
  //   external: id => deps.some(dep => id === dep || id.startsWith(`${dep}/`))
  // },
  // {
  //   input: 'index.persistence.ts',
  //   output: {
  //     file: pkg.esm2017Persistence,
  //     format: 'es',
  //     sourcemap: true
  //   },
  //   plugins: es2017BuildPlugins,
  //   external: true,
  // }
];

export default [...es5Builds, ...es2017Builds];
