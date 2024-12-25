# E-Reader Tools

Tools for developing applications for the Nintendo GBA E-Reader.

This is a port of CaitSith2's [ereader tools](https://caitsith2.com/ereader/devtools.htm) to NodeJS.

## Goals

- Entirely written in JavaScript
- Full support for everything CaitSith2's tools do
- well documented and tested

## Why?

- Generally non-native tools are easier to work with.
- Support actions in the eventual VSCode Ereader extension I plan to make.
- Support the eventual web version of these tools.

# Status

Brand new. So far only `compress-vpk` exists and so far it can only do a very simple compression.

# To Use

```bash
npm install --global @city41/ereader-tools
compress-vpk --input myGame.bin --output myGame.vpk
```

# Development

## Publishing

ereader-tools uses [semantic versioning](https://semver.org/)

Publishing a new version is done by bumping the version in package.json

```bash
yarn version
yarn version v1.22.19
info Current version: 0.4.0
question New version: 0.4.1
info New version: 0.4.1
Done in 16.19s.

git push
git push --tags
```

Once [the Publish action](https://github.com/city41/ereader-tools/actions/workflows/publish.yml) notices the version has changed, it will run a build and publish to npm.
