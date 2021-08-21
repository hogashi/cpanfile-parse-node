const parser = require('../dist/parser');

it('parse cpanfile', () => {
  const cpanfileStr = [
    `configure_requires 'ExtUtils::MakeMaker', 5.5;`,
    ``,
    `requires 'DBI';`,
    `requires 'Plack', '0.9970';`,
    `conflicts 'Moose', '< 0.8';`,
    ``,
    `on 'test' => sub {`,
    `    requires 'Test::More';`,
    `};`,
    ``,
    `on 'develop' => sub {`,
    `    requires 'Catalyst::Runtime', '> 5.8000, < 5.9';`,
    `    recommends 'Catalyst::Plugin::Foo';`,
    `};`,
    ``,
    `test_requires 'Test::Warn', 0.1;`,
    `author_requires 'Module::Install', 0.99;`,
  ].join('\n');
  return expect(parser.parse(cpanfileStr)).toMatchObject({
    configure: {
      requires: { 'ExtUtils::MakeMaker': '5.5' },
    },
    runtime: {
      requires: { Plack: '0.9970', DBI: 0 },
      conflicts: { Moose: '< 0.8' },
    },
    test: {
      requires: { 'Test::More': 0, 'Test::Warn': '0.1' },
    },
    develop: {
      requires: {
        'Catalyst::Runtime': '> 5.8000, < 5.9',
        'Module::Install': '0.99',
      },
      recommends: { 'Catalyst::Plugin::Foo': 0 },
    },
  });
});
