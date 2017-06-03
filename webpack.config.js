var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');


var glob = require('glob');
var pathMap = require('./src/pathmap.json');
for (var name in pathMap) {
    pathMap[name] = path.resolve(__dirname, pathMap[name]);
}
;

var publicPath = "/dist/";

var entries = getEntry('./src/**/*.js');
// entries.vendors = ["./src/boot.js"];

var chunks = Object.keys(entries);

module.exports = {
    devtool: "cheap-eval-source-map",
    entry: entries,
    output: {
        filename: '[name].[chunkHash:8].js',
        publicPath: publicPath,
        path: path.resolve(__dirname, 'dist/'),
        chunkFilename: 'plugins/[name].js'
    },
    resolve: {
        extensions: ['.js', ".css"],
        alias: pathMap
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract({fallback: 'style-loader', use: 'css-loader'})
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                // 图片加载器，较小的图片转成 base64
                loader: 'url',
                query: {
                    limit: 10000,
                    name: './images/[name].[ext]?[hash:7]'
                }
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            {from: "./plugins/**/*.*"}
        ]),
        new webpack.optimize.CommonsChunkPlugin({
            names: "vendors",
            chunks: chunks,  // chunks 是需要提取的模块
            minChunks: chunks.length,
        })
        , new ExtractTextPlugin('css/[name]-[contentHash:8].css')
    ]
};
var prod = process.env.NODE_ENV === 'production';
module.exports.plugins = (module.exports.plugins || []);
if (prod) {
    module.exports.devtool = 'source-map';
    module.exports.plugins = module.exports.plugins.concat([
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new webpack.optimize.OccurenceOrderPlugin()
    ]);
} else {
    module.exports.devtool = 'eval-source-map';
}

var pages = getEntry('./src/**/*.html');
for (var pathname in pages) {
    // 配置生成的 html 文件，定义路径等
    var conf = {
        filename: pathname + '.html',
        template: pages[pathname], // 模板路径
        inject: "head",              // js 插入位置
        minify: {
            removeComments: true,
            collapseWhitespace: false
        }
    };
    if (pathname in module.exports.entry) {
        conf.chunks = ['vendors', pathname];
        conf.hash = false;
    }
    // 需要生成几个 html 文件，就配置几个 HtmlWebpackPlugin 对象
    module.exports.plugins.push(new HtmlWebpackPlugin(conf));
}

// 根据项目具体需求，输出正确的 js 和 html 路径
function getEntry(globPath) {
    var entries = {},
        basename, tmp, pathname;

    glob.sync(globPath).forEach(function (entry) {
        basename = path.basename(entry, path.extname(entry));
        tmp = entry.split('/');//.splice(-1);
        tmp.pop();
        tmp.shift();
        tmp.shift();
        pathname = (tmp.length == 0 ? "" : (tmp.join("/") + '/')) + basename; // 正确输出 js 和 html 的路径
        entries[pathname] = entry;
    });
    return entries;
}