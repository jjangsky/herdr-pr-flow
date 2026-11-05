import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDiff, commentTarget, withComments } from '../mods/pr-flow/diff.js';

const DIFF = `diff --git a/a.js b/a.js
--- a/a.js
+++ b/a.js
@@ -1,3 +1,3 @@ top
 keep
-old
+new
 end`;
const lines = parseDiff(DIFF)[0].lines;
const thread = (over) => ({ path: 'a.js', line: 2, diffSide: 'RIGHT', isResolved: false, isOutdated: false, comments: { nodes: [{ author: { login: 'dana' }, body: 'Fix\nthis' }] }, ...over });

test('commentTarget gives the line and side GitHub expects', () => {
  const [hunk, ctx, del, add] = lines;
  assert.equal(commentTarget(hunk), null);
  assert.deepEqual(commentTarget(ctx), { line: 1, side: 'RIGHT' });
  assert.deepEqual(commentTarget(del), { line: 2, side: 'LEFT' });
  assert.deepEqual(commentTarget(add), { line: 2, side: 'RIGHT' });
  assert.equal(commentTarget({ kind: 'comment', text: 'x' }), null);
});

test('withComments puts a thread under its line, on the right side', () => {
  const rows = withComments(lines, [thread()], 'a.js');
  const at = rows.findIndex((r) => r.kind === 'add');
  assert.deepEqual(rows.slice(at + 1, at + 4), [{ kind: 'comment-head', text: 'dana' }, { kind: 'comment', text: 'Fix' }, { kind: 'comment', text: 'this' }]);
  assert.equal(rows[rows.findIndex((r) => r.kind === 'del') + 1].kind, 'add');
});

test('withComments follows LEFT comments to the removed line', () => {
  const rows = withComments(lines, [thread({ diffSide: 'LEFT' })], 'a.js');
  assert.equal(rows[rows.findIndex((r) => r.kind === 'del') + 1].kind, 'comment-head');
});

test('withComments leaves out resolved, outdated and other files\' threads', () => {
  for (const over of [{ isResolved: true }, { isOutdated: true }, { path: 'b.js' }, { line: null }]) {
    assert.equal(withComments(lines, [thread(over)], 'a.js'), lines);
  }
});

test('withComments wraps long lines', () => {
  const rows = withComments(lines, [thread({ comments: { nodes: [{ author: { login: 'd' }, body: 'x'.repeat(25) }] } })], 'a.js', 10);
  assert.deepEqual(rows.filter((r) => r.kind === 'comment').map((r) => r.text.length), [10, 10, 5]);
});
