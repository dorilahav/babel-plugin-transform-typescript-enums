import {transformSync} from '@babel/core';
import fs from 'fs';
import path from 'path';
import plugin from '../src';

const inputFileName = 'input.ts';
const outputFileName = 'output.js';
const optionsFileName = 'options.json';

const getTestDirectoriesRecursively = (currentDirectory, testDirectories) => {
  const files = fs.readdirSync(currentDirectory);

  if (files.includes(inputFileName)) {
    const inputFilePath = path.join(currentDirectory, inputFileName);

    if (fs.statSync(inputFilePath).isFile()) {
      testDirectories.push(currentDirectory);
    }
  }

  files.map(child => path.join(currentDirectory, child))
    .filter(child => fs.statSync(child).isDirectory())
    .forEach(childDirectory => {
      getTestDirectoriesRecursively(childDirectory, testDirectories);
    });

  return testDirectories;
}

const getTestDirectories = baseDirectory => getTestDirectoriesRecursively(baseDirectory, []);

const getFileContent = filePath => {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  return fs.readFileSync(filePath, 'utf-8').toString();
}

const getTestOptions = directory => {
  const optionsFilePath = path.join(directory, optionsFileName);
  const optionsContent = getFileContent(optionsFilePath);

  return optionsContent ? JSON.parse(optionsContent) : {};
}

const getTestInput = directory => {
  const inputFilePath = path.join(directory, inputFileName);

  return getFileContent(inputFilePath);
}

const getTestOutput = directory => {
  const outputFilePath = path.join(directory, outputFileName);

  return getFileContent(outputFilePath);
}

const transform = (input, options) => transformSync(input, {plugins: [[plugin, options]]})?.code;

const trim = string => string.replace(/\s/g, "");

const testInputOutputCase = directory => {
  const options = getTestOptions(directory);
  const input = getTestInput(directory);
  const expectedOutput = getTestOutput(directory);
  const output = transform(input, options);

  test(directory, () => {
    expect(trim(output)).toBe(trim(expectedOutput));
  });
}

export const testInputOutputCases = baseDirectory => {
  const testDirectories = getTestDirectories(baseDirectory);
  
  for (const testDirectory of testDirectories) {
    testInputOutputCase(testDirectory);
  }
}