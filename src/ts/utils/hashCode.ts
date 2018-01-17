/*
 * Stolen shamelessly from http://www.erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
 * This should exactly replicate Java's String.hashCode()
 */

export default function(str: string): number {
  let hash = 0;
  if (str.length == 0) return hash;
  for (let i = 0; i < str.length; i++) {
      let char = str.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
      hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}