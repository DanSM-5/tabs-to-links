// @ts-check

const OK = 'ok';
const OPEN_LINKS = 'open_links';
const IGNORED_LINES = ['//', '#', ';'];
const STATUS = {
  /** @type {'failure'} */
  FAILURE: 'failure',
  /** @type {'success'} */
  SUCCESS: 'success',
}

/**
 * @param {number} time Sleep time in seconds
 */
const sleep = (time = 1) => {
  return new Promise(/** @type {() => void} */(res) => {
    setTimeout(() => { res() }, time * 1000);
  });
};

/**
 * @param {string} text List of links in a single string
 * @param {number} delay Time to sleep between links being opened
 */
const openLinks = async (text, delay) => {
  const links = text.split("\n");
  for (const link of links) {
    if (link === "" || IGNORED_LINES.some(commentStart => link.startsWith(commentStart))) {
      continue;
    }

    await chrome.tabs.create({ url: link  });
    await sleep(delay);
  }
};

/**
 * @param {string} reason Reason for failure
 * @returns {BackgroundResponse<{ reason: string }>} Response message
 */
const getFailureResponse = (reason) => {
  /** @type {BackgroundResponse<{ reason: string; }>} */
  const response = {
    status: STATUS.FAILURE,
    payload: {
      reason,
    },
  }
  return response;
};

// Firefox (MV2) persistent background page. The popup talks to it through
// runtime.sendMessage (same as the Chrome worker), so the open-links loop runs
// here and keeps going after the popup closes when the first tab steals focus.
chrome.runtime.onMessage.addListener(
  /**
   * @param {Message|undefined} request
   * @param {chrome.runtime.MessageSender} _sender
   * @param {(response: BackgroundResponse) => void} sendResponse
   */
  (request, _sender, sendResponse) => {
    if (!request) {
      const reason = "No request in message";
      console.warn(reason);
      sendResponse(getFailureResponse(reason));
      return;
    }

    const { type } = request;

    switch (type) {
      case OPEN_LINKS: {
        const { links, delay } = /** @type {OpenLinksMessage['payload']} */ (request.payload);
        /** @type {BackgroundResponse<{ message: 'ok' }>} */
        const response = {
          status: STATUS.SUCCESS,
          payload: { message: OK },
        }

        // Respond synchronously, then run the loop detached from the popup.
        sendResponse(response);
        openLinks(links, delay);
        return;
      }
      default: {
        const reason = `No handler for type: ${type}`;
        console.warn(reason);
        sendResponse(getFailureResponse(reason));
        return;
      }
    }
  }
);
