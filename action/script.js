
(_ => {
  const resetBtn = document.querySelector("#reset-btn");
  const cleanBtn = document.querySelector("#clean-btn");
  const copyBtn = document.querySelector("#copy-btn");
  const txtArea = document.querySelector("#txt-box");
  const tag = "[Tabs2Links]";
  const defaultIcon = "../img/question.png";
  const [
    CLICK,
    LOAD,
  ] = [
    "click",
    "load",
  ];

  const copyAction = async string => {
      try {
        await navigator.clipboard.writeText(string)
        console.log(`${tag} Copy successful!`);
      } catch (error) {
        console.log(`${tag} An error occured :(`);
      }
  }

  const createItemsForList = () => {
    const item = document.createElement("li");
    const text = document.createElement("span");
    const imageBtn = document.createElement("button");
    const closeBtn = document.createElement("button");

    item.classList.add("row-link");
    imageBtn.classList.add("tab-icon");
    closeBtn.classList.add("close-button");

    imageBtn.contentEditable = false;

    item.appendChild(imageBtn);
    item.appendChild(text);
    item.appendChild(closeBtn);

    return [ item, imageBtn, text, closeBtn ];
  };

  const formatLink = (img, link) => {
    const imageUrl = img ? img : defaultIcon;
    const [ listItem, imageBtn, text, closeBtn ] = createItemsForList();
    imageBtn.style.backgroundImage = `url(${imageUrl})`;
    text.innerHTML = link;

    const imgClickHandler = e => {
      copyAction(text.textContent);
    };

    const clsBtnClickHandler = e => {
      const parent = listItem.parentElement;
      imageBtn.removeEventListener(CLICK, imgClickHandler)
      closeBtn.removeEventListener(CLICK, clsBtnClickHandler)
      parent.removeChild(listItem);
    };

    imageBtn.addEventListener(CLICK, imgClickHandler);
    closeBtn.addEventListener(CLICK, clsBtnClickHandler);

    return listItem;
  };

  const getTabsFromWindows = (cb, onEnd) => {
    // [Chrome Specific] - [FireFox support]
    chrome.windows.getAll({ populate: true }, windows => {
      windows.forEach(window => {
        window.tabs.forEach(cb);
      });
      onEnd();
    });
  };

  const getTextLinks = () => Array
      .from(document.querySelectorAll(".row-link span"))
      .map(e => e.innerText)
      .reduce((acc, curr) => !!acc ? `${acc}\n${curr}` : curr, "");

  const copyHandler = () => {
    const text = getTextLinks();
    console.log("String: ", text);
    copyAction(text);
  };
  
  const getLinksHandler = () => {
    const list = document.createElement("ul");
    const forEachTab = tab => {
      const { url, favIconUrl } = tab;
      list.appendChild(formatLink(favIconUrl, url));
    };
    const onEnd = () => {
      txtArea.replaceChildren(list);
    };
    getTabsFromWindows(forEachTab, onEnd);
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