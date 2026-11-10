import pLimit from 'p-limit';
import {normalizeURL, extractPageData } from './crawl';
import type {ExtractedPageData} from './crawl';

export class ConcurrentCrawler {

    baseURL: string;
    pages: Record<string, ExtractedPageData>;
    limit: ReturnType<typeof pLimit>;
    maxPages: number;
    shouldStop: boolean;
    allTasks: Set<Promise<void>>;
    visited: Set<string>

    //constructor
    constructor(baseURL: string, maxConcurrency: number, maxPages: number) {
        this.baseURL = baseURL;
        this.pages = {};
        this.limit = pLimit(maxConcurrency);

        this.maxPages = maxPages;
        this.shouldStop = false;
        this.allTasks = new Set();
        this.visited = new Set();

    }

    private addPageVisit(normalizedURL: string): boolean{     
        
        if (this.shouldStop) {
            return false;
        }
        if (this.visited .has(normalizedURL)) {
            return false;
        }
        if (this.visited.size >= this.maxPages) {
            this.shouldStop = true;
            console.log(`Reached maximum number of pages to crawl.`);
            return false;
        } else {
            this.visited.add(normalizedURL);
            return true;
        }

        // if (normalizedURL in this.pages) {
        //     this.pages[normalizedURL] += 1;
        //     return false; 
        // } else {
        //     this.pages[normalizedURL] = 1;
        //     return true;
        // }
    }

    private async getHTML(currentUrl:string): Promise<string> {
        
        return await this.limit(async () => {
            try {
                const response = await fetch(currentUrl);
                if (response.status > 399) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("text/html")) {
                    throw new Error(`Not right content type! Content-Type: ${response.headers.get("content-type")}`);
                }
                return await response.text();   

            } catch (error) {
                console.error(`Error getting HTML!!!`);
                throw error ;
            }
        });
  
    }

    private async crawlPage(currentURL: string): Promise<void> {

        if (this.shouldStop) {
            return;
        }

        //make sure currentURL is within the same domain as baseURL
        const baseDomain = new URL(this.baseURL).hostname;
        const currentDomain = new URL(currentURL).hostname;
    
        if (baseDomain !== currentDomain) {
            console.error(`Skipping ${currentURL} as it is not within the same domain as ${this.baseURL}`);            return;
        }
        //get normalized version of the currentURL
        const normalizedURL = normalizeURL(currentURL);
        
        //Check whether this is a new page
        const isNewPage = this.addPageVisit(normalizedURL);
        if (!isNewPage) {
            return;
        }

        // fetch HTML 
        console.log(`Crawling: ${currentURL}`);

        let html: string;
        try {
            html = await this.getHTML(currentURL);
            
        } catch (error) {
            console.error(`Failed to crawl: ${currentURL}`, error);
            return;
            
        }
        //Extract URL's from HTML
        //const nextURLs = getURLsFromHTML(html, currentURL);

        const data = extractPageData(html, currentURL); //extract page data
        this.pages[normalizedURL] = data; //save extracted data

        //Recursively crawl URLs concurrently or at the same time, 
        //so call the function on all the URL's returned from nextURLs array
        const crawlPromises = data.outgoing_links.map((nextURL) => {
            const task  = this.crawlPage(nextURL);

            this.allTasks.add(task);

            task.finally(() => {
                this.allTasks.delete(task);
            }).catch((error) => { 
                console.error(`Error crawling ${nextURL}:`, error);
            });

            return task;
        });

        //"Start all these asynchronous operations, 
        // and don't move on until every single one has finished."
        await Promise.allSettled(crawlPromises);

    }

    async crawl(): Promise<Record<string, ExtractedPageData>>{
        await this.crawlPage(this.baseURL);

        while (this.allTasks.size > 0) {
            await Promise.allSettled(Array.from(this.allTasks));
        }   

        return this.pages
    }

}

export async function crawlSiteAsync(
    baseURL: string,
    maxConcurrency: number, 
    maxPages: number
): Promise<Record<string, ExtractedPageData>> {

    const crawlerInstance = new ConcurrentCrawler(baseURL, maxConcurrency, maxPages);
    const pages = await crawlerInstance.crawl();
    return pages;
}