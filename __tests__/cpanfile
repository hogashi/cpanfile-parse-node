# https://github.com/miyagawa/cpanfile/blob/5e89c54bb388402db3a0bb61a44de875860df3d1/cpanfile
requires 'CPAN::Meta', 2.12091;
requires 'CPAN::Meta::Prereqs', 2.12091;
requires 'parent';

recommends 'Pod::Usage';

on test => sub {
    requires 'Test::More', 0.88;
    requires 'File::pushd';
};
