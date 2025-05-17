// @ts-check

// Cases where the chrome object is used it preceded by the comment:
// [Chrome Specific] - [FireFox support]
// This extension works fine in both browsers with minimal css differences.
// Chrome manifest: v3
// Firefox manifest: v2

// This is an example on how to implement strong typing by using jsdoc
// You may need to do a `npm ci` to add the @types/chrome package or simply remove
// the first line @ts-check to turn off type checking if it becomes to annoying.

// If the Promise.withResolvers is showing an error, just open types/webapis.s.ts
// Once the file is open the error will go away... 😅

((_) => {
  // HTML Elements
  const allWindowsCheckbox = /** @type {HTMLInputElement} */ (
    document.querySelector("#all-windows")
  );
  const allWindowsBtn = /** @type {HTMLButtonElement} */ (
    document.querySelector("#all-windows-btn")
  );
  const useRegexpCheckbox = /** @type {HTMLInputElement} */ (
    document.querySelector("#use-regexp")
  );
  const useRegexpBtn = /** @type {HTMLButtonElement} */ (
    document.querySelector("#use-regexp-btn")
  );
  const searchBox = /** @type {HTMLInputElement} */ (
    document.querySelector("#search-box")
  );
  const searchBtn = /** @type {HTMLButtonElement} */ (
    document.querySelector("#search-btn")
  );
  const resetBtn = /** @type {HTMLButtonElement} */ (
    document.querySelector("#reset-btn")
  );
  const downloadBtn = /** @type {HTMLButtonElement} */ (
    document.querySelector("#download-btn")
  );
  const copyBtn = /** @type {HTMLButtonElement} */ (
    document.querySelector("#copy-btn")
  );
  const txtArea = /** @type {HTMLTextAreaElement} */ (
    document.querySelector("#txt-box")
  );
  const tabContainer = /** @type {HTMLDivElement} */ (
    document.querySelector(".tab-container")
  )
  const fileInput = /** @type {HTMLInputElement} */ (
    document.querySelector("#file-input")
  )
  const openLinksArea = /** @type {HTMLTextAreaElement} */ (
    document.querySelector("#links-to-open")
  )
  const openBtn = /** @type {HTMLButtonElement} */ (
    document.querySelector("#open-btn")
  );
  const TAG = "[Tabs2Links]";
  const defaultIcon = "../img/question.png";
  const t2lIcon = "../icons/icon128.png";
  const DEBOUNCE_SEARCH_MS = 300;
  const UNSET_TIMER_REF = -1;
  // Constants
  const BLUR = "blur";
  const CLICK = "click";
  const CHANGE = "change";
  const LOAD = "load";
  const ERROR = "error";
  const WARN = "warn";
  const INFO = "info";
  const LOG = "log";
  const DEBUG = "debug";
  const HIDE = "hide";
  const REMOVE = "remove";
  const ADD = "add";
  const KEYUP = "keyup";
  const SPAN = "span";
  const BUTTON = "button";
  const DIV = "div";
  const LI = "li";
  const UL = "ul";
  const A = "a";
  const STYLE = "style";
  const CHROME = "chrome";
  const FIREFOX = "firefox";
  const EMPTY = "";
  const EDITABLE = "contenteditable";
  const DOWNLOAD_MIME = "data:text/plain;charset=utf-8,";
  // CSS Selectors
  const ALL_ROWS = ".row-link";
  const VISIBLE_ROWS = ".row-link:not(.hide)";
  const VISIBLE_LINKS = ".row-link:not(.hide) span";
  const COPY_BUTTON = ".button-wrapper:first-child";
  const REMOVE_BUTTON = ".button-wrapper:last-child";
  // CSS Classes
  const ROW_LINK = "row-link";
  const TAB_ICON = "tab-icon";
  const CLOSE_BUTTON = "close-button";
  const CLOSE_BUTTON_CONTAINER = "close-button-container";
  const BUTTON_WRAPPER = "button-wrapper";
  const ACTIVE_TAB = "active";
  const OPEN_PAGE = "open-page";
  const COPY_PAGE = "copy-page";
  // Array Methods
  const EVERY = "every";
  const SOME = "some";
  // Placeholder content
  const SEARCH_BY_REGEXP = "Search using regex";
  const SEARCH_BY_TEXT = "Search text";
  const NOTIFICATION_ID = "tabs-to-links_global_notificationId";
  const OK = "OK";
  const NOTIFICATION_TITLE = "Copied to clipboard";
  const BEFORE_UNLOAD = "beforeunload";
  const TYPE_BASIC = "basic";
  const IGNORED_LINES = ['//', '#', ';'];

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
    CONFIG: "config",
  };
  // Browser Specific
  const BROWSER_CSS_VARIABLES = {
    [CHROME]: ["--txt-box-width: 400px", "--list-right-padding: 0"],
    [FIREFOX]: ["--txt-box-width: 340px", "--list-right-padding: 10px"],
  };

  let searchTimer = UNSET_TIMER_REF;

  /**
   * Type of functions in logger
   * @typedef { (message: string, ...args: unknown[]) => void } LogFunction
   */
  /**
   * @typedef { typeof ERROR | typeof WARN | typeof INFO | typeof LOG | typeof DEBUG } LogLevels
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
			/** @type {LogLevels} */ level,
    ) => {
      /** @type {LogFunction} */
      const logFunction = (message, ...rest) => {
        console[level](`${TAG}${message}`, ...rest);
      };
      logger[level] = logFunction;

      return logger;
    };

    const levels =
			/** @type {{ reduce: (callback: typeof reduceFunction, initial: object) => Logger }} */ ([
        ERROR,
        WARN,
        INFO,
        LOG,
        DEBUG,
      ]);

    /** @type {Logger} */
    const loggerObject = levels.reduce(reduceFunction, {});

    return loggerObject;
  })();

  const BROWSER = (() => {
    const userAgent = navigator.userAgent.toLocaleLowerCase();

    if (userAgent.indexOf(CHROME) !== -1) {
      return CHROME;
    }

    return FIREFOX;
  })();

  /**
   * Add styles to the document by appending a style tag.
   * @param {string} style Styles to append to the document
   */
  const addCssStyle = (style) => {
    const cssStyle = document.createElement(STYLE);

    cssStyle.textContent = style;
    document.head.append(cssStyle);
  };

  /**
   * Append the set of variables to fix differences between
   * firefox and chromium browsers
   */
  const setBrowserSpecificStyles = () => {
    const browserVars = BROWSER_CSS_VARIABLES[BROWSER];

    const stylesString = browserVars.join(";");

    const styles = `:root {${stylesString}}`;

    addCssStyle(styles);
  };

  /**
   * Mark rows that match query visible
   * and rows that don't hidden.
   * This uses simple string matching with the rules:
   * - "&" or (has to match all terms separated by ampersand)
   * - "|" and (has to match at least one term separated by pipe)
   * - "^" not (negates the matching expression)
   *
   * @param {string} query String to match against
   * @returns {void}
   */
  const filterItemsSimple = (query) => {
    const isNegative = query.startsWith("^");
    const cleanQuery = isNegative ? query.substring(1) : query;
    const isAnd = cleanQuery.includes("&");
    const isOr = cleanQuery.includes("|");
    // const isPlain = !isAnd && !isOr;

    if (isAnd && isOr) {
      // This requires grouping which is better suited for regex
      // version of the matching.
      warn('[FilterSimple] Cannot evaluate "and" and "or" expression');
      return;
    }

    let /** @type {typeof EVERY | typeof SOME} */ arrayMethod;
    let /** @type {string[]} */ terms;

    if (isAnd) {
      terms = cleanQuery.split("&");
      arrayMethod = EVERY;
    } else {
      terms = cleanQuery.split("|");
      arrayMethod = SOME;
    }

    // Trim the terms, so whitespaces can be added between separators
    terms = terms.map((term) => term.trim());

    // biome-ignore lint/complexity/noForEach: prefer forEach for readability
    document.querySelectorAll(ALL_ROWS).forEach((item) => {
      try {
        const text = item.querySelector(SPAN)?.textContent || "";
        const shouldHide =
          terms[arrayMethod]((term) => text.includes(term)) === isNegative;
        // NOTE: Method adds or removes the 'hide' class
        // so initial remove means all are visible by default
        const classMethod = shouldHide ? ADD : REMOVE;
        item.classList[classMethod](HIDE);
      } catch (e) {
        // Should not arrive here
        error("[FilterSimple] Error evaluating text:", e);
      }
    });
  };

  // TODO: Add message for no results?
  /**
   * Mark rows that match query visible
   * and rows that don't hidden.
   * This uses regex rules by javascript to do matches.
   *
   * @param {string} query String to match against
   * @returns {void}
   */
  const filterItemsByRegexp = (query) => {
    /** @type {RegExp} */
    let searchPattern;
    /** @type {(text: string) => boolean} */
    let isValid = (text) => searchPattern.test(text);
    try {
      searchPattern = new RegExp(query);
    } catch (e) {
      // If it comes here, there is probably a SyntaxError
      // when attempting to create the regexp
      // Thrown if one of the following is true:
      // > pattern cannot be parsed as a valid regular expression.
      // > flags contains repeated characters or any character outside of those allowed.
      // Src: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/RegExp
      debug("[FilterRegexp] Error creating regexp:", e);
      isValid = (text) => text.includes(query);
    }

    // biome-ignore lint/complexity/noForEach: Prefer forEach for readability
    document.querySelectorAll(ALL_ROWS).forEach((item) => {
      try {
        const text = item.querySelector(SPAN)?.textContent || "";
        // NOTE: Method adds or removes the 'hide' class
        // so initial remove means all are visible by default
        const classMethod = isValid(text) ? REMOVE : ADD;
        item.classList[classMethod](HIDE);
      } catch (e) {
        // Should not arrive here
        error("[FilterRegexp] Error evaluating text:", e);
      }
    });
  };

  /**
   * Make all available rows visible
   *
   * @returns {void}
   */
  const setAllVisible = () => {
    // biome-ignore lint/complexity/noForEach: Prefer forEach for readability
    document
      .querySelectorAll(ALL_ROWS)
      .forEach((i) => i.classList.remove(HIDE));
  };

  /**
   * Send a notification that content has been copied to clipboard
   * @param {string} id Notification id
   * @param {string} message Message to notify to host
   * @param {chrome.notifications.ButtonOptions[] | undefined} buttons Buttons to show in notification
   * @returns {void}
   */
  const extension_notify = (id, message, buttons) => {
    chrome.notifications.clear(id, () => {
      chrome.notifications.create(id, {
        // NOTE: Buttons not supported by firefox
        ...(BROWSER === CHROME ? { buttons } : {}),
        type: TYPE_BASIC,
        message,
        title: NOTIFICATION_TITLE,
        iconUrl: t2lIcon,
      });
    });
  };

  /**
   * Sets the notification handler callbacks and the cleanup logic
   */
  const set_notification_handlers = () => {
    /** @type (notificationId: string, buttonIndex: number) => void): void */
    const onButtonClickedCallback = (notificationId, _buttonIndex) => {
      // NOTE: If this extend to other possible notifications,
      // replace with a switch
      if (notificationId === NOTIFICATION_ID) {
        chrome.notifications.clear(notificationId);
      }
    };

    /** @type (notificationId: string) => void): void */
    const onClickedCallback = (notificationId) => {
      // NOTE: If this extend to other possible notifications,
      // replace with a switch
      if (notificationId === NOTIFICATION_ID) {
        chrome.notifications.clear(notificationId);
      }
    };

    chrome.notifications.onButtonClicked.addListener(onButtonClickedCallback);
    chrome.notifications.onClicked.addListener(onClickedCallback);

    window.addEventListener(BEFORE_UNLOAD, () => {
      chrome.notifications.onButtonClicked.removeListener(onButtonClickedCallback);
      chrome.notifications.onClicked.removeListener(onClickedCallback);
    })
  }

  const firefoxNotificationRequest = () => {
    if (BROWSER !== FIREFOX || Notification.permission !== "default") {
      return;
    }

    // Firefox just making the life harder for developers as always...
    // Ask to allow user to deny but the extension will take "default" as "granted".
    // As it is not possible to check the regular permissions (see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/notifications)
    // We attempt to ask using the web notification API instead.
    Notification.requestPermission().then(_permission => {
      // Do nothing
    }).catch((e) => {
      console.error("Cannot request for notifications", e)
    });
  }

  /**
   * Sets the given text in the device clipboard
   *
   * @param {string} string Text to copy to device clipboard
   * @param {boolean} all To indicate whether it is copying all links
   * @returns {Promise<void>}
   */
  const copyAction = async (string, all) => {
    if (!string) {
      return;
    }

    try {
      await navigator.clipboard.writeText(string);

      const notify_host = () => {
        const message = all
          ? "All links have been copied to clipboard!"
          : `Link copied: ${string}`;

        extension_notify(NOTIFICATION_ID, message, [
          { title: OK  },
        ]);
      };

      switch (BROWSER) {
        case FIREFOX:
          // NOTE: Firefox does not implement 'getPermissionLevel'.
          // Only skip notifications if explicitly denied.
          switch (Notification.permission) {
            case "denied":
              return;

            case "default":
            case "granted":
              notify_host();
              break;
          }
          break;

        default:
          // @ts-expect-error Only possible values override to allow nicer completion
          // Ref: https://developer.chrome.com/docs/extensions/reference/api/notifications#type-PermissionLevel
          chrome.notifications.getPermissionLevel((/** @type {"granted"|"denied"} */level) => {
            if (level === 'granted') {
              notify_host();
            }
          });
          break;
      }

    } catch (error) {
      warn("Unable to copy text in clipboard.");
    }
  };

  /**
   * Creates a button with an icon
   * @param {string} url Url for the button icon
   * @returns {HTMLButtonElement}
   */
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

  /**
   * Creates a span element with text content
   * @param {string} linkText Text to display inside the element
   * @returns {HTMLSpanElement}
   */
  const getTextContainer = (linkText) => {
    const text = document.createElement(SPAN);
    text.textContent = linkText;

    return text;
  };

  // Event Handlers
  /**
   * Event handler when a button image is clicked
   * @param {MouseEvent} evt
   */
  const onClickImgButton = (evt) => {
    const target = /** @type { HTMLDivElement | HTMLButtonElement } */ (
      evt?.target
    );
    /**
     * @type { HTMLLIElement | null | undefined }
     */
    const listItem =
      target instanceof HTMLButtonElement
        ? /** @type {HTMLLIElement | undefined} */ (
          target.parentElement?.parentElement
        )
        : /** @type {HTMLLIElement | undefined} */ (target.parentElement);

    const text = listItem?.querySelector(SPAN)?.textContent || EMPTY;

    firefoxNotificationRequest();
    copyAction(text, false);
  };

  /**
   * Event handler when a button image is clicked
   * @param {MouseEvent} evt
   */
  const onClickCloseButton = (evt) => {
    const target = /** @type { HTMLDivElement | HTMLButtonElement } */ (
      evt?.target
    );

    /**
     * @type { HTMLLIElement | null | undefined }
     */
    const listItem =
      target instanceof HTMLButtonElement
        ? /** @type {HTMLLIElement | undefined} */ (
          target.parentElement?.parentElement?.parentElement
        )
        : /** @type {HTMLLIElement | undefined} */ (target.parentElement);

    // const listItem = (/** @type {{ parentElement?: HTMLDivElement }} */ (evt?.target))
    //   ?.parentElement;

    if (!listItem) {
      // Should be impossible to arrive here
      return;
    }

    const list = listItem.parentElement;
    const imageWrapper = /** @type { HTMLDivElement } */ (
      listItem.querySelector(COPY_BUTTON)
    );
    const closeWrapper = /** @type { HTMLDivElement } */ (
      listItem.querySelector(REMOVE_BUTTON)
    );
    imageWrapper.removeEventListener(CLICK, onClickImgButton);
    closeWrapper.removeEventListener(CLICK, onClickCloseButton);
    list?.removeChild(listItem);
  };

  /**
   * @param {MouseEvent} evt
   */
  const onTextClick = (evt) => {
		/** @type {HTMLSpanElement} */ (evt.target).contentEditable = "true";
  };

  /**
   * @param {FocusEvent} evt
   */
  const onTextBlur = (evt) => {
		/** @type {HTMLSpanElement} */ (evt.target).contentEditable = "false";
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
    return new Promise((resolve) => {
      // [Chrome Specific] - [FireFox support]
      chrome.storage.sync.get(key, (stored) => {
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
    */ (Promise.withResolvers());

    getStorage(key)
      .then((stored) => {
        const updated = {
          [key]: {
            ...stored,
            ...item,
          },
        };

        // [Chrome Specific] - [FireFox support]
        chrome.storage.sync.set(updated, () => {
          promise.resolve(updated);
        });
      })
      .catch((e) => {
        error("[Storage] Error updating storage:", e);
        promise.reject(
          new Error("[Storage] Error updating storage", { cause: e }),
        );
      });

    return promise.promise;
  };

  /**
   *
   * @param {(tab: chrome.tabs.Tab, index: number) => any} callback Callback function
   * @returns {Promise<void>}
   */
  const setTabsFromAllWindows = (callback) => {
    return new Promise((resolve) => {
      // [Chrome Specific] - [FireFox support]
      chrome.windows.getAll({ populate: true }, (windows) => {
        // biome-ignore lint/complexity/noForEach: Prefer forEach for readability
        windows.forEach((window) => {
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
    return new Promise((resolve) => {
      // [Chrome Specific] - [FireFox support]
      chrome.windows.getCurrent({ populate: true }, (window) => {
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
    return new Promise((resolve) => {
      // [Chrome Specific] - [FireFox support]
      chrome.windows.getAll({ populate: true }, (windows) => {
        /**
         * @type {chrome.tabs.Tab[]}
         */
        let allTabs = [];

        for (let i = 0; i < windows.length; ++i) {
          const win = windows[i];
          const tabs = win.tabs || [];
          allTabs = allTabs.concat(tabs);
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
    return new Promise((resolve) => {
      // [Chrome Specific] - [FireFox support]
      chrome.windows.getCurrent({ populate: true }, (window) => {
        resolve(window.tabs || []);
      });
    });
  };

  const getAllTextLinks = () => {
    let text = EMPTY;
    // biome-ignore lint/complexity/noForEach: Prefer forEach for readability
    document.querySelectorAll(VISIBLE_LINKS).forEach((el) => {
      const itemText = el.textContent || EMPTY;

      // Prevent adding break lines if item has no content
      text = itemText ? `${text}\n${itemText}` : text;
    });

    // Remove leading '\n'
    return text.substring(1);
  };

  const copyHandler = () => {
    const text = getAllTextLinks();

    firefoxNotificationRequest();
    copyAction(text, true);
  };

  const getLinksHandler = async () => {
    const list = document.createElement(UL);
    /**
     * Function to apply to all tabs to gather information
     * and build the list of elements to display
     *
     * @param {{ url?: string; favIconUrl?: string}} tab Tab from window
     */
    const forEachTab = (tab) => {
      const { url, favIconUrl } = tab;
      const item = formatLink(url || "", favIconUrl || "");
      list.appendChild(item);
    };

    const checked = allWindowsCheckbox.checked;

    // NOTE: This should be faster
    // as everything should happen on a single iteration.
    const setTabs = checked ? setTabsFromAllWindows : setTabsCurrentWindow;

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
    const date = new Date().toISOString().replace(/:/gi, "-");

    link.download = `links_${date}.txt`;
    link.href = `${DOWNLOAD_MIME}${encodeURIComponent(text)}`;
    link.click();
  };

  const updatePlaceholder = () => {
    if (useRegexpCheckbox.checked) {
      searchBox.placeholder = SEARCH_BY_REGEXP;
    } else {
      searchBox.placeholder = SEARCH_BY_TEXT;
    }
  };

  const toggleRegexpConfigHandler = () => {
    const useRegexp = !useRegexpCheckbox.checked;

    setStorage(STORAGE.CONFIG, { useRegexp }).catch((e) => {
      error("[Storage] Error updating config.useRegexp to:", useRegexp, e);
    });

    useRegexpCheckbox.checked = useRegexp;

    // Need to update the search
    searchHandler();
    updatePlaceholder();
  };

  const checkAllWindowsHandler = () => {
    const allWindows = !allWindowsCheckbox.checked;

    setStorage(STORAGE.CONFIG, { allWindows }).catch((e) => {
      error("[Storage] Error updating config.allWindows to:", allWindows, e);
    });

    allWindowsCheckbox.checked = allWindows;

    // Need to update the list
    getLinksHandler();
  };

  /**
   * Enable content editable in cell
	 * @param {MutationRecord[]} _mutationList List to observe
	 * @param {MutationObserver} _observer Observer
   */
  const enableContentEditable = (
		_mutationList,
		_observer,
  ) => {
    // Enable if there are items left and they are visible
    const enableEdit = !!document.querySelectorAll(VISIBLE_ROWS).length;

    txtArea.setAttribute(EDITABLE, enableEdit.toString());
    // observer.disconnect();
  };

  /**
   * Handle the search action.
   * Items not matching the query will be hidden.
   * Items matching the query will be visible.
   * Empty query means everything is visible
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

    // The simple filter is more straightforward but it lacks
    // filtering options like better negation support.
    // The option exist because regexp isn't easy and requires
    // you to know how to escape special characters.
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

  /**
   * @param {MouseEvent} evt
   */
  const onTabClick = (evt) => {
    const tab = /** @type {HTMLElement | null} */ (evt.target);
    if (!tab) {
      return;
    }

    const isOpenTab = tab.classList.contains(OPEN_PAGE);
    const [showClass, hideClass] = isOpenTab ? [OPEN_PAGE, COPY_PAGE] : [COPY_PAGE, OPEN_PAGE];

    // Set tab active
    tabContainer.querySelector(`.tab.${hideClass}`)?.classList.remove(ACTIVE_TAB);
    tabContainer.querySelector(`.tab.${showClass}`)?.classList.add(ACTIVE_TAB);

    // Set display tab
    document.querySelector(`.page.${hideClass}`)?.classList.add(HIDE);
    document.querySelector(`.page.${showClass}`)?.classList.remove(HIDE);
  };

  const onSelectedFile = async () => {
    const files = /** @type {File[]|null} */ (fileInput.files);
    if (!files || files?.length === 0) {
      // No selected files
      return;
    }

    let currText = openLinksArea.value || '';

    for (const file of files) {
      // Do not attempt to read from images
      if (file.type.startsWith('image/')) {
        continue;
      }

      try {
        const text = await file.text();
        currText = currText === '' ? text : `${currText}\n${text}`;
      } catch (err) {
        error(`[Read] Unable to read file: ${file.name}`, err);
      }
    }

    openLinksArea.value = currText;
  };

  /**
   * @param {number} time Sleep time in seconds
   */
  const sleep = (time = 1) => {
    return new Promise(/** @type {() => void} */(res) => {
      setTimeout(() => { res() }, time * 1000);
    });
  };

  const onOpenLinks = async () => {
    const text = openLinksArea.value;
    const lines = text.split("\n");
    for (const line of lines) {
      if (line === "" || IGNORED_LINES.some(comment => line.startsWith(comment))) {
        continue;
      }

      // Does not work
      // await chrome.tabs.create({ url: line  });
      await sleep();
    }
  };

  const onWindowsLoad = async () => {
    const { allWindows, useRegexp } = await getStorage(STORAGE.CONFIG);
    allWindowsCheckbox.checked = !!allWindows;
    useRegexpCheckbox.checked = !!useRegexp;

    // Mark first tab as current
    const tabs = Array.from(/** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.tab')));
    for (let i = 0; i < tabs.length; ++i) {
      const tab = tabs[i];
      tab.addEventListener(CLICK, onTabClick);
    }
    tabs[0].click();
    openLinksArea.value = "// Add your links here\n// lines starting with '//', '#', and ';'\n// will be ignored\n";

    setBrowserSpecificStyles();
    getLinksHandler();
    updatePlaceholder();
    searchBox.focus();
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
    openBtn.addEventListener(CLICK, onOpenLinks);
    fileInput.addEventListener(CHANGE, onSelectedFile);
    window.addEventListener(LOAD, onWindowsLoad);
    set_notification_handlers();
  };

  loadListeners();
})();
