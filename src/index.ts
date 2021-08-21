import * as fs from 'fs/promises';

export const parseCpanfile: () => Promise<string> = async () => {
  const buffer = await fs.readFile('./cpanfile');
  const str = buffer.toString();
  // console.log({ str });
  return str;
};

parseCpanfile();
