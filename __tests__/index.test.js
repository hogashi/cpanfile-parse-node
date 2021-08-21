const index = require('../index');

it('parse cpanfile', () => {
  return expect(index.parseCpanfile('./__tests__/cpanfile')).resolves.toMatchSnapshot();
});
