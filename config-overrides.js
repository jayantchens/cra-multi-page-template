const { override } = require('customize-cra');
const paths = require('react-scripts/config/paths');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const env = process.env.NODE_ENV || 'development' // 环境变量

function setIndexConfig() {
  // 自动设置首页的入口
  paths.appHtml = `${paths.appSrc}/pages/index/index.html`;
  paths.appIndexJs = `${paths.appSrc}/pages/index/index.js`;
  // paths.servedPath = './';
}
setIndexConfig();

function getEntryConfig(env) {
  const setHotDev = 'development' === env ? [require.resolve('react-dev-utils/webpackHotDevClient')] : [];
  return entry => {
    return [...setHotDev, `${paths.appSrc}/pages/${entry}/index.js`];
  };
}

function removePlugin (plugins, name) {
  // HtmlWebpackPlugin
  const list = plugins.filter(it => !(it.constructor && it.constructor.name && name === it.constructor.name));
  if (list.length === plugins.length) {
    throw new Error(`Can not found plugin: ${name}.`);
  }
  return list;
};

const getHtmlWebpackPlugin = env => {
  const minify = {
    removeComments: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    useShortDoctype: true,
    removeEmptyAttributes: true,
    removeStyleLinkTypeAttributes: true,
    keepClosingSlash: true,
    minifyJS: true,
    minifyCSS: true,
    minifyURLs: true,
  };
  const config = Object.assign(
    {},
    { inject: true },
    'development' !== env ? { minify } : undefined,
  );
  return entry => {
    return new HtmlWebpackPlugin({
      ...config,
      template: `${paths.appSrc}/pages/${entry}/index.html`,
      chunks: [entry],
      filename: `${entry}.html`,
    });
  };
};


function getPagesEntryDir() {
  let pagesNamekeys = []
  const pagesPath = paths.appSrc + '/pages';
  const files = fs.readdirSync(pagesPath);
  files.forEach(function (item, index) {
      let stat = fs.lstatSync(pagesPath + `/${item}`)
      if (stat.isDirectory() === true) { 
        pagesNamekeys.push(item)
      }
  })
  return pagesNamekeys;
}

function supportMultiPage (config, envs) {
  const pageLists = getPagesEntryDir();
  config.entry = {};
  config.plugins = removePlugin(config.plugins, 'HtmlWebpackPlugin');
  const getEntry = getEntryConfig(env);
  const htmlWebpackPlugin = getHtmlWebpackPlugin(env);
  pageLists.forEach(entryName => {
    config.entry[entryName] = getEntry(entryName);
    config.plugins.push(htmlWebpackPlugin(entryName));
    
  });  
  if ('development' === env) {
    config.output.filename = 'static/js/[name].bundle.js';
  } else {
    config.output.filename = 'static/js/[name].[contenthash:8].js'
  }
  return config;
};

function replacePlugin (plugins, nameMatcher, newPlugin) {
  const pluginIndex = plugins.findIndex((plugin) => {
    return plugin.constructor && plugin.constructor.name && nameMatcher(plugin.constructor.name);
  });
  if (pluginIndex === -1) return plugins;
  // plugins.slice(0, pluginIndex).concat(newPlugin).concat(plugins.slice(pluginIndex + 1)); 数组拼接方式
  plugins.splice(pluginIndex, 1, newPlugin);
  return plugins;
};

function fixManifest(config) {
  const multiEntryManfiestPlugin = new ManifestPlugin({
    fileName: 'asset-manifest.json',
    publicPath: '/',
    generate: (seed, files, entrypoints) => {
      const manifestFiles = files.reduce((manifest, file) => {
        manifest[file.name] = file.path;
        return manifest;
      }, seed);

      const entrypointFiles = {};
      Object.keys(entrypoints).forEach(entrypoint => {
        entrypointFiles[entrypoint] = entrypoints[entrypoint].filter(fileName => !fileName.endsWith('.map') && !fileName.endsWith('.hot-update.js'));
      });

      return {
        files: manifestFiles,
        entrypoints: entrypointFiles,
      };
    },
  });

  config.plugins = replacePlugin(config.plugins, (name) => /ManifestPlugin/i.test(name), multiEntryManfiestPlugin);
  return config
}


module.exports = {
  webpack: override(
    supportMultiPage,
    fixManifest
  ),
  devServer: configFunction => {
    return (proxy, allowedHost) => {
      const config = configFunction(proxy, allowedHost);
      config.index = 'index.html';
      config.openPage = 'index.html';
      config.historyApiFallback.rewrites = [{ from: /^\/user/, to: '/user.html' }, { from: /^\/main/, to: '/index.html' }];
      return config;
    };
  },
}