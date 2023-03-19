
(_ => {
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
  ] = [
    "click",
    "load",
    "error",
  ];

  const copyAction = async string => {
      try {
        await navigator.clipboard.writeText(string)
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
    text.innerHTML = linkText;

    return text
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

    closeBtnContainer.appendChild(closeBtn)

    imageWrapper.appendChild(imageBtn);
    closeWrapper.appendChild(closeBtnContainer);

    item.appendChild(imageWrapper);
    item.appendChild(text);
    item.appendChild(closeWrapper);

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
      imageWrapper.removeEventListener(CLICK, onClickImgButton)
      closeWrapper.removeEventListener(CLICK, onClickCloseButton)
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

  // Original
  // const getTabsFromWindows = (cb, onEnd) => {
  //   // [Chrome Specific] - [FireFox support]
  //   chrome.windows.getAll({ populate: true }, windows => {
  //     windows.forEach(window => {
  //       window.tabs.forEach(cb);
  //     });
  //     onEnd();
  //   });
  // };

  const setTabsFromAllWindows = (cb, onEnd) => {
    // [Chrome Specific] - [FireFox support]
    chrome.windows.getAll({ populate: true }, windows => {
      windows.forEach(window => {
        window.tabs.forEach(cb);
      });
      onEnd();
    });
  };

  const setTabsCurrentWindow = (cb, onEnd) => {
    // [Chrome Specific] - [FireFox support]
    chrome.windows.getCurrent({ populate: true }, window => {
      window.tabs.forEach(cb);
      onEnd();
    });
  };

  const getAllTextLinks = () => Array
      .from(document.querySelectorAll(".row-link span"))
      .reduce((contentText, el) => {
        const itemText = el.innerText || "";

        // Prevent starting with break line
        return contentText ? `${contentText}\n${itemText}` : itemText; 
      }, "");

  const copyHandler = () => {
    const text = getAllTextLinks();
    // console.log("String: ", text);
    copyAction(text);
  };
  
  const getLinksHandler = () => {
    const list = document.createElement("ul");
    const forEachTab = tab => {
      const { url, favIconUrl } = tab;
      list.appendChild(formatLink(url, favIconUrl));
    };
    const onEnd = () => {
      txtArea.replaceChildren(list);
    };
    setTabsFromAllWindows(forEachTab, onEnd);
  };
  
  const cleanHandler = () => {
    txtArea.replaceChildren();
  };

  const load = () => {
    resetBtn.addEventListener(CLICK, getLinksHandler);
    cleanBtn.addEventListener(CLICK, cleanHandler);
    copyBtn.addEventListener(CLICK, copyHandler);
    window.addEventListener(LOAD, getLinksHandler);
  };

  load();
})();