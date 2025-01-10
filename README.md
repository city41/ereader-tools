# E-Reader Tools

Tools for developing applications for the Nintendo GBA E-Reader.

This is a port of CaitSith2's [ereader tools](https://caitsith2.com/ereader/devtools.htm) to NodeJS.

## Goals

- Entirely written in TypeScript
- Full support for everything CaitSith2's tools do
- Improvements and additions, such as raw to svg
- well documented and tested

## Why?

- Generally non-native tools are easier to work with.
- Support actions in the eventual VSCode Ereader extension I plan to make.
- Support the eventual web version of these tools.
- Print out more accurate dotcode strips that more closely match Nintendo's

# Status

Very alpha. So far only `compress-vpk` and `convert-raw` exist and both are quite raw (no pun intended). Not recommended for general usage yet.

# To Use

```bash
npm install --global @city41/ereader-tools
compress-vpk --input myGame.bin --output myGame.vpk
convert-raw --input myGame.raw --output myGame
convert-raw --input myGame.raw --output myGame --format bmp
convert-raw --input myGame.raw --output myGame --format bmp --dpi 600
convert-raw --input myGame.raw --output myGame --format png
```

## convert-raw

`convert-raw` is this toolset's equivalent to `raw2bmp`. It is currently in a transition/experimental phase and not recommended for use. For now I recommend sticking with `raw2bmp`. Ultimately I am very hopeful that `convert-raw` will create images that scan more reliably than the ones created by `raw2bmp` and match Nintendo's original dotstrips more closely, if not perfectly.

### bmp

If you specify `--format bmp`, it will produce MS bitmap files identical to raw2bmp. It supports the same dpi's too: 300, 600, 1200 and 2400, specified with `--dpi <dpi>`.

To create bmps, it is doing the exact same steps as `raw2bmp` does. There also integration tests to verify the output matches `raw2bmp`.

### png

If you specify `--format png`, then only 300 dpi is supported. This is not a useful output, 300 dpi almost certainly will not scan in an E-Reader. This really exists to help ensure the svg implementation is correct.

### svg

Long term, this will be the main output format and likely the only supported format. With svg, `--dpi` is not supported. The resulting svg image can be scaled to any size needed, so dpi is irrelevant.

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
