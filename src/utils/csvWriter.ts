import { format } from "fast-csv";
import fs from "node:fs";
import path from "node:path";
import { finished } from "node:stream/promises";

export type CsvWriter<T extends Record<string, unknown>> = {
  write: (row: T) => void;
  close: () => Promise<void>;
};

export const createCsvWriter = async <T extends Record<string, unknown>>(
  outputDir: string,
  filename: string
): Promise<CsvWriter<T>> => {
  await fs.promises.mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, filename);
  const stream = fs.createWriteStream(filePath);
  const csvStream = format({ headers: true });
  csvStream.pipe(stream);

  return {
    write: (row: T) => {
      csvStream.write(row);
    },
    close: async () => {
      csvStream.end();
      await finished(stream);
    }
  };
};
