'use strict';

const Controller = require('trails/controller');
const Boom = require('boom');
const Client = require('../models/Client');
const HelperService = require('../services/HelperService');
const ErrorService = require('../services/ErrorService');

/**
 * @module ClientController
 * @description Controller for Clients.
 */
module.exports = class ClientController extends Controller{

  create (request, reply) {
    Client
      .create(request.payload)
      .then((client) => {
        if (!client) {
          throw Boom.badRequest();
        }
        return reply(client);
      })
      .catch(err => {
        ErrorService.handle(err, request, reply);
      });
  }

  find (request, reply) {
    const options = HelperService.getOptionsFromQuery(request.query);
    const criteria = HelperService.getCriteriaFromQuery(request.query);

    if (request.params.id) {
      criteria._id = request.params.id;
      Client
        .findOne(criteria)
        .then(result => {
          if (!result) {
            throw Boom.notFound();
          }
          return reply(result);
        })
        .catch(err => {
          ErrorService.handle(err, request, reply);
        });
    }
    else {
      const query = HelperService.find(Client, criteria, options);
      let gresults = {};
      query
        .then((results) => {
          gresults = results;
          return Client.count(criteria);
        })
        .then((number) => {
          return reply(gresults).header('X-Total-Count', number);
        })
        .catch((err) => {
          ErrorService.handle(err, request, reply);
        });
    }
  }

  update (request, reply) {
    Client
      .findOneAndUpdate({ _id: request.params.id }, request.payload, {runValidators: true, new: true})
      .then((client) => {
        reply(client);
      })
      .catch(err => {
        ErrorService.handle(err, request, reply);
      });
  }

  destroy (request, reply) {
    Client
      .remove({ _id: request.params.id })
      .then(() => {
        reply().code(204);
      })
      .catch(err => {
        ErrorService.handle(err, request, reply);
      });
  }
};
