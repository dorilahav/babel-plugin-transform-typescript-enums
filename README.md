# babel-plugin-transform-typescript-enums
[![Tests](https://github.com/dorilahav/babel-plugin-transform-typescript-enums/actions/workflows/run-tests.yml/badge.svg)](https://github.com/dorilahav/babel-plugin-transform-typescript-enums/actions/workflows/run-tests.yml)

TypeScript enums can be very frasturating to deal with.
This package gives more control over how babel transpiles TypeScript enums.

## Prerequisites
Make sure you are using `@babel/core` version 7+. Previous versions might work, but are not supported.
## Installation
Using npm:
```
npm i -D babel-plugin-transform-typescript-enums
```
Or, using yarn:
```
yarn add -D babel-plugin-transform-typescript-enums
```

## Usage
#### Via `.babelrc` (Recommended)
```json
{
  "plugins": ["transform-typescript-enums"]
}
```

Please note that if you are using [`@babel/plugin-transform-typescript`](https://babeljs.io/docs/en/babel-plugin-transform-typescript) along with this plugin you will need to put `transform-typescript-enums` in a higher order, before the TypeScript plugin, E.g:
```json
{
  "plugins": ["transform-typescript-enums", "@babel/plugin-transform-typescript"]
}
```
If you are using [`@babel/preset-typescript`](https://babeljs.io/docs/en/babel-preset-typescript) this is not relevant because in babel, plugins run before presets.
#### Via CLI
With [`@babel/preset-typescript`](https://babeljs.io/docs/en/babel-preset-typescript):
```sh
# Order of presets and plugins doesn't matter.

babel --presets @babel/preset-typescript --plugins transform-typescript-enums script.js
```
Or with [`@babel/plugin-transform-typescript`](https://babeljs.io/docs/en/babel-plugin-transform-typescript):
```sh
# Notice that it comes before the @babel/plugin-transform-typescript plugin.

babel --plugins transform-typescript-enums,@babel/plugin-transform-typescript script.js
```

## Configuration
This plugin gives you more control over transpiling your enums.
As you may know, TypeScript enums gets converted to JavaScript objects at runtime, and sometimes we might want to change how it's done.

### ```reverseMap (default undefined)```
If you are unfamiliar with TypeScript enums reverse mapping, you can [read about it in the official TypeScript documentation](https://www.typescriptlang.org/docs/handbook/enums.html#reverse-mappings).
In short, enum reverse mapping lets you access enum values using their keys and enum keys using their values, a bi-directional behavior.

The `reverseMap` configuration option offers more control over how and whether enums should be reverse mapped. By default, TypeScript string enum entries (enum entries with string values) are not being reverse-mapped while numeric enum entires are. This option will let you decide yourself.

```reverseMap: undefined (or just don't specify)```

Just like TypeScript's default behavior, will transform string enum entries into a non-reverse mapped enum object and numeric enums into a reverse mapped enum object.

Consider the following TypeScript inputs:
```ts
enum ColorString {
  Red = 'red',
  Yellow = 'yellow'
}

enum ColorNumeric {
  Red = 1,
  Yellow = 2
}
```
The above code snippet will be transformed into the following JavaScript output:
```js
var ColorString;

(function (ColorString) {
  ColorString["Red"] = "red";
  ColorString["Yellow"] = "yellow";
})(ColorString || (ColorString = {}));

var ColorNumeric;

(function (ColorNumeric) {
  ColorNumeric[ColorNumeric["Red"] = 1] = "Red";
  ColorNumeric[ColorNumeric["Yellow"] = 2] = "Yellow";
})(ColorNumeric || (ColorNumeric = {}));
```
Or, to simplify:
```js
const ColorString = {
  Red: 'red',
  Yellow: 'yellow'
}

const ColorNumeric = {
  1: 'Yellow',
  2: 'Red',
  Red: 2,
  Yellow: 1
}
```

```reverseMap: true```

Will forcefully enable reverse mapping for all enum value types.

**IMPORTANT NOTE**<br/>This is not supported by TypeScript, use it only if you know what you are doing.
It might cause some values to override each other (for example, when using objects as enum values).

Consider the following TypeScript inputs:
```ts
enum ColorString {
  Red = 'red',
  Yellow = 'yellow'
}

enum ColorNumeric {
  Red = 1,
  Yellow = 2
}
```
The above code snippet will be transformed into the following JavaScript output:
```js
var ColorString;

(function (ColorString) {
  ColorString[ColorString["Red"] = "red"] = "Red";
  ColorString[ColorString["Yellow"] = "yellow"] = "Yellow";
})(ColorString || (ColorString = {}));

var ColorNumeric;

(function (ColorNumeric) {
  ColorNumeric[ColorNumeric["Red"] = 1] = "Red";
  ColorNumeric[ColorNumeric["Yellow"] = 2] = "Yellow";
})(ColorNumeric || (ColorNumeric = {}));
```
Or, to simplify:
```js
const ColorString = {
  Red: 'red',
  Yellow: 'yellow',
  red: 'Red',
  yellow: 'Yellow'
}

const ColorNumeric = {
  1: 'Red',
  2: 'Yellow',
  Red: 1,
  Yellow: 2
}
```

```reverseMap: false```

Will disable reverse mapping completely, for all entry types.

Consider the following TypeScript inputs:
```ts
enum ColorString {
  Red = 'red',
  Yellow = 'yellow'
}

enum ColorNumeric {
  Red = 1,
  Yellow = 2
}
```
The above code snippet will be transformed into the following JavaScript output:
```js
var ColorString;

(function (ColorString) {
  ColorString["Red"] = "red";
  ColorString["Yellow"] = "yellow";
})(ColorString || (ColorString = {}));

var ColorNumeric;

(function (ColorNumeric) {
  ColorNumeric["Red"] = 1;
  ColorNumeric["Yellow"] = 2;
})(ColorNumeric || (ColorNumeric = {}));
```
Or, to simplify:
```js
const ColorString = {
  Red: 'red',
  Yellow: 'yellow'
}

const ColorNumeric = {
  Red: 1,
  Yellow: 2
}
```