import * as fs from 'fs/promises';

import { parse } from './parser';

export const loadCpanfile = async (path: string): Promise<string> => {
  const buffer = await fs.readFile(path);
  return parse(buffer.toString());
};

loadCpanfile('./__tests__/cpanfile').then((res) => console.log(res));
