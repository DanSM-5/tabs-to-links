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

    // Does not work
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

chrome.runtime.onMessage.addListener(
  /**
   * @param {Message|undefined} request
   * @param {(response: BackgroundResponse) => void} sendResponse
   */
  async (request, _sender, sendResponse) => {
    if (!request) {
      const reason = "No request in message";
      console.warn(reason);
      return sendResponse(getFailureResponse(reason));
    }

    const { type } =  request;

    switch (type) {
      case OPEN_LINKS: {
        const { links, delay } = /** @type {OpenLinksMessage['payload']} */ (request.payload);
        /** @type {BackgroundResponse<{ message: 'ok' }>} */
        const response = {
          status: STATUS.SUCCESS,
          payload: { message: OK },
        }

        sendResponse(response);
        await openLinks(links, delay);
        return;
      }
      default: {
        const reason = `No handler for type: ${type}`;
        console.warn(reason);
        return sendResponse(getFailureResponse(reason));
      }
    }
  }
);
