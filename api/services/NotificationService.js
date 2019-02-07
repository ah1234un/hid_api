'use strict';

const Boom = require('boom');
const async = require('async');
const Notification = require('../models/Notification');
const User = require('../models/User');
const EmailService = require('./EmailService');

/**
 * @module NotificationService
 * @description Service for notifications
 */
module.exports = {

  // Create notification and send email
  send: function (notification, callback) {
    const that = this;

    //this.log.debug('Sending a notification of type ' +
    //  notification.type + ' to user ' + notification.user.email);

    Notification
      .create(notification)
      .then(not => {
        return EmailService.sendNotification(notification);
      })
      .then(info => {
        return callback();
      })
      .catch(err => {
        //that.log.error('Error creating a notification', { error: err });
        return callback(Boom.badImplementation());
      });
  },

  // Create notification and send email to multiple users
  sendMultiple: function (users, notification, callback) {
    const that = this;
    this._transformUsers(users, function (items) {
      that._sendMultipleHelper(items, notification, callback);
    });
  },

  // Transform user IDs in users if needed
  _transformUsers: function (users, callback) {
    let areUsers = true;
    for (let i = 0, len = users.length; i < len; i++) {
      if (users[i].constructor.name === 'ObjectID') {
        areUsers = false;
      }
    }
    if (!areUsers) {
      User
        .find({_id: { $in: users}})
        .then((items) => {
          callback(items);
        });
    }
    else {
      callback(users);
    }
  },

  // Helper function to send multiple emails and notifications
  _sendMultipleHelper: function (users, notification, callback) {
    const that = this;
    async.eachSeries(users, function (user, next) {
      notification.user = user;
      that.send(notification, next);
    }, callback);
  },

  // Create only a notification, without sending an email
  notify: function (notification, callback) {
    const that = this;

    //this.log.debug('Sending a notification of type ' +
    //  notification.type + ' to user ' + notification.user.email);

    Notification.create(notification, function (err, not) {
      if (err) {
        //that.log.error('Error creating a notification.', { error: err });
        return callback(Boom.badImplementation());
      }
      return callback();
    });
  },

  notifyMultiple: function (users, notification, callback) {
    const that = this;
    this._transformUsers(users, function (items) {
      async.eachSeries(items, function(user, next) {
        notification.user = user;
        that.notify(notification, next);
      }, callback);
    });
  }

};
