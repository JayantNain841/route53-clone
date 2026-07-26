import pathlib
base = pathlib.Path(r"C:\Users\nainj\Downloads\route53-clone\route53-clone\frontend\src\app\dashboard\zones")
print('folder exists:', base.exists())
for p in sorted(base.iterdir(), key=lambda x: x.name):
    print('entry:', repr(p.name), '->', p)
for p in base.iterdir():
    if p.name == '[id':
        target = base / '[id]'
        print('renaming', p, 'to', target)
        p.rename(target)
        print('renamed')
        break
print('done')
