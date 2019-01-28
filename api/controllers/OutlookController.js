'use strict';

const Boom = require('boom');
const fs = require('fs');
const microsoftGraph = require('@microsoft/microsoft-graph-client');
const OutlookSync = require('../models/OutlookSync');
const List = require('../models/List');
const User = require('../models/User');
const ErrorService = require('../services/ErrorService');

/**
 * @module OutlookController
 * @description Generated Trails.js Controller.
 */
module.exports = {

  saveOutlookCredentials: function (request, reply) {
    const credentials = JSON.parse(fs.readFileSync('keys/outlook.json'));
    const oauth2 = require('simple-oauth2').create(credentials);
    if (request.payload.code && request.payload.redirectUri) {
      oauth2.authorizationCode.getToken({
        code: request.payload.code,
        redirect_uri: request.payload.redirectUri,
        scope: 'openid offline_access User.Read Contacts.ReadWrite'
      }, function (error, result) {
        if (error) {
          ErrorService.handle(error, request, reply);
        }
        else {
          const token = oauth2.accessToken.create(result);
          if (token && token.token && token.token.refresh_token) {
            request.params.currentUser.outlookCredentials = token.token;
            request.params.currentUser.save();
            reply().code(204);
          }
          else {
            const noRefreshToken = Boom.badRequest('No refresh token');
            ErrorService.handle(noRefreshToken, request, reply);
          }
        }
      });
    }
    else {
      return reply(Boom.badRequest());
    }
  },

  create: function (request, reply) {
    const appCreds = JSON.parse(fs.readFileSync('keys/outlook.json'));
    const oauth2 = require('simple-oauth2').create(appCreds);
    const credentials = request.params.currentUser.outlookCredentials;
    if (request.payload && request.payload.list) {
      let accessToken = '', client = {}, gList = {}, gOsync = {};
      OutlookSync
        .findOne({user: request.params.currentUser._id, list: request.payload.list})
        .then(sync => {
          if (sync) {
            throw Boom.conflict('Contact folder already exists');
          }
          return oauth2.accessToken.create({refresh_token: credentials.refresh_token}).refresh();
        })
        .then(res => {
          accessToken = res.token.access_token;
          // Create a Graph client
          client = microsoftGraph.Client.init({
            authProvider: (done) => {
              // Just return the token
              done(null, accessToken);
            }
          });
        })
        .then(() => {
          return List.findOne({_id: request.payload.list});
        })
        .then(list => {
          if (!list) {
            throw Boom.notFound();
          }
          gList = list;

          return client
            .api('/me/contactFolders')
            .post({
              displayName: gList.name
            });
        })
        .then(res => {
          // Create OutlookSync
          return OutlookSync
            .create({
              list: gList._id,
              user: request.params.currentUser._id,
              folder: res.id
            });
        })
        .then(osync => {
          const criteria = {};
          if (gList.isVisibleTo(request.params.currentUser)) {
            criteria[gList.type + 's'] = {$elemMatch: {list: gList._id, deleted: false}};
            if (!gList.isOwner(request.params.currentUser)) {
              criteria[gList.type + 's'].$elemMatch.pending = false;
            }
          }
          gOsync = osync;
          return User
            .find(criteria)
            .sort('name')
            .lean();
        })
        .then(users => {
          let promises = [];
          users.forEach(function (elt) {
            let emails = [];
            elt.emails.forEach(function (email) {
              emails.push({
                address: email.email,
                name: elt.name
              });
            });
            promises.push(client
              .api('/me/contactFolders/' + gOsync.folder + '/contacts')
              .post(gOsync.getContact(elt))
            );
          });
          return Promise.all(promises);
        })
        .then(data => {
          reply(gOsync);
        })
        .catch(err => {
          ErrorService.handle(err, request, reply);
        });
    }
    else {
      return reply(Boom.badRequest());
    }
  }

};
