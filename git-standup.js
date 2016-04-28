#!/usr/bin/env node
/*
Based on: https://github.com/kamranahmedse/git-standup/blob/master/git-standup
But written in JS.
*/

require(`babel-core/register`)
import yargs from 'yargs'
import chalk from 'chalk'
import git from 'nodegit'
import moment from 'moment'
import curry from 'lodash/fp/curry'

const argv = yargs
  .usage(`Usage: $0 <command> [options]`)
  .command(`standup`, `List the contributions of an author or authors for a given repo.`)
  .option(`author`, {
    alias: `a`,
    describe: `Filter by author`
  })
  .option(`days`, {
    alias: `d`,
    describe: `Filter by days ago`,
    default: 7
  })
  .alias(`days`, `day`)
  .option(`start`, {
    alias: `w`,
    describe: `Specify weekday range to filter results`
  })
  .alias(`start`, `s`)
  .help(`help`)
  .alias(`help`, `h`)
  .argv

const matchesAuthor = curry((args, authorObj) => {
  const toMatch = args.author
  const author = authorObj.name()
  const lowerAuthor = author.toLowerCase()
  if (toMatch === `all` || !toMatch) {
    return author
  }
  const email = authorObj.email().toLowerCase()
  // console.log(`author`, author, author.indexOf(toMatch))
  // console.log(`email`, email, email.indexOf(toMatch))
  // console.log(`toMatch`, toMatch)
  if (lowerAuthor.indexOf(toMatch) > -1 || email.indexOf(toMatch) > -1) {
    return toMatch
  }
})

const testAuthor = matchesAuthor(argv)
const endTime = moment()
const yesterday = endTime.subtract(1, `days`)
const startTime = endTime.subtract(argv.days, `days`)

console.log(chalk.blue(`argv`), argv)

git.Repository.open(`../lumen-frontend`)
  .then((repo) => repo.getMasterCommit())
  .then((firstCommit) => {
    const history = firstCommit.history()
    let count = 0
    const limit = 100
    history.on(`commit`, (commit) => {
      try {
        if (++count >= limit) {
          return
        }
        const name = testAuthor(commit.author())
        if (!name) {
          return
        }
        // const name = author.name()
        let message = commit.message()
        if (message.indexOf(`Merge`) === 0) {
          return
        }
        const newLineIndex = message.indexOf(`\n`)
        if (newLineIndex !== -1) {
          message = message.substr(0, newLineIndex)
        }
        const commitDate = moment(commit.date())
        if (commitDate.isSameOrAfter(startTime)) {
          let formattedDate = commitDate.calendar()
          if (yesterday.isBefore(commitDate)) {
            formattedDate = commitDate.fromNow()
          }
          console.log(
            chalk.yellow(commit.sha().substr(0, 8)),
            message,
            chalk.green(formattedDate),
            chalk.bgRed.white(name)
          )
        }
      } catch (e) {
        console.log(chalk.red(`Error during testing!`, e))
      }
    })
    history.start()
  })
