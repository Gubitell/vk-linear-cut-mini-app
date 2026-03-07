# -*- mode: python ; coding: utf-8 -*-
# Сборка: pyinstaller cutting_calc.spec

from pathlib import Path
from PyInstaller.utils.hooks import collect_all

block_cipher = None

# Все QML-файлы проекта (рядом с main.py)
qml_files = [
    'main.qml', 'HomePage.qml', 'History.qml', 'MaterialSetup.qml',
    'MaterialTemplate.qml', 'DetailsInput.qml', 'DetailCard.qml',
    'Results.qml', 'BoardView.qml', 'Visualization.qml',
]
qml_datas = [(f, '.') for f in qml_files]

# Подтянуть PySide6 целиком (Qt, QML-модули, плагины)
pyside6_datas, pyside6_binaries, pyside6_hiddenimports = collect_all('PySide6')

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=pyside6_binaries,
    datas=qml_datas + pyside6_datas,
    hiddenimports=pyside6_hiddenimports + [
        'PySide6.QtCore', 'PySide6.QtGui', 'PySide6.QtQml', 'PySide6.QtQuick',
        'PySide6.QtQuickControls2', 'PySide6.QtQuickLayouts', 'PySide6.QtQuickWindow',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='Калькулятор раскроя',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # без консоли (GUI)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
