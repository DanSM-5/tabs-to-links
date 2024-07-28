Tabs 2 Links
=========

## Description

Tabs to links is simple extension to filter and copy links from your favorite web browser.

It aims to simplify the copying process by building a friendly UI which lists all the sites currently open and allow simple operations for filtering, removal, copying and save (save to a file).

# Features

- List current window or all windows.
- Allow copying individual urls by clicking the site icon.
- Batch copy all links.
- Batch download all links.
- Filter links using the search box (simple filter and regex).
- Individual links removal.

# Roadmap

- Open links: Allow to open links from the UI 

# Installation

## Download from the store

### Firefox

Download from [Mozilla Addons](https://addons.mozilla.org/en-US/firefox/addon/tabs-2-links).

### Chrome and chromium browsers

Download from [Chrome Store](https://chromewebstore.google.com/detail/tabs-2-links/anfojdbbkhnidglkmcblgglfgnmenknd)

## Install from source

- Clone the repository somewhere in your file system.
```bash
git clone https://github.com/DanSM-5/tabs-to-links
```
- Follow the documentation of your browser to load extensions.
- Search for the directory of the repository in your computer and select the `manifest.json` file. The application should be able to load from the root directory.
  - It is possible to build for a specific browser and load the directory under `tmp`.

## Environment setup

The scripts to build are `bash` scripts which require a bash shell available. This should be already available in most linux distrubtions. On windows you can use the **git bash shell** that is installed along with git for windows. To enable `npm` to work with the bash shell in windows run `npm run set-shell`.

## Creating a zip

The repository has a helper script to package the extensions for `Chrome` and `Firefox`.

```bash
./helpers/build.sh [firefox|chrome]
```

There is a convenience npm script in the package.json that can be used intead.

```
npm run build [firefox|chrome]
```

Additionaly there is a `build-all.sh` build script

```bash
./helpers/build-all.sh
```

and `build:all` npm script to build for all browsers in a single command.

```bash
npm run build:all
```

# What's different between Chrome and Firefox?

In functionality? Nothing really. I created a different build for chrome just to support manifest v3 and get rid of the annoying warning. You could potentially use any build on any browser and it should work fine as long as it supports the manifest version.
