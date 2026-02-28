from __future__ import annotations

import csv
import io
import zipfile
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import Base, get_db
from models.auth import User
from models.company import Company
from .auth_utils import get_current_user
from .logs_utils import create_audit_log


router = APIRouter(
    tags=["Backup"],
)


def _normalize_role(role: str | None) -> str:
    return (role or "").strip().upper()


def _serialize_csv_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, datetime):
        # Keep consistent, machine-readable timestamps
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc).isoformat()
        return value.isoformat()
    return str(value) if not isinstance(value, (int, float, bool, str)) else value


def _write_model_to_csv_bytes(
    db: Session,
    model,
    company_id: int | None,
    company_user_ids: list[int],
) -> bytes:
    mapper = model.__mapper__
    columns = list(mapper.columns)
    fieldnames = [c.key for c in columns]

    query = db.query(model)

    # Prefer explicit company scoping.
    col_keys = {c.key for c in columns}
    if company_id is not None and "company_id" in col_keys:
        query = query.filter(getattr(model, "company_id") == company_id)
    elif company_id is not None and "related_to_company" in col_keys:
        query = query.filter(getattr(model, "related_to_company") == company_id)
    elif company_user_ids:
        # Heuristic: if a table references users, scope by user ids.
        user_fk_cols = []
        for c in columns:
            try:
                if any(getattr(fk.column.table, "name", None) == "users" for fk in c.foreign_keys):
                    user_fk_cols.append(c)
            except Exception:
                continue
        if user_fk_cols:
            query = query.filter(or_(*[col.in_(company_user_ids) for col in user_fk_cols]))

    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()

    for row in query.yield_per(1000):
        writer.writerow({
            name: _serialize_csv_value(getattr(row, name, None))
            for name in fieldnames
        })

    return output.getvalue().encode("utf-8")


@router.get("/admin/backup/csv")
def download_backup_csv_zip(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = _normalize_role(current_user.role)
    if role not in {"CEO", "ADMIN"}:
        raise HTTPException(status_code=403, detail="Only Admin/CEO can download backups")

    company_id = current_user.related_to_company
    if not company_id:
        raise HTTPException(status_code=403, detail="User not associated with a company")

    company_user_ids = [
        row[0]
        for row in db.query(User.id)
        .filter(User.related_to_company == company_id)
        .all()
    ]

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    filename = f"crm-backup-company-{company_id}-{timestamp}.zip"

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        # Export all mapped models as separate CSVs.
        tables_exported = 0
        for mapper in Base.registry.mappers:
            model = mapper.class_
            table_name = mapper.local_table.name

            # Safety: skip any SQLAlchemy internal tables if they appear.
            if not table_name or table_name.startswith("sqlite_"):
                continue

            try:
                csv_bytes = _write_model_to_csv_bytes(
                    db=db,
                    model=model,
                    company_id=company_id,
                    company_user_ids=company_user_ids,
                )
                zf.writestr(f"{table_name}.csv", csv_bytes)
                tables_exported += 1
            except Exception as exc:
                import traceback
                error_details = f"Exception: {exc}\n\nTraceback:\n{traceback.format_exc()}"
                zf.writestr(f"{table_name}.ERROR.txt", error_details)
                try:
                    db.rollback()
                except Exception:
                    pass

    buffer.seek(0)

    # Record audit log (best-effort): the backup was generated for download.
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        create_audit_log(
            db=db,
            current_user=current_user,
            instance=company or current_user,
            action="BACKUP",
            request=request,
            new_data={
                "format": "csv",
                "company_id": company_id,
                "tables_exported": tables_exported,
            },
            custom_message=f"downloaded CSV backup (tables: {tables_exported})",
        )
    except Exception:
        # Never break backup download because of audit logging.
        pass

    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
