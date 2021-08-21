import * as fs from 'fs/promises';

export const parseCpanfile = () => {
  fs.readFile('./cpanfile').then((buffer) => {
    console.log({ buffer: buffer.toString() });
  });
};

parseCpanfile();
