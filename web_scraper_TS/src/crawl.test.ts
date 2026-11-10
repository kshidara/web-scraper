import { describe, expect, test } from 'vitest';
import { normalizeURL, getHeadingFromHTML, getFirstParagraphFromHTML, getURLsFromHTML, getImagesFromHTML, extractPageData } from './crawl';

describe('normalizeURL Tests', () => {
    test('normalizes standard URL string', () => {
        expect(normalizeURL('http://example.com')).toBe('http://example.com');
    });

    test('removes trailing slashes', () => {
    expect(normalizeURL('http://example.com/')).toBe('http://example.com');
    });

    test('removes query parameters from the URL', () => {
    expect(normalizeURL('http://example.com?param=value')).toBe('http://example.com');
    });

    test('removes hash fragments from the URL', () => {
    expect(normalizeURL('http://example.com#section')).toBe('http://example.com');
    });

    test('removes default ports from the URL', () => {
    expect(normalizeURL('http://example.com:80')).toBe('http://example.com');
    expect(normalizeURL('https://example.com:443')).toBe('https://example.com');
    });

    test('normalizes protocol and hostname to lowercase', () => {
    expect(normalizeURL('HTTP://EXAMPLE.COM')).toBe('http://example.com');
    expect(normalizeURL('https://EXAMPLE.COM')).toBe('https://example.com');
    });

    test('throws an error for invalid URLs', () => {
    expect(() => normalizeURL('invalid-url')).toThrowError('Invalid URL: invalid-url');
    });   

});

describe('getHeadingFromHTML Tests', () => {

    test("getHeadingFromHTML basic", () => {
        const inputBody = `<html><body><h1>Test Title</h1></body></html>`;
        const actual = getHeadingFromHTML(inputBody);
        const expected = "Test Title";
        expect(actual).toEqual(expected);
    });

    test('extracts <h1> from HTML', () => {
        expect(getHeadingFromHTML('<div><h1>Main Heading Text</h1><h2>Fallback Heading Text</h2></div>'))
        .toBe('Main Heading Text');
    });

    test('extracts <h2> from HTML if <h1> is not present', () => {
        expect(getHeadingFromHTML('<h2>Fallback Heading Text</h2>'))
        .toBe('Fallback Heading Text');
    });

    test('returns empty string if no heading is present', () => {
        expect(getHeadingFromHTML('<p>No heading here</p>'))
        .toBe('');
    });

});

describe('getFirstParagraphFromHTML Tests', () => {

    test("getFirstParagraphFromHTML main priority", () => {
        const inputBody = `
            <html><body>
            <p>Outside paragraph.</p>
            <main>
                <p>Main paragraph.</p>
            </main>
            </body></html>
        `;
        const actual = getFirstParagraphFromHTML(inputBody);
        const expected = "Main paragraph.";
        expect(actual).toEqual(expected);
    });

    test('extracts the first <p> element from HTML', () => {
        const inputBody = `
            <html><body>
            <p>Outside paragraph.</p>
            <p>Main paragraph.</p>
            </body></html>
        `;
        const actual = getFirstParagraphFromHTML(inputBody);
        const expected = "Outside paragraph.";
        expect(actual).toEqual(expected);
    });

    test('returns empty string if no <p> element is present', () => {
        expect(getFirstParagraphFromHTML(`
            <html><body>
            <h1>Outside paragraph.</h1>
            <main>
                <h2>Main paragraph.</h2>
            </main>
            </body></html>
        `))
        .toBe('');
    });

});

describe('getURLsFromHTML Tests', () => {

    test("getURLsFromHTML extracts URLs from anchor tags", () => {
        const inputURL = 'https://crawler-test.com';
        const inputBody = `<html><body><a href="/path/one"><span>Boot.dev</span></a></body></html>`;

        const actual = getURLsFromHTML(inputBody, inputURL);
        const expected = ['https://crawler-test.com/path/one'];
        expect(actual).toEqual(expected);
    
    });

    test("getURLsFromHTML returns empty array if no anchor tags are present", () => {
        const inputURL = 'https://crawler-test.com';
        const inputBody = `<html><body><p>No links here</p></body></html>`;

        const actual = getURLsFromHTML(inputBody, inputURL);
        expect(actual).toEqual([]);
    });

    test("getURLsFromHTML handles invalid URLs gracefully", () => {
        const inputURL = 'https://crawler-test.com';
        const inputBody = `<html><body><a href=""><span>Boot.dev</span></a></body></html>`;

        const actual = getURLsFromHTML(inputBody, inputURL);
        expect(actual).toEqual([]);
    });

});

describe('getImagesFromHTML Tests', () => {

    test("getImagesFromHTML extracts image URLs from img tags", () => {
        const inputURL = 'https://crawler-test.com';
        const inputBody = `<html><body><img src="/logo.png" alt="Logo"></body></html>`;

        const actual = getImagesFromHTML(inputBody, inputURL);
        const expected = ['https://crawler-test.com/logo.png'];
        expect(actual).toEqual(expected);
    
    });

    test("getImagesFromHTML returns empty array if no img tags are present", () => {
        const inputURL = 'https://crawler-test.com';
        const inputBody = `<html><body><p>No images here</p></body></html>`;

        const actual = getImagesFromHTML(inputBody, inputURL);
        expect(actual).toEqual([]);
    });

    test("getImagesFromHTML handles invalid image URLs gracefully", () => {
        const inputURL = 'https://crawler-test.com';
        const inputBody = `<html><body><img src="" alt="Logo"></body></html>`;

        const actual = getImagesFromHTML(inputBody, inputURL);
        expect(actual).toEqual([]);
    });

});

describe('extractPageData Tests', () => {

    test("extractPageData basic", () => {
        const inputURL = "https://crawler-test.com";
        const inputBody = `
            <html><body>
            <h1>Test Title</h1>
            <p>This is the first paragraph.</p>
            <a href="/link1">Link 1</a>
            <img src="/image1.jpg" alt="Image 1">
            </body></html>
        `;

        const actual = extractPageData(inputBody, inputURL);
        const expected = {
            url: "https://crawler-test.com",
            heading: "Test Title",
            first_paragraph: "This is the first paragraph.",
            outgoing_links: ["https://crawler-test.com/link1"],
            image_urls: ["https://crawler-test.com/image1.jpg"],
        };

        expect(actual).toEqual(expected);
});

    
});