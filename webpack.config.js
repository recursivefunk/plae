const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const pathsToClean = ['dist']

const config = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'plae.js'
  },
  mode: process.env.NODE_ENV === 'production' ? 'production': 'development',
  module: {
    rules: [
      {
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    // cleanup
    new CleanWebpackPlugin(pathsToClean),
    // copy soundmanager over to dist
    new CopyWebpackPlugin([
      { from: './swf/*.swf', to: '.' },
      { from: './web/*.html', to: '.', flatten: true },
      { from: './sound/*.mp3', to: '.' }
    ], { debug: 'debug' })
  ]
}

module.exports = config
