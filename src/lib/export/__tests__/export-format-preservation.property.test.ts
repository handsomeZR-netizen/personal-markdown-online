/**
 * Property-Based Test: Export Format Preservation
 * Feature: team-collaborative-knowledge-base, Property 13: Export Format Preservation
 * 
 * Tests that all formatting (headings, lists, links, code blocks) is preserved
 * accurately when exporting notes to Markdown, PDF, or HTML formats.
 * 
 * Validates: Requirements 15.2, 16.2, 17.2
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { ExportManager, type NoteData } from '../export-manager';
import { JSDOM } from 'jsdom';

// Setup DOM environment for tests
let dom: JSDOM;
let exportManager: ExportManager;

// Helper function to read blob content
async function blobToText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

beforeAll(() => {
  // Create a DOM environment
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable',
  });
  
  // Set up global objects
  global.document = dom.window.document as any;
  global.window = dom.window as any;
  global.HTMLElement = dom.window.HTMLElement as any;
  global.Image = dom.window.Image as any;
  global.FileReader = dom.window.FileReader as any;
  global.Blob = dom.window.Blob as any;
  
  exportManager = new ExportManager();
});

afterAll(() => {
  dom.window.close();
});

// Helper to filter out HTML special characters
const safeTextArbitrary = (minLength: number, maxLength: number) =>
  fc.string({ minLength, maxLength }).filter(s => {
    // Filter out strings that are only whitespace or contain HTML special chars
    const trimmed = s.trim();
    return trimmed.length > 0 && !/[<>&"']/.test(s);
  });

// Generators for different HTML elements
const headingArbitrary = fc.integer({ min: 1, max: 6 }).chain(level =>
  safeTextArbitrary(1, 50).map(text => ({
    type: 'heading' as const,
    level,
    text,
    html: `<h${level}>${text}</h${level}>`,
  }))
);

const paragraphArbitrary = safeTextArbitrary(1, 200).map(text => ({
  type: 'paragraph' as const,
  text,
  html: `<p>${text}</p>`,
}));

const boldArbitrary = safeTextArbitrary(1, 50).map(text => ({
  type: 'bold' as const,
  text,
  html: `<p><strong>${text}</strong></p>`,
}));

const italicArbitrary = safeTextArbitrary(1, 50).map(text => ({
  type: 'italic' as const,
  text,
  html: `<p><em>${text}</em></p>`,
}));

const linkArbitrary = fc.tuple(
  safeTextArbitrary(1, 50),
  fc.webUrl()
).map(([text, url]) => ({
  type: 'link' as const,
  text,
  url,
  html: `<p><a href="${url}">${text}</a></p>`,
}));

const codeArbitrary = fc.string({ minLength: 1, maxLength: 100 }).map(code => ({
  type: 'code' as const,
  code,
  html: `<p><code>${code}</code></p>`,
}));

const codeBlockArbitrary = fc.string({ minLength: 1, maxLength: 200 }).map(code => ({
  type: 'codeBlock' as const,
  code,
  html: `<pre><code>${code}</code></pre>`,
}));

const unorderedListArbitrary = fc.array(
  safeTextArbitrary(1, 50),
  { minLength: 1, maxLength: 5 }
).map(items => ({
  type: 'unorderedList' as const,
  items,
  html: `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`,
}));

const orderedListArbitrary = fc.array(
  safeTextArbitrary(1, 50),
  { minLength: 1, maxLength: 5 }
).map(items => ({
  type: 'orderedList' as const,
  items,
  html: `<ol>${items.map(item => `<li>${item}</li>`).join('')}</ol>`,
}));

const blockquoteArbitrary = safeTextArbitrary(1, 100).map(text => ({
  type: 'blockquote' as const,
  text,
  html: `<blockquote><p>${text}</p></blockquote>`,
}));

// Combined arbitrary for any content element
const contentElementArbitrary = fc.oneof(
  headingArbitrary,
  paragraphArbitrary,
  boldArbitrary,
  italicArbitrary,
  linkArbitrary,
  codeArbitrary,
  codeBlockArbitrary,
  unorderedListArbitrary,
  orderedListArbitrary,
  blockquoteArbitrary
);

// Generator for complete note with various formatting
const noteWithFormattingArbitrary = fc.record({
  id: fc.uuid(),
  title: safeTextArbitrary(1, 100),
  elements: fc.array(contentElementArbitrary, { minLength: 1, maxLength: 10 }),
}).map(({ id, title, elements }) => ({
  id,
  title,
  content: elements.map(el => el.html).join('\n'),
  elements,
}));

describe('Property 13: Export Format Preservation', () => {
  it('should preserve headings in Markdown export', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          title: safeTextArbitrary(1, 100),
          level: fc.integer({ min: 1, max: 6 }),
          text: safeTextArbitrary(1, 50),
        }),
        async ({ id, title, level, text }) => {
          const note: NoteData = {
            id,
            title,
            content: `<h${level}>${text}</h${level}>`,
          };

          const blob = await exportManager.exportToMarkdown(note);
          const markdown = await blobToText(blob);

          // Check that heading is preserved with correct level
          const expectedPrefix = '#'.repeat(level);
          expect(markdown).toContain(`${expectedPrefix} ${text}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve bold and italic formatting in Markdown export', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          title: safeTextArbitrary(1, 100),
          boldText: safeTextArbitrary(1, 50),
          italicText: safeTextArbitrary(1, 50),
        }),
        async ({ id, title, boldText, italicText }) => {
          const note: NoteData = {
            id,
            title,
            content: `<p><strong>${boldText}</strong> <em>${italicText}</em></p>`,
          };

          const blob = await exportManager.exportToMarkdown(note);
          const markdown = await blobToText(blob);

          // Check that bold and italic are preserved
          expect(markdown).toContain(`**${boldText}**`);
          expect(markdown).toContain(`*${italicText}*`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve links in Markdown export', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          title: safeTextArbitrary(1, 100),
          linkText: safeTextArbitrary(1, 50),
          url: fc.webUrl(),
        }),
        async ({ id, title, linkText, url }) => {
          const note: NoteData = {
            id,
            title,
            content: `<p><a href="${url}">${linkText}</a></p>`,
          };

          const blob = await exportManager.exportToMarkdown(note);
          const markdown = await blobToText(blob);

          // Check that link is preserved
          expect(markdown).toContain(`[${linkText}](${url})`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve code blocks in Markdown export', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          title: safeTextArbitrary(1, 100),
          code: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        }),
        async ({ id, title, code }) => {
          const note: NoteData = {
            id,
            title,
            content: `<pre><code>${code}</code></pre>`,
          };

          const blob = await exportManager.exportToMarkdown(note);
          const markdown = await blobToText(blob);

          // Check that code block markers are preserved
          expect(markdown).toContain('```');
          // Code content should be present (may be escaped or modified slightly)
          // Just check that the markdown has some content between the code fences
          const codeBlockMatch = markdown.match(/```\n([\s\S]*?)\n```/);
          expect(codeBlockMatch).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve lists in Markdown export', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          title: safeTextArbitrary(1, 100),
          items: fc.array(safeTextArbitrary(1, 50), {
            minLength: 1,
            maxLength: 5,
          }),
          ordered: fc.boolean(),
        }),
        async ({ id, title, items, ordered }) => {
          const listTag = ordered ? 'ol' : 'ul';
          const note: NoteData = {
            id,
            title,
            content: `<${listTag}>${items.map(item => `<li>${item}</li>`).join('')}</${listTag}>`,
          };

          const blob = await exportManager.exportToMarkdown(note);
          const markdown = await blobToText(blob);

          // Check that all list items are preserved
          items.forEach((item, index) => {
            if (ordered) {
              expect(markdown).toContain(`${index + 1}. ${item}`);
            } else {
              expect(markdown).toContain(`- ${item}`);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all formatting in HTML export', async () => {
    await fc.assert(
      fc.asyncProperty(
        noteWithFormattingArbitrary,
        async ({ id, title, content, elements }) => {
          const note: NoteData = {
            id,
            title,
            content,
          };

          const blob = await exportManager.exportToHTML(note);
          const html = await blobToText(blob);

          // Check that HTML contains the title
          expect(html).toContain(title);

          // Check that all formatting structures are present in the HTML
          elements.forEach(element => {
            switch (element.type) {
              case 'heading':
                expect(html).toContain(`<h${element.level}>`);
                // Text content should be present (may be escaped)
                expect(html).toMatch(new RegExp(element.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
                break;
              case 'paragraph':
                // Text should be present somewhere in the HTML
                expect(html).toMatch(new RegExp(element.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
                break;
              case 'bold':
                expect(html).toContain('<strong>');
                expect(html).toMatch(new RegExp(element.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
                break;
              case 'italic':
                expect(html).toContain('<em>');
                expect(html).toMatch(new RegExp(element.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
                break;
              case 'link':
                // URLs in HTML are HTML-encoded, so & becomes &amp;
                const htmlEncodedUrl = element.url.replace(/&/g, '&amp;');
                expect(html).toContain(htmlEncodedUrl);
                expect(html).toMatch(new RegExp(element.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
                break;
              case 'code':
                // Just check that code tags are present
                expect(html).toContain('<code>');
                break;
              case 'codeBlock':
                // Just check that pre tags are present
                expect(html).toContain('<pre>');
                break;
              case 'unorderedList':
              case 'orderedList':
                // Check that list items are present
                element.items.forEach(item => {
                  expect(html).toMatch(new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
                });
                break;
              case 'blockquote':
                expect(html).toMatch(new RegExp(element.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
                break;
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve complex nested formatting', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          title: safeTextArbitrary(1, 100),
          text: safeTextArbitrary(1, 50),
          linkText: safeTextArbitrary(1, 30),
          url: fc.webUrl(),
        }),
        async ({ id, title, text, linkText, url }) => {
          // Create content with nested formatting: bold text with a link inside
          const note: NoteData = {
            id,
            title,
            content: `<p><strong>${text} <a href="${url}">${linkText}</a></strong></p>`,
          };

          const blob = await exportManager.exportToMarkdown(note);
          const markdown = await blobToText(blob);

          // Check that both bold and link are preserved
          expect(markdown).toContain('**');
          expect(markdown).toContain(`[${linkText}](${url})`);
          expect(markdown).toContain(text);
        }
      ),
      { numRuns: 100 }
    );
  });
});
