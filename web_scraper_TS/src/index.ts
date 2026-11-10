import { getHTML, crawlPage } from './crawl';
import { expect, test } from 'vitest';
import { crawlSiteAsync } from "./ConcurrentCrawler";
import { writeJSONReport } from '../report';

async function main() {

    // const args = process.argv.slice(2); // Remove the first two elements (node and script path)

    // if (args.length < 1) {
    //     console.error("Usage Error: arguments are required. Please provide a URL to crawl.");
    //     process.exit(1);
    // }
    // if (args.length > 1) {
    //     console.error("Usage Error: too many arguments provided. Please provide only one URL to crawl.");
    //     process.exit(1);
    // }

    // const baseURL = process.argv[2];
    // console.log(`Crawler starting at: ${baseURL}`);

    // const maxConcurrency = Number(process.argv[3]) || 3; // Set the maximum concurrency level
    // const maxPages = Number(process.argv[4]) || 100; // Set the maximum number of pages to crawl

    // const pages = await crawlSiteAsync(baseURL, maxConcurrency, maxPages);

    // console.log(pages);         

    const args = process.argv.slice(2);

    const baseURL = args[0];
    const maxConcurrency = Number(args[1]) || 3;
    const maxPages = Number(args[2]) || 100;

    if (!baseURL) {
        console.error('Please provide a URL to crawl.');
        process.exit(1);
    }

    const pages = await crawlSiteAsync(baseURL, maxConcurrency, maxPages);

    console.log("Finished crawling.");

    writeJSONReport(pages, "report.json");

    console.log("JSON report created successfully.");

    const firstPage = Object.values(pages)[0];

    if (firstPage) {
        console.log(
            `First page record: ${firstPage["url"]} - ${firstPage["heading"]}`,
        );
    }

}

main();