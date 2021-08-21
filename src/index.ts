import * as fs from 'fs/promises';

import { parse } from './parser';

export const parseCpanfile = async (path: string): Promise<string> => {
  const buffer = await fs.readFile(path);
  return parse(buffer.toString());
};

parseCpanfile('./__tests__/cpanfile');
