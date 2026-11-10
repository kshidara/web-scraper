import { JSDOM } from 'jsdom'

export async function getHTML(url:string): Promise<string | undefined> {

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "BootCrawler/1.0"
            }
        }
        );
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        if (!response.headers.get("content-type")?.includes("text/html")) {
            throw new Error(`Not right content type! Content-Type: ${response.headers.get("content-type")}`);
        }
        return await response.text();

    } catch(error){
        console.error(`Error getting HTML!!!`);
        throw error ;
    }
}

export async function crawlPage(baseURL: string, currentURL: string, pages: Record<string, number> = {}): Promise<Record<string, number>> {
    //make sure currentURL is within the same domain as baseURL
    const baseDomain = new URL(baseURL).hostname;
    console.log("baseDomain = " + baseDomain)

    const currentDomain = new URL(currentURL).hostname;
    console.log("currentDomain" + currentDomain)

    if (baseDomain !== currentDomain) {
        console.error(`Skipping ${currentURL} as it is not within the same domain as ${baseURL}`);
        return pages;
    }

    //get normalized version of the currentURL
    const normalizedURL = normalizeURL(currentURL);
    console.log("normalized URL of current URL" + normalizedURL)

    //if pages object already has an object for normalized current URL, increment count and return current pages
    if (normalizedURL in pages) {
        pages[normalizedURL] += 1;
        return pages; 
    } else {
        pages[normalizedURL] = 1;
    }

    //get HTML from current URL using getHTML() and add print statement
    const currentUrlHtml = await getHTML(currentURL);
    if (currentUrlHtml){
        console.log(currentUrlHtml);
    }else {
        return pages;
    }

    //Assuming all went well with the fetch request in the new function, get all the URLs from the response body HTML, resolving them relative to currentURL.
    const listOfAllLinksInUrlPage = getURLsFromHTML(currentUrlHtml, currentURL);

    //Recursively crawl each URL you found on the page and update the pages to keep an aggregate count.
    for (const url of listOfAllLinksInUrlPage) {
        await crawlPage(baseURL, url, pages);
    }

    //Finally return updated pages object
    console.log(pages)
    return pages;

}

export function normalizeURL(url: string): string {
    try {
        const parsedUrl = new URL(url);
        parsedUrl.protocol = parsedUrl.protocol.toLowerCase(); // Normalize protocol to lowercase
        parsedUrl.hostname = parsedUrl.hostname.toLowerCase(); // Normalize hostname to lowercase
        
        if ((parsedUrl.protocol === 'http:' && parsedUrl.port === '80') ||
            (parsedUrl.protocol === 'https:' && parsedUrl.port === '443')) {
            parsedUrl.port = '';  // Remove default ports to be blank
        }
    
        parsedUrl.hash = ''; // Remove the hash fragment
        parsedUrl.search = ''; // Remove query parameters
        
        return parsedUrl.toString().replace(/\/$/, ''); //return the normalized URL as a string
    
    } catch (error) {
        throw new Error(`Invalid URL: ${url}`);
    }

}

export function getHeadingFromHTML(html: string): string {

    const dom = new JSDOM(html);
    const h1_heading = dom.window.document.querySelector("h1")
    const h2_heading = dom.window.document.querySelector("h2")

    return h1_heading?.textContent || h2_heading?.textContent || '';

}

export function getFirstParagraphFromHTML(html: string): string {

    const dom = new JSDOM(html);
    const p_paragraph = dom.window.document.querySelector("main p") || dom.window.document.querySelector("p");

    return p_paragraph?.textContent || '';
    
}

export function getURLsFromHTML(html:string, baseURL:string): string[] {

    const dom = new JSDOM(html);
    const elements = dom.window.document.querySelectorAll("a");
    const urls: string[] = [];

    for (const element of elements) {
        const href = element.getAttribute("href");
        if (href) {
            try { 
                const url = new URL(href, baseURL);
                urls.push(url.toString());
            } catch (error) {
                console.error(`Invalid URL found: ${href}`);
            }
        }
    }
    return urls || [];
}

export function getImagesFromHTML(html:string, baseURL:string): string[] {

    const dom = new JSDOM(html);
    const elements = dom.window.document.querySelectorAll("img");
    const urls: string[] = [];
    
    for (const element of elements) {
        const src = element.getAttribute("src");
        if (src) {
            try {
                const url = new URL(src, baseURL);
                urls.push(url.toString());

            } catch (error) {
                console.error(`Invalid image URL found: ${src}`);
            }
        }
    }
    return urls || [];
}

export function extractPageData(html: string, pageURL: string): ExtractedPageData {
    const _url = normalizeURL(pageURL);
    const heading = getHeadingFromHTML(html);
    const firstParagraph = getFirstParagraphFromHTML(html);
    const urls= getURLsFromHTML(html, pageURL);
    const images = getImagesFromHTML(html, pageURL);

    return {
        heading,
        first_paragraph: firstParagraph,
        outgoing_links: urls,
        image_urls: images,
        url: _url
    };

}

export type ExtractedPageData = {
    url: string;
    heading: string;
    first_paragraph: string;
    outgoing_links: string[];
    image_urls: string[];
};