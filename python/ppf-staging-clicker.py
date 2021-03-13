import sys
from telethon import TelegramClient, events

last_message_id = 0

if len(sys.argv) >= 2:
  api_id = sys.argv[1]
  api_hash = sys.argv[2]

  client = TelegramClient('pantini', api_id, api_hash)

  @client.on(events.NewMessage("https://t.me/joinchat/HZLgHnK8TQAyZWQy"))
  async def new_message_event_handler(event):
    global last_message_id

    if event.message.buttons is not None and event.message.id > last_message_id:
      last_message_id = event.message.id
      await event.message.click(0, 0)

  client.start()
  client.run_until_disconnected()
