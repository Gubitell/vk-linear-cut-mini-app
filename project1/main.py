import sys
import os
from pathlib import Path
from typing import List, Dict, Any

# База для путей: при сборке exe — папка распаковки, иначе — папка скрипта
if getattr(sys, "frozen", False):
    _base_dir = Path(sys._MEIPASS)
else:
    _base_dir = Path(__file__).resolve().parent

from PySide6.QtCore import QObject, Slot, Signal
from PySide6.QtGui import QGuiApplication
from PySide6.QtQml import QQmlApplicationEngine


class CuttingOptimizer(QObject):
    """Класс для оптимизации раскроя материалов"""
    
    calculationComplete = Signal(dict)
    
    def __init__(self):
        super().__init__()
    
    @Slot(float, float, list, float)
    def calculate(self, material_length: float, cut_width: float, details: List[Dict[str, int]], material_cost: float = 0):
        """
        Рассчитывает оптимальный раскрой методом FFD (First Fit Decreasing)
        
        Args:
            material_length: длина материала (мм)
            cut_width: толщина реза (мм)
            details: список деталей [{'length': int, 'quantity': int}, ...]
            material_cost: стоимость одной заготовки (рубли)
        """
        # Преобразуем список деталей в плоский список с учетом количества
        pieces = []
        detail_summary = {}  # Для подсчета уникальных деталей
        
        for detail in details:
            length = float(detail['length'])
            quantity = int(detail['quantity'])
            pieces.extend([length] * quantity)
            
            # Считаем уникальные детали
            if length in detail_summary:
                detail_summary[length] += quantity
            else:
                detail_summary[length] = quantity
        
        # Сортируем детали по убыванию длины (FFD алгоритм)
        pieces.sort(reverse=True)
        
        # Список досок с раскроем
        boards = []
        
        # Размещаем каждую деталь
        for piece in pieces:
            placed = False
            
            # Пытаемся разместить деталь в существующую доску
            for board in boards:
                if board['remaining'] >= piece + cut_width:
                    board['pieces'].append(piece)
                    board['remaining'] -= (piece + cut_width)
                    placed = True
                    break
            
            # Если не влезла, создаем новую доску
            if not placed:
                if piece > material_length:
                    # Деталь больше материала - ошибка
                    self.calculationComplete.emit({
                        'error': f'Деталь длиной {piece}мм превышает длину материала {material_length}мм'
                    })
                    return
                
                boards.append({
                    'pieces': [piece],
                    'remaining': material_length - piece - cut_width
                })
        
        # Подсчитываем статистику
        board_count = len(boards)
        total_material_used = board_count * material_length
        total_pieces_length = sum(pieces)
        
        # Подсчет резов: для каждой заготовки
        # - Если остаток = 0: последнюю деталь не режем (N деталей = N-1 резов)
        # - Если остаток > 0: все детали отрезаны (N деталей = N резов)
        total_cuts = 0
        for board in boards:
            pieces_count = len(board['pieces'])
            if board['remaining'] == 0:
                # Последняя деталь использовала весь материал
                total_cuts += pieces_count - 1
            else:
                # Есть остаток - все детали были отрезаны
                total_cuts += pieces_count
        
        total_cut_waste = total_cuts * cut_width
        total_waste = sum(board['remaining'] for board in boards) + total_cut_waste
        waste_percent = (total_waste / total_material_used * 100) if total_material_used > 0 else 0
        benefit_percent = 100 - waste_percent
        
        # Подготавливаем детальную информацию о раскрое
        boards_detail = []
        for i, board in enumerate(boards):
            used_length = sum(board['pieces']) + (len(board['pieces']) - 1) * cut_width
            boards_detail.append({
                'boardNumber': i + 1,
                'pieces': board['pieces'],
                'usedLength': used_length,
                'wasteLength': board['remaining']
            })
        
        # Формируем список уникальных деталей для вывода
        details_list = [{'length': length, 'quantity': qty} for length, qty in sorted(detail_summary.items())]
        
        result = {
            'boardCount': board_count,
            'materialLength': material_length,
            'totalMaterialUsed': total_material_used,
            'totalPiecesLength': total_pieces_length,
            'totalWaste': int(total_waste),
            'wastePercent': round(waste_percent, 3),
            'benefitPercent': round(benefit_percent, 3),
            'cutsCount': total_cuts,
            'boards': boards_detail,
            'details': details_list,
            'cost': round(board_count * material_cost, 2) if material_cost > 0 else None
        }
        
        self.calculationComplete.emit(result)


if __name__ == "__main__":
    app = QGuiApplication(sys.argv)

    engine = QQmlApplicationEngine()
    
    # Создаем и регистрируем оптимизатор
    optimizer = CuttingOptimizer()
    engine.rootContext().setContextProperty("cuttingOptimizer", optimizer)

    if getattr(sys, "frozen", False):
        # Путь к QML-модулям Qt (QtQuick, QtQuick.Controls и т.д.)
        qt_qml = _base_dir / "PySide6" / "Qt" / "qml"
        if qt_qml.exists():
            engine.addImportPath(str(qt_qml))

    qml_file = _base_dir / "main.qml"
    engine.load(qml_file)

    if not engine.rootObjects():
        sys.exit(-1)

    sys.exit(app.exec())
