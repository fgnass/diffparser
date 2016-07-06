/* eslint-env mocha */
import expect from 'unexpected';
import parse from '../src';

describe('diff parser', () => {
  it('should parse null', () => {
    expect(parse(null), 'to be empty');
  });

  it('should parse empty string', () => {
    expect(parse(''), 'to be empty');
  });

  it('should parse whitespace', () => {
    expect(parse(' '), 'to be empty');
  });

  it('should parse simple git-like diff', () => {
    const diff = `
diff --git a/file b/file
index 123..456 789
--- a/file
+++ b/file
@@ -1,2 +1,2 @@
- line1
+ line2
`;
    const files = parse(diff);
    expect(files, 'to have length', 1);
    const file = files[0];
    expect(file, 'to have properties', {
      from: 'file',
      to: 'file',
    });
    expect(file.chunks, 'to have length', 1);
    const chunk = file.chunks[0];
    expect(chunk.content, 'to be', '@@ -1,2 +1,2 @@');
    expect(chunk.changes, 'to have length', 2);
    expect(chunk.changes[0].content, 'to be', '- line1');
    expect(chunk.changes[0].position, 'to be', 1);
    expect(chunk.changes[1].content, 'to be', '+ line2');
    expect(chunk.changes[1].position, 'to be', 2);
  });

  it('should parse diff with new file mode line', () => {
    const diff = `
diff --git a/test b/test
new file mode 100644
index 0000000..db81be4
--- /dev/null
+++ b/test
@@ -0,0 +1,2 @@
+line1
+line2
`;
    const files = parse(diff);
    expect(files, 'to have length', 1);
    const file = files[0];
    expect(file.new, 'to be true');
    expect(file.from, 'to be', '/dev/null');
    expect(file.to, 'to be', 'test');

    const chunk = file.chunks[0];
    expect(chunk.content, 'to be', '@@ -0,0 +1,2 @@');
    expect(chunk.changes, 'to satisfy', [
      { content: '+line1', position: 1 },
      { content: '+line2', position: 2 },
    ]);
  });

  it('should parse diff with deleted file mode line', () => {
    const diff = `
diff --git a/test b/test
deleted file mode 100644
index db81be4..0000000
--- b/test
+++ /dev/null
@@ -1,2 +0,0 @@
-line1
-line2
`;
    const files = parse(diff);
    expect(files, 'to have length', 1);
    const file = files[0];
    expect(file.deleted, 'to be true');
    expect(file.from, 'to be', 'test');
    expect(file.to, 'to be', '/dev/null');
    const chunk = file.chunks[0];
    expect(chunk.content, 'to be', '@@ -1,2 +0,0 @@');
    expect(chunk.changes, 'to satisfy', [
      { content: '-line1', position: 1 },
      { content: '-line2', position: 2 },
    ]);
  });

  it('should parse diff with single line files', () => {
    const diff = `
diff --git a/file1 b/file1
deleted file mode 100644
index db81be4..0000000
--- b/file1
+++ /dev/null
@@ -1 +0,0 @@
-line1
diff --git a/file2 b/file2
new file mode 100644
index 0000000..db81be4
--- /dev/null
+++ b/file2
@@ -0,0 +1 @@
+line1
`;
    const files = parse(diff);
    expect(files, 'to have length', 2);

    const [f1, f2] = files;
    expect(f1.deleted, 'to be true');
    expect(f1.from, 'to be', 'file1');
    expect(f1.to, 'to be', '/dev/null');

    expect(f2.new, 'to be true');
    expect(f2.from, 'to be', '/dev/null');
    expect(f2.to, 'to be', 'file2');

    const c1 = f1.chunks[0];
    expect(c1.content, 'to be', '@@ -1 +0,0 @@');
    expect(c1.changes, 'to satisfy', [
      { content: '-line1', position: 1, type: 'del' },
    ]);
    const c2 = f2.chunks[0];
    expect(c2.content, 'to be', '@@ -0,0 +1 @@');
    expect(c2.changes, 'to satisfy', [
      { content: '+line1', position: 1, type: 'add' },
    ]);
  });

  it('should parse multiple files in diff', () => {
    const diff = `
diff --git a/file1 b/file1
index 123..456 789
--- a/file1
+++ b/file1
@@ -1,2 +1,2 @@
- line1
+ line2
diff --git a/file2 b/file2
index 123..456 789
--- a/file2
+++ b/file2
@@ -1,3 +1,3 @@
- line1
+ line2
`;
    const files = parse(diff);
    expect(files, 'to have length', 2);

    const [f1, f2] = files;
    expect(f1, 'to satisfy', { from: 'file1', to: 'file1' });
    expect(f2, 'to satisfy', { from: 'file2', to: 'file2' });

    const c1 = f1.chunks[0];
    expect(c1.content, 'to be', '@@ -1,2 +1,2 @@');
    expect(c1.changes, 'to satisfy', [
      { content: '- line1', position: 1 },
      { content: '+ line2', position: 2 },
    ]);

    const c2 = f2.chunks[0];
    expect(c2.content, 'to be', '@@ -1,3 +1,3 @@');
    expect(c2.changes, 'to satisfy', [
      { content: '- line1' },
      { content: '+ line2' },
    ]);
  });

  it('should parse gnu sample diff', () => {
    const diff = `
--- lao  2002-02-21 23:30:39.942229878 -0800
+++ tzu  2002-02-21 23:30:50.442260588 -0800
@@ -1,7 +1,6 @@
-The Way that can be told of is not the eternal Way;
-The name that can be named is not the eternal name.
 The Nameless is the origin of Heaven and Earth;
-The Named is the mother of all things.
+The named is the mother of all things.
+
 Therefore let there always be non-being,
  so we may see their subtlety,
And let there always be being,
@@ -9,3 +8,6 @@
 The two are the same,
 But after they are produced,
  they have different names.
+They both may be called deep and profound.
+Deeper and more profound,
+The door of all subtleties!
`;
    const files = parse(diff);
    expect(files, 'to have length', 1);

    const f = files[0];
    expect(f.from, 'to be', 'lao');
    expect(f.to, 'to be', 'tzu');
    expect(f.chunks, 'to have length', 2);

    const [c1, c2] = f.chunks;
    expect(c1, 'to satisfy', {
      oldStart: 1,
      oldLines: 7,
      newStart: 1,
      newLines: 6,
    });
    expect(c2, 'to satisfy', {
      oldStart: 9,
      oldLines: 3,
      newStart: 8,
      newLines: 6,
    });
  });

  it('should parse hg diff output', () => {
    const diff = `
diff -r 82e55d328c8c -r fef857204a0c hello.c
--- a/hello.c	Fri Aug 26 01:21:28 2005 -0700
+++ b/hello.c	Sat Aug 16 22:05:04 2008 +0200
@@ -11,6 +11,6 @@

 int main(int argc, char **argv)
 {
-	printf("hello, world!\n");
+	printf("hello, world!\");
 	return 0;
 }
`;
    const files = parse(diff);
    expect(files, 'to have length', 1);
    const f = files[0];
    expect(f.chunks[0].content, 'to be', '@@ -11,6 +11,6 @@');
    expect(f.from, 'to be', 'hello.c');
    expect(f.to, 'to be', 'hello.c');
  });

  it('should parse svn diff output', () => {
    const diff = `
Index: new.txt
===================================================================
--- new.txt	(revision 0)
+++ new.txt	(working copy)
@@ -0,0 +1 @@
+test
Index: text.txt
===================================================================
--- text.txt	(revision 6)
+++ text.txt	(working copy)
@@ -1,7 +1,5 @@
-This part of the
-document has stayed the
-same from version to
-version.  It shouldn't
+This is an important
+notice! It shouldn't
 be shown if it doesn't
 change.  Otherwise, that
 would not be helping to
`;
    const files = parse(diff);
    expect(files, 'to have length', 2);

    const f = files[0];
    expect(f, 'to satisfy', {
      from: 'new.txt',
      to: 'new.txt',
    });
    expect(f.chunks[0].changes, 'to have length', 1);
  });

  it('should parse file names for n new empty file', () => {
    const diff = `
diff --git a/newFile.txt b/newFile.txt
new file mode 100644
index 0000000..e6a2e28
`;
    const files = parse(diff);
    expect(files, 'to have length', 1);
    const f = files[0];
    expect(f, 'to satisfy', {
      from: '/dev/null',
      to: 'newFile.txt',
    });
  });

  it('should parse file names for a deleted file', () => {
    const diff = `
diff --git a/deletedFile.txt b/deletedFile.txt
deleted file mode 100644
index e6a2e28..0000000
`;
    const files = parse(diff);
    expect(files, 'to have length', 1);
    expect(files[0], 'to satisfy', {
      from: 'deletedFile.txt',
      to: '/dev/null',
    });
  });

  it('should detect renamed files', () => {
    const diff = `
diff --git a/bar b/bar
new file mode 100644
index 0000000..4e4b354
--- /dev/null
+++ b/bar
@@ -0,0 +1,2 @@
+this is a
+sample file
diff --git a/foo b/foo
deleted file mode 100644
index 4e4b354..0000000
--- a/foo
+++ /dev/null
@@ -1,2 +0,0 @@
-this is a
-sample file
`;
    const files = parse(diff, { findRenames: true });
    expect(files, 'to equal', [{
      renamed: true,
      from: 'foo',
      to: 'bar',
    }]);
  });
});
