
(_ => {
  const getBtn = document.querySelector("#get-btn");
  const cleanBtn = document.querySelector("#clean-btn");
  const copyBtn = document.querySelector("#copy-btn");
  const txtArea = document.querySelector("#txt-box");
  const tag = "[Tabs2Links]";
  const defaultIcon = "../img/question.png";

  const copyAction = string => {
    navigator.clipboard
      .writeText(string)
      .then(() => {
        console.log(`${tag} Copy successful!`);
      })
      .catch(() => {
        console.log(`${tag} An error occured :(`);
      });
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

    imageBtn.addEventListener("click", e => {
      copyAction(text.textContent);
    });

    closeBtn.addEventListener("click", e => {
      const parent = listItem.parentElement;
      parent.removeChild(listItem);
    });

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
  
  const getHandler = () => {
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
    getBtn.addEventListener("click", getHandler);
    cleanBtn.addEventListener("click", cleanHandler);
    copyBtn.addEventListener("click", copyHandler);
    window.addEventListener("load", getHandler);
  };

  load();
})();