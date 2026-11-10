import fs from 'fs';
import path from 'path';
import type { ExtractedPageData } from './src/crawl';

export function writeJSONReport(
  pageData: Record<string, ExtractedPageData>,
  filename = "report.json",
): void {
    
    // Convert the object into an array and sort by URL
    const sorted = Object.values(pageData).sort((a,b) => a.url.localeCompare(b.url));
    
    //Convert sorted array into formatted JSON
    const json = JSON.stringify(sorted, null, 2);

    const filepath = path.resolve(process.cwd(), filename);

    //Write JSON to disk
    fs.writeFileSync(filepath, json);


}