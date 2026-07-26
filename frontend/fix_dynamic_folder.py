from pathlib import Path
import sys
base = Path(r"C:\Users\nainj\Downloads\route53-clone\route53-clone\frontend\src\app\dashboard\zones")
print('base exists:', base.exists())
for p in base.iterdir():
    name = p.name
    print('entry repr:', repr(name), 'len:', len(name), 'chars:', [ord(c) for c in name])
    if name.startswith('[id'):
        target = base / '[id]'
        print('trying rename from', repr(name), 'to', repr(target.name))
        if target.exists():
            print('target already exists:', target)
        try:
            p.rename(target)
            print('renamed successfully')
        except Exception as e:
            print('rename failed:', type(e).__name__, e)
            try:
                import shutil
                shutil.copytree(p, target)
                shutil.rmtree(p)
                print('copied and removed old folder')
            except Exception as e2:
                print('copy/move failed:', type(e2).__name__, e2)
sys.exit(0)
