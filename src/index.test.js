const index = require('../index');

it('parse cpanfile', () => {
  return expect(index.parseCpanfile()).resolves.toMatchSnapshot();
});
