const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: "./src/ts/main.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: '/dist/',
    filename: "bundle.js",
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
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
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
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
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

  devtool: "eval-source-map",
  devServer: {
    historyApiFallback: true,
    noInfo: true,
    overlay: true,
    contentBase: './dist',
  },
}

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = "source-map"
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}