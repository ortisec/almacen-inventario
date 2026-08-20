from io import BytesIO

from fpdf import FPDF, XPos, YPos
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter


def _latin(text: str | None) -> str:
    if text is None:
        return ""
    return str(text).encode("latin-1", errors="replace").decode("latin-1")


def _clip(text: str | None, limit: int = 45) -> str:
    value = _latin(text)
    return value if len(value) <= limit else value[: limit - 1] + "..."


def _excel_sheet(rows: list[list], title: str, filename: str) -> BytesIO:
    wb = Workbook()
    ws = wb.active
    ws.title = title

    headers = rows[0]
    ws.append(headers)
    header_fill = PatternFill("solid", fgColor="1D64F1")
    header_font = Font(color="FFFFFF", bold=True)
    for col in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")

    for row in rows[1:]:
        ws.append(row)

    for col in range(1, len(headers) + 1):
        width = max(len(str(r[col - 1])) for r in rows) + 3
        ws.column_dimensions[get_column_letter(col)].width = max(width, 12)

    bio = BytesIO()
    wb.save(bio)
    bio.seek(0)
    return bio


def _pdf_table(title: str, headers: list[str], widths: list[int], data: list[list]) -> BytesIO:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)

    def draw_header():
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_fill_color(29, 100, 241)
        pdf.set_text_color(255, 255, 255)
        for i, header in enumerate(headers):
            pdf.cell(widths[i], 8, _latin(header), border=1, align="C", fill=True)
        pdf.ln()
        pdf.set_text_color(0, 0, 0)

    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.ln(3)

    draw_header()
    pdf.set_font("Helvetica", "", 8)
    pdf.set_fill_color(238, 246, 255)
    fill = False
    for row in data:
        if pdf.get_y() > 260:
            pdf.add_page()
            draw_header()
            pdf.set_font("Helvetica", "", 8)
            pdf.set_fill_color(238, 246, 255)
        for i, value in enumerate(row):
            align = "C" if i not in (1, 3) else "L"
            pdf.cell(widths[i], 8, _clip(value, 60), border=1, align=align, fill=fill)
        pdf.ln()
        fill = not fill

    return BytesIO(bytes(pdf.output(dest="S")))


def products_excel(items) -> BytesIO:
    rows = [["Codigo", "Nombre", "Stock actual", "Creado"]]
    for p in items:
        rows.append([p.code, p.name, p.current_stock, p.created_at.date().isoformat()])
    return _excel_sheet(rows, "Productos", "productos")


def products_pdf(items) -> BytesIO:
    headers = ["Codigo", "Nombre", "Stock", "Creado"]
    widths = [40, 90, 20, 30]
    data = [
        [p.code, p.name, p.current_stock, p.created_at.date().isoformat()] for p in items
    ]
    return _pdf_table("Lista de productos", headers, widths, data)


def movements_excel(items) -> BytesIO:
    rows = [
        ["Fecha", "Producto", "Codigo", "Tipo", "Cantidad", "Stock resultante", "Nota"]
    ]
    for m in items:
        rows.append(
            [
                m.movement_date.isoformat(),
                m.product.name,
                m.product.code,
                "Entrada" if m.movement_type == "ENTRADA" else "Salida",
                m.quantity,
                m.stock_after,
                m.note or "",
            ]
        )
    return _excel_sheet(rows, "Movimientos", "movimientos")


def movements_pdf(items) -> BytesIO:
    headers = ["Fecha", "Producto", "Tipo", "Cant.", "Stock", "Nota"]
    widths = [24, 72, 20, 16, 16, 32]
    data = []
    for m in items:
        data.append(
            [
                m.movement_date.isoformat(),
                f"{m.product.code} - {m.product.name}",
                "Entrada" if m.movement_type == "ENTRADA" else "Salida",
                m.quantity,
                m.stock_after,
                m.note or "",
            ]
        )
    return _pdf_table("Lista de movimientos", headers, widths, data)