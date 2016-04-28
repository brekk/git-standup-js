#!/usr/bin/env node
'use strict';

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _nodegit = require('nodegit');

var _nodegit2 = _interopRequireDefault(_nodegit);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _curry = require('lodash/fp/curry');

var _curry2 = _interopRequireDefault(_curry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
Based on: https://github.com/kamranahmedse/git-standup/blob/master/git-standup
But written in JS.
*/

require('babel-core/register');


var argv = _yargs2.default.usage('Usage: $0 <command> [options]').command('standup', 'List the contributions of an author or authors for a given repo.').option('author', {
  alias: 'a',
  describe: 'Filter by author'
}).option('days', {
  alias: 'd',
  describe: 'Filter by days ago',
  default: 7
}).alias('days', 'day').option('start', {
  alias: 'w',
  describe: 'Specify weekday range to filter results'
}).alias('start', 's').help('help').alias('help', 'h').argv;

var matchesAuthor = (0, _curry2.default)(function (args, authorObj) {
  var toMatch = args.author;
  var author = authorObj.name();
  var lowerAuthor = author.toLowerCase();
  if (toMatch === 'all' || !toMatch) {
    return author;
  }
  var email = authorObj.email().toLowerCase();
  // console.log(`author`, author, author.indexOf(toMatch))
  // console.log(`email`, email, email.indexOf(toMatch))
  // console.log(`toMatch`, toMatch)
  if (lowerAuthor.indexOf(toMatch) > -1 || email.indexOf(toMatch) > -1) {
    return toMatch;
  }
});

var testAuthor = matchesAuthor(argv);
var endTime = (0, _moment2.default)();
var yesterday = endTime.subtract(1, 'days');
var startTime = endTime.subtract(argv.days, 'days');

console.log(_chalk2.default.blue('argv'), argv);

_nodegit2.default.Repository.open('../lumen-frontend').then(function (repo) {
  return repo.getMasterCommit();
}).then(function (firstCommit) {
  var history = firstCommit.history();
  var count = 0;
  var limit = 100;
  history.on('commit', function (commit) {
    try {
      if (++count >= limit) {
        return;
      }
      var name = testAuthor(commit.author());
      if (!name) {
        return;
      }
      // const name = author.name()
      var message = commit.message();
      if (message.indexOf('Merge') === 0) {
        return;
      }
      var newLineIndex = message.indexOf('\n');
      if (newLineIndex !== -1) {
        message = message.substr(0, newLineIndex);
      }
      var commitDate = (0, _moment2.default)(commit.date());
      if (commitDate.isSameOrAfter(startTime)) {
        var formattedDate = commitDate.calendar();
        if (yesterday.isBefore(commitDate)) {
          formattedDate = commitDate.format('ddd, h:ma');
        }
        console.log(_chalk2.default.yellow(commit.sha().substr(0, 8)), message, _chalk2.default.green(formattedDate), _chalk2.default.bgRed.white(name));
      }
    } catch (e) {
      console.log(_chalk2.default.red('Error during testing!', e));
    }
  });
  history.start();
});
