import * as fs from 'fs/promises';

export const parseCpanfile = async () => {
  const buffer = await fs.readFile('./cpanfile');
  console.log({ buffer: buffer.toString() });
};

parseCpanfile();
