
(_ => {
  const getBtn = document.querySelector("#get-btn");
  const cleanBtn = document.querySelector("#clean-btn");
  const copyBtn = document.querySelector("#copy-btn");
  const txtArea = document.querySelector("#txt-box");
  const tag = "[Tabs2Links]";
  const defaultIcon = "../img/question.png";

  const formatLink = (img, link) => {
    return `<li class="row-link"><img class="image" src="${img ? img : defaultIcon}"/><span>${link}</span></li>`;
    // return `<li class="row-link"><div class="image" style="background-image: url(${img});"></div><span>${link}</span></li>`;
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
    const links = [];
    getTabsFromWindows(tab => { // cb
      const { url, favIconUrl } = tab;
      links.push(formatLink(favIconUrl, url));
    }, () => { // onEnd
      const linksString = links.join("\n");
      txtArea.innerHTML = `<ul>${linksString}</ul>`;
    });
  };
  
  const cleanHandler = () => {
    txtArea.innerHTML = "";
  };

  const load = () => {
    getBtn.addEventListener("click", getHandler);
    cleanBtn.addEventListener("click", cleanHandler);
    copyBtn.addEventListener("click", copyHandler);
    window.addEventListener("load", getHandler);
  };

  load();
})();