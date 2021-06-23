
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
    const image = document.createElement("img");
    const closeBtn = document.createElement("button");

    item.classList.add("row-link");
    image.classList.add("image");
    closeBtn.classList.add("close-button");

    item.appendChild(image);
    item.appendChild(text);
    item.appendChild(closeBtn);

    return [ item, image, text, closeBtn ];
  };

  const formatLink = (img, link) => {
    const [ listItem, image, text, closeBtn ] = createItemsForList();
    image.src = img ? img : defaultIcon;
    text.innerHTML = link;

    image.addEventListener("click", e => {
      copyAction(text.textContent);
    });

    closeBtn.addEventListener("click", e => {
      const parent = listItem.parentElement;
      parent.removeChild(listItem);
    });

    return listItem;
  };

  const getTabsFromWindows = (cb, onEnd) => {
    // [Chrome Specific]
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