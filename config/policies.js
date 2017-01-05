/**
 * Policies Configuration
 * (app.config.footprints)
 *
 * Define which prerequisites a request must pass before reaching the intended
 * controller action. By default, no policies are configured for controllers or
 * footprints, therefore the request always will directly reach the intended
 * handler.
 *
 * @see http://trailsjs.io/doc/config/policies
 */

'use strict';

module.exports = {

  FootprintController: ['AuthPolicy.isAuthenticated'],

  ClientController: ['AuthPolicy.isAdmin'],

  ServiceController: {
    create: ['AuthPolicy.isAuthenticated'],
    find: ['AuthPolicy.isAuthenticated'],
    update: ['AuthPolicy.isAdminOrServiceOwner'],
    destroy: ['AuthPolicy.isAdminOrServiceOwner'],
    mailchimpLists: ['AuthPolicy.isAuthenticated'],
    googleGroups: ['AuthPolicy.isAuthenticated'],
    subscribe: ['AuthPolicy.isAdminOrCurrent'],
    unsubscribe: ['AuthPolicy.isAdminOrCurrent']
  },

  ServiceCredentialsController: ['AuthPolicy.isAuthenticated'],

  UserController: {
    showAccount: [ 'AuthPolicy.isAuthenticated'],
    create: [ 'AuthPolicy.isAuthenticated' ],
    find: ['AuthPolicy.isAuthenticated'],
    update: ['AuthPolicy.isAdminOrCurrent'],
    destroy: ['AuthPolicy.isAdminOrCurrent'],
    notify: ['AuthPolicy.isAuthenticated'],
    checkin: ['AuthPolicy.isAdminOrCurrent'],
    checkout: ['AuthPolicy.isAdminOrCurrent'],
    resetPassword: [ ],
    claimEmail: [ 'AuthPolicy.isAdminOrCurrent'],
    updatePicture: [ 'AuthPolicy.isAdminOrCurrent' ],
    addEmail: [ 'AuthPolicy.isAdminOrCurrent' ],
    setPrimaryEmail: [ 'AuthPolicy.isAdminOrCurrent' ],
    validateEmail: [ ],
    dropEmail: [ 'AuthPolicy.isAdminOrCurrent' ],
    addPhone: [ 'AuthPolicy.isAdminOrCurrent' ],
    dropPhone: [ 'AuthPolicy.isAdminOrCurrent' ],
    setPrimaryPhone: ['AuthPolicy.isAdminOrCurrent' ],
    setPrimaryOrganization: ['AuthPolicy.isAdminOrCurrent']
  },

  NotificationController: ['AuthPolicy.isAuthenticated'],

  ListController: ['AuthPolicy.isAuthenticated'],

  DefaultController: {
    info: [ ]
  }

};
