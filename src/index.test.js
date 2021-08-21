const index = require('../dist/index');

it('parse cpanfile', () => {
  return expect(index.parseCpanfile()).resolves.toMatchSnapshot();
});
