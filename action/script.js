
// @ts-check

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
  const allWindowsCheckbox = /** @type {HTMLInputElement} */ (document.querySelector('#all-windows'));
  const allWindowsBtn = /** @type {HTMLButtonElement} */ (document.querySelector('#all-windows-btn'));
  const useRegexpCheckbox = /** @type {HTMLInputElement} */ (document.querySelector('#use-regexp'));
  const useRegexpBtn = /** @type {HTMLButtonElement} */ (document.querySelector('#use-regexp-btn'));
  const searchBox = /** @type {HTMLInputElement} */ (document.querySelector('#search-box'));
  const searchBtn = /** @type {HTMLButtonElement} */ (document.querySelector('#search-btn'));
  const resetBtn = /** @type {HTMLButtonElement} */ (document.querySelector('#reset-btn'));
  const downloadBtn = /** @type {HTMLButtonElement} */ (document.querySelector('#download-btn'));
  const copyBtn = /** @type {HTMLButtonElement} */ (document.querySelector('#copy-btn'));
  const txtArea = /** @type {HTMLTextAreaElement} */ (document.querySelector('#txt-box'));
  const TAG = '[Tabs2Links]';
  const defaultIcon = '../img/question.png';
  const DEBOUNCE_SEARCH_MS = 300;
  const UNSET_TIMER_REF = -1;
  // Constants
  const BLUR = 'blur';
  const CLICK = 'click';
  const LOAD = 'load';
  const ERROR = 'error';
  const WARN = 'warn';
  const INFO = 'info';
  const LOG = 'log';
  const DEBUG = 'debug';
  const HIDE = 'hide';
  const REMOVE = 'remove';
  const ADD = 'add';
  const KEYUP = 'keyup';
  const SPAN = 'span';
  const BUTTON = 'button';
  const DIV = 'div';
  const LI = 'li';
  const UL = 'ul';
  const A = 'a';
  const STYLE = 'style';
  const CHROME = 'chrome';
  const FIREFOX = 'firefox';
  const EMPTY =  '';
  const EDITABLE = 'contenteditable';
  const DOWNLOAD_MIME = 'data:text/plain;charset=utf-8,';
  // CSS Selectors
  const ALL_ROWS = '.row-link';
  const VISIBLE_ROWS = '.row-link:not(.hide)';
  const VISIBLE_LINKS = '.row-link:not(.hide) span';
  const COPY_BUTTON = '.button-wrapper:first-child';
  const REMOVE_BUTTON = '.button-wrapper:last-child';
  // CSS Clases
  const ROW_LINK = 'row-link';
  const TAB_ICON = 'tab-icon';
  const CLOSE_BUTTON = 'close-button';
  const CLOSE_BUTTON_CONTAINER = 'close-button-container';
  const BUTTON_WRAPPER = 'button-wrapper';
  // Storage keys
  /**
   * @typedef {{
   *   CONFIG: 'config'
   * }} STORAGE
   */
  /** @typedef {keyof STORAGE} StorageMapKeys */
  /** @typedef {STORAGE[StorageMapKeys]} StorageKeys */
  /** @type {STORAGE} */
  const STORAGE = {
    CONFIG: 'config',
  };
  // Browser Specific
  const BROWSER_CSS_VARIABLES = {
    [CHROME]: [
      '--txt-box-width: 400px',
      '--list-right-padding: 0',
    ],
    [FIREFOX]: [
      '--txt-box-width: 340px',
      '--list-right-padding: 10px',
    ],
  };

  let searchTimer = UNSET_TIMER_REF;

  /**
   * Type of functions in logger
   * @typedef { (message: string, ...args: unknown[]) => void } LogFunction
   */
  /**
   * @typedef { ERROR | WARN | INFO | LOG | DEBUG } LogLevels
   */
  /**
   * @typedef {{
   *  [ERROR]: LogFunction;
   *  [WARN]: LogFunction;
   *  [INFO]: LogFunction;
   *  [LOG]: LogFunction;
   *  [DEBUG]: LogFunction;
   * }} Logger
   */

  const { error, warn, info, log, debug } = (() => {
    /**
     * @type {(previousValue: Logger, currentValue: LogLevels, currentIndex: number, array: string[]) => Logger}
     */
    const reduceFunction = (
      /** @type {Logger} */ logger,
      /** @type {LogLevels} */ level
    ) => {
      /** @type {LogFunction} */
      const logFunction = (message, ...rest) => {
        console[level](`${TAG}${message}`, ...rest);
      };
      logger[level] = logFunction;

      return logger;
    };

    const levels = /** @type {{ reduce: (callback: typeof reduceFunction, initial: object) => Logger }} */ ([ERROR, WARN, INFO, LOG, DEBUG]);

    /** @type {Logger} */
    const loggerObject = levels.reduce(reduceFunction, {});

    return loggerObject;
  })();

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

    const stylesString = browserVars.join(';');

    const styles = `:root {${stylesString}}`;

    addCssStyle(styles);
  };

  /**
   * Mark rows that match query visible
   * and rows that don't hidden.
   * This uses simple string matching with the rules:
   * - "&" or (has to match all terms separated by ampersand)
   * - "|" and (has to match at least one term separated by pipe)
   * - "`" xor (has to match one and only one)
   * - "^" not (negates the matching expression)
   *
   * @param {string} query String to match against
   * @returns {void}
   */
  const filterItemsSimple = (query) => {
    const isNegative = query.startsWith('^');
    let cleanQuery = isNegative ? query.substring(1) : query;
    const isAnd = cleanQuery.includes('&');
    const isOr = cleanQuery.includes('|');
    // const isPlain = !isAnd && !isOr;

    if (isAnd && isOr) {
      // This requires grouping which is better suited for regex
      // version of the matching.
      return;
    }

    let /** @type {'every' | 'some'} */ arrayMethod;
    let /** @type {string[]} */ terms;

    if (isAnd) {
      terms = cleanQuery.split('&');
      arrayMethod = 'every';
    } else {
      terms = cleanQuery.split('|');
      arrayMethod = 'some';
    }

    document.querySelectorAll(ALL_ROWS).forEach(item => {
      const text = item.querySelector(SPAN)?.textContent || '';
      let classMethod = REMOVE;
      try {
        if (terms[arrayMethod](term => term.includes(text))) {
          classMethod = ADD;
        }
      } catch (e) {
        error('[FilterSimple] Error matching term:', text, e);
        // Fallback to show
        classMethod = REMOVE;
      }

      item.classList[classMethod](HIDE);
    });
  };

  // TODO: Add message for no results?
  // TODO: Need to improve search. Add basic search.
  // Regex will do for now.
  /**
   * Mark rows that match query visible
   * and rows that don't hidden.
   * This uses regex rules by javascript to do matches.
   *
   * @param {string} query String to match against
   * @returns {void}
   */
  const filterItemsByRegexp = (query) => {
    // Regex
    // Exceptions: SyntaxError
    // Thrown if one of the following is true:
    // > pattern cannot be parsed as a valid regular expression.
    // > flags contains repeated characters or any character outside of those allowed.
    // Src: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/RegExp

    // TODO: Investigate if error is at instantiation time (e.g. new Regex(query))
    // or when using the object (e.g. someRegex.test(text)).
    // The below snipet could be a better abstraction and avoid continues exceptions
    // but it will only work if the exception is during instantiation.
    // The current approach is better for the later but generally safer.

    // let isMatchingText;

    // try {
    //   const searchPattern = new RegExp(query);

    //   isMatchingText = (content) => searchPattern.test(content);
    // } catch (error) {
    //   isMatchingText = (content) => content.includes(query);
    // }

    // const method = isMatchingText(text.textContent)
    //   ? REMOVE // Remove .hide class
    //   : ADD // Add .hide class

    /** @type {RegExp} */
    let searchPattern;
    try {
      searchPattern = new RegExp(query);
    } catch (e) {
      error('[FilterRegexp] Error creating regexp:', e);
      // No assingning fallback to searchPattern to use
      // fallback with includes
    }

    document.querySelectorAll(ALL_ROWS).forEach(item => {
      const text = item.querySelector(SPAN)?.textContent || '';
      // NOTE: Method adds or removes the 'hide' class
      // so initial remove means all are visible by default
      let classMethod = REMOVE;
      try {
        if (!searchPattern.test(text)) {
          classMethod = ADD;
        }

      } catch (error) {
        if (!text.includes(query)) {
          classMethod = ADD;
        }
      }

      item.classList[classMethod](HIDE);
    });
  };

  /**
   * Make all available rows visible
   *
   * @returns {void}
   */
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
      warn('Unable to copy text in clipboard.');
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

  /**
   * Creates a "li" element formatted for display
   *
   * @param {string} linkText String url for the tab
   * @param {string} imageUrl String url for the favicon
   * @returns {{
   *   item: HTMLLIElement;
   *   imageBtn: HTMLButtonElement;
   *   text: HTMLSpanElement;
   *   closeBtn: HTMLButtonElement;
   *   imageWrapper: HTMLDivElement;
   *   closeWrapper: HTMLDivElement;
   * }}
   */
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

  /**
   * Creates a "li" element formatted for display
   *
   * @param {string} linkText String url for the tab
   * @param {string} imageUrl String url for the favicon
   * @returns {HTMLLIElement}
   */
  const formatLink = (linkText, imageUrl) => {
    const { item } = createItemForList(linkText, imageUrl);

    return item;
  };

  // Storage methods wrapped in promises.
  /**
   * @typedef {{
   *   allWindows: boolean;
   *   useRegexp: boolean;
   * }} Config
   */
  /**
   * Type of the object stored in storage.sync
   * @typedef {{
   *   config: Config;
   * }} SyncStorage
   */

  /**
   * @param {StorageKeys} key
   * @returns {Promise<SyncStorage[StorageKeys]>}
   */
  const getStorage = (key) => {
    return new Promise(resolve => {
      // [Chrome Specific] - [FireFox support]
      chrome.storage.sync.get(key, stored => {
        resolve(stored[key] || {});
      });
    });
  };

  /**
   * @template T
   * @param {StorageKeys} key Key to add or update
   * @param {T} item Item to store
   * @returns {Promise<{ [k in key]: T }>}
   */
  const setStorage = (key, item) => {
    const promise = /**
      @type {{
        promise: Promise<{ [k in key]: T }>;
        resolve: (resolveArg: { [k in key]: T }) => void;
        reject: typeof Promise.reject
      }}
    */(Promise.withResolvers());

    getStorage(key).then(stored => {
      const updated = {
        [key]: {
          ...stored,
          ...item,
        }
      };

      // [Chrome Specific] - [FireFox support]
      chrome.storage.sync.set(updated, () => {
        promise.resolve(updated);
      });
    })
    .catch(e => {
      error('[Storage] Error updating storage:', e)
      promise.reject(new Error('[Storage] Error updating storage', { cause: e }));
    });

    return promise.promise;
  };

  /**
   *
   * @param {(tab: chrome.tabs.Tab, index: number) => any} callback Callback function
   * @returns {Promise<void>}
   */
  const setTabsFromAllWindows = (callback) => {
    return new Promise(resolve => {
      // [Chrome Specific] - [FireFox support]
      chrome.windows.getAll({ populate: true }, windows => {
        windows.forEach(window => {
          if (!window.tabs) {
            return;
          }

          window.tabs.forEach(callback);
        });

        resolve();
      });
    });
  };

  /**
   *
   * @param {(tab: chrome.tabs.Tab, index: number) => any} callback Callback function
   * @returns {Promise<void>}
   */
  const setTabsCurrentWindow = (callback) => {
    return new Promise(resolve => {
      // [Chrome Specific] - [FireFox support]
      chrome.windows.getCurrent({ populate: true }, window => {
        window.tabs?.forEach(callback);

        resolve();
      });
    });
  };

  /**
   * Gets all the tabs from all existing windows of the browser
   * @returns {Promise<chrome.tabs.Tab[]>}
   */
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

  /**
   * Gets all the tabs from the current active window of the browser
   * @returns {Promise<chrome.tabs.Tab[]>}
   */
  const getTabsCurrentWindow = () => {
    return new Promise(resolve => {
      // [Chrome Specific] - [FireFox support]
      chrome.windows.getCurrent({ populate: true }, window => {
        resolve(window.tabs || []);
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
    /**
     * Function to apply to all tabs to gather information
     * and build the list of elements to display
     *
     * @param {{ url?: string; favIconUrl?: string}} tab Tab from window
     */
    const forEachTab = tab => {
      const { url, favIconUrl } = tab;
      const item = formatLink(url || '', favIconUrl || '');
      list.appendChild(item);
    };

    const checked = allWindowsCheckbox.checked;

    // NOTE: This should be faster
    // as everything should happen on a single iteration.
    const setTabs = checked
      ? setTabsFromAllWindows
      : setTabsCurrentWindow;

    await setTabs(forEachTab);

    // NOTE: This requires two iterations. One to get
    // the tabs and one to create the "li" elements.
    // const tabs = checked
    //   ? await getTabsFromAllWindows()
    //   : await getTabsCurrentWindow();
    // tabs.forEach(forEachTab);

    txtArea.replaceChildren(list);
  };

  const downloadHandler = () => {
    const text = getAllTextLinks();

    if (!text) {
      return;
    }

    const link = document.createElement(A);
    const date = (new Date()).toISOString().replace(/:/gi, '-');

    link.download = `links_${date}.txt`;
    link.href = `${DOWNLOAD_MIME}${encodeURIComponent(text)}`;
    link.click();
  };

  const toggleRegexpConfigHandler = () => {
    const useRegexp = !useRegexpCheckbox.checked;

    setStorage(STORAGE.CONFIG, { useRegexp })
      .catch(e => {
        error('[Storage] Error updating config.useRegexp to:', useRegexp, e);
      });

    useRegexpCheckbox.checked = useRegexp;

    // Need to update the search
    searchHandler();
  }

  const checkAllWindowsHandler = () => {
    const allWindows = !allWindowsCheckbox.checked;

    setStorage(STORAGE.CONFIG, { allWindows })
      .catch(e => {
        error('[Storage] Error updating config.allWindows to:', allWindows, e);
      });

    allWindowsCheckbox.checked = allWindows;

    // Need to update the list
    getLinksHandler();
  };

  // Remove content editable if there is nore more items
  const enableContentEditable = (mutationList, observer) => {

    // Enable if there are items left and they are visible
    const enableEdit = !!document
      .querySelectorAll(VISIBLE_ROWS).length

    txtArea.setAttribute(EDITABLE, enableEdit.toString());
  };

  /**
   * Handle the search action.
   * Items not matching the query will be hidden.
   * Items matching the query will be visible.
   * Empty query means everythign is visible
   *
   * @returns {void}
   */
  const searchHandler = () => {
    const input = searchBox.value;
    if (!input || input.length === 0) {
      setAllVisible();
      // enableContentEditable();

      return;
    }

    if (useRegexpCheckbox.checked) {
      filterItemsByRegexp(input);
    } else {
      filterItemsSimple(input);
    }
  };

  /**
   * Wrapper for search handler but debounced to prevent spamming
   * the function while typing.
   * @returns {void}
   */
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
    const { allWindows, useRegexp } = await getStorage(STORAGE.CONFIG);
    allWindowsCheckbox.checked = !!allWindows;
    useRegexpCheckbox.checked = !!useRegexp;

    setBrowserSpecificStyles();
    getLinksHandler();
    // setObserverTxtArea();
  };

  const loadListeners = () => {
    searchBox.addEventListener(KEYUP, debouncedSearch);
    searchBtn.addEventListener(CLICK, searchHandler);
    allWindowsBtn.addEventListener(CLICK, checkAllWindowsHandler);
    useRegexpBtn.addEventListener(CLICK, toggleRegexpConfigHandler);
    resetBtn.addEventListener(CLICK, getLinksHandler);
    downloadBtn.addEventListener(CLICK, downloadHandler);
    copyBtn.addEventListener(CLICK, copyHandler);
    window.addEventListener(LOAD, onWindowsLoad);
  };

  loadListeners();
})();
