# ui-extract-webpack-plugin

## Installation

```shell
$ npm install ui-extract-webpack-plugin --save
```

## Usage

```javascript
const UiExtractPlugin = require('ui-extract-webpack-plugin');

module.exports = {
  // ...
  plugins: [
    new UiExtractPlugin(options),
    // ...
  ],
};
```

## Options

### context

* Type: `String`
* Default: `undefined`

源代码目录绝对路径

## License

[MIT](https://github.com/Oc-master/ui-extract-webpack-plugin/blob/master/LICENSE)
