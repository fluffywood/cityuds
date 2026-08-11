#!/usr/bin/env python3
"""Render mapped course PDFs into WeChat-friendly JPEG page assets."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

try:
    import fitz  # PyMuPDF
except ImportError as exc:  # pragma: no cover - dependency guidance
    raise SystemExit(
        "PyMuPDF is required. Install it with: python -m pip install pymupdf"
    ) from exc

try:
    from PIL import Image
except ImportError as exc:  # pragma: no cover - dependency guidance
    raise SystemExit(
        "Pillow is required. Install it with: python -m pip install pillow"
    ) from exc


EXPECTED_COURSE_COUNT = 17
COURSE_LIMIT_BYTES = 2 * 1024 * 1024
COURSE_TARGET_BYTES = 1_800_000
TOTAL_LIMIT_BYTES = 30 * 1024 * 1024
RENDER_PROFILES = (
    {"dpi": 150, "quality": 84},
    {"dpi": 144, "quality": 82},
    {"dpi": 132, "quality": 80},
    {"dpi": 120, "quality": 78},
)


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as stream:
        return json.load(stream)


def repo_path(repo_root: Path, relative_path: str) -> Path:
    path = (repo_root / relative_path).resolve()
    try:
        path.relative_to(repo_root)
    except ValueError as exc:
        raise ValueError(f"Path escapes repository root: {relative_path}") from exc
    return path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def directory_size(path: Path) -> int:
    return sum(file.stat().st_size for file in path.rglob("*") if file.is_file())


def clear_generated_pages(assets_dir: Path) -> None:
    for pattern in ("page-*.jpg", "page-*.jpeg", "page-*.webp", "page-*.png"):
        for path in assets_dir.glob(pattern):
            path.unlink()


def render_course(
    pdf_path: Path,
    assets_dir: Path,
    package_relative_path: str,
    dpi: int,
    quality: int,
) -> tuple[list[dict[str, Any]], int]:
    clear_generated_pages(assets_dir)
    page_records: list[dict[str, Any]] = []

    with fitz.open(str(pdf_path)) as document:
        if document.needs_pass:
            raise RuntimeError(f"Encrypted PDF is not supported: {pdf_path}")

        for page_index, page in enumerate(document, start=1):
            pixmap = page.get_pixmap(dpi=dpi, colorspace=fitz.csRGB, alpha=False)
            image = Image.frombytes(
                "RGB",
                (pixmap.width, pixmap.height),
                pixmap.samples,
            )
            filename = f"page-{page_index:03d}.jpg"
            output_path = assets_dir / filename
            image.save(
                output_path,
                format="JPEG",
                quality=quality,
                optimize=True,
                progressive=True,
                subsampling=0,
                dpi=(dpi, dpi),
            )
            image.close()

            with Image.open(output_path) as rendered:
                rendered.load()
                if rendered.format != "JPEG":
                    raise RuntimeError(f"Unexpected image format: {output_path}")
                width, height = rendered.size

            page_records.append(
                {
                    "page": page_index,
                    "path": f"{package_relative_path}/assets/{filename}",
                    "bytes": output_path.stat().st_size,
                    "width": width,
                    "height": height,
                }
            )

    return page_records, sum(page["bytes"] for page in page_records)


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    index_path = repo_root / "data" / "course-documents" / "index.json"
    mappings = load_json(index_path)

    if len(mappings) != EXPECTED_COURSE_COUNT:
        raise RuntimeError(
            f"Expected {EXPECTED_COURSE_COUNT} mapped courses, found {len(mappings)}"
        )

    packages_root = repo_root / "wechat" / "miniprogram" / "packages"
    generated_root = repo_root / "wechat" / "generated"
    generated_root.mkdir(parents=True, exist_ok=True)

    course_records: list[dict[str, Any]] = []
    total_pages = 0
    total_package_bytes = 0

    for course_code in sorted(mappings):
        mapping = mappings[course_code]
        pdf_path = repo_path(repo_root, mapping["pdf"])
        translation_path = repo_path(repo_root, mapping["translation"])
        docs_root = (repo_root / "docs").resolve()

        if not pdf_path.is_file():
            raise FileNotFoundError(pdf_path)
        if not translation_path.is_file():
            raise FileNotFoundError(translation_path)
        try:
            pdf_path.relative_to(docs_root)
        except ValueError as exc:
            raise ValueError(f"Mapped PDF is outside docs/: {pdf_path}") from exc

        translation = load_json(translation_path)
        translated_page_count = len(translation.get("pages", []))
        source_hash = sha256_file(pdf_path)
        package_name = f"doc-{course_code.lower()}"
        package_dir = packages_root / package_name
        assets_dir = package_dir / "assets"
        assets_dir.mkdir(parents=True, exist_ok=True)
        package_relative_path = f"packages/{package_name}"

        selected_profile: dict[str, int] | None = None
        page_records: list[dict[str, Any]] = []
        asset_bytes = 0
        package_bytes = 0

        for profile in RENDER_PROFILES:
            page_records, asset_bytes = render_course(
                pdf_path=pdf_path,
                assets_dir=assets_dir,
                package_relative_path=package_relative_path,
                dpi=profile["dpi"],
                quality=profile["quality"],
            )
            package_bytes = directory_size(package_dir)
            selected_profile = profile
            if package_bytes <= COURSE_TARGET_BYTES:
                break

        if package_bytes >= COURSE_LIMIT_BYTES:
            raise RuntimeError(
                f"{course_code} package is {package_bytes} bytes; limit is "
                f"strictly below {COURSE_LIMIT_BYTES} bytes"
            )

        page_count = len(page_records)
        if page_count != translated_page_count:
            raise RuntimeError(
                f"{course_code} page mismatch: PDF={page_count}, "
                f"translation={translated_page_count}"
            )

        total_pages += page_count
        total_package_bytes += package_bytes
        course_records.append(
            {
                "course_code": course_code,
                "source_pdf": mapping["pdf"],
                "source_sha256": source_hash,
                "page_count": page_count,
                "package": package_relative_path,
                "asset_bytes": asset_bytes,
                "package_bytes": package_bytes,
                "render": {
                    "format": "jpeg",
                    "dpi": selected_profile["dpi"],
                    "quality": selected_profile["quality"],
                },
                "pages": page_records,
            }
        )
        print(
            f"{course_code}: {page_count} pages, {package_bytes} bytes, "
            f"{selected_profile['dpi']} dpi / quality {selected_profile['quality']}"
        )

    if total_package_bytes >= TOTAL_LIMIT_BYTES:
        raise RuntimeError(
            f"Generated packages total {total_package_bytes} bytes; limit is "
            f"strictly below {TOTAL_LIMIT_BYTES} bytes"
        )

    manifest = {
        "schema_version": 1,
        "format": "jpeg",
        "course_count": len(course_records),
        "page_count": total_pages,
        "total_package_bytes": total_package_bytes,
        "limits": {
            "course_bytes": COURSE_LIMIT_BYTES,
            "total_bytes": TOTAL_LIMIT_BYTES,
        },
        "courses": course_records,
    }
    manifest_path = generated_root / "pdf-pages-manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Manifest: {manifest_path.relative_to(repo_root).as_posix()} | "
        f"{len(course_records)} courses | {total_pages} pages | "
        f"{total_package_bytes} bytes"
    )


if __name__ == "__main__":
    main()
