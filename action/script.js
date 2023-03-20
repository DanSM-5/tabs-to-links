
(_ => {
  const allWindowsCheckbox = document.querySelector("#all-windows");
  const allWindowsBtn = document.querySelector("#all-windows-btn");
  const searchBox = document.querySelector("#search-box");
  const searchBtn = document.querySelector("#search-btn");
  const resetBtn = document.querySelector("#reset-btn");
  const cleanBtn = document.querySelector("#clean-btn");
  const copyBtn = document.querySelector("#copy-btn");
  const txtArea = document.querySelector("#txt-box");
  const TAG = "[Tabs2Links]";
  const defaultIcon = "../img/question.png";
  const [
    CLICK,
    LOAD,
    ERROR,
    HIDE,
    REMOVE,
    ADD,
    KEYUP,
  ] = [
    "click",
    "load",
    "error",
    "hide",
    "remove",
    "add",
    "keyup",
  ];
  const STORAGE = {
    CONFIG: "config",
  };

  let searchTimer = -1;

  // TODO: Add message for no results?
  // TODO: Need to improve search. Add basic search.
  // Regex will do for now.
  const filterItems = (input) => {
    document.querySelectorAll(".row-link").forEach(item => {
      const text = item.children[1];
      let method = REMOVE;
      // TODO: Not sure if regex could throw exception.
      try {
        const searchPatter = new RegExp(input);

        if (!searchPatter.test(text.textContent)) {
          method = ADD;
        }
        
      } catch (error) {
        if (!text.textContent.includes(input)) {
          method = ADD;
        }
      }

      item.classList[method](HIDE);
    });
  };

  const setAllVisible = () => {
    document.querySelectorAll(".row-link")
      .forEach(i => i.classList.remove(HIDE));
  };

  const copyAction = async string => {
    try {
      await navigator.clipboard.writeText(string);
    } catch (error) {
      console.warn(`${TAG} Unable to copy text in clipboard.`);
    }
  }

  const getImageButton = (url) => {
    const imageBtn = document.createElement("button");

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
    const text = document.createElement("span");
    text.textContent = linkText;

    return text;
  };

  const createItemForList = (linkText, imageUrl) => {
    // HTML elements
    const text = getTextContainer(linkText);
    const imageBtn = getImageButton(imageUrl);
    const item = document.createElement("li");
    const imageWrapper = document.createElement("div");
    const closeBtn = document.createElement("button");
    const closeBtnContainer = document.createElement("div");
    const closeWrapper = document.createElement("div");

    closeBtnContainer.appendChild(closeBtn);

    imageWrapper.appendChild(imageBtn);
    closeWrapper.appendChild(closeBtnContainer);

    item.replaceChildren(imageWrapper, text, closeWrapper);

    // CSS styling
    item.classList.add("row-link");
    imageBtn.classList.add("tab-icon");
    closeBtn.classList.add("close-button");
    closeBtnContainer.classList.add("close-button-container");
    imageWrapper.classList.add("button-wrapper");
    closeWrapper.classList.add("button-wrapper");

    // Event Handlers
    const onClickImgButton = e => {
      copyAction(text.textContent);
    };

    const onClickCloseButton = e => {
      const parent = item.parentElement;
      imageWrapper.removeEventListener(CLICK, onClickImgButton);
      closeWrapper.removeEventListener(CLICK, onClickCloseButton);
      parent.removeChild(item);
    };

    imageWrapper.addEventListener(CLICK, onClickImgButton);
    closeWrapper.addEventListener(CLICK, onClickCloseButton);

    // Prevent editting buttons elements and wrappers
    imageBtn.contentEditable = false;
    closeBtn.contentEditable = false;
    imageWrapper.contentEditable = false;
    closeWrapper.contentEditable = false;

    return { item, imageBtn, text, closeBtn, imageWrapper, closeWrapper };
  };

  const formatLink = (linkText, imageUrl) => {
    const { item } = createItemForList(linkText, imageUrl);

    return item;
  };

  const getStorage = (key) => {
    return new Promise(resolve => {
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

  const getAllTextLinks = () => document
    .querySelectorAll(".row-link:not(.hide) span")
    .reduce((contentText, el) => {
      const itemText = el.innerText || "";

      // Prevent starting with break line
      return contentText ? `${contentText}\n${itemText}` : itemText; 
    }, "");

  const copyHandler = () => {
    const text = getAllTextLinks();
    copyAction(text);
  };
  
  const getLinksHandler = async () => {
    const list = document.createElement("ul");
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
  
  const cleanHandler = () => {
    txtArea.replaceChildren();
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

  const searchHandler = () => {
    const input = searchBox.value;
    if (!input || input.length === 0) {
      setAllVisible();

      return;
    }

    filterItems(input);
  };

  const debouncedSearch = () => {
    if (searchTimer !== -1) {
      clearTimeout(searchTimer);
    }

    searchTimer = setTimeout(() => {
      searchTimer = -1;
      searchHandler();
    }, 300);
  };

  const setObserverTxtArea = () => {
    const config = { childList: true, subtree: true };

    // Remove content editable if there is nore more items
    const callback = (mutationList, observer) => {
      // TODO: Fix bug if all items are hidden from result
      // text area will still be editable.
      txtArea.setAttribute(
        "contenteditable",
        !!txtArea.children?.[0]?.childElementCount,
      );
    };

    const observer = new MutationObserver(callback);

    observer.observe(txtArea, config);
  };

  const onWindowsLoad = async () => {
    const { checked } = await getStorage(STORAGE.CONFIG);
    allWindowsCheckbox.checked = !!checked;

    getLinksHandler();
    setObserverTxtArea();
  };

  const loadListeners = () => {
    searchBox.addEventListener(KEYUP, debouncedSearch);
    searchBtn.addEventListener(CLICK, searchHandler);
    allWindowsBtn.addEventListener(CLICK, checkAllWindowsHandler);
    resetBtn.addEventListener(CLICK, getLinksHandler);
    cleanBtn.addEventListener(CLICK, cleanHandler);
    copyBtn.addEventListener(CLICK, copyHandler);
    window.addEventListener(LOAD, onWindowsLoad);
  };

  loadListeners();
})();