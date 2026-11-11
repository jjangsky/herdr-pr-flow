import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newer, due, parseRelease, offer, updatePrompt, CHECK_EVERY_MS } from '../mods/pr-flow/update.js';
import { VERSION } from '../mods/pr-flow/version.js';

test('the mod knows the version in package.json', () => {
  assert.equal(VERSION, JSON.parse(readFileSync(new URL('../package.json', import.meta.url))).version);
});

test('newer compares each part as a number', () => {
  assert.equal(newer('v0.10.0', '0.9.9'), true);
  assert.equal(newer('v0.5.1', '0.5.0'), true);
  assert.equal(newer('v0.5.0', '0.5.0'), false);
  assert.equal(newer('v0.4.9', '0.5.0'), false);
  assert.equal(newer('v1', '0.9.9'), true);
});

test('due asks once a day, never when turned off', () => {
  const now = 10 * CHECK_EVERY_MS;
  assert.equal(due({}, now), true);
  assert.equal(due({ checked: now - CHECK_EVERY_MS + 1 }, now), false);
  assert.equal(due({ checked: now - CHECK_EVERY_MS }, now), true);
  assert.equal(due({ off: true }, now), false);
});

test('parseRelease keeps tag, notes and a link into this repo', () => {
  assert.deepEqual(parseRelease({ tag_name: 'v0.6.0', body: 'notes', html_url: 'https://github.com/jjangsky/herdr-pr-flow/releases/tag/v0.6.0' }),
    { tag: 'v0.6.0', notes: 'notes', url: 'https://github.com/jjangsky/herdr-pr-flow/releases/tag/v0.6.0' });
  assert.equal(parseRelease({ tag_name: 'v0.6.0', html_url: 'https://evil.example/x' }).url, 'https://github.com/jjangsky/herdr-pr-flow/releases');
  assert.equal(parseRelease({ tag_name: 'v0.6.0', prerelease: true }), null);
  assert.equal(parseRelease({ message: 'Not Found' }), null);
  assert.equal(parseRelease(null), null);
});

test('offer shows a newer release until it is put off or turned off', () => {
  const latest = { tag: 'v0.6.0', notes: '', url: '' };
  assert.equal(offer({ latest }, '0.5.0'), latest);
  assert.equal(offer({ latest }, '0.6.0'), null);
  assert.equal(offer({ latest, dismissed: 'v0.6.0' }, '0.5.0'), null);
  assert.equal(offer({ latest: { ...latest, tag: 'v0.7.0' }, dismissed: 'v0.6.0' }, '0.5.0')?.tag, 'v0.7.0');
  assert.equal(offer({ latest, off: true }, '0.5.0'), null);
  assert.equal(offer({}, '0.5.0'), null);
});

test('updatePrompt names the repo in both languages', () => {
  assert.match(updatePrompt('en'), /github\.com\/jjangsky\/herdr-pr-flow/);
  assert.match(updatePrompt('ko'), /github\.com\/jjangsky\/herdr-pr-flow/);
});
