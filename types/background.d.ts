type MessageTypes = 
  | 'open_links';

type Status =
  | 'success'
  | 'failure'

interface Message<T = any> {
  type: MessageTypes;
  payload: T;
}

interface BackgroundResponse<T = any> {
  status: Status;
  payload: T;
}
