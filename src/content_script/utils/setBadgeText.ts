import type {
  ChromeMessage,
  ChromeMessageBody,
  ChromeResponse,
} from '@/types/chrome/message'

const queue: ChromeMessage<'chrome:badge'>[] = []
let running: Promise<ChromeResponse> | null = null

const run = (message?: ChromeMessage<'chrome:badge'>) => {
  if (message) {
    running = chrome.runtime
      .sendMessage(message)
      .finally(() => run(queue.shift()))
  } else {
    running = null
  }
}

export const setBadgeText = (body: ChromeMessageBody['chrome:badge']) => {
  const message: ChromeMessage<'chrome:badge'> = {
    type: 'chrome:badge',
    body: body,
  }

  if (running) {
    queue.push(message)
  } else {
    run(message)
  }
}
