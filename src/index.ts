import * as fs from 'fs/promises';

import { parse } from './parser';

export const parseCpanfile: () => Promise<string> = async () => {
  const buffer = await fs.readFile('./cpanfile');
  return parse(buffer.toString());
};

parseCpanfile();
