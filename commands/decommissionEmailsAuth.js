/* eslint no-await-in-loop: "off", no-restricted-syntax: "off", no-console: "off" */
/* eslint func-names: "off" */
/**
 * @module decommissionEmailsAuth
 *
 * @description Sends an email to AUTH users notifying them that HIDv2 is
 * being decommissioned in January 2021.
 */
const { argv } = require('yargs');
const mongoose = require('mongoose');
const app = require('../');

const store = app.config.env[process.env.NODE_ENV].database.stores[process.env.NODE_ENV];
mongoose.connect(store.uri, store.options);

const User = require('../api/models/User');
const EmailService = require('../api/services/EmailService');

async function run() {
  const limit = argv.limit || 0;
  const locale = argv.locale || /.*/;

  const cursor = User
    .find({ authOnly: true, locale })
    .limit(limit)
    .cursor({ noCursorTimeout: true });

  // Send one email to each user we queried.
  for (let user = await cursor.next(); user !== null; user = await cursor.next()) {
    if (user.name && user.email) {
      await EmailService.sendDecommissionForAuthUsers(user);
    } else {
      console.log(`[Commands->decommissionEmailsAuth] Email NOT sent: user ${user._id} lacked name/email`);
    }
  }

  // When we are done queing emails, exit with status 0.
  process.exit();
}

(async function () {
  await run();
}()).catch((e) => {
  // If we catch any errors, print them and exit with status 1.
  console.log(e);
  process.exit(1);
});
