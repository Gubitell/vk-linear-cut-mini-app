"""Тестирование логики оптимизатора раскроя"""

from typing import List, Dict


def calculate_cutting(material_length: int, cut_width: int, details: List[Dict[str, int]], material_cost: float = 0):
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
        length = detail['length']
        quantity = detail['quantity']
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
                return {'error': f'Деталь длиной {piece}мм превышает длину материала {material_length}мм'}
            
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
    
    return result


if __name__ == "__main__":
    # Тестовый пример из задачи
    print("=== Тест: Доски 6м ===")
    result = calculate_cutting(
        material_length=6000,
        cut_width=3,
        details=[
            {'length': 1200, 'quantity': 23},
            {'length': 2300, 'quantity': 12},
            {'length': 3000, 'quantity': 6},
            {'length': 800, 'quantity': 17}
        ],
        material_cost=450.0
    )
    
    print(f"\nИспользовано заготовок: {result['materialLength']} x {result['boardCount']} шт. = {result['totalMaterialUsed']}")
    print(f"Польза: {result['benefitPercent']}%")
    print(f"Остатки: {result['wastePercent']}% ({result['totalWaste']})")
    print(f"Количество разрезов: {result['cutsCount']}")
    if result['cost']:
        print(f"Общая стоимость: {result['cost']} руб")
    
    print("\nДетали:")
    for detail in result['details']:
        print(f"  {detail['length']} - {detail['quantity']} шт.")
    
    print("\n=== Раскрой по доскам ===")
    for board in result['boards']:
        print(f"\nДоска #{board['boardNumber']}:")
        print(f"  Детали: {board['pieces']}")
        print(f"  Использовано: {board['usedLength']}мм")
        print(f"  Остаток: {board['wasteLength']}мм")
    
    # Простой тест
    print("\n\n=== Тест: Простой пример ===")
    result2 = calculate_cutting(
        material_length=6000,
        cut_width=3,
        details=[
            {'length': 1200, 'quantity': 5}
        ],
        material_cost=450.0
    )
    
    print(f"\nИспользовано заготовок: {result2['materialLength']} x {result2['boardCount']} шт. = {result2['totalMaterialUsed']}")
    print(f"Польза: {result2['benefitPercent']}%")
    print(f"Остатки: {result2['wastePercent']}% ({result2['totalWaste']})")
    print(f"Количество разрезов: {result2['cutsCount']}")
    if result2['cost']:
        print(f"Общая стоимость: {result2['cost']} руб")
    
    print("\nДетали:")
    for detail in result2['details']:
        print(f"  {detail['length']} - {detail['quantity']} шт.")
    
    for board in result2['boards']:
        print(f"\nДоска #{board['boardNumber']}:")
        print(f"  Детали: {board['pieces']}")
        print(f"  Использовано: {board['usedLength']}мм")
        print(f"  Остаток: {board['wasteLength']}мм")
