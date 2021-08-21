import * as fs from 'fs/promises';

import { parse } from './parser';

const parseCpanfile = async (path: string): Promise<string> => {
  const buffer = await fs.readFile(path);
  return parse(buffer.toString());
};

export default parseCpanfile;
