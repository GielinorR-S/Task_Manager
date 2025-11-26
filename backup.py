import shutil
import os

source = r'c:\Users\Cini9\Desktop\Portfolio\Django x React'
destination = r'c:\Users\Cini9\Desktop\Portfolio\Django x React_backup'

# To prevent shutil.Error: [Errno 13] Permission denied: '.venv\Lib\site-packages\pip-25.3.dist-info\...
# when shutil.copytree tries to copy permissions of some files in venv
def copy_with_handling(src, dst, *, follow_symlinks=True):
    if os.path.isdir(src):
        if not os.path.exists(dst):
            os.makedirs(dst)
        shutil.copystat(src, dst, follow_symlinks=follow_symlinks)
    else:
        shutil.copy2(src, dst, follow_symlinks=follow_symlinks)
    return dst

if os.path.exists(destination):
    shutil.rmtree(destination)

shutil.copytree(source, destination, copy_function=copy_with_handling, ignore=shutil.ignore_patterns('.git', '__pycache__', 'node_modules'))
print("Backup created successfully")
