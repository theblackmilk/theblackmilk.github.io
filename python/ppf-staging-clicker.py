import sys
from telethon import TelegramClient, events

if len(sys.argv) >= 2:
  api_id = sys.argv[1]
  api_hash = sys.argv[2]

  client = TelegramClient('pantini', api_id, api_hash)

  @client.on(events.NewMessage("https://t.me/joinchat/HZLgHnK8TQAyZWQy"))
  async def new_message_event_handler(event):
    if event.message.buttons is not None:
      await event.message.click(0, 1)

  client.start()
  client.run_until_disconnected()
