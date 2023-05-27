
// Cases where the chrome object is used it preceded by the comment:
// [Chrome Specific] - [FireFox support]
// This extension works fine in both browsers with minimal css differences.
// Chrome manifest: v3
// Firefox manifest: v2

// TODO: Add a top level browser class fix incompatibility in css,
// and merge master and master-firefox together

// TODO: Consider a build script. Firefox and chrome cannot use same
// manifest as chrome does not support "browser_specific_settings"
// and will throw an exception if this is present.

(_ => {
  // HTML Elements
  const allWindowsCheckbox = document.querySelector("#all-windows");
  const allWindowsBtn = document.querySelector("#all-windows-btn");
  const searchBox = document.querySelector("#search-box");
  const searchBtn = document.querySelector("#search-btn");
  const resetBtn = document.querySelector("#reset-btn");
  const downloadBtn = document.querySelector("#download-btn");
  const copyBtn = document.querySelector("#copy-btn");
  const txtArea = document.querySelector("#txt-box");
  const TAG = "[Tabs2Links]";
  const defaultIcon = "../img/question.png";
  const DEBOUNCE_SEARCH_MS = 300;
  const UNSET_TIMER_REF = -1;
  // Constants
  const [
    BLUR,
    CLICK,
    LOAD,
    ERROR,
    HIDE,
    REMOVE,
    ADD,
    KEYUP,
    SPAN,
    BUTTON,
    DIV,
    LI,
    UL,
    A,
    STYLE,
    CHROME,
    FIREFOX,
    EMPTY,
    EDITABLE,
    DOWNLOAD_MIME,
  ] = [
    "blur",
    "click",
    "load",
    "error",
    "hide",
    "remove",
    "add",
    "keyup",
    "span",
    "button",
    "div",
    "li",
    "ul",
    "a",
    "style",
    "chrome",
    "firefox",
    "",
    "contenteditable",
    "data:text/plain;charset=utf-8," 
  ];
  // CSS Selectors
  const [
    ALL_ROWS,
    VISIBLE_ROWS,
    VISIBLE_LINKS,
    COPY_BUTTON,
    REMOVE_BUTTON,
  ] = [
    ".row-link",
    ".row-link:not(.hide)",
    ".row-link:not(.hide) span",
    ".button-wrapper:first-child",
    ".button-wrapper:last-child",
  ];
  // CSS Clases
  const [
    ROW_LINK,
    TAB_ICON,
    CLOSE_BUTTON,
    CLOSE_BUTTON_CONTAINER,
    BUTTON_WRAPPER,
  ] = [
    "row-link",
    "tab-icon",
    "close-button",
    "close-button-container",
    "button-wrapper",
  ];
  // Storage keys
  const STORAGE = {
    CONFIG: "config",
  };
  // Browser Specific
  const BROWSER_CSS_VARIABLES = {
    [CHROME]: [
      "--txt-box-width: 400px;",
    ],
    [FIREFOX]: [
      "--txt-box-width: 340px;",
    ],
  };

  let searchTimer = UNSET_TIMER_REF;

  const BROWSER = (() => {
    const userAgent = navigator.userAgent.toLocaleLowerCase();

    if (userAgent.indexOf(CHROME) !== -1) {
      return CHROME;
    } else if(userAgent.indexOf(FIREFOX) !== -1) {
      return FIREFOX
    }

    // TODO: Check support with other chromium browsers.
    // Use lowest supported option.
    return FIREFOX;
  })();

  const addCssStyle = (style) => {
    const cssStyle = document.createElement(STYLE);

    cssStyle.textContent = style;
    document.head.append(cssStyle);
  };

  const setBrowserSpecificStyles = () => {
    const browserVars = BROWSER_CSS_VARIABLES[BROWSER];

    const stylesString = browserVars.reduce((curr, style) => {
      return `${curr}${style}`;
    }, EMPTY);

    const styles = `:root {${stylesString}}`;

    addCssStyle(styles);
  };
  // TODO: Add message for no results?
  // TODO: Need to improve search. Add basic search.
  // Regex will do for now.
  const filterItems = (input) => {
    // Regex
    // Exceptions: SyntaxError
    // Thrown if one of the following is true:
    // > pattern cannot be parsed as a valid regular expression.
    // > flags contains repeated characters or any character outside of those allowed.
    // Src: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/RegExp

    // TODO: Investigate if error is at instantiation time (e.g. new Regex(input))
    // or when using the object (e.g. someRegex.test(text)).
    // The below snipet could be a better abstraction and avoid continues exceptions
    // but it will only work if the exception is during instantiation.
    // The current approach is better for the later but generally safer.

    // let isMatchingText;

    // try {
    //   const searchPatter = new RegExp(input);

    //   isMatchingText = (content) => searchPatter.test(content);
    // } catch (error) {
    //   isMatchingText = (content) => content.includes(input);
    // }

    // const method = isMatchingText(text.textContent)
    //   ? REMOVE // Remove .hide class
    //   : ADD // Add .hide class

    document.querySelectorAll(ALL_ROWS).forEach(item => {
      const text = item.querySelector(SPAN)?.textContent || '';
      let method = REMOVE;
      try {
        const searchPatter = new RegExp(input);

        if (!searchPatter.test(text)) {
          method = ADD;
        }
        
      } catch (error) {
        if (!text.includes(input)) {
          method = ADD;
        }
      }

      item.classList[method](HIDE);
    });
  };

  const setAllVisible = () => {
    document.querySelectorAll(ALL_ROWS)
      .forEach(i => i.classList.remove(HIDE));
  };

  const copyAction = async string => {
    if (!string) {
      return
    }

    try {
      await navigator.clipboard.writeText(string);
    } catch (error) {
      console.warn(`${TAG} Unable to copy text in clipboard.`);
    }
  }

  const getImageButton = (url) => {
    const imageBtn = document.createElement(BUTTON);

    if (!url) {
      // Use default image
      imageBtn.style.backgroundImage = `url(${defaultIcon})`;
      return imageBtn;
    }

    // Create image to handle error
    const img = new Image();
    img.src = url;

    const onError = () => {
      imageBtn.style.backgroundImage = `url(${defaultIcon})`;
      // img.removeEventListener(ERROR, onError);
      // img.removeEventListener(LOAD, onLoad);
    };
    const onLoad = () => {
      imageBtn.style.backgroundImage = `url(${url})`;
      // img.removeEventListener(ERROR, onError);
      // img.removeEventListener(LOAD, onLoad);
    };

    img.addEventListener(ERROR, onError);
    img.addEventListener(LOAD, onLoad);

    return imageBtn;
  };

  const getTextContainer = (linkText) => {
    const text = document.createElement(SPAN);
    text.textContent = linkText;

    return text;
  };

  // Event Handlers
  const onClickImgButton = evt => {
    const text = evt.target
      .parentElement
      .querySelector(SPAN)
      ?.textContent || EMPTY;

    copyAction(text);
  };

  const onClickCloseButton = evt => {
    const item = evt.target
      .parentElement;
    const parent = item.parentElement;
    const imageWrapper = item.querySelector(COPY_BUTTON);
    const closeWrapper = item.querySelector(REMOVE_BUTTON);
    imageWrapper.removeEventListener(CLICK, onClickImgButton);
    closeWrapper.removeEventListener(CLICK, onClickCloseButton);
    parent.removeChild(item);
  };

  const onTextClick = (evt) => {
    evt.target.contentEditable = true;
  };

  const onTextBlur = (evt) => {
    evt.target.contentEditable = false;
  };

  const createItemForList = (linkText, imageUrl) => {
    // HTML elements
    const text = getTextContainer(linkText);
    const imageBtn = getImageButton(imageUrl);
    const item = document.createElement(LI);
    const imageWrapper = document.createElement(DIV);
    const closeBtn = document.createElement(BUTTON);
    const closeBtnContainer = document.createElement(DIV);
    const closeWrapper = document.createElement(DIV);

    closeBtnContainer.appendChild(closeBtn);

    imageWrapper.appendChild(imageBtn);
    closeWrapper.appendChild(closeBtnContainer);

    item.replaceChildren(imageWrapper, text, closeWrapper);

    // CSS styling
    item.classList.add(ROW_LINK);
    imageBtn.classList.add(TAB_ICON);
    closeBtn.classList.add(CLOSE_BUTTON);
    closeBtnContainer.classList.add(CLOSE_BUTTON_CONTAINER);
    imageWrapper.classList.add(BUTTON_WRAPPER);
    closeWrapper.classList.add(BUTTON_WRAPPER);

    imageWrapper.addEventListener(CLICK, onClickImgButton);
    closeWrapper.addEventListener(CLICK, onClickCloseButton);

    text.addEventListener(CLICK, onTextClick);
    text.addEventListener(BLUR, onTextBlur);

    return { item, imageBtn, text, closeBtn, imageWrapper, closeWrapper };
  };

  const formatLink = (linkText, imageUrl) => {
    const { item } = createItemForList(linkText, imageUrl);

    return item;
  };

  // Storage methods wrapped in promises.
  const getStorage = (key) => {
    return new Promise(resolve => {
      // [Chrome Specific] - [FireFox support]
      chrome.storage.sync.get(key, stored => {
        resolve(stored[key] || {});
      });
    });
  };

  const setStorage = (key, item) => {
    return new Promise(async resolve => {
      const stored = await getStorage(key);
      const updated = {
        [key]: {
          ...stored,
          ...item,
        }
      };

      // [Chrome Specific] - [FireFox support]
      chrome.storage.sync.set(updated, () => {
        resolve(updated);
      });
    });
  };

  const setTabsFromAllWindows = (cb) => {
    return new Promise(resolve => {
      // [Chrome Specific] - [FireFox support]
      chrome.windows.getAll({ populate: true }, windows => {
        windows.forEach(window => {
          window.tabs.forEach(cb);
        });

        resolve();
      });
    });
  };

  const setTabsCurrentWindow = (cb) => {
    return new Promise(resolve => {
      // [Chrome Specific] - [FireFox support]
      chrome.windows.getCurrent({ populate: true }, window => {
        window.tabs.forEach(cb);

        resolve();
      });
    });
  };

  const getTabsFromAllWindows = () => {
    return new Promise(resolve => {
      // [Chrome Specific] - [FireFox support]
      chrome.windows.getAll({ populate: true }, windows => {
        let allTabs = [];

        for (let i = 0; i < windows.length; ++i) {
          const win = windows[i];
          allTabs = allTabs.concat(win.tabs)
        }

        resolve(allTabs);
      });
    });
  };

  const getTabsCurrentWindow = () => {
    return new Promise(resolve => {
      // [Chrome Specific] - [FireFox support]
      chrome.windows.getCurrent({ populate: true }, window => {
        resolve(window.tabs);
      });
    });
  };

  const getAllTextLinks = () => {
    let text = EMPTY;
    document
      .querySelectorAll(VISIBLE_LINKS)
      .forEach((el) => {
      const itemText = el.textContent || EMPTY;

      // Prevent adding break lines if item has no content
      text = itemText ? `${text}\n${itemText}` : text;
    });

    // Remove leading '\n'
    return text.substring(1);
  }

  const copyHandler = () => {
    const text = getAllTextLinks();
    copyAction(text);
  };
  
  const getLinksHandler = async () => {
    const list = document.createElement(UL);
    const forEachTab = tab => {
      const { url, favIconUrl } = tab;
      const item = formatLink(url, favIconUrl);
      list.appendChild(item);
    };

    const checked = allWindowsCheckbox.checked;

    // TODO: Decide best approach
    // const setTabs = checked
    //   ? setTabsFromAllWindows
    //   : setTabsCurrentWindow;

    // await setTabs(forEachTab);

    const tabs = checked
      ? await getTabsFromAllWindows()
      : await getTabsCurrentWindow();

    tabs.forEach(forEachTab);

    txtArea.replaceChildren(list);
  };
  
  const downloadHandler = () => {
    const text = getAllTextLinks();
    
    if (!text) {
      return;
    }

    const link = document.createElement(A);
    const date = (new Date()).toISOString().replace(/:/gi, '-');

    link.download = `links-${date}.txt`;
    link.href = `${DOWNLOAD_MIME}${encodeURIComponent(text)}`;
    link.click();
  };

  const checkAllWindowsHandler = () => {
    const checked = !allWindowsCheckbox.checked;

    setStorage(STORAGE.CONFIG, { checked })
      .catch(e => {
        console.error(`${TAG} State could not be saved`);
      });

    allWindowsCheckbox.checked = checked;

    getLinksHandler();
  };

  // Remove content editable if there is nore more items
  const enableContentEditable = (mutationList, observer) => {

    // Enable if there are items left and they are visible
    const enableEdit = !!document
      .querySelectorAll(VISIBLE_ROWS).length

    txtArea.setAttribute(EDITABLE, enableEdit);
  };

  const searchHandler = () => {
    const input = searchBox.value;
    if (!input || input.length === 0) {
      setAllVisible();
      // enableContentEditable();

      return;
    }

    filterItems(input);
    // enableContentEditable();
  };

  const debouncedSearch = () => {
    if (searchTimer !== UNSET_TIMER_REF) {
      clearTimeout(searchTimer);
    }

    searchTimer = setTimeout(() => {
      searchTimer = UNSET_TIMER_REF;
      searchHandler();
    }, DEBOUNCE_SEARCH_MS);
  };

  const setObserverTxtArea = () => {
    const config = { childList: true, subtree: true };

    const observer = new MutationObserver(enableContentEditable);

    observer.observe(txtArea, config);
  };

  const onWindowsLoad = async () => {
    const { checked } = await getStorage(STORAGE.CONFIG);
    allWindowsCheckbox.checked = !!checked;

    setBrowserSpecificStyles();
    getLinksHandler();
    // setObserverTxtArea();
  };

  const loadListeners = () => {
    searchBox.addEventListener(KEYUP, debouncedSearch);
    searchBtn.addEventListener(CLICK, searchHandler);
    allWindowsBtn.addEventListener(CLICK, checkAllWindowsHandler);
    resetBtn.addEventListener(CLICK, getLinksHandler);
    downloadBtn.addEventListener(CLICK, downloadHandler);
    copyBtn.addEventListener(CLICK, copyHandler);
    window.addEventListener(LOAD, onWindowsLoad);
  };

  loadListeners();
})();