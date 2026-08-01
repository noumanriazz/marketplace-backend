const Pusher = require("pusher");

let pusherClient = null;

/**
 * Returns a singleton Pusher client instance.
 * @returns {import("pusher")|null}
 */
const getPusher = () => {
  if (pusherClient) {
    return pusherClient;
  }

  const {
    PUSHER_APP_ID,
    PUSHER_KEY,
    PUSHER_SECRET,
    PUSHER_CLUSTER,
  } = process.env;

  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    console.warn("⚠️  Pusher is not fully configured. Real-time events are disabled.");
    return null;
  }

  pusherClient = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });

  return pusherClient;
};

/**
 * Triggers a Pusher event on a channel.
 * @param {string} channel
 * @param {string} event
 * @param {object} payload
 * @returns {Promise<void>}
 */
const triggerPusherEvent = async (channel, event, payload) => {
  const pusher = getPusher();

  if (!pusher) {
    return;
  }

  await pusher.trigger(channel, event, payload);
};

module.exports = {
  getPusher,
  triggerPusherEvent,
};
