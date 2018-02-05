const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ChunkManifestPlugin = require('chunk-manifest-webpack-plugin')
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

const pkg = require('./package.json')

const isProd = process.env.NODE_ENV === 'production'
const isDev = !isProd
const doViz = process.env.VIZ !== undefined
console.log(`Build type: [${isProd ? "production" : "development"}]`)
console.log(`Emitting bundle analysis? [${doViz ? "yes" : "no"}]`)

// Default exports
module.exports = {
  entry: {
    app: "./src/ts/main.ts",
  },
  recordsOutputPath: path.join(__dirname, "records.json"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `[name].${isProd ? "[chunkhash]" : "[hash]"}.js`,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ],
      },
      {
        test: /\.sass$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader?indentedSyntax'
        ],
      },
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader'
        ],
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          appendTsSuffixTo: [/\.vue$/],
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  plugins: [
    new HardSourceWebpackPlugin({
      configHash: function(webpackConfig) {
        return require('node-object-hash')({sort: false}).hash({
          webpackConfig,
          isProd,
          doViz,
        })
      }
    }),
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      title: "dib",
      template: "src/templates/index.ejs",
      hash: true,
      cache: true,
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: function(module) {
        return module.context && module.context.includes("node_modules")
      },
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'borc',
      minChunks: function(module) {
        return module.context && module.context.includes("borc")
      },
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      minChunks: Infinity,
    }),
  ],
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      comp: path.resolve(__dirname, "./src/components/"),
      types: path.resolve(__dirname, "./src/ts/types/"),
      utils: path.resolve(__dirname, "./src/ts/utils/"),
      ts: path.resolve(__dirname, "./src/ts/"),
      styles: path.resolve(__dirname, "./src/styles/"),
    },
    extensions: ['.ts', '.js', '.vue', '.json'],
  },
  performance: {
    hints: false
  },
  devtool: "cheap-module-eval-source-map",
}

// Production only
if (isProd) {
  module.exports.devtool = "none"
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new UglifyJsPlugin({
      exclude: /borc/, // Uglify breaks asm.js
      sourceMap: false,
      parallel: true,
      cache: true,
      uglifyOptions: {
        ecma: 8,
        mangle: {
          keep_classnames: true,
        },
        compress: {
          keep_classnames: true,
        }
      },
    }),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
// Development only
if (isDev) {
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ])
}

// Visualize bundle outputs
if (doViz) {
  let BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  module.exports.plugins = (module.exports.plugins || []).concat([
    new BundleAnalyzerPlugin({
      type: "static"
    })
  ])
}