import {Post} from 'types/post'
import {PostProcessor, makePostProcessor} from 'types/postProcessor'
import PPE from 'types/postProcessorEnvironment'
import RNG from 'types/rng'

import escapeHtml from 'utils/escapeHtml'

import * as _ from 'lodash'

const izAuth = "iz"
const baseGroup = "base"
const baseRandGroup = "base/rand"

/*
 * Basic functionality
 */
// Seriously, don't disable this one
const htmlEscape = makePostProcessor(
  ["htmlEscape", izAuth, baseGroup],
  (post: Post, env: PPE) => {
    post.text = escapeHtml(post.text)
    return post
  }
)

/*
 * Die rolling and other randomized nicknacks 
 */
type Replacer = (substring: string, ...args: any[]) => string
type Env_Replacer = (env: PPE) => Replacer
type NameAuthGroup = [string, string, string]
function mkReplaceFn(id: string | NameAuthGroup, regex: RegExp, fn: Env_Replacer): PostProcessor {
  let processor: PostProcessor
  processor = _.assign((post: Post, ppe: PPE) => {
    post.text = post.text.replace(regex, fn(ppe))
    return post
  }, typeof id === 'string' ? {id: id} : {
    id: id[0],
    author: id[1],
    group: id[2],
  })
  return processor
}

const die = mkReplaceFn(
  ["die", izAuth, baseRandGroup],
  /#d(\d+)/g,
    (ppe: PPE) => (match: string, numSides: string): string => {
    let sides = Number(numSides)
    if (isNaN(sides)) {
      return `<span class="error-inline">A die can't have ${numSides} sides. How did you even do that?</span>`
    }
    let result = ppe.rng.nextRange(1, sides + 1)
    let final = `<span class="die-roll">${match}(${result})</span>`
    return final
  }
)

const dice = mkReplaceFn(
  ["dice", izAuth, baseRandGroup],
  /#(\d+)d(\d+)/g,
  (ppe: PPE) => (match: string, numDice: string, numSides: string) => {
    let dice = Number(numDice)
    let sides = Number(numSides)
    if (isNaN(dice) || isNaN(sides)) {
      return `
        <span class="error-inline">
          You can't throw ${numDice} ${numSides}-sided dice. How did you even do that?
        </span>`
    }
    let results = []
    for (let d = 0; d < dice; d++) {
      results.push(ppe.rng.nextRange(1, sides + 1))
    }
    let total = results.reduce((a,x) => a + x, 0)
    let final = `<span class="dice-roll">${match}(${results.join(" + ")} = ${total})</span>`
    return final
  }
)

/*
 * Export order is relative execution order.
 * Make htmlEscape is before processors that output html.
 */
export {
  htmlEscape,
  die,
  dice,
}
