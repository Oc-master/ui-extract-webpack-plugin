const fs = require('fs');
const path = require('path');
const glob = require('glob');
const dayjs = require('dayjs');
const chalk = require('chalk');
const replaceExt = require('replace-ext');
const { outputFileSync } = require('fs-extra');

class UiExtractPlugin {
  constructor(options) {
    const { context = '' } = options;
    this.context = context;
    this.uiContext = path.resolve(this.context, 'libs/vant');
  }

  apply(compiler) {
    compiler.hooks.entryOption.tap('UiExtractPlugin', () => {
      const uiDependency = this.getUIDependency();
      const { length } = uiDependency;
      if (length) {
        const necessaryModule = ['common', 'mixins', 'wxs'];
        necessaryModule.forEach((item) => this.copyFiles(path.resolve(this.uiContext, item)));
        uiDependency.forEach((item) => {
          const entries = [];
          this.addEntries(this.context, item, entries);
          entries.forEach((entry) => this.copyFiles(entry));
        });
      }
    });
  }

  getUIDependency() {
    const files = glob.sync(`${this.context}/**/*.json`);
    const { length } = files;
    if (!length) return [];
    const uiDependency = files.reduce((acc, item) => {
      try {
        const content = fs.readFileSync(item, { encoding: 'utf-8' });
        const { usingComponents = {} } = JSON.parse(content);
        const components = Object.values(usingComponents);
        const { length: componentsLength } = components;
        if (!componentsLength) return acc;
        const temp = components.filter((component) => (component.includes('vant') || component.includes('iview')));
        return [...acc, ...temp];
      } catch(e) {
        return acc;
      }
    }, []);
    return uiDependency;
  }

  /**
   * 生成当前模块相对于源代码上下文的相对路径
   * @param {String} moduleContext 模块路径上下文
   * @param {String} modulePath 模块路径
   */
  transformRelative(moduleContext, modulePath) {
    const isAbsolute = modulePath.charAt(0) === '/';
    const absolutePath = isAbsolute ? path.resolve(moduleContext, modulePath.slice(1)) : path.resolve(moduleContext, modulePath);
    const relativePath = path.relative(this.context, absolutePath);
    return relativePath;
  }

  /**
   * 收集单一模块所依赖的其他模块，用来生成入口数组
   * @param {String} context 模块路径的上下文
   * @param {String} modulePath 模块路径
   * @param {Array}} entries 入口数组
   */
  addEntries(context, modulePath, entries) {
    const relativePath = this.transformRelative(context, modulePath);
    const jsonFile = replaceExt(relativePath, '.json');
    const jsonPath = path.resolve(this.context, jsonFile);
    const moduleContext = path.dirname(jsonPath);
    entries.push(moduleContext);
    try {
      const content = fs.readFileSync(jsonPath,{ encoding: 'utf-8' });
      const { usingComponents = {} } = JSON.parse(content);
      const components = Object.values(usingComponents);
      const { length } = components;
      if (length) {
        components.forEach((component) => this.addEntries(moduleContext, component, entries));
      }
    } catch (e) {
      console.log(chalk.gray(`[${dayjs().format('HH:mm:ss')}]`), chalk.red(`ERROR: "${jsonFile}" 文件内容读取失败`));
    }
  }

  copyFiles(modulePath) {
    const filePathList = glob.sync(`${modulePath}/**/*`);
    filePathList.forEach((item) => {
      const stat = fs.statSync(item);
      if (stat.isFile()) {
        const data = fs.readFileSync(item);
        outputFileSync(item.replace('src', 'dist'), data);
      }
    });
  }

  getUiContext() {
    const dirList = fs.readdirSync(this.context);
  }
}

module.exports = UiExtractPlugin;
