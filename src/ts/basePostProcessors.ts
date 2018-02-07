import {Post} from 'types/post'
import {PostProcessor, makePostProcessor} from 'types/postProcessor'
import PPE from 'types/postProcessorEnvironment'
import RNG from 'types/rng'

import escapeHtml from 'utils/escapeHtml'

import {MAX_POST_TEXT_LENGTH, MAX_RAND_RANGE, MAX_RAND_OPS} from 'ts/constants'

import * as _ from 'lodash'

const izAuth = "iz"
const baseGroup = "base"
const baseRandGroup = "base/rand"

/*
 * Basic functionality
 */
// Seriously, don't disable this one
// Escapes user-entered html tags and special characters to prevent injection
const htmlEscape = makePostProcessor(
  ["htmlEscape", izAuth, baseGroup],
  (post) => {
    post.text = escapeHtml(post.text)
    return post
  }
)
// This operation must escape all text again, or may delete closing html tags.
// That means if the length limit is reached, formatting will be broken for the
// truncated post.
const limitLength = makePostProcessor(
  ["limitLength", izAuth, baseGroup],
  (post) => {
    if (post.text.length > MAX_POST_TEXT_LENGTH) {
      post.text = escapeHtml(post.text.substring(0, MAX_POST_TEXT_LENGTH))
      post.notes.push({
        type: 'WARNING',
        id: 'post-too-long',
        message: "This post was too long, and has been truncated to an acceptable length. Formatting has been lost."
      })
    }
    return post
  }
)

// Turn formatted post ids into links to that post
const postLink = makePostProcessor(
  ["postlink", izAuth, baseGroup],
  (post) => {
    post.text = post.text.replace(
      /(&gt;&gt;)([0-z]{46})(\s|$)/g,
      (match: string, prefix: string, postId: string, trailing: string): string => {
        post.notes.push({
          id: 'references-' + postId + "-" + Math.random(),
          type: "INFO",
          group: 'references',
          message: postId,
        })
        return `<a class="post-post-link" href="#post-${postId}">${prefix + postId}#${trailing}</a>`
      }
    )
    
    return post
  }
)

const quoteLine = makePostProcessor(
  ["quoteline", izAuth, baseGroup],
  (post) => {
    post.text = post.text.replace(
      /^&gt;(.*)$/gm,
      (match: string, quoted: string): string => {
        // Don't quote lines starting with two or more '>'
        if (quoted.startsWith('&gt;')) return match
        // otherwise wrap the line in a span with class 'quote'
        return `<span class="quote">${match}</span>`
      }
    )
    return post
  }
)

/*
 * Die rolling and other randomized nicknacks 
 */

const die = makePostProcessor(
  ["die", izAuth, baseRandGroup],
  (post, env) => {
    post.text = post.text.replace(
      /#d(\d+)/g,
      (match: string, numSides: string): string => {
        let sides = Number(numSides)
        if (isNaN(sides)) {
          post.notes.push({
            id: 'nan-sided-die',
            type: "ERROR",
            message: "The regex should prevent this, how did you do it?"
          })
          return `<span class="error-inline die-roll">${match}(wut)</span>`
        }
        if (sides > MAX_RAND_RANGE) {
          post.notes.push({
            id: 'large-die',
            type: "ERROR",
            message: "Cowardlily refusing to roll a die that large."
          })
          return `<span class="error-inline die-roll">${match}(the die crushes you under it's weight)</span>`
        }
        let result = env.rng.nextRange(1, sides + 1)
        let final = `<span class="die-roll">${match}(${result})</span>`
        return final
      }
    )
    return post
  }
)

const dice = makePostProcessor(
  ["dice", izAuth, baseRandGroup],
  (post, env) => {
    post.text = post.text.replace(
      /#(\d+)d(\d+)/g,
      (match: string, numDice: string, numSides: string): string => {
        let dice = Number(numDice)
        let sides = Number(numSides)
        if (isNaN(dice) || isNaN(sides)) {
          post.notes.push({
            id: 'invalid-dice',
            type: 'ERROR',
            message: "The regex should prevent this, how did you do it?"
          })
          return `<span class="error-inline dice-roll">${match}(wut)</span>`
        }
        if (sides > MAX_RAND_RANGE) {
          post.notes.push({
            id: 'large-dice',
            type: 'ERROR',
            message: "Cowardlily refusing to roll dice that large."
          })
          return `<span class="error-inline dice-roll">${match}(the first die crushes you under it's weight)</span>`
        }
        if (dice > MAX_RAND_OPS) {
          post.notes.push({
            id: 'many-dice',
            type: 'ERROR',
            message: "Cowardlily refusing to roll that many dice."
          })
          return `<span class="error-inline dice-roll">${match}(the dice spill everywhere - oddly, this does not constitute a roll)</span>`
        }
        if (dice * sides > MAX_RAND_RANGE) { // This is an imperfect measure of computational difficulty
          post.notes.push({
            id: 'some-medium-dice',
            type: 'ERROR',
            message: `Cowardlily refusing to roll ${dice} dice with ${sides} sides. (dice * sides = ${dice * sides})`
          })
          return `<span class="error-inline dice-roll">${match}(the dice collapse together into a miniature black hole, which promptly fizzles out)</span>`
        }
        let results = []
        for (let d = 0; d < dice; d++) {
          results.push(env.rng.nextRange(1, sides + 1))
        }
        let total = results.reduce((a,x) => a + x, 0)
        let final = `<span class="dice-roll">${match}(${results.join(" + ")} = ${total})</span>`
        return final
      
      }
    )
    return post
  }
)

/*
 * Export order is relative execution order.
 * Make sure that htmlEscape is before processors that output html, (so first)
 * and that limitLength is after processors that output html. (so last)
 */
export {
  // keep first
  htmlEscape,
  // the rest
  die,
  dice,
  quoteLine, // put before other '>' parsers
  postLink,
  // keep last
  limitLength
}
